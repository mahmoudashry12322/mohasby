import assert from "node:assert/strict";
import { test } from "node:test";
import templates from "../src/data/cost-templates.json";
import {
  evaluateFormula,
  parseFormula,
  scheduleValues,
} from "../src/lib/accounting/schedule-engine";
import { D } from "../src/lib/accounting/calculations";
test("all extracted cost formulas parse without executing code", () => {
  for (const [type, template] of Object.entries(templates))
    for (const [cell, formula] of Object.entries(template.formulas))
      assert.doesNotThrow(
        () => parseFormula(formula),
        type + "!" + cell + ": " + formula,
      );
  assert.throws(() => parseFormula("process.exit()"));
  assert.throws(() => parseFormula("1;alert(1)"));
});
test("manufacturing costs roll up direct costs, overhead, unit cost and markup", () => {
  const t = templates.MANUFACTURING;
  const rows = [
    {
      مدين: "100",
      "الحساب الفرعى": "المشتريات",
      "مركز تكلفة تحليلى": "M1",
      "مركز تكلفة فرعى": t.labels.B9,
    },
    {
      مدين: "50",
      "الحساب الفرعى": "مصروفات",
      "مركز تكلفة تحليلى": "M1",
      "مركز تكلفة فرعى": t.labels.B14,
    },
  ];
  const r = scheduleValues(
    t,
    { C33: "10", C35: "0.2" },
    { center: "M1" },
    { Table3: rows },
  );
  assert.deepEqual(r.errors, {});
  assert.equal(r.values.D32, "150");
  assert.equal(r.values.D34, "15");
  assert.equal(r.values.D36, "18");
});
test("sumifs uses center and cost item, missing inputs are surfaced", () => {
  const t = templates.IMPORT;
  const rows = [
    {
      مدين: "1000",
      "الحساب الفرعى": "المشتريات",
      "مركز تكلفة تحليلى": "IMP1",
      "مركز تكلفة فرعى": t.labels.B9,
    },
    {
      مدين: "100",
      "الحساب الفرعى": "مصروفات",
      "مركز تكلفة تحليلى": "IMP1",
      "مركز تكلفة فرعى": t.labels.B10,
    },
    {
      مدين: "99999",
      "الحساب الفرعى": "المشتريات",
      "مركز تكلفة تحليلى": "OTHER",
      "مركز تكلفة فرعى": t.labels.B9,
    },
  ];
  const result = scheduleValues(
    t,
    { C13: "0.1", C17: "0.05", C36: "100", C39: "50" },
    { center: "IMP1" },
    { Table3: rows },
  );
  assert.equal(result.values.D35, "1270.5");
  assert.equal(result.values.D40, "63525");
  assert.equal(result.values.D41, "635.25");
  assert.ok(
    Object.keys(
      scheduleValues(t, {}, { center: "IMP1" }, { Table3: rows }).errors,
    ).length > 0,
  );
});
test("division by zero is caught only by explicit IFERROR", () => {
  assert.equal(
    evaluateFormula(parseFormula('IFERROR(2/0,"")'), () => ""),
    "",
  );
  assert.throws(() => evaluateFormula(parseFormula("2/0"), () => ""));
  assert.equal(String(evaluateFormula(parseFormula("2+3*4"), () => "")), "14");
});
