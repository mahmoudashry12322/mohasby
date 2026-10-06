import assert from "node:assert/strict";
import { test } from "node:test";
import {
  depreciation,
  importCost,
  validateLines,
  weighTicket,
} from "../src/lib/accounting/calculations";

test("workbook journal: net kg and price per tonne, with sequential deductions", () => {
  const result = weighTicket({
    weight: "12550",
    tare: "3825",
    bags: "230",
    bagDeduction: "0",
    discountRate: "0",
    inspectionRate: "0",
    pricePerTonne: "19000",
  });
  assert.equal(result.gross.toString(), "8725");
  assert.equal(result.amount.toString(), "165775");
  const discounted = weighTicket({
    weight: "1100",
    tare: "100",
    bags: "10",
    bagDeduction: "2",
    discountRate: "0.1",
    inspectionRate: "0.05",
    pricePerTonne: "1000",
  });
  assert.equal(discounted.net.toString(), "837.9");
  assert.equal(discounted.amount.toString(), "837.9");
  assert.throws(() =>
    weighTicket({
      weight: "1",
      tare: "2",
      bags: "0",
      bagDeduction: "0",
      discountRate: "0",
      inspectionRate: "0",
      pricePerTonne: "1",
    }),
  );
});
test("balanced decimal accounting, precision and invalid sides", () => {
  validateLines([
    { debit: "0.10", credit: "0" },
    { debit: "0.20", credit: "0" },
    { debit: "0", credit: "0.30" },
  ]);
  for (const lines of [
    [
      { debit: "1", credit: "1" },
      { debit: "0", credit: "0" },
    ],
    [
      { debit: "1", credit: "0" },
      { debit: "0", credit: "0.99" },
    ],
    [
      { debit: "0.001", credit: "0" },
      { debit: "0", credit: "0.001" },
    ],
  ])
    assert.throws(() => validateLines(lines));
});
test("import cost chain and no zero quantity", () => {
  const r = importCost({
    goods: "1000",
    freight: "100",
    insuranceRate: "0.1",
    customsRate: "0.05",
    fees: "29.5",
    quantity: "100",
    exchangeRate: "50",
  });
  assert.equal(r.foreignTotal.toString(), "1300");
  assert.equal(r.localTotal.toString(), "65000");
  assert.equal(r.localUnit.toString(), "650");
  assert.throws(() =>
    importCost({
      goods: "1",
      freight: "0",
      insuranceRate: "0",
      customsRate: "0",
      fees: "0",
      quantity: "0",
      exchangeRate: "1",
    }),
  );
});
test("asset depreciation is bounded by residual value", () => {
  assert.equal(
    depreciation("38000", "0", "0", "0.15", 12).expense.toString(),
    "5700",
  );
  assert.equal(
    depreciation("100", "0", "90", "0.2", 12, "5").expense.toString(),
    "5",
  );
});
