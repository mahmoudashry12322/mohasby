import assert from "node:assert/strict";
import { test } from "node:test";
import { D } from "../src/lib/accounting/calculations";
import prisma from "../src/lib/prisma";
import { financialStatements } from "../src/lib/accounting/reports";

// CSV value escaping matching DataTable implementation
function escapeCsvValue(v: unknown): string {
  if (v === null || v === undefined) return '""';
  if (typeof v === "number") {
    return isFinite(v) ? String(v) : '""';
  }
  const s = String(v).trim();
  const cleanNum = s.replace(/,/g, "");
  // Numeric values must remain unquoted and without leading ' so Excel parses them as native numbers
  if (/^-?\d+(\.\d+)?$/.test(cleanNum)) {
    return cleanNum;
  }
  let safeStr = String(v);
  // Neutralize formula injection for text starting with =, +, -, @, \t, or \r
  if (/^[=+\-@\t\r]/.test(safeStr)) {
    safeStr = "'" + safeStr;
  }
  return '"' + safeStr.replace(/"/g, '""') + '"';
}

function generateCsv(params: {
  companyName: string;
  reportTitle: string;
  periodText: string;
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
  summaryRows: { label: string; value: string | number }[];
  summaryTitle: string;
}) {
  const { companyName, reportTitle, periodText, columns, rows, summaryRows, summaryTitle } = params;
  const lines: string[] = [];

  // Metadata Header
  lines.push(`${escapeCsvValue("اسم الشركة")},${escapeCsvValue(companyName)}`);
  lines.push(`${escapeCsvValue("اسم التقرير")},${escapeCsvValue(reportTitle)}`);
  lines.push(`${escapeCsvValue("الفترة")},${escapeCsvValue(periodText)}`);
  lines.push("");

  // Table Column Headers
  lines.push(columns.map((c) => escapeCsvValue(c.label)).join(","));

  // Table Rows
  for (const r of rows) {
    lines.push(columns.map((c) => escapeCsvValue(r[c.key])).join(","));
  }

  // Summary Section
  lines.push("");
  lines.push(`${escapeCsvValue(summaryTitle)},${escapeCsvValue("القيمة")}`);
  for (const item of summaryRows) {
    lines.push(`${escapeCsvValue(item.label)},${escapeCsvValue(item.value)}`);
  }

  return "\ufeff" + lines.join("\r\n");
}

test("balance sheet export: CSV escaping, UTF-8 BOM, and formula injection safeguards", () => {
  // 1. Positive numbers are preserved as summable numeric strings
  assert.equal(escapeCsvValue("12800.00"), "12800.00");
  assert.equal(escapeCsvValue(12800), "12800");

  // 2. Negative numbers are preserved as summable numeric strings and NOT prepended with '
  assert.equal(escapeCsvValue("-100.00"), "-100.00");
  assert.equal(escapeCsvValue("-250.75"), "-250.75");
  assert.equal(escapeCsvValue(-100), "-100");

  // 3. Formula injection vectors on text are neutralized by prepending '
  assert.equal(escapeCsvValue("=SUM(A1:A10)"), "\"'=SUM(A1:A10)\"");
  assert.equal(escapeCsvValue("-cmd|' /C calc'!A0"), "\"'-cmd|' /C calc'!A0\"");
  assert.equal(escapeCsvValue("+1234567890 (Phone)"), "\"'+1234567890 (Phone)\"");
  assert.equal(escapeCsvValue("@external_link"), "\"'@external_link\"");
  assert.equal(escapeCsvValue("\tindent"), "\"'\tindent\"");

  // 4. Regular text with quotes and commas
  assert.equal(escapeCsvValue("شركة \"الأمل\" للتجارة"), "\"شركة \"\"الأمل\"\" للتجارة\"");
  assert.equal(escapeCsvValue("حساب مدين, نقدي"), "\"حساب مدين, نقدي\"");

  // 5. Full CSV structure contains BOM and headers
  const csv = generateCsv({
    companyName: "شركة الاختبار",
    reportTitle: "قائمة المركز المالي",
    periodText: "من 2026-10-01 إلى 2026-10-31",
    columns: [
      { key: "code", label: "الكود" },
      { key: "name", label: "الحساب" },
      { key: "balance", label: "الرصيد" },
    ],
    rows: [
      { code: "120101", name: "الخزينة", balance: "12300.00" },
      { code: "210101", name: "موردون", balance: "-100.00" },
    ],
    summaryRows: [
      { label: "إجمالي الأصول", value: "12800.00" },
      { label: "إجمالي الالتزامات", value: "100.00" },
      { label: "فرق الاتزان", value: "0.00" },
    ],
    summaryTitle: "ملخص المركز المالي",
  });

  assert.ok(csv.startsWith("\ufeff"), "CSV must begin with UTF-8 BOM");
  assert.ok(csv.includes("\"اسم الشركة\",\"شركة الاختبار\""));
  assert.ok(csv.includes("\"الفترة\",\"من 2026-10-01 إلى 2026-10-31\""));
  assert.ok(csv.includes("210101,\"موردون\",-100.00"), "Negative balance must be raw numeric -100.00");
  assert.ok(csv.includes("\"إجمالي الأصول\",12800.00"));
});

test("balance sheet logic: equilibrium equations and edge cases", () => {
  // Case A: Profitable Company
  {
    const assets = D("12800.00");
    const liabilities = D("100.00");
    const equity = D("10000.00");
    const unclosedProfit = D("2700.00");
    const totalEquity = equity.add(unclosedProfit);
    const totalLiabilitiesAndEquity = liabilities.add(totalEquity);
    const difference = assets.sub(totalLiabilitiesAndEquity);

    assert.equal(totalEquity.toFixed(2), "12700.00");
    assert.equal(totalLiabilitiesAndEquity.toFixed(2), "12800.00");
    assert.equal(difference.toFixed(2), "0.00");
  }

  // Case B: Loss-making Company (Loss has correct negative sign and is subtracted)
  {
    const assets = D("8000.00");
    const liabilities = D("1000.00");
    const equity = D("10000.00");
    const unclosedLoss = D("-3000.00"); // Loss
    const totalEquity = equity.add(unclosedLoss);
    const totalLiabilitiesAndEquity = liabilities.add(totalEquity);
    const difference = assets.sub(totalLiabilitiesAndEquity);

    assert.equal(totalEquity.toFixed(2), "7000.00");
    assert.equal(totalLiabilitiesAndEquity.toFixed(2), "8000.00");
    assert.equal(difference.toFixed(2), "0.00");
  }

  // Case C: Closed Profit (No double counting when entries are closed to retained earnings)
  {
    const assets = D("12800.00");
    const liabilities = D("100.00");
    const equity = D("12700.00"); // Capital 10000 + Retained Earnings 2700
    const unclosedProfit = D("0.00"); // Closed
    const totalEquity = equity.add(unclosedProfit);
    const totalLiabilitiesAndEquity = liabilities.add(totalEquity);
    const difference = assets.sub(totalLiabilitiesAndEquity);

    assert.equal(totalEquity.toFixed(2), "12700.00");
    assert.equal(totalLiabilitiesAndEquity.toFixed(2), "12800.00");
    assert.equal(difference.toFixed(2), "0.00");
  }

  // Case D: Zero balance / Empty Company
  {
    const assets = D("0.00");
    const liabilities = D("0.00");
    const equity = D("0.00");
    const unclosedProfit = D("0.00");
    const totalEquity = equity.add(unclosedProfit);
    const totalLiabilitiesAndEquity = liabilities.add(totalEquity);
    const difference = assets.sub(totalLiabilitiesAndEquity);

    assert.equal(totalEquity.toFixed(2), "0.00");
    assert.equal(totalLiabilitiesAndEquity.toFixed(2), "0.00");
    assert.equal(difference.toFixed(2), "0.00");
  }

  // Case E: True Discrepancy is truthfully exposed and never zeroed out artificially
  {
    const assets = D("12875.00"); // Real imbalance of 75.00
    const liabilities = D("100.00");
    const equity = D("10000.00");
    const unclosedProfit = D("2700.00");
    const totalEquity = equity.add(unclosedProfit);
    const totalLiabilitiesAndEquity = liabilities.add(totalEquity);
    const difference = assets.sub(totalLiabilitiesAndEquity);

    assert.equal(difference.toFixed(2), "75.00");
  }
});

test("reference verification: Company 19 manual test figures match exactly", async () => {
  const from = new Date("2026-10-01T00:00:00.000Z");
  const to = new Date("2026-10-31T23:59:59.999Z");

  const bs = await financialStatements(19, from, to);

  // Exact reference figures from user request
  assert.equal(bs.assets, "12800.00", "إجمالي الأصول: 12,800.00");
  assert.equal(bs.liabilities, "100.00", "إجمالي الالتزامات: 100.00");
  assert.equal(bs.equity, "10000.00", "حقوق الملكية المسجلة: 10,000.00");
  assert.equal(bs.unclosedProfit, "2700.00", "الربح غير المقفل: 2,700.00");
  assert.equal(bs.totalEquity, "12700.00", "إجمالي حقوق الملكية شاملاً الربح: 12,700.00");
  assert.equal(bs.totalLiabilitiesAndEquity, "12800.00", "إجمالي الالتزامات وحقوق الملكية: 12,800.00");
  assert.equal(bs.difference, "0.00", "فرق الاتزان: صفر");

  // Accounts check
  const cashAcc = bs.rows.find((r) => r.code === "120101");
  const custAcc = bs.rows.find((r) => r.code === "120501");
  const suppAcc = bs.rows.find((r) => r.code === "210101");
  const capAcc = bs.rows.find((r) => r.code === "31");

  assert.equal(cashAcc?.balance, "12300.00", "الخزينة: 12,300.00");
  assert.equal(custAcc?.balance, "500.00", "العملاء: 500.00");
  assert.equal(suppAcc?.balance, "-100.00", "الموردون: دائن 100.00");
  assert.equal(capAcc?.balance, "-10000.00", "رأس المال: دائن 10,000.00");
});
