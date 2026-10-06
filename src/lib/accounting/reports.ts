import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { D, money, sum } from "./calculations";
import { dateOnly, Tx } from "./ledger";
import { HttpError } from "@/lib/server/http";
import { stockBalances } from "./periodic-stock";

export function reportFilter(p: URLSearchParams) {
  const from = p.get("from")
    ? new Date(dateOnly.parse(p.get("from")))
    : new Date("1900-01-01");
  const to = p.get("to")
    ? new Date(dateOnly.parse(p.get("to")))
    : new Date("9999-12-31");
  if (from > to) throw new HttpError(400, "تاريخ البداية بعد النهاية");
  return { from, to };
}
export async function trialBalance(
  companyId: number,
  from: Date,
  to: Date,
  db: Tx = prisma,
) {
  const accounts = await db.account.findMany({
    where: { companyId, isGroup: false },
    orderBy: { code: "asc" },
  });
  const grouped = await db.journalLine.groupBy({
    by: ["accountCode"],
    where: { companyId, entry: { status: "POSTED", date: { lte: to } } },
    _sum: { debit: true, credit: true },
  });
  const opening = await db.journalLine.groupBy({
    by: ["accountCode"],
    where: {
      companyId,
      entry: {
        status: "POSTED",
        OR: [
          { date: { lt: from } },
          { kind: "OPENING", date: { gte: from, lte: to } },
        ],
      },
    },
    _sum: { debit: true, credit: true },
  });
  const adjustments = await db.journalLine.groupBy({
    by: ["accountCode"],
    where: {
      companyId,
      entry: {
        status: "POSTED",
        kind: "ADJUSTMENT",
        date: { gte: from, lte: to },
      },
    },
    _sum: { debit: true, credit: true },
  });
  return accounts.map((a) => {
    const t = grouped.find((l) => l.accountCode === a.code),
      o = opening.find((l) => l.accountCode === a.code),
      adj = adjustments.find((l) => l.accountCode === a.code);
    const debit = D(t?._sum.debit || 0),
      credit = D(t?._sum.credit || 0),
      balance = debit.sub(credit);
    const od = D(o?._sum.debit || 0),
      oc = D(o?._sum.credit || 0),
      ad = D(adj?._sum.debit || 0),
      ac = D(adj?._sum.credit || 0);
    return {
      code: a.code,
      name: a.name,
      accountClass: a.accountClass,
      statementType: a.statementType,
      cashFlow: a.cashFlow,
      openingDebit: od.toFixed(2),
      openingCredit: oc.toFixed(2),
      movementDebit: debit.sub(od).sub(ad).toFixed(2),
      movementCredit: credit.sub(oc).sub(ac).toFixed(2),
      adjustmentDebit: ad.toFixed(2),
      adjustmentCredit: ac.toFixed(2),
      debit: debit.toFixed(2),
      credit: credit.toFixed(2),
      closingDebit: Prisma.Decimal.max(balance, 0).toFixed(2),
      closingCredit: Prisma.Decimal.max(balance.neg(), 0).toFixed(2),
      balance: balance.toFixed(2),
      periodBalance: debit.sub(od).sub(credit).add(oc).toFixed(2),
    };
  });
}
export async function ledgerReport(
  companyId: number,
  p: URLSearchParams,
  db: Tx = prisma,
) {
  const { from, to } = reportFilter(p);
  const filter: Prisma.JournalLineWhereInput = {
    companyId,
    ...(p.get("account") ? { accountCode: p.get("account")! } : {}),
    ...(p.get("party") ? { party: p.get("party")! } : {}),
    ...(p.get("costCenter") ? { costCenter: p.get("costCenter")! } : {}),
    ...(p.get("costType") ? { costType: p.get("costType")! } : {}),
    ...(p.get("cashOnly") === "true" ? { account: { cashFlow: "CASH" } } : {}),
  };
  const documents = p.get("documents")?.split(",").filter(Boolean);
  const documentFilter = documents
    ? { document: { in: documents } }
    : p.get("document")
      ? { document: p.get("document")! }
      : {};
  const opening = await db.journalLine.aggregate({
    where: {
      ...filter,
      entry: { status: "POSTED", date: { lt: from }, ...documentFilter },
    },
    _sum: { debit: true, credit: true },
  });
  const lines = await db.journalLine.findMany({
    where: {
      ...filter,
      entry: {
        status: "POSTED",
        date: { gte: from, lte: to },
        ...documentFilter,
      },
    },
    include: { account: true, entry: true },
    orderBy: [
      { entry: { date: "asc" } },
      { entry: { number: "asc" } },
      { id: "asc" },
    ],
  });
  let balance = D(opening._sum.debit || 0).sub(opening._sum.credit || 0);
  const openingBalance = balance.toFixed(2);
  const rows = lines.map((l) => {
    balance = balance.add(l.debit).sub(l.credit);
    return {
      id: l.id,
      date: l.entry.date.toISOString().slice(0, 10),
      number: l.entry.number,
      account: l.accountCode,
      name: l.account.name,
      description: l.description || l.entry.description,
      document: l.entry.document,
      reference: l.entry.reference,
      party: l.party,
      costCenter: l.costCenter,
      costType: l.costType,
      costItem: l.costItem,
      season: l.season,
      farm: l.farm,
      pivot: l.pivot,
      debit: l.debit.toFixed(2),
      credit: l.credit.toFixed(2),
      balance: balance.toFixed(2),
    };
  });
  return {
    rows,
    openingBalance,
    closingBalance: balance.toFixed(2),
    debit: sum(lines.map((l) => l.debit)).toFixed(2),
    credit: sum(lines.map((l) => l.credit)).toFixed(2),
  };
}
export async function financialStatements(
  companyId: number,
  from: Date,
  to: Date,
  db: Tx = prisma,
) {
  const trial = await trialBalance(companyId, from, to, db);
  const isIncome = (a: (typeof trial)[number]) =>
    a.statementType === "قائمة الدخل";
  const incomeRows = trial.filter(isIncome);
  const profit = sum(incomeRows.map((a) => D(a.periodBalance).neg()));
  const allProfit = sum(incomeRows.map((a) => D(a.balance).neg()));
  const assets = sum(
    trial
      .filter((a) => !isIncome(a) && a.accountClass === "الأصول")
      .map((a) => a.balance),
  );
  const liabilities = sum(
    trial
      .filter((a) => !isIncome(a) && a.accountClass === "الخصوم")
      .map((a) => D(a.balance).neg()),
  );
  const equity = sum(
    trial
      .filter((a) => !isIncome(a) && a.accountClass === "حقوق الملكية")
      .map((a) => D(a.balance).neg()),
  );
  const items = await db.register.findMany({
    where: { companyId, kind: "items" },
  });
  const inventoryCodes = new Set(
    items
      .map((i) => (i.data as Record<string, string>).inventoryAccount)
      .filter(Boolean),
  );
  const stockValue = sum(
    (await stockBalances(companyId, to, db)).map((b) => b.value),
  );
  const stockBook = sum(
    trial.filter((a) => inventoryCodes.has(a.code)).map((a) => a.balance),
  );
  const allAccounts = await db.account.findMany({
    where: { companyId },
    select: { code: true, parentCode: true },
  });
  const parents = new Map(allAccounts.map((a) => [a.code, a.parentCode]));
  function belongs(code: string, group: string) {
    const seen = new Set<string>();
    let cursor: string | null | undefined = code;
    while (cursor && !seen.has(cursor)) {
      if (cursor === group) return true;
      seen.add(cursor);
      cursor = parents.get(cursor);
    }
    return false;
  }
  const groupValue = (group: string) =>
    sum(
      incomeRows
        .filter((a) => belongs(a.code, group))
        .map((a) => a.periodBalance),
    );
  const sales = groupValue("41").neg(),
    cogs = groupValue("51"),
    otherRevenue = groupValue("42").neg(),
    selling = groupValue("52"),
    admin = groupValue("53");
  const otherExpenses = profit
    .neg()
    .add(sales)
    .sub(cogs)
    .add(otherRevenue)
    .sub(selling)
    .sub(admin);
  const incomeSummary = [
    { label: "صافي إيرادات النشاط", value: sales.toFixed(2) },
    { label: "تكلفة النشاط والمبيعات", value: cogs.toFixed(2) },
    { label: "مجمل الربح", value: sales.sub(cogs).toFixed(2) },
    { label: "إيرادات أخرى", value: otherRevenue.toFixed(2) },
    { label: "مصاريف البيع والتسويق", value: selling.toFixed(2) },
    { label: "مصاريف إدارية وعمومية", value: admin.toFixed(2) },
    { label: "باقي المصروفات والتسويات", value: otherExpenses.toFixed(2) },
    { label: "صافي الربح", value: profit.toFixed(2) },
  ];
  const equityRows = trial
    .filter((a) => a.accountClass === "حقوق الملكية")
    .map((a) => ({
      code: a.code,
      name: a.name,
      opening: D(a.openingCredit).sub(a.openingDebit).toFixed(2),
      increases: D(a.movementCredit).add(a.adjustmentCredit).toFixed(2),
      decreases: D(a.movementDebit).add(a.adjustmentDebit).toFixed(2),
      closing: D(a.balance).neg().toFixed(2),
    }));
  equityRows.push({
    code: "",
    name: "أرباح غير مقفلة",
    opening: allProfit.sub(profit).toFixed(2),
    increases: Prisma.Decimal.max(profit, 0).toFixed(2),
    decreases: Prisma.Decimal.max(profit.neg(), 0).toFixed(2),
    closing: allProfit.toFixed(2),
  });
  return {
    rows: trial,
    incomeRows,
    incomeSummary,
    equityRows,
    profit: profit.toFixed(2),
    assets: assets.toFixed(2),
    liabilities: liabilities.toFixed(2),
    equity: equity.toFixed(2),
    unclosedProfit: allProfit.toFixed(2),
    difference: assets.sub(liabilities).sub(equity).sub(allProfit).toFixed(2),
    pendingInventoryAdjustment: stockValue.sub(stockBook).toFixed(2),
  };
}

// A cash line has its own classification, independent of the counteraccount.
// This supports compound entries without inventing cash from accrual balances.
export async function cashFlow(
  companyId: number,
  from: Date,
  to: Date,
  db: Tx = prisma,
) {
  const lines = await db.journalLine.findMany({
    where: {
      companyId,
      account: { cashFlow: "CASH" },
      entry: {
        status: "POSTED",
        date: { gte: from, lte: to },
        kind: { not: "OPENING" },
      },
    },
    include: { account: true, entry: true },
  });
  const rows = ["OPERATING", "INVESTING", "FINANCING", "UNCLASSIFIED"].map(
    (category) => ({
      category,
      amount: sum(
        lines
          .filter((l) => (l.cashFlow || "UNCLASSIFIED") === category)
          .map((l) => l.debit.sub(l.credit)),
      ).toFixed(2),
    }),
  );
  const total = sum(rows.map((r) => r.amount));
  const opening = await db.journalLine.aggregate({
    where: {
      companyId,
      account: { cashFlow: "CASH" },
      entry: {
        status: "POSTED",
        OR: [
          { date: { lt: from } },
          { kind: "OPENING", date: { gte: from, lte: to } },
        ],
      },
    },
    _sum: { debit: true, credit: true },
  });
  const initial = D(opening._sum.debit || 0).sub(opening._sum.credit || 0);
  return {
    rows,
    opening: initial.toFixed(2),
    net: total.toFixed(2),
    closing: initial.add(total).toFixed(2),
    unclassified: lines.filter((l) => !l.cashFlow).length,
  };
}

export async function indirectCashFlow(
  companyId: number,
  from: Date,
  to: Date,
  db: Tx = prisma,
) {
  const trial = await trialBalance(companyId, from, to, db),
    direct = await cashFlow(companyId, from, to, db);
  const profit = sum(
    trial
      .filter((a) => a.statementType === "قائمة الدخل")
      .map((a) => D(a.periodBalance).neg()),
  );
  const noncash = sum(
    trial.filter((a) => a.cashFlow === "NONCASH").map((a) => a.periodBalance),
  );
  const workingCapital = sum(
    trial
      .filter((a) =>
        ["OPERATING_ASSET", "OPERATING_LIABILITY"].includes(a.cashFlow || ""),
      )
      .map((a) => D(a.periodBalance).neg()),
  );
  const operating = profit.add(noncash).add(workingCapital);
  const investing = D(
      direct.rows.find((r) => r.category === "INVESTING")!.amount,
    ),
    financing = D(direct.rows.find((r) => r.category === "FINANCING")!.amount);
  const net = operating.add(investing).add(financing);
  return {
    rows: [
      { category: "صافي الربح", amount: profit.toFixed(2) },
      {
        category: "تعديلات غير نقدية حسب تصنيف الحسابات",
        amount: noncash.toFixed(2),
      },
      { category: "تغير رأس المال العامل", amount: workingCapital.toFixed(2) },
      { category: "صافي النشاط التشغيلي", amount: operating.toFixed(2) },
      { category: "صافي الاستثمار", amount: investing.toFixed(2) },
      { category: "صافي التمويل", amount: financing.toFixed(2) },
    ],
    opening: direct.opening,
    net: net.toFixed(2),
    closing: D(direct.opening).add(net).toFixed(2),
    difference: D(direct.net).sub(net).toFixed(2),
    unclassified: direct.unclassified,
  };
}
export async function partyBalances(
  companyId: number,
  from: Date,
  to: Date,
  db: Tx = prisma,
) {
  const parties = await db.register.findMany({
    where: { companyId, kind: "parties" },
    orderBy: { code: "asc" },
  });
  const total = await db.journalLine.groupBy({
    by: ["party"],
    where: { companyId, entry: { status: "POSTED", date: { lte: to } } },
    _sum: { debit: true, credit: true },
  });
  const prior = await db.journalLine.groupBy({
    by: ["party"],
    where: { companyId, entry: { status: "POSTED", date: { lt: from } } },
    _sum: { debit: true, credit: true },
  });
  return {
    rows: parties.map((p) => {
      const t = total.find((r) => r.party === p.code),
        o = prior.find((r) => r.party === p.code),
        d = D(t?._sum.debit || 0),
        c = D(t?._sum.credit || 0),
        od = D(o?._sum.debit || 0),
        oc = D(o?._sum.credit || 0);
      return {
        code: p.code,
        name: p.name,
        type: (p.data as Record<string, string>).type,
        openingBalance: od.sub(oc).toFixed(2),
        debit: d.sub(od).toFixed(2),
        credit: c.sub(oc).toFixed(2),
        balance: d.sub(c).toFixed(2),
      };
    }),
  };
}
