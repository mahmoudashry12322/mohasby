import { Prisma } from "@prisma/client";

export const D = (v: Prisma.Decimal.Value = 0) => new Prisma.Decimal(v);
export const money = (v: Prisma.Decimal.Value) =>
  D(v).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
export const sum = (v: Prisma.Decimal.Value[]) =>
  v.reduce<Prisma.Decimal>((a, n) => a.add(n), D(0));

// قيود اليومية AA:AJ, AL/AM. Rates are fractions; prices are per tonne.
export function weighTicket(input: {
  weight: string;
  tare: string;
  bags: string;
  bagDeduction: string;
  discountRate: string;
  inspectionRate: string;
  pricePerTonne: string;
}) {
  for (const value of Object.values(input))
    if (!D(value).isFinite() || D(value).isNegative())
      throw new Error("القيم يجب أن تكون موجبة أو صفراً");
  if (D(input.discountRate).gt(1) || D(input.inspectionRate).gt(1))
    throw new Error("النسبة بين صفر وواحد");
  const gross = D(input.weight).sub(input.tare);
  const bagLoss = D(input.bags).mul(input.bagDeduction);
  const netKg = gross.sub(bagLoss);
  const discount = netKg.mul(input.discountRate);
  const afterDiscount = netKg.sub(discount);
  const inspection = afterDiscount.mul(input.inspectionRate);
  const net = afterDiscount.sub(inspection);
  if (gross.lt(0) || net.lt(0)) throw new Error("الخصومات تتجاوز الوزن");
  return {
    gross,
    bagLoss,
    netKg,
    discount,
    afterDiscount,
    inspection,
    net,
    amount: money(net.mul(input.pricePerTonne).div(1000)),
  };
}

export function importCost(v: {
  goods: string;
  freight: string;
  insuranceRate: string;
  customsRate: string;
  fees: string;
  quantity: string;
  exchangeRate: string;
}) {
  for (const n of Object.values(v))
    if (!D(n).isFinite() || D(n).lt(0)) throw new Error("قيمة غير صالحة");
  if (D(v.quantity).lte(0) || D(v.exchangeRate).lte(0))
    throw new Error("الكمية وسعر الصرف يجب أن يكونا أكبر من صفر");
  if (D(v.insuranceRate).gt(1) || D(v.customsRate).gt(1))
    throw new Error("النسبة بين صفر وواحد");
  const freightTotal = D(v.goods).add(v.freight);
  const insurance = freightTotal.mul(v.insuranceRate);
  const customs = freightTotal.add(insurance).mul(v.customsRate);
  const foreignTotal = freightTotal.add(insurance).add(customs).add(v.fees);
  return {
    freightTotal,
    insurance,
    customs,
    foreignTotal: money(foreignTotal),
    localTotal: money(foreignTotal.mul(v.exchangeRate)),
    foreignUnit: foreignTotal.div(v.quantity),
    localUnit: foreignTotal.mul(v.exchangeRate).div(v.quantity),
  };
}

export function depreciation(
  cost: string,
  additions: string,
  prior: string,
  rate: string,
  months: number,
  residual = "0",
) {
  const base = D(cost).add(additions);
  if (
    D(rate).lt(0) ||
    D(rate).gt(1) ||
    months < 0 ||
    months > 12 ||
    !Number.isInteger(months) ||
    D(prior).lt(0) ||
    D(residual).lt(0) ||
    base.lt(D(prior).add(residual))
  )
    throw new Error("بيانات الإهلاك غير صالحة");
  const expense = money(
    Prisma.Decimal.min(
      base.mul(rate).mul(months).div(12),
      base.sub(prior).sub(residual),
    ),
  );
  return {
    base,
    expense,
    accumulated: D(prior).add(expense),
    net: base.sub(prior).sub(expense),
  };
}

export function validateLines(lines: { debit: string; credit: string }[]) {
  if (lines.length < 2 || lines.length > 500)
    throw new Error("القيد يحتاج من 2 إلى 500 بند");
  for (const l of lines) {
    const d = D(l.debit),
      c = D(l.credit);
    if (
      !d.isFinite() ||
      !c.isFinite() ||
      d.lt(0) ||
      c.lt(0) ||
      d.decimalPlaces() > 2 ||
      c.decimalPlaces() > 2 ||
      d.gte("1000000000000000") ||
      c.gte("1000000000000000") ||
      d.gt(0) === c.gt(0)
    )
      throw new Error(
        "كل بند يحتاج مبلغاً موجباً في المدين أو الدائن فقط، بدقة منزلتين",
      );
  }
  const debit = sum(lines.map((l) => l.debit)),
    credit = sum(lines.map((l) => l.credit));
  if (!debit.eq(credit))
    throw new Error(`القيد غير متزن: الفرق ${debit.sub(credit).toFixed(2)}`);
  return { debit, credit };
}
