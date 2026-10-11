"use client";
import React, { useState } from "react";
import {
  DataTable,
  DateFilters,
  Field,
  inputClass,
  useLoad,
  Workspace,
} from "./Workspace";
type Report = {
  rows?: Record<string, unknown>[];
  incomeRows?: Record<string, unknown>[];
  [key: string]: unknown;
};
const trialColumns = [
  ["code", "الكود"],
  ["name", "الحساب"],
  ["openingDebit", "افتتاحي مدين"],
  ["openingCredit", "افتتاحي دائن"],
  ["movementDebit", "حركة مدين"],
  ["movementCredit", "حركة دائن"],
  ["adjustmentDebit", "تسوية مدين"],
  ["adjustmentCredit", "تسوية دائن"],
  ["closingDebit", "رصيد مدين"],
  ["closingCredit", "رصيد دائن"],
];
const ledgerColumns = [
  ["date", "التاريخ"],
  ["number", "القيد"],
  ["account", "الكود"],
  ["name", "الحساب"],
  ["description", "البيان"],
  ["document", "المستند"],
  ["reference", "المرجع"],
  ["party", "الحساب التحليلي"],
  ["costCenter", "مركز التكلفة"],
  ["costItem", "بند التكلفة"],
  ["debit", "مدين"],
  ["credit", "دائن"],
  ["balance", "الرصيد"],
];
export function ReportView({
  title,
  report = "ledger",
  view = "",
  costType = "",
}: {
  title: string;
  report?: string;
  view?: string;
  costType?: string;
}) {
  const [query, setQuery] = useState(""),
    [account, setAccount] = useState(""),
    [party, setParty] = useState(""),
    [center, setCenter] = useState("");
  const p = new URLSearchParams(query);
  if (account) p.set("account", account);
  if (party) p.set("party", party);
  if (center) p.set("costCenter", center);
  if (costType) p.set("costType", costType);
  if (view === "sales") p.set("documents", "SALE,SALE_RETURN");
  if (view === "purchases") p.set("documents", "PURCHASE,PURCHASE_RETURN");
  if (view === "cash") p.set("cashOnly", "true");
  const { data, error, loading } = useLoad<Report>(
    `/api/reports/${report}?${p}`,
    {},
  );
  const accounts = useLoad<{
    accounts: { code: string; name: string; isGroup: boolean }[];
  }>("/api/accounts?flat=true", { accounts: [] });
  const parties = useLoad<{ rows: { code: string; name: string }[] }>(
    "/api/registers/parties",
    { rows: [] },
  );
  const employees = useLoad<{ rows: { code: string; name: string }[] }>(
    "/api/registers/employees",
    { rows: [] },
  );
  const centers = useLoad<{ rows: { code: string; name: string }[] }>(
    "/api/registers/cost-centers",
    { rows: [] },
  );
  let rows = data.rows || [],
    columns = ledgerColumns;
  const metrics: [string, string][] = [];
  if (report === "trial-balance") columns = trialColumns;
  if (report === "ledger")
    metrics.push(
      ["openingBalance", "رصيد سابق"],
      ["debit", "مدين الفترة"],
      ["credit", "دائن الفترة"],
      ["closingBalance", "الرصيد"],
    );
  if (report === "financial") {
    columns = [
      ["code", "الكود"],
      ["name", "الحساب"],
      ["accountClass", "التصنيف"],
      ["periodBalance", "حركة الفترة (مدين − دائن)"],
      ["balance", "الرصيد (مدين − دائن)"],
    ];
    if (view === "income") {
      rows = data.incomeRows || [];
      metrics.push(
        ["profit", "صافي الربح من القيود المرحلة"],
        ["pendingInventoryAdjustment", "تسوية مخزون لم ترحل بعد"],
      );
    } else if (view === "equity") {
      rows = (data.equityRows || []) as Record<string, unknown>[];
      columns = [
        ["name", "البند"],
        ["opening", "رصيد أول الفترة"],
        ["increases", "إضافات / أرباح"],
        ["decreases", "تخفيضات / مسحوبات"],
        ["closing", "رصيد آخر الفترة"],
      ];
      metrics.push(
        ["equity", "حقوق الملكية المسجلة"],
        ["unclosedProfit", "أرباح غير مقفلة"],
      );
    } else {
      rows = rows.filter((r) => r.statementType !== "قائمة الدخل");
      metrics.push(
        ["assets", "الأصول"],
        ["liabilities", "الالتزامات"],
        ["equity", "حقوق الملكية"],
        ["unclosedProfit", "أرباح غير مقفلة"],
        ["difference", "فرق الميزانية"],
      );
    }
  }
  if (report.startsWith("cash-flow")) {
    columns = [
      ["category", "النشاط"],
      ["amount", "صافي التدفق"],
    ];
    metrics.push(
      ["opening", "رصيد أول الفترة"],
      ["net", "صافي التدفق"],
      ["closing", "رصيد آخر الفترة"],
      ["unclassified", "بنود تحتاج تصنيف"],
    );
    if (report === "cash-flow-indirect")
      metrics.push(["difference", "فرق المطابقة مع حركة النقدية"]);
  }
  if (report === "parties")
    columns = [
      ["code", "الكود"],
      ["name", "الاسم"],
      ["type", "النوع"],
      ["openingBalance", "رصيد سابق"],
      ["debit", "مدين الفترة"],
      ["credit", "دائن الفترة"],
      ["balance", "الرصيد"],
    ];
  return (
    <Workspace title={title} error={error}>
      <DateFilters onChange={setQuery} />
      {report === "ledger" && (
        <div className="grid gap-3 md:grid-cols-3 print:hidden">
          <Field label="الحساب">
            <select
              className={inputClass}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            >
              <option value="">جميع الحسابات</option>
              {accounts.data.accounts
                .filter((a) => !a.isGroup)
                .map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="الحساب التحليلي">
            <select
              className={inputClass}
              value={party}
              onChange={(e) => setParty(e.target.value)}
            >
              <option value="">الكل</option>
              {[...parties.data.rows, ...employees.data.rows].map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="مركز التكلفة">
            <select
              className={inputClass}
              value={center}
              onChange={(e) => setCenter(e.target.value)}
            >
              <option value="">الكل</option>
              {centers.data.rows.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      {metrics.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {metrics.map(([key, label]) => (
            <div key={key} className="rounded-xl border bg-white p-4">
              <p className="text-sm text-ink-600">{label}</p>
              <p className="mt-2 text-xl font-bold tabular-nums">
                {String(data[key] ?? "—")}
              </p>
            </div>
          ))}
        </div>
      )}
      {view === "income" && Array.isArray(data.incomeSummary) && (
        <DataTable
          rows={data.incomeSummary as Record<string, unknown>[]}
          columns={[
            { key: "label", label: "البند" },
            { key: "value", label: "القيمة" },
          ]}
        />
      )}{" "}
      {loading ? (
        <p>جارٍ إعداد التقرير…</p>
      ) : (
        <DataTable
          rows={rows}
          columns={columns.map(([key, label]) => ({ key, label }))}
        />
      )}
    </Workspace>
  );
}
