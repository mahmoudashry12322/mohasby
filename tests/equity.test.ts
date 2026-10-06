import { test } from "node:test";
import assert from "node:assert/strict";
import { allocatePartners, partnerInput } from "../src/lib/accounting/equity";
test("partner allocations preserve cents and support equal or configured ratios", () => {
  const partners = ["A", "B", "C"].map((code) => ({
    code,
    name: code,
    share: "0",
  }));
  const rows = allocatePartners(partners, {}, "100", "10");
  assert.deepEqual(
    rows.map((r) => r.profitShare),
    ["33.33", "33.33", "33.34"],
  );
  assert.deepEqual(
    rows.map((r) => r.costShare),
    ["3.33", "3.33", "3.34"],
  );
  const configured = allocatePartners(
    [
      { code: "A", name: "A", share: "0.4" },
      { code: "B", name: "B", share: "0.6" },
    ],
    {
      A: partnerInput.parse({
        capital: "1000",
        funding: "500",
        withdrawals: "50",
        drawingInterest: "5",
        capitalInterest: "10",
        salary: "20",
      }),
    },
    "100",
    "200",
  );
  assert.equal(configured[0].profitCurrent, "-35.00");
  assert.equal(configured[0].endingCapital, "965.00");
  assert.equal(configured[0].settlement, "370.00");
  assert.throws(() =>
    allocatePartners(
      [{ code: "A", name: "A", share: "0.5" }],
      {},
      "100",
      "200",
    ),
  );
});
