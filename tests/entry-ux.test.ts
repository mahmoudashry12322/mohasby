import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownRenderer } from "../src/components/assistant/MarkdownRenderer";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decimalUnits,
  journalIssues,
} from "../src/lib/accounting/entry-validation";
import {
  workbookGuides,
  workbookPage,
} from "../src/lib/accounting/workbook-guides";
import { getKnowledge } from "../src/lib/assistant/knowledge-loader";
import { buildSystemPrompt } from "../src/lib/assistant/system-prompt";
import { costSheetRows } from "../src/lib/accounting/sheet-rows";
import templates from "../src/data/cost-templates.json";
import distribution from "../src/data/distribution-template.json";

test("incomplete entry gives row issues; empty opposite amount is zero", () => {
  assert.equal(decimalUnits(""), 0n);
  for (const invalid of ["-1", "abc", "Infinity", "1e3", "1.0000001"])
    assert.equal(decimalUnits(invalid), null);
  assert.match(
    journalIssues([{ accountCode: "100", debit: "0.001", credit: "0" }])
      .issues[0],
    /منزلتين/,
  );
  const result = journalIssues([
    { accountCode: "", debit: "1", credit: "0" },
    { accountCode: "200", debit: "1", credit: "1" },
  ]);
  assert.match(result.issues[0], /الحساب/);
  assert.match(result.issues[1], /فقط/);
  assert.equal(
    journalIssues([
      { accountCode: "100", debit: "0.1", credit: "" },
      { accountCode: "100", debit: "0.2", credit: "0" },
      { accountCode: "200", debit: "", credit: "0.3" },
    ]).balanced,
    true,
  );
  assert.equal(
    journalIssues([
      { accountCode: "100", debit: "0.01", credit: "" },
      { accountCode: "200", debit: "", credit: "0.02" },
    ]).balanced,
    false,
  );
});

test("all 43 workbook pages have guides and valid related links; route matching is exact", () => {
  assert.equal(workbookGuides.length, 43);
  for (const page of workbookGuides) {
    assert.equal(workbookPage("/ar" + page.href)?.page, page.page);
    assert.equal(workbookPage("/en" + page.href)?.page, page.page);
    assert.ok(page.guide.steps.length >= 3);
    for (const related of page.guide.related)
      assert.ok(
        workbookGuides.some((p) => p.page === related),
        related,
      );
  }
  assert.equal(
    workbookPage("/dashboard/accounting/not-a-real-page"),
    undefined,
  );
  assert.equal(workbookPage("/dashboard/banking/cheque-portfolio"), undefined);
});

test("every cost and distribution input is reachable inside its sheet table", () => {
  for (const template of Object.values(templates))
    for (const cell of Object.keys(template.inputs)) {
      assert.match(cell, /^[CDEF]\d+$/);
      assert.ok(
        costSheetRows(template).some((r) => r.row === Number(cell.slice(1))),
        cell,
      );
    }
  for (const cell of Object.keys(distribution.inputs)) {
    assert.match(cell, /^[BCDEF]\d+$/);
    assert.ok(distribution.rows.includes(Number(cell.slice(1))), cell);
  }
});

test("assistant knows actual payroll and statement workflows and respects knowledge budget", () => {
  assert.ok(
    getKnowledge({
      currentRoute: "/ar/dashboard/hr/payroll-journal",
      maxTokens: 1600,
    }).loadedTopics.includes("payroll"),
  );
  assert.ok(
    getKnowledge({
      currentRoute: "/ar/dashboard/accounting/equity-summary",
      maxTokens: 1600,
    }).loadedTopics.includes("distribution"),
  );
  assert.ok(
    getKnowledge({
      currentRoute: "/dashboard/accounting/journal-entries",
      maxTokens: 30,
    }).estimatedTokens <= 30,
  );
  const prompt = buildSystemPrompt({
    userRole: "accountant",
    locale: "ar",
    currentRoute: "/ar/dashboard/accounting/journal-entries",
  });
  assert.match(prompt, /حفظ مسودة/);
  assert.match(prompt, /المستندات والوزن/);
  assert.match(prompt, /لا توجد محفظة شيكات/);
  for (const p of workbookGuides) assert.ok(prompt.includes(p.href));
});

test("assistant renders only real workbook links as clickable navigation", () => {
  const html = renderToStaticMarkup(
    React.createElement(MarkdownRenderer, {
      content:
        "افتح [كشف حساب](/ar/dashboard/accounting/account-statement). [مجهول](/dashboard/accounting/missing) [خارجي](https://example.test) [سيئ](javascript:alert)",
    }),
  );
  assert.equal((html.match(/<a /g) || []).length, 1);
  assert.match(html, /href="\/ar\/dashboard\/accounting\/account-statement"/);
});
