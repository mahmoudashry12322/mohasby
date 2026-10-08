import templates from "@/data/cost-templates.json";
import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/server/http";
import { Tx } from "./ledger";
import { stockBalances } from "./periodic-stock";
import { D, weighTicket } from "./calculations";
import { scheduleValues } from "./schedule-engine";

export type CostType = keyof typeof templates;
export function costTemplate(type: string) {
  if (!Object.hasOwn(templates, type))
    throw new HttpError(404, "نوع التكلفة غير موجود");
  return templates[type as CostType];
}
export async function costSchedule(
  companyId: number,
  type: string,
  centerCode: string,
  from: Date,
  to: Date,
  db: Tx = prisma,
) {
  const template = costTemplate(type);
  const center = await db.register.findFirst({
    where: { companyId, kind: "cost-centers", code: centerCode },
  });
  if (!center) throw new HttpError(400, "اختر مركز التكلفة");
  const context = center.data as Record<string, string>;
  if (context.type !== type)
    throw new HttpError(400, "نوع المركز لا يطابق التقرير");
  const saved = await db.register.findUnique({
    where: {
      companyId_kind_code: {
        companyId,
        kind: "cost-inputs-final",
        code:
          type +
          ":" +
          centerCode +
          ":" +
          from.toISOString().slice(0, 10) +
          ":" +
          to.toISOString().slice(0, 10),
      },
    },
  });
  const inputs = (saved?.data || {}) as Record<string, string>;
  const lines = await db.journalLine.findMany({
    where: {
      companyId,
      costCenter: centerCode,
      entry: { status: "POSTED", date: { gte: from, lte: to } },
    },
    include: { account: true, entry: true },
  });
  const movements = await db.stockMovement.findMany({
    where: { companyId, date: { gte: from, lte: to } },
    include: { item: true },
  });
  const valuation = await stockBalances(companyId, to, db);
  const byEntry = new Map(
    movements.filter((m) => m.entryId).map((m) => [m.entryId!, m]),
  );
  const divisor =
    type === "IMPORT" && inputs.C39 && D(inputs.C39).gt(0)
      ? D(inputs.C39)
      : D(1);
  const table3 = lines.map((line) => {
    const movement = byEntry.get(line.entryId),
      meta = (movement?.metadata || {}) as Record<string, unknown>;
    const weights = (meta.weigh || {}) as Record<string, string>;
    const sign = String(meta.documentType || "").endsWith("RETURN") ? -1 : 1;
    const gross = movement ? movement.quantity.mul(sign) : D(0);
    const net = movement
      ? D(
          weights.weight
            ? weighTicket(weights as Parameters<typeof weighTicket>[0]).net
            : movement.quantity,
        ).mul(sign)
      : D(0);
    const document = ["PURCHASE", "PURCHASE_RETURN"].includes(
      line.entry.document,
    )
      ? "مشتريات"
      : ["SALE", "SALE_RETURN"].includes(line.entry.document)
        ? "مبيعات"
        : line.entry.document;
    return {
      المستند: document,
      التصنيف: String(
        (movement?.item.data as Record<string, string> | undefined)?.category ||
          "",
      ),
      الصافى: net.toString(),
      مدين: (type === "FARMING" ? line.debit : line.debit.sub(line.credit))
        .div(divisor)
        .toString(),
      دائن: (type === "FARMING" ? line.credit : line.credit.sub(line.debit))
        .div(divisor)
        .toString(),
      "الحساب الفرعى": line.account.name,
      "الحساب الرئيسى": line.account.mainGroup || "",
      "مركز تكلفة تحليلى": line.costCenter,
      "مركز تكلفة فرعى": line.costItem,
      "مركز تكلفة رئيسى": line.costType,
      المزرعة: line.farm,
      البيفت: line.pivot,
      الموسم: line.season,
      القائم: gross.toString(),
      العدد: weights.bags || "0",
      السعر:
        weights.pricePerTonne || movement?.unitCost.mul(1000).toString() || "0",
      الصنف: movement?.item.name || "",
      الكمية: movement?.quantity.toString() || "0",
    };
  });
  const stockRows = movements.map((m) => {
    const meta = m.metadata as Record<string, unknown>;
    const tagged = lines.find(
      (l) => l.entryId === m.entryId && l.costCenter === centerCode,
    );
    const matches = tagged || meta.costCenter === centerCode;
    return {
      kind: m.kind,
      matches,
      row: {
        "مركز تكلفة تحليلى":
          tagged?.costCenter || String(meta.costCenter || ""),
        "مركز تكلفة فرعى": tagged?.costItem || String(meta.costItem || ""),
        القائم: m.quantity.toString(),
        الكمية: m.quantity.toString(),
        الصنف: m.item.name,
        السعر: String(
          D(String(meta.pricePerTonne || "0")).gt(0)
            ? meta.pricePerTonne
            : D(
                valuation.find((b) => b.itemId === m.itemId)?.averageCost ||
                  m.unitCost,
              )
                .mul(1000)
                .toString(),
        ),
      },
    };
  });
  const tables = {
    Table3: table3,
    Table5: stockRows
      .filter(
        (m) =>
          m.matches && ["RECEIPT", "OPENING", "RETURN_IN"].includes(m.kind),
      )
      .map((m) => m.row),
    Table58: stockRows
      .filter((m) => m.matches && ["ISSUE", "RETURN_OUT"].includes(m.kind))
      .map((m) => m.row),
    Table14: stockRows
      .filter((m) => m.matches && ["WASTE", "COUNT_LOSS"].includes(m.kind))
      .map((m) => m.row),
  };
  const result = scheduleValues(
    template,
    inputs,
    { ...context, center: centerCode },
    tables,
  );
  return {
    template,
    inputs,
    ...result,
    sourceLines: lines.length,
    center: center.name,
  };
}
