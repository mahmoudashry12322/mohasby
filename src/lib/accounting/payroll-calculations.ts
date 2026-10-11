import { D, money as roundedMoney, sum } from "./calculations";
const money = (v: Parameters<typeof roundedMoney>[0]) =>
  roundedMoney(v).toFixed(2);

export type PayrollMovement = {
  date: string;
  absenceDays: string;
  deductionDays: string;
  insurance: string;
  allowances: string;
  bonusDays: string;
  overtimeDays: string;
  overtimeHours: string;
};
// Final workbook: daily = basic / 30; hourly = daily / 8. A salary is
// recognised once per employee/year/month, irrespective of movement count.
export function payrollAmounts(
  basic: string,
  movements: PayrollMovement[],
  advances = "0",
) {
  basic = money(basic);
  const daily = D(basic).div(30),
    hourly = daily.div(8);
  const field = (key: keyof PayrollMovement) =>
    sum(movements.map((m) => D(m[key])));
  const absence = field("absenceDays").mul(daily).toDecimalPlaces(2),
    deductions = field("deductionDays").mul(daily).toDecimalPlaces(2),
    bonus = field("bonusDays").mul(daily).toDecimalPlaces(2),
    overtimeDays = field("overtimeDays").mul(daily).toDecimalPlaces(2),
    overtimeHours = field("overtimeHours").mul(hourly).toDecimalPlaces(2),
    allowances = field("allowances").toDecimalPlaces(2),
    insurance = field("insurance").toDecimalPlaces(2);
  const gross = D(basic)
      .add(bonus)
      .add(overtimeDays)
      .add(overtimeHours)
      .add(allowances),
    withheld = D(advances).add(absence).add(deductions).add(insurance);
  return {
    basic: money(basic),
    daily: daily.toFixed(6),
    hourly: hourly.toFixed(6),
    allowances: money(allowances),
    bonus: money(bonus),
    overtimeDays: money(overtimeDays),
    overtimeHours: money(overtimeHours),
    absence: money(absence),
    deductions: money(deductions),
    insurance: money(insurance),
    advances: money(advances),
    gross: money(gross),
    withheld: money(withheld),
    net: money(gross.sub(withheld)),
    expense: money(gross.sub(absence).sub(deductions)),
  };
}
export function employmentDuration(start: string, asOf: string) {
  if (!start || start > asOf) return { days: 0, months: 0, years: 0 };
  const a = new Date(start + "T00:00:00Z"),
    b = new Date(asOf + "T00:00:00Z");
  const months =
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    b.getUTCMonth() -
    a.getUTCMonth() -
    (b.getUTCDate() < a.getUTCDate() ? 1 : 0);
  return {
    days: Math.floor((b.getTime() - a.getTime()) / 86400000),
    months,
    years: Math.floor(months / 12),
  };
}
