import test from "node:test";
import assert from "node:assert/strict";
import home from "../src/data/workbook-home.json";
import templates from "../src/data/cost-templates.json";
import distribution from "../src/data/distribution-template.json";
import {
  NAV_GROUPS,
  getAllRouteParams,
  getNavItem,
} from "../src/lib/nav/nav.config";
import { modules } from "../src/lib/accounting/modules";
import {
  scheduleValues,
  parseFormula,
} from "../src/lib/accounting/schedule-engine";
import {
  employmentDuration,
  payrollAmounts,
} from "../src/lib/accounting/payroll-calculations";

test("final Home has exactly 43 unique destinations and the sidebar exposes the same set", () => {
  assert.equal(home.length, 43);
  assert.equal(new Set(home.map((b) => b.cell)).size, 43);
  assert.equal(new Set(home.map((b) => b.group + "/" + b.page)).size, 43);
  assert.equal(getAllRouteParams().length, 43);
  assert.equal(NAV_GROUPS.flatMap((g) => g.items).length, 43);
  for (const b of home) {
    assert.ok(getNavItem(b.group, b.page), b.label);
    assert.ok(b.page === "chart-of-accounts" || modules[b.page], b.label);
  }
  assert.deepEqual(
    home.filter((b) => b.group === "hr").map((b) => b.label),
    ["بيانات الموظفين", "يومية المرتبات", "كشف مفردات الراتب", "كشف الرواتب"],
  );
  assert.equal(
    Object.values(templates).reduce(
      (n, t) => n + Object.keys(t.formulas).length,
      0,
    ),
    254,
  );
  for (const template of Object.values(templates)) {
    assert.deepEqual(
      template.rows.map((r) => r.row),
      template.rows.map((r) => r.row).sort((a, b) => a - b),
    );
    const inputs = Object.fromEntries(
      Object.keys(template.inputs).map((k) => [k, "1"]),
    );
    assert.deepEqual(
      scheduleValues(
        template,
        inputs,
        { center: "C", farm: "F", pivot: "P", season: "S" },
        { Table3: [], Table5: [], Table58: [], Table14: [] },
      ).errors,
      {},
    );
  }
});
test("salary recognises basic once; multiple movements, fractional days, deductions and advances balance", () => {
  const movement = {
    date: "2026-01-03",
    absenceDays: "1",
    deductionDays: "0.5",
    insurance: "120",
    allowances: "300",
    bonusDays: "2",
    overtimeDays: "1",
    overtimeHours: "4",
  };
  const r = payrollAmounts("6000", [movement], "1000");
  assert.deepEqual(
    [r.daily, r.hourly, r.gross, r.withheld, r.net, r.expense],
    ["200.000000", "25.000000", "7000.00", "1420.00", "5580.00", "6700.00"],
  );
  const doubled = payrollAmounts("6000", [movement, movement], "1000");
  assert.equal(doubled.gross, "8000.00"); // Basic is not doubled.
  const cents = payrollAmounts("100.123456", [
    {
      ...movement,
      absenceDays: "0",
      deductionDays: "0",
      insurance: "1",
      allowances: "0",
      bonusDays: "0",
      overtimeDays: "0",
      overtimeHours: "1",
    },
  ]);
  assert.equal(
    Number(cents.expense),
    Number(cents.net) + Number(cents.insurance),
  );
  assert.deepEqual(employmentDuration("2024-02-29", "2026-02-28"), {
    days: 730,
    months: 23,
    years: 1,
  });
});
test("final two-partner distribution evaluates all 79 formulas, including negative balance labels", () => {
  assert.equal(Object.keys(distribution.formulas).length, 79);
  Object.values(distribution.formulas).forEach(parseFormula);
  const inputs = Object.fromEntries(
    Object.keys(distribution.inputs).map((k) => [k, "0"]),
  );
  Object.assign(inputs, {
    C8: "600",
    C9: "400",
    E8: "100",
    E9: "100",
    D15: "50",
    D16: "80",
    C49: "1000",
    C52: "600",
    C55: "20",
    D55: "40",
  });
  const { values: v, errors } = scheduleValues(
    distribution,
    inputs,
    { first: "Partner A", second: "Partner B" },
    {},
  );
  assert.deepEqual(errors, {});
  assert.equal(v.D8, "0.6");
  assert.equal(v.E22, "100");
  assert.equal(v.E23, "-100");
  assert.equal(v.F29, "650");
  assert.equal(v.F30, "420");
  assert.equal(v.E36, "750");
  assert.equal(v.E37, "320");
  assert.equal(v.C56, "80");
  assert.equal(v.D56, "-140");
  assert.equal(v.E57, "220");
  assert.equal(v.C59, "-30");
  assert.equal(v.D59, "-30");
  assert.equal(v.E59, "-60");
  const loss = scheduleValues(
    distribution,
    { ...inputs, E8: "-1000" },
    { first: "Partner A", second: "Partner B" },
    {},
  );
  assert.equal(loss.values.C43, "مدين");
  assert.equal(v.B43, "Partner A");
});
