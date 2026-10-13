"use client";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(""),
    [account, setAccount] = useState(searchParams.get("account") || ""),
    [party, setParty] = useState(searchParams.get("party") || ""),
    [center, setCenter] = useState("");
  const statement = view === "statement";
  const ready = !statement || !!account;
  const p = new URLSearchParams(query);
  if (account) p.set("account", account);
  if (party) p.set("party", party);
  if (center) p.set("costCenter", center);
  if (costType) p.set("costType", costType);
  if (view === "sales") p.set("documents", "SALE,SALE_RETURN");
  if (view === "purchases") p.set("documents", "PURCHASE,PURCHASE_RETURN");
  if (view === "cash") p.set("cashOnly", "true");
  const { data, error, loading } = useLoad<Report>(
    ready ? `/api/reports/${report}?${p}` : null,
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
  if (statement)
    columns = [
      ["number", "رقم القيد"],
      ["date", "التاريخ"],
      ["reference", "رقم الاذن"],
      ["document", "المستند"],
      ["description", "البيان"],
      ["bags", "العدد"],
      ["gross", "القائم"],
      ["bagLoss", "خـ : ك"],
      ["discountRate", "نسبة %"],
      ["inspectionRate", "فحص %"],
      ["net", "الصافى"],
      ["pricePerTonne", "السعر للطن"],
      ["debit", "مدين"],
      ["credit", "دائن"],
      ["balance", "الرصيد"],
    ];
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
              <option value="">
                {statement ? "اختر اسم الحساب لعرض الكشف" : "جميع الحسابات"}
              </option>
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
      {statement && ready && (
        <div
          className="rounded-xl border border-green-200 bg-white p-5 space-y-3"
          data-statement-header
        >
          <h2 className="font-bold text-xl">
            كشف حساب —{" "}
            {accounts.data.accounts.find((a) => a.code === account)?.name}
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <p>كود الحساب: {account}</p>
            <p>
              الحساب التحليلي:{" "}
              {[...parties.data.rows, ...employees.data.rows].find(
                (a) => a.code === party,
              )?.name || "الكل"}
            </p>
            <p>من تاريخ: {p.get("from") || "بداية السجلات"}</p>
            <p>حتى تاريخ: {p.get("to") || "نهاية السجلات"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-sm">
            {[
              [
                "افتتاحى مدين",
                String(data.openingBalance || "0.00").startsWith("-")
                  ? "0.00"
                  : String(data.openingBalance || "0.00"),
              ],
              [
                "افتتاحى دائن",
                String(data.openingBalance || "0.00").startsWith("-")
                  ? String(data.openingBalance).slice(1)
                  : "0.00",
              ],
              ["إجمالي مدين", String(data.debit ?? "0.00")],
              ["إجمالي دائن", String(data.credit ?? "0.00")],
              [
                "الرصيد",
                String(data.closingBalance || "0.00").replace(/^-/, ""),
              ],
              [
                "حالة الرصيد",
                Number(data.closingBalance || 0) > 0
                  ? "مدين"
                  : Number(data.closingBalance || 0) < 0
                    ? "دائن"
                    : "متوازن",
              ],
            ].map(([label, value]) => (
              <p key={label} className="rounded bg-green-50 p-3">
                {label}: <strong>{loading ? "…" : value}</strong>
              </p>
            ))}
          </div>
        </div>
      )}
      {ready && !statement && metrics.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {metrics.map(([key, label]) => (
            <div key={key} className="rounded-xl border bg-white p-4">
              <p className="text-sm text-ink-600">{label}</p>
              <p className="mt-2 text-xl font-bold tabular-nums">
                {loading ? "…" : String(data[key] ?? "—")}
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
      {!ready ? (
        <p className="rounded-xl border bg-white p-6">
          اختر الحساب بالاسم لعرض كشفه. لا تحتاج إلى إدخال حركات هنا.
        </p>
      ) : loading ? (
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
