import prisma from "@/lib/prisma";
import { z } from "zod";
import { authorize } from "@/lib/auth/server";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import {
  audit,
  createEntryTx,
  dateOnly,
  decimal,
  entrySchema,
  locked,
  sameRequest,
  requestDigest,
} from "@/lib/accounting/ledger";
import { D, money, weighTicket } from "@/lib/accounting/calculations";
import { moveStockTx, stockSchema } from "@/lib/accounting/periodic-stock";
const schema = z.object({
  type: z.enum(["PURCHASE", "SALE", "PURCHASE_RETURN", "SALE_RETURN"]),
  date: dateOnly,
  itemId: z.string().min(1),
  warehouse: z.string().min(1),
  party: z.string().min(1),
  accountCode: z.string().min(1),
  quantity: decimal,
  unitPrice: decimal,
  reference: z.string().max(100).default(""),
  description: z.string().min(1).max(500),
  requestKey: z.string().min(8).max(100),
  truck: z.string().max(100).default(""),
  shipment: z.string().max(200).default(""),
  notes: z.string().max(1000).default(""),
  costCenter: z.string().default(""),
  costItem: z.string().default(""),
  weigh: z
    .object({
      weight: decimal,
      tare: decimal,
      bags: decimal,
      bagDeduction: decimal,
      discountRate: decimal,
      inspectionRate: decimal,
      pricePerTonne: decimal,
    })
    .optional(),
});
export async function POST(request: Request) {
  try {
    const actor = await authorize(request, true),
      input = schema.parse(await body(request));
    const result = await locked(actor.companyId, async (tx) => {
      const existing = await tx.stockMovement.findUnique({
        where: {
          companyId_requestKey: {
            companyId: actor.companyId,
            requestKey: input.requestKey,
          },
        },
      });
      if (existing) {
        sameRequest(existing.metadata, "documentRequestHash", input);
        return existing;
      }
      const party = await tx.register.findFirst({
        where: {
          companyId: actor.companyId,
          kind: "parties",
          code: input.party,
          isActive: true,
        },
      });
      if (!party) throw new HttpError(400, "العميل أو المورد غير موجود");
      const item = await tx.register.findFirst({
        where: {
          id: input.itemId,
          companyId: actor.companyId,
          kind: "items",
          isActive: true,
        },
      });
      if (!item) throw new HttpError(400, "الصنف غير موجود");
      const config = item.data as Record<string, string>;
      let quantity = D(input.quantity),
        amount = money(quantity.mul(input.unitPrice));
      let weigh: ReturnType<typeof weighTicket> | undefined;
      if (input.weigh) {
        if (config.unit !== "kg")
          throw new HttpError(400, "مستند الوزن يحتاج صنفاً بوحدة كجم");
        try {
          weigh = weighTicket(input.weigh);
        } catch (e) {
          throw new HttpError(400, (e as Error).message);
        }
        quantity = weigh.gross;
        amount = weigh.amount;
      }
      if (quantity.lte(0) || amount.lte(0))
        throw new HttpError(400, "الكمية والقيمة أكبر من صفر");
      const purchase = input.type.startsWith("PURCHASE"),
        returned = input.type.endsWith("RETURN");
      const kind = purchase
        ? returned
          ? "RETURN_OUT"
          : "RECEIPT"
        : returned
          ? "RETURN_IN"
          : "ISSUE";
      const movement = await moveStockTx(
        tx,
        actor,
        stockSchema.parse({
          date: input.date,
          itemId: input.itemId,
          warehouse: input.warehouse,
          kind,
          quantity: quantity.toString(),
          unitCost: amount.div(quantity).toFixed(6),
          counterpart: input.accountCode,
          party: input.party,
          reference: input.reference,
          description: input.description,
          requestKey: input.requestKey,
        }),
        purchase ? amount : undefined,
      );
      let entryId = movement.entryId;
      if (!purchase) {
        if (!config.salesAccount || config.salesAccount === input.accountCode)
          throw new HttpError(400, "حدد حساب المبيعات والحساب المقابل المختلف");
        const entry = await createEntryTx(
          tx,
          actor,
          entrySchema.parse({
            date: input.date,
            kind: "GENERAL",
            document: input.type,
            description: input.description,
            reference: input.reference,
            requestKey: "sale:" + input.requestKey,
            lines: [
              {
                accountCode: input.accountCode,
                party: input.party,
                debit: returned ? "0" : amount.toString(),
                credit: returned ? amount.toString() : "0",
              },
              {
                accountCode: config.salesAccount,
                debit: returned ? amount.toString() : "0",
                credit: returned ? "0" : amount.toString(),
              },
            ],
          }),
          true,
        );
        entryId = entry.id;
      }
      if (entryId) {
        await tx.journalEntry.update({
          where: { id: entryId },
          data: { document: input.type },
        });
        if (input.costCenter) {
          const center = await tx.register.findFirst({
            where: {
              companyId: actor.companyId,
              kind: "cost-centers",
              code: input.costCenter,
              isActive: true,
            },
          });
          if (!center) throw new HttpError(400, "مركز التكلفة غير موجود");
          const d = center.data as Record<string, string>;
          await tx.journalLine.updateMany({
            where: {
              entryId,
              accountCode: purchase
                ? config.purchaseAccount
                : config.salesAccount,
            },
            data: {
              costCenter: input.costCenter,
              costType: d.type,
              costItem: input.costItem,
              season: d.season || "",
              farm: d.farm || "",
              pivot: d.pivot || "",
            },
          });
        }
      }
      const saved = await tx.stockMovement.update({
        where: { id: movement.id },
        data: {
          entryId,
          metadata: {
            ...(movement.metadata as Record<string, string>),
            documentRequestHash: requestDigest(input),
            documentType: input.type,
            truck: input.truck,
            shipment: input.shipment,
            notes: input.notes,
            party: input.party,
            description: input.description,
            ...(input.weigh ? { weigh: input.weigh } : {}),
            costCenter: input.costCenter,
            costItem: input.costItem,
            pricePerTonne:
              input.weigh?.pricePerTonne ||
              D(input.unitPrice).mul(1000).toString(),
            amount: amount.toFixed(2),
          },
        },
      });
      await audit(tx, actor, "DOCUMENT_POSTED", saved.id, { entryId });
      return saved;
    });
    return ok({ result });
  } catch (e) {
    return fail(e);
  }
}

export async function GET() {
  try {
    const user = await authorize();
    const rows = await prisma.stockMovement.findMany({
      where: {
        companyId: user.companyId,
        metadata: { path: ["documentType"], string_contains: "" },
      },
      include: { item: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return ok({
      rows: rows.map((m) => {
        const meta = m.metadata as Record<string, any>;
        const w = meta.weigh ? weighTicket(meta.weigh) : null;
        return {
          id: m.id,
          date: m.date.toISOString().slice(0, 10),
          reference: m.reference,
          type: meta.documentType,
          item: m.item.name,
          category: (m.item.data as Record<string, string>).category,
          warehouse: m.warehouse,
          quantity: m.quantity.toString(),
          amount: meta.amount,
          truck: meta.truck,
          shipment: meta.shipment,
          notes: meta.notes,
          party: meta.party,
          description: meta.description,
          costCenter: meta.costCenter,
          costItem: meta.costItem,
          ...(w
            ? Object.fromEntries(
                Object.entries(w).map(([k, v]) => [k, v.toString()]),
              )
            : {}),
        };
      }),
    });
  } catch (e) {
    return fail(e);
  }
}
