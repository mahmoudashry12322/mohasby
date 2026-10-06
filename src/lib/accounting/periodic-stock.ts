import { z } from "zod";
import {
  Actor,
  audit,
  createEntryTx,
  dateOnly,
  decimal,
  entrySchema,
  locked,
  openDate,
  Tx,
  sameRequest,
  requestDigest,
} from "./ledger";
import { D, money, sum } from "./calculations";
import { HttpError } from "@/lib/server/http";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const stockSchema = z.object({
  date: dateOnly,
  itemId: z.string().min(1),
  warehouse: z.string().min(1),
  kind: z.enum([
    "OPENING",
    "RECEIPT",
    "ISSUE",
    "WASTE",
    "RETURN_IN",
    "RETURN_OUT",
    "COUNT_GAIN",
    "COUNT_LOSS",
  ]),
  quantity: decimal.refine((v) => D(v).gt(0), "الكمية أكبر من صفر"),
  unitCost: decimal.default("0"),
  counterpart: z.string().default(""),
  party: z.string().default(""),
  costCenter: z.string().max(200).default(""),
  costItem: z.string().max(200).default(""),
  reference: z.string().max(200).default(""),
  description: z.string().min(1).max(500),
  requestKey: z.string().min(8).max(100),
});
type Snapshot = {
  itemId: string;
  code: string;
  name: string;
  warehouse: string;
  quantity: string;
  value: string;
  averageCost: string;
};
export async function stockBalances(
  companyId: number,
  to = new Date("9999-12-31"),
  db: Tx | typeof prisma = prisma,
): Promise<Snapshot[]> {
  const last = await db.inventoryClose.findFirst({
    where: { companyId, date: { lte: to } },
    orderBy: { date: "desc" },
  });
  const snapshots = (last?.snapshots || []) as unknown as Snapshot[];
  const movements = await db.stockMovement.findMany({
    where: { companyId, date: { lte: to, ...(last ? { gt: last.date } : {}) } },
    include: { item: true },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  const pools = new Map<
    string,
    { quantity: Prisma.Decimal; value: Prisma.Decimal }
  >();
  const balances = new Map<
    string,
    {
      itemId: string;
      code: string;
      name: string;
      warehouse: string;
      quantity: Prisma.Decimal;
    }
  >();
  for (const s of snapshots) {
    const pool = pools.get(s.itemId) || { quantity: D(0), value: D(0) };
    pool.quantity = pool.quantity.add(s.quantity);
    pool.value = pool.value.add(s.value);
    pools.set(s.itemId, pool);
    balances.set(s.itemId + ":" + s.warehouse, {
      ...s,
      quantity: D(s.quantity),
    });
  }
  for (const m of movements) {
    const pool = pools.get(m.itemId) || { quantity: D(0), value: D(0) };
    if (["OPENING", "RECEIPT", "RETURN_OUT"].includes(m.kind)) {
      pool.quantity = pool.quantity.add(m.quantity.mul(m.direction));
      pool.value = pool.value.add(m.value.mul(m.direction));
    }
    pools.set(m.itemId, pool);
    const key = m.itemId + ":" + m.warehouse,
      g = balances.get(key) || {
        itemId: m.itemId,
        code: m.item.code,
        name: m.item.name,
        warehouse: m.warehouse,
        quantity: D(0),
      };
    g.quantity = g.quantity.add(m.quantity.mul(m.direction));
    balances.set(key, g);
  }
  const result: Snapshot[] = [];
  for (const [itemId, pool] of pools) {
    if (
      pool.quantity.lt(0) ||
      pool.value.lt(0) ||
      (pool.quantity.isZero() && !pool.value.isZero())
    )
      throw new HttpError(
        409,
        "مرتجع المشتريات يترك كمية أو قيمة غير صالحة؛ راجع تكلفة المستند الأصلي",
      );
    const groups = [...balances.values()]
      .filter((b) => b.itemId === itemId)
      .sort((a, b) => a.warehouse.localeCompare(b.warehouse));
    const avg = pool.quantity.gt(0) ? pool.value.div(pool.quantity) : D(0);
    const totalQuantity = sum(groups.map((g) => g.quantity)),
      totalValue = money(totalQuantity.mul(avg));
    let allocated = D(0);
    groups.forEach((g, i) => {
      const value =
        i === groups.length - 1
          ? totalValue.sub(allocated)
          : money(g.quantity.mul(avg));
      allocated = allocated.add(value);
      result.push({
        ...g,
        quantity: g.quantity.toFixed(3),
        value: value.toFixed(2),
        averageCost: avg.toFixed(6),
      });
    });
  }
  return result;
}
export async function moveStock(
  actor: Actor,
  input: z.infer<typeof stockSchema>,
) {
  return locked(actor.companyId, (tx) => moveStockTx(tx, actor, input));
}
export async function moveStockTx(
  tx: Tx,
  actor: Actor,
  input: z.infer<typeof stockSchema>,
  exactAmount?: Prisma.Decimal,
) {
  const prior = await tx.stockMovement.findUnique({
    where: {
      companyId_requestKey: {
        companyId: actor.companyId,
        requestKey: input.requestKey,
      },
    },
  });
  if (prior) {
    sameRequest(prior.metadata, "stockRequestHash", input);
    return prior;
  }
  const date = new Date(input.date);
  await openDate(tx, actor.companyId, date);
  const item = await tx.register.findFirst({
    where: {
      id: input.itemId,
      companyId: actor.companyId,
      kind: "items",
      isActive: true,
    },
  });
  if (
    !item ||
    !(await tx.register.findFirst({
      where: {
        companyId: actor.companyId,
        kind: "warehouses",
        code: input.warehouse,
        isActive: true,
      },
    }))
  )
    throw new HttpError(400, "الصنف أو المخزن غير موجود");
  if (
    input.costCenter &&
    !(await tx.register.findFirst({
      where: {
        companyId: actor.companyId,
        kind: "cost-centers",
        code: input.costCenter,
        isActive: true,
      },
    }))
  )
    throw new HttpError(400, "مركز التكلفة غير موجود");
  const config = item.data as Record<string, string>,
    q = D(input.quantity);
  if (q.decimalPlaces() > 3) throw new HttpError(400, "دقة الكمية ثلاث منازل");
  const direction = ["OPENING", "RECEIPT", "RETURN_IN", "COUNT_GAIN"].includes(
    input.kind,
  )
    ? 1
    : -1;
  const history = await tx.stockMovement.findMany({
    where: {
      companyId: actor.companyId,
      itemId: item.id,
      warehouse: input.warehouse,
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  if (input.kind === "OPENING" && history.length)
    throw new HttpError(
      409,
      "الرصيد الافتتاحي يجب أن يسبق كل حركة لهذا الصنف والمخزن",
    );
  // Inserting on a historical date must preserve every later running quantity.
  let running = D(0),
    inserted = false;
  for (const h of history) {
    if (!inserted && h.date > date) {
      running = running.add(q.mul(direction));
      inserted = true;
      if (running.lt(0))
        throw new HttpError(409, "الرصيد لا يكفي في تاريخ المستند");
    }
    running = running.add(h.quantity.mul(h.direction));
    if (running.lt(0))
      throw new HttpError(409, "الحركة تسبب رصيداً سالباً في تاريخ لاحق");
  }
  if (!inserted) running = running.add(q.mul(direction));
  if (running.lt(0))
    throw new HttpError(409, "الرصيد لا يكفي؛ لا يسمح بمخزون سالب");
  if (input.kind === "COUNT_GAIN") {
    const priorBalance = (await stockBalances(actor.companyId, date, tx)).find(
      (b) => b.itemId === item.id,
    );
    if (!priorBalance || D(priorBalance.averageCost).lte(0))
      throw new HttpError(
        400,
        "لا يوجد أساس تكلفة لزيادة الجرد؛ سجل رصيداً افتتاحياً أو وارداً بقيمته أولاً",
      );
  }
  const financial = ["OPENING", "RECEIPT", "RETURN_OUT"].includes(input.kind);
  const amount = financial ? exactAmount || money(q.mul(input.unitCost)) : D(0);
  let entryId: string | undefined;
  if (financial) {
    if (amount.lte(0)) throw new HttpError(400, "أدخل قيمة المستند الأصلي");
    const accountCode =
      input.kind === "OPENING"
        ? config.inventoryAccount
        : config.purchaseAccount;
    if (!accountCode || !input.counterpart || accountCode === input.counterpart)
      throw new HttpError(
        400,
        "حدد حساب المخزون / المشتريات والحساب المقابل المختلف",
      );
    const entry = await createEntryTx(
      tx,
      actor,
      entrySchema.parse({
        date: input.date,
        kind: input.kind === "OPENING" ? "OPENING" : "STOCK",
        document: input.kind,
        description: input.description,
        reference: input.reference,
        requestKey: "stock:" + input.requestKey,
        lines: [
          {
            accountCode,
            costCenter: input.costCenter,
            costItem: input.costItem,
            debit: direction > 0 ? amount.toString() : "0",
            credit: direction < 0 ? amount.toString() : "0",
          },
          {
            accountCode: input.counterpart,
            party: input.party,
            debit: direction < 0 ? amount.toString() : "0",
            credit: direction > 0 ? amount.toString() : "0",
          },
        ],
      }),
      true,
    );
    entryId = entry.id;
  }
  const movement = await tx.stockMovement.create({
    data: {
      companyId: actor.companyId,
      itemId: item.id,
      warehouse: input.warehouse,
      date,
      direction,
      quantity: q,
      unitCost: financial ? D(input.unitCost) : D(0),
      value: amount,
      kind: input.kind,
      reference: input.reference,
      entryId,
      requestKey: input.requestKey,
      metadata: {
        costCenter: input.costCenter,
        costItem: input.costItem,
        stockRequestHash: requestDigest(input),
        pricePerTonne: D(input.unitCost).mul(1000).toString(),
      },
    },
  });
  const balances = await stockBalances(actor.companyId, date, tx);
  if (balances.some((b) => b.itemId === item.id && D(b.value).lt(0)))
    throw new HttpError(400, "مرتجع المشتريات يتجاوز قيمة البضاعة المتاحة");
  await audit(tx, actor, "STOCK_POSTED", movement.id, {
    entryId: entryId || null,
    method: "PERIODIC_WEIGHTED_AVERAGE",
  });
  return movement;
}

export async function closeInventory(tx: Tx, actor: Actor, date: Date) {
  const existing = await tx.inventoryClose.findUnique({
    where: { companyId_date: { companyId: actor.companyId, date } },
  });
  if (existing) return existing;
  const later = await tx.inventoryClose.findFirst({
    where: { companyId: actor.companyId, date: { gt: date } },
  });
  if (later) throw new HttpError(409, "يوجد إقفال مخزون أحدث");
  const balances = await stockBalances(actor.companyId, date, tx);
  const items = await tx.register.findMany({
    where: { companyId: actor.companyId, kind: "items" },
  });
  const totals = new Map<string, { value: Prisma.Decimal; expense: string }>();
  for (const item of items) {
    const data = item.data as Record<string, string>;
    const related = balances.filter((b) => b.itemId === item.id);
    if (!related.length) continue;
    if (!data.inventoryAccount || !data.expenseAccount)
      throw new HttpError(
        400,
        "حدد حسابي المخزون وتغير المخزون للصنف " + item.code,
      );
    const previous = totals.get(data.inventoryAccount);
    if (previous && previous.expense !== data.expenseAccount)
      throw new HttpError(
        400,
        "الحساب المشترك للمخزون يجب أن يستخدم حساب تغير مخزون واحد",
      );
    totals.set(data.inventoryAccount, {
      value: (previous?.value || D(0)).add(sum(related.map((b) => b.value))),
      expense: data.expenseAccount,
    });
  }
  const lines: Record<string, string>[] = [];
  for (const [accountCode, g] of totals) {
    const ledger = await tx.journalLine.aggregate({
      where: {
        companyId: actor.companyId,
        accountCode,
        entry: { status: "POSTED", date: { lte: date } },
      },
      _sum: { debit: true, credit: true },
    });
    const book = D(ledger._sum.debit || 0).sub(ledger._sum.credit || 0),
      difference = g.value.sub(book);
    if (difference.isZero()) continue;
    const amount = difference.abs().toFixed(2);
    lines.push(
      {
        accountCode,
        debit: difference.gt(0) ? amount : "0",
        credit: difference.lt(0) ? amount : "0",
      },
      {
        accountCode: g.expense,
        debit: difference.lt(0) ? amount : "0",
        credit: difference.gt(0) ? amount : "0",
      },
    );
  }
  let entryId: string | undefined;
  if (lines.length) {
    const entry = await createEntryTx(
      tx,
      actor,
      entrySchema.parse({
        date: date.toISOString().slice(0, 10),
        kind: "ADJUSTMENT",
        description: "تسوية مخزون آخر الفترة بالمتوسط المرجح",
        document: "INVENTORY_CLOSE",
        requestKey: "inventory-close:" + date.toISOString(),
        lines,
      }),
      true,
    );
    entryId = entry.id;
  }
  const close = await tx.inventoryClose.create({
    data: {
      companyId: actor.companyId,
      date,
      snapshots: balances as unknown as Prisma.InputJsonValue,
      entryId,
    },
  });
  await tx.company.update({
    where: { id: actor.companyId },
    data: { closedThrough: date },
  });
  await audit(tx, actor, "INVENTORY_CLOSED", close.id, {
    entryId: entryId || null,
    date: date.toISOString(),
  });
  return close;
}
