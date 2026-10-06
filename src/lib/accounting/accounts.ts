import { Prisma } from "@prisma/client";
import { z } from "zod";
import { Actor, audit, locked, Tx } from "./ledger";
import { HttpError } from "@/lib/server/http";
export const accountSchema = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(200),
  nameEn: z.string().max(200).nullable().optional(),
  accountClass: z.enum([
    "الأصول",
    "الخصوم",
    "حقوق الملكية",
    "الإيرادات",
    "المصروفات",
  ]),
  mainGroup: z.string().max(200).nullable().optional(),
  subGroup: z.string().max(200).nullable().optional(),
  nature: z.enum(["مدين", "دائن"]),
  statementType: z.enum(["قائمة المركز المالي", "قائمة الدخل"]),
  parentCode: z.string().max(50).nullable().optional(),
  isGroup: z.boolean().default(false),
});
export async function addAccount(
  actor: Actor,
  input: z.infer<typeof accountSchema>,
) {
  return locked(actor.companyId, async (tx) => {
    let level = 1;
    if (input.parentCode) {
      const parent = await tx.account.findUnique({
        where: {
          companyId_code: {
            companyId: actor.companyId,
            code: input.parentCode,
          },
        },
      });
      if (!parent || !parent.isActive)
        throw new HttpError(400, "الحساب الأب غير موجود أو موقوف");
      if (
        parent.accountClass !== input.accountClass ||
        parent.statementType !== input.statementType
      )
        throw new HttpError(
          400,
          "تصنيف الحساب والقائمة يجب أن يطابقا الحساب الأب",
        );
      if (
        await tx.journalLine.count({
          where: { companyId: actor.companyId, accountCode: parent.code },
        })
      )
        throw new HttpError(409, "حساب مستخدم في قيود لا يتحول إلى مجموعة");
      level = parent.level + 1;
      if (level > 10) throw new HttpError(400, "أقصى عمق للدليل 10 مستويات");
      await tx.account.update({
        where: { id: parent.id },
        data: { isGroup: true },
      });
    }
    const saved = await tx.account.create({
      data: {
        ...input,
        parentCode: input.parentCode || null,
        companyId: actor.companyId,
        level,
        isSystem: false,
      },
    });
    await audit(tx, actor, "ACCOUNT_CREATED", String(saved.id));
    return saved;
  });
}
export async function changeAccount(
  actor: Actor,
  code: string,
  input: unknown,
  disable = false,
) {
  return locked(actor.companyId, async (tx) => {
    const existing = await tx.account.findUnique({
      where: { companyId_code: { companyId: actor.companyId, code } },
    });
    if (!existing) throw new HttpError(404, "الحساب غير موجود");
    const data = disable
      ? { isActive: false }
      : z
          .object({
            name: z.string().trim().min(1).max(200).optional(),
            nameEn: z.string().max(200).nullable().optional(),
            isActive: z.boolean().optional(),
            cashFlow: z
              .enum([
                "",
                "CASH",
                "OPERATING_ASSET",
                "OPERATING_LIABILITY",
                "NONCASH",
                "INVESTING",
                "FINANCING",
              ])
              .optional(),
          })
          .parse(input);
    if (
      data.isActive === false &&
      (await tx.account.count({
        where: { companyId: actor.companyId, parentCode: code, isActive: true },
      }))
    )
      throw new HttpError(409, "أوقف الحسابات الفرعية أولاً");
    const saved = await tx.account.update({ where: { id: existing.id }, data });
    await audit(tx, actor, "ACCOUNT_UPDATED", String(saved.id));
    return saved;
  });
}

export async function accountBalances(tx: Tx, companyId: number) {
  const accounts = await tx.account.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
  });
  const totals = await tx.journalLine.groupBy({
    by: ["accountCode"],
    where: { companyId, entry: { status: "POSTED" } },
    _sum: { debit: true, credit: true },
  });
  const balances = new Map(
    totals.map((t) => [
      t.accountCode,
      new Prisma.Decimal(t._sum.debit || 0).sub(t._sum.credit || 0),
    ]),
  );
  for (const a of [...accounts].sort((a, b) => b.level - a.level))
    if (a.parentCode)
      balances.set(
        a.parentCode,
        (balances.get(a.parentCode) || new Prisma.Decimal(0)).add(
          balances.get(a.code) || 0,
        ),
      );
  return accounts.map((a) => ({
    ...a,
    balance: (balances.get(a.code) || new Prisma.Decimal(0))
      .mul(a.nature === "دائن" ? -1 : 1)
      .toNumber(),
  }));
}
