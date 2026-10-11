import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/server/http";
import { validateLines } from "./calculations";

export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T00:00:00Z");
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "تاريخ غير صالح");
export const decimal = z
  .union([z.string(), z.number()])
  .transform(String)
  .refine(
    (v) => /^\d{1,15}(\.\d{1,6})?$/.test(v),
    "رقم موجب بدقة ست منازل كحد أقصى",
  );
const text = z.string().trim().max(200).default("");
export const lineSchema = z.object({
  accountCode: z.string().trim().min(1).max(50),
  debit: decimal.default("0"),
  credit: decimal.default("0"),
  description: text,
  party: text,
  costCenter: text,
  costType: text,
  costItem: text,
  season: text,
  farm: text,
  pivot: text,
  cashFlow: z.enum(["", "OPERATING", "INVESTING", "FINANCING"]).default(""),
});
export const entrySchema = z.object({
  date: dateOnly,
  description: z.string().trim().min(1).max(1000),
  kind: z
    .enum([
      "GENERAL",
      "OPENING",
      "ADJUSTMENT",
      "CASH",
      "DEPRECIATION",
      "STOCK",
      "CLOSING",
    ])
    .default("GENERAL"),
  document: text,
  reference: text,
  requestKey: z.string().min(8).max(100),
  lines: z.array(lineSchema).min(2).max(500),
});
export type EntryInput = z.infer<typeof entrySchema>;
export type Actor = { id: string; companyId: number; role: string };
export type Tx = Prisma.TransactionClient;

export const requestDigest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function sameRequest(metadata: unknown, key: string, value: unknown) {
  const previous = (metadata as Record<string, unknown> | null)?.[key];
  if (previous && previous !== requestDigest(value))
    throw new HttpError(
      409,
      "رقم طلب مكرر ببيانات مختلفة؛ حدّث الصفحة وراجع المستند المسجل أولاً",
    );
}

// All accounting and master-data mutations take the same per-company lock.
// This serializes posting, inventory valuation and period closure.
export async function locked<T>(companyId: number, fn: (tx: Tx) => Promise<T>) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${companyId}::bigint)`;
      return fn(tx);
    },
    { maxWait: 10000, timeout: 20000 },
  );
}
export async function audit(
  tx: Tx,
  actor: Actor,
  action: string,
  entityId: string,
  detail: Prisma.InputJsonValue = {},
) {
  await tx.auditLog.create({
    data: {
      companyId: actor.companyId,
      userId: actor.id,
      action,
      entityId,
      detail,
    },
  });
}
export async function openDate(tx: Tx, companyId: number, date: Date) {
  const company = await tx.company.findUniqueOrThrow({
    where: { id: companyId },
  });
  if (company.closedThrough && date <= company.closedThrough)
    throw new HttpError(409, "الفترة المالية مقفلة");
  if (
    await tx.fiscalPeriod.count({
      where: {
        companyId,
        isClosed: true,
        start: { lte: date },
        end: { gte: date },
      },
    })
  )
    throw new HttpError(409, "الفترة المالية مقفلة");
}
export async function checkLines(
  tx: Tx,
  actor: Actor,
  lines: EntryInput["lines"],
) {
  try {
    validateLines(lines);
  } catch (e) {
    throw new HttpError(400, (e as Error).message);
  }
  const codes = [...new Set(lines.map((l) => l.accountCode))];
  const accounts = await tx.account.findMany({
    where: {
      companyId: actor.companyId,
      code: { in: codes },
      isActive: true,
      isGroup: false,
    },
  });
  if (accounts.length !== codes.length)
    throw new HttpError(400, "اختر حسابات تفصيلية فعالة من شركتك");
  for (const [field, kind] of [
    ["party", "parties"],
    ["costCenter", "cost-centers"],
  ] as const) {
    const values = [...new Set(lines.map((l) => l[field]).filter(Boolean))];
    if (
      values.length &&
      (await tx.register.count({
        where: {
          companyId: actor.companyId,
          kind: field === "party" ? { in: ["parties", "employees"] } : kind,
          code: { in: values },
          isActive: true,
        },
      })) !== values.length
    )
      throw new HttpError(400, `مرجع غير موجود: ${field}`);
  }
}
async function checkPayrollMonth(
  tx: Tx,
  actor: Actor,
  date: Date,
  lines: { party: string; accountCode: string }[],
) {
  const employees = await tx.register.findMany({
    where: {
      companyId: actor.companyId,
      kind: "employees",
      code: { in: lines.map((l) => l.party).filter(Boolean) },
    },
  });
  for (const employee of employees) {
    if (
      !lines.some(
        (l) =>
          l.party === employee.code &&
          l.accountCode ===
            (employee.data as Record<string, string>).advanceAccount,
      )
    )
      continue;
    const saved = await tx.register.findUnique({
      where: {
        companyId_kind_code: {
          companyId: actor.companyId,
          kind: "payroll-month",
          code: date.toISOString().slice(0, 7) + ":" + employee.code,
        },
      },
    });
    if ((saved?.data as Record<string, unknown> | undefined)?.entryId)
      throw new HttpError(
        409,
        "سلف هذا الشهر أُقفلت بترحيل المرتب؛ استخدم تسوية في شهر مفتوح",
      );
  }
}
export async function createEntryTx(
  tx: Tx,
  actor: Actor,
  input: EntryInput,
  post = false,
) {
  const existing = await tx.journalEntry.findUnique({
    where: {
      companyId_requestKey: {
        companyId: actor.companyId,
        requestKey: input.requestKey,
      },
    },
  });
  if (existing) {
    sameRequest(existing.metadata, "requestHash", input);
    return existing;
  }
  await openDate(tx, actor.companyId, new Date(input.date));
  await checkLines(tx, actor, input.lines);
  await checkPayrollMonth(tx, actor, new Date(input.date), input.lines);
  const enriched = [];
  for (const line of input.lines) {
    const center = line.costCenter
      ? await tx.register.findFirst({
          where: {
            companyId: actor.companyId,
            kind: "cost-centers",
            code: line.costCenter,
          },
        })
      : null;
    const dimensions = (center?.data || {}) as Record<string, string>;
    enriched.push({
      ...line,
      costType: dimensions.type || line.costType,
      season: line.season || dimensions.season || "",
      farm: line.farm || dimensions.farm || "",
      pivot: line.pivot || dimensions.pivot || "",
    });
  }
  const sequence = await tx.sequence.upsert({
    where: { companyId_key: { companyId: actor.companyId, key: "journal" } },
    create: { companyId: actor.companyId, key: "journal", value: 1 },
    update: { value: { increment: 1 } },
  });
  const { lines: originalLines, ...header } = input;
  const lines = enriched;
  const entry = await tx.journalEntry.create({
    data: {
      ...header,
      date: new Date(input.date),
      companyId: actor.companyId,
      number: sequence.value,
      metadata: { requestHash: requestDigest(input) },
      createdBy: actor.id,
      status: post ? "POSTED" : "DRAFT",
      postedAt: post ? new Date() : null,
      postedBy: post ? actor.id : null,
      lines: { create: lines },
    },
    include: { lines: true },
  });
  await audit(
    tx,
    actor,
    post ? "ENTRY_CREATED_POSTED" : "ENTRY_CREATED",
    entry.id,
  );
  return entry;
}
export async function createEntry(actor: Actor, input: EntryInput) {
  return locked(actor.companyId, (tx) => createEntryTx(tx, actor, input));
}
export async function entryAction(
  actor: Actor,
  id: string,
  action: "post" | "void" | "reverse",
  reversalDate?: string,
) {
  return locked(actor.companyId, async (tx) => {
    const entry = await tx.journalEntry.findFirst({
      where: { id, companyId: actor.companyId },
      include: { lines: true },
    });
    if (!entry) throw new HttpError(404, "القيد غير موجود");
    if (action === "reverse") {
      if (entry.status !== "POSTED" || entry.reversalOf)
        throw new HttpError(409, "يمكن عكس قيد مرحل أصلي فقط");
      if (
        ["DEPRECIATION", "INVENTORY_CLOSE", "PAYROLL"].includes(entry.document)
      )
        throw new HttpError(
          409,
          "قيد نظام مرتبط بجدول إهلاك أو إقفال. سجل تسوية معتمدة في فترة مفتوحة",
        );
      if (
        await tx.stockMovement.count({
          where: { companyId: actor.companyId, entryId: id },
        })
      )
        throw new HttpError(409, "قيد مخزون: استخدم مستند إرجاع للمخزون");
      const prior = await tx.journalEntry.findUnique({
        where: { reversalOf: id },
      });
      if (prior) return prior;
      const date = dateOnly.parse(reversalDate);
      if (date < entry.date.toISOString().slice(0, 10))
        throw new HttpError(400, "تاريخ العكس قبل القيد الأصلي");
      const reversal = await createEntryTx(
        tx,
        actor,
        entrySchema.parse({
          date,
          description: "عكس قيد " + entry.number,
          kind: entry.kind,
          reference: entry.reference,
          document: entry.document,
          requestKey: "reversal:" + id,
          lines: entry.lines.map((l) => ({
            ...l,
            debit: l.credit.toString(),
            credit: l.debit.toString(),
          })),
        }),
        true,
      );
      await tx.journalEntry.update({
        where: { id: reversal.id },
        data: { reversalOf: id },
      });
      await audit(tx, actor, "ENTRY_REVERSED", id, { reversalId: reversal.id });
      return reversal;
    }
    if (entry.status === (action === "post" ? "POSTED" : "VOID")) return entry;
    if (entry.status !== "DRAFT")
      throw new HttpError(409, "القيد المرحل لا يعدل ولا يحذف؛ استخدم العكس");
    await openDate(tx, actor.companyId, entry.date);
    if (action === "post")
      await checkPayrollMonth(tx, actor, entry.date, entry.lines);
    if (action === "post")
      await checkLines(
        tx,
        actor,
        entry.lines.map((l) =>
          lineSchema.parse({
            ...l,
            debit: l.debit.toString(),
            credit: l.credit.toString(),
          }),
        ),
      );
    const result = await tx.journalEntry.update({
      where: { id },
      data: {
        status: action === "post" ? "POSTED" : "VOID",
        postedAt: action === "post" ? new Date() : null,
        postedBy: action === "post" ? actor.id : null,
      },
    });
    await audit(
      tx,
      actor,
      action === "post" ? "ENTRY_POSTED" : "ENTRY_VOIDED",
      id,
    );
    return result;
  });
}
