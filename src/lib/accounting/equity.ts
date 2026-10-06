import { z } from "zod";
import { D, money, sum } from "./calculations";
import { decimal, Tx } from "./ledger";
import { financialStatements, partyBalances } from "./reports";
import { HttpError } from "@/lib/server/http";
export const partnerInput = z.object({
  capital: decimal.default("0"),
  funding: decimal.default("0"),
  withdrawals: decimal.default("0"),
  receivedRevenue: decimal.default("0"),
  offset: decimal.default("0"),
  drawingInterest: decimal.default("0"),
  capitalInterest: decimal.default("0"),
  salary: decimal.default("0"),
});
export type PartnerInput = z.infer<typeof partnerInput>;
export function allocatePartners(
  partners: { code: string; name: string; share: string }[],
  inputs: Record<string, PartnerInput>,
  profit: string,
  costs: string,
) {
  if (!partners.length) return [];
  const totalShare = sum(partners.map((p) => p.share));
  if (!totalShare.isZero() && !totalShare.eq(1))
    throw new HttpError(
      400,
      "مجموع نسب الشركاء يجب أن يساوي 1، أو اترك الجميع صفراً للتوزيع المتساوي",
    );
  const totalCapital = sum(partners.map((p) => inputs[p.code]?.capital || 0));
  let allocatedProfit = D(0),
    allocatedCost = D(0);
  return partners.map((p, i) => {
    const v = partnerInput.parse(inputs[p.code] || {}),
      ratio = totalShare.isZero() ? D(1).div(partners.length) : D(p.share);
    const profitShare =
      i === partners.length - 1
        ? D(profit).sub(allocatedProfit)
        : money(D(profit).mul(ratio));
    allocatedProfit = allocatedProfit.add(profitShare);
    const costShare =
      i === partners.length - 1
        ? D(costs).sub(allocatedCost)
        : money(D(costs).mul(ratio));
    allocatedCost = allocatedCost.add(costShare);
    const fundingOffset = D(v.funding).sub(costShare),
      drawings = D(v.withdrawals).add(v.receivedRevenue).add(v.offset);
    const profitCurrent = profitShare
      .sub(v.withdrawals)
      .add(v.drawingInterest)
      .sub(v.capitalInterest)
      .sub(v.salary);
    return {
      code: p.code,
      name: p.name,
      ...v,
      ratio: ratio.mul(100).toFixed(4) + "%",
      capitalRatio: totalCapital.gt(0)
        ? D(v.capital).div(totalCapital).mul(100).toFixed(4) + "%"
        : "—",
      profitShare: profitShare.toFixed(2),
      costShare: costShare.toFixed(2),
      fundingOffset: fundingOffset.toFixed(2),
      totalDrawings: drawings.toFixed(2),
      settlement: fundingOffset.sub(drawings).toFixed(2),
      profitCurrent: profitCurrent.toFixed(2),
      endingCapital: D(v.capital).add(profitCurrent).toFixed(2),
    };
  });
}
export async function equityReport(
  db: Tx,
  companyId: number,
  from: Date,
  to: Date,
) {
  const key =
    from.toISOString().slice(0, 10) + ":" + to.toISOString().slice(0, 10);
  const saved = await db.register.findUnique({
    where: {
      companyId_kind_code: { companyId, kind: "equity-inputs", code: key },
    },
  });
  const inputs = (saved?.data || {}) as Record<string, PartnerInput>;
  const partners = await db.register.findMany({
    where: { companyId, kind: "parties", isActive: true },
    orderBy: { code: "asc" },
  });
  const selected = partners.filter(
    (p) => (p.data as Record<string, string>).type === "PARTNER",
  );
  const financial = await financialStatements(companyId, from, to, db),
    balances = await partyBalances(companyId, from, to, db);
  const costs = sum(
    financial.incomeRows
      .filter((a) => a.accountClass === "المصروفات")
      .map((a) => a.periodBalance),
  );
  const rows = allocatePartners(
    selected.map((p) => ({
      code: p.code,
      name: p.name,
      share: String((p.data as Record<string, string>).share || "0"),
    })),
    inputs,
    financial.profit,
    costs.toString(),
  ).map((p) => ({
    ...p,
    ledgerBalance:
      balances.rows.find((r) => r.code === p.code)?.balance || "0.00",
  }));
  return {
    rows,
    inputs,
    profit: financial.profit,
    costs: costs.toFixed(2),
    pendingInventoryAdjustment: financial.pendingInventoryAdjustment,
  };
}
