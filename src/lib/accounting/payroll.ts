import { z } from "zod";
import { D, money } from "./calculations";
import { dateOnly, decimal, Tx } from "./ledger";
import { payrollAmounts, PayrollMovement } from "./payroll-calculations";

export const payrollMovementSchema = z.object({
  employee: z.string().min(1).max(100),
  date: dateOnly,
  absenceDays: decimal.default("0"),
  deductionDays: decimal.default("0"),
  insurance: decimal.default("0"),
  allowances: decimal.default("0"),
  bonusDays: decimal.default("0"),
  overtimeDays: decimal.default("0"),
  overtimeHours: decimal.default("0"),
  advance: decimal.default("0"),
  cashAccount: z.string().max(50).default(""),
  requestKey: z.string().min(8).max(80),
  description: z.string().max(500).default(""),
});
export const payrollMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export function monthRange(month: string) {
  payrollMonth.parse(month);
  const from = new Date(month + "-01T00:00:00Z"),
    to = new Date(from);
  to.setUTCMonth(to.getUTCMonth() + 1);
  to.setUTCDate(0);
  return { from, to };
}
export async function payrollReport(tx: Tx, companyId: number, month: string) {
  const { from, to } = monthRange(month);
  const employees = await tx.register.findMany({
    where: { companyId, kind: "employees" },
    orderBy: { code: "asc" },
  });
  const records = await tx.register.findMany({
    where: { companyId, kind: "payroll-movements" },
    orderBy: { createdAt: "asc" },
  });
  const saved = await tx.register.findMany({
    where: {
      companyId,
      kind: "payroll-month",
      code: { startsWith: month + ":" },
    },
  });
  const advances = await tx.journalLine.findMany({
    where: {
      companyId,
      entry: {
        status: "POSTED",
        date: { gte: from, lte: to },
        NOT: { document: "PAYROLL" },
      },
    },
    include: { entry: true },
  });
  const rows = employees.flatMap((emp) => {
    const data = emp.data as Record<string, string>;
    const snapshot = saved.find((s) => s.code === month + ":" + emp.code);
    const state = (snapshot?.data || {}) as Record<string, any>;
    const movements = records
      .filter((r) => {
        const d = r.data as Record<string, string>;
        return (
          !d.void && d.employee === emp.code && d.date.startsWith(month + "-")
        );
      })
      .map((r) => ({ id: r.id, ...(r.data as Record<string, string>) }));
    if (
      !snapshot &&
      !movements.length &&
      (!emp.isActive ||
        (data.startDate && data.startDate > to.toISOString().slice(0, 10)))
    )
      return [];
    const sourceAdvances = advances.filter(
      (l) => l.party === emp.code && l.accountCode === data.advanceAccount,
    );
    const advanceTotal = sourceAdvances.reduce(
      (n, l) => n.add(l.debit).sub(l.credit),
      D(0),
    );
    const basic = state.basicSalary ?? data.basicSalary;
    const calculated = payrollAmounts(
      basic,
      movements as unknown as PayrollMovement[],
      money(advanceTotal).toFixed(2),
    );
    return [
      {
        id: emp.id,
        code: emp.code,
        name: emp.name,
        job: data.job || "",
        month,
        ...(state.entryId ? state.amounts : calculated),
        entryId: state.entryId || null,
        movements,
        advanceLines: sourceAdvances.map((l) => ({
          date: l.entry.date.toISOString().slice(0, 10),
          number: l.entry.number,
          amount: money(l.debit.sub(l.credit)).toFixed(2),
        })),
      },
    ];
  });
  const total = (key: string) =>
    money(rows.reduce((n, r) => n.add(D(r[key] || 0)), D(0))).toFixed(2);
  return {
    month,
    rows,
    totals: {
      gross: total("gross"),
      withheld: total("withheld"),
      net: total("net"),
    },
  };
}
