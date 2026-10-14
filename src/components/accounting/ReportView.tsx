"use client";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import React, { useState } from "react";
import {
  DataTable,
  DateFilters,
  Field,
  inputClass,
  ReportMetadata,
  SummaryItem,
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
  const locale = useLocale();
  const isAr = locale !== "en";
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.toString() || ""),
    [account, setAccount] = useState(searchParams?.get("account") || ""),
    [party, setParty] = useState(searchParams?.get("party") || ""),
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
      ["code", isAr ? "الكود" : "Code"],
      ["name", isAr ? "الحساب" : "Account"],
      ["accountClass", isAr ? "التصنيف" : "Classification"],
      [
        "periodBalance",
        isAr ? "حركة الفترة (مدين − دائن)" : "Period Movement (Debit - Credit)",
      ],
      ["balance", isAr ? "الرصيد (مدين − دائن)" : "Balance (Debit - Credit)"],
    ];
    if (view === "income") {
      rows = data.incomeRows || [];
      metrics.push(
        [
          "profit",
          isAr
            ? "صافي الربح من القيود المرحلة"
            : "Net Profit from Posted Entries",
        ],
        [
          "pendingInventoryAdjustment",
          isAr ? "تسوية مخزون لم ترحل بعد" : "Pending Inventory Adjustment",
        ],
      );
    } else if (view === "equity") {
      rows = (data.equityRows || []) as Record<string, unknown>[];
      columns = [
        ["name", isAr ? "البند" : "Item"],
        ["opening", isAr ? "رصيد أول الفترة" : "Beginning Balance"],
        ["increases", isAr ? "إضافات / أرباح" : "Increases / Profit"],
        ["decreases", isAr ? "تخفيضات / مسحوبات" : "Decreases / Drawings"],
        ["closing", isAr ? "رصيد آخر الفترة" : "Ending Balance"],
      ];
      metrics.push(
        ["equity", isAr ? "حقوق الملكية المسجلة" : "Recorded Equity"],
        ["unclosedProfit", isAr ? "أرباح غير مقفلة" : "Unclosed Profit"],
      );
    } else {
      rows = rows.filter((r) => r.statementType !== "قائمة الدخل");
      metrics.push(
        ["assets", isAr ? "الأصول" : "Assets"],
        ["liabilities", isAr ? "الالتزامات" : "Liabilities"],
        ["equity", isAr ? "حقوق الملكية" : "Equity"],
        ["unclosedProfit", isAr ? "أرباح غير مقفلة" : "Unclosed Profit"],
        ["difference", isAr ? "فرق الميزانية" : "Balance Difference"],
      );
    }
  }
  if (report.startsWith("cash-flow")) {
    columns = [
      ["category", isAr ? "النشاط" : "Activity"],
      ["amount", isAr ? "صافي التدفق" : "Net Flow"],
    ];
    metrics.push(
      ["opening", isAr ? "رصيد أول الفترة" : "Opening Balance"],
      ["net", isAr ? "صافي التدفق" : "Net Flow"],
      ["closing", isAr ? "رصيد آخر الفترة" : "Closing Balance"],
      ["unclassified", isAr ? "بنود تحتاج تصنيف" : "Unclassified Items"],
    );
    if (report === "cash-flow-indirect")
      metrics.push([
        "difference",
        isAr ? "فرق المطابقة مع حركة النقدية" : "Reconciliation Difference",
      ]);
  }
  if (report === "parties") {
    columns = [
      ["code", isAr ? "الكود" : "Code"],
      ["name", isAr ? "الاسم" : "Name"],
      ["type", isAr ? "النوع" : "Type"],
      ["openingBalance", isAr ? "رصيد سابق" : "Prior Balance"],
      ["debit", isAr ? "مدين الفترة" : "Period Debit"],
      ["credit", isAr ? "دائن الفترة" : "Period Credit"],
      ["balance", isAr ? "الرصيد" : "Balance"],
    ];

    const partyTypeLabels: Record<string, { ar: string; en: string }> = {
      CUSTOMER: { ar: "عميل", en: "Customer" },
      SUPPLIER: { ar: "مورد", en: "Supplier" },
      PARTNER: { ar: "شريك", en: "Partner" },
      EMPLOYEE: { ar: "موظف", en: "Employee" },
    };

    rows = (data.rows || []).map((r) => {
      const rawType = String(r.type || "").toUpperCase();
      const typeLabel = partyTypeLabels[rawType]
        ? isAr
          ? partyTypeLabels[rawType].ar
          : partyTypeLabels[rawType].en
        : String(r.type || "—");

      const num = Number(r.balance || 0);
      let balanceDisplay = String(r.balance ?? "0.00");

      if (num < 0) {
        const absVal = Math.abs(num).toFixed(2);
        if (rawType === "SUPPLIER") {
          balanceDisplay = isAr
            ? `${absVal} دائن — مستحق للمورد`
            : `${absVal} Cr — Payable to Supplier`;
        } else if (rawType === "CUSTOMER") {
          balanceDisplay = isAr
            ? `${absVal} دائن — رصيد دائن للعميل`
            : `${absVal} Cr — Customer Credit`;
        } else {
          balanceDisplay = isAr ? `${absVal} دائن` : `${absVal} Cr`;
        }
      } else if (num > 0) {
        const val = num.toFixed(2);
        if (rawType === "CUSTOMER") {
          balanceDisplay = isAr
            ? `${val} مدين — مستحق على العميل`
            : `${val} Dr — Receivable from Customer`;
        } else if (rawType === "SUPPLIER") {
          balanceDisplay = isAr
            ? `${val} مدين — رصيد مقدم للمورد`
            : `${val} Dr — Advance to Supplier`;
        } else {
          balanceDisplay = isAr ? `${val} مدين` : `${val} Dr`;
        }
      } else {
        balanceDisplay = isAr ? "0.00 (متوازن)" : "0.00 (Balanced)";
      }

      const openNum = Number(r.openingBalance || 0);
      let openingDisplay = String(r.openingBalance ?? "0.00");
      if (openNum < 0) {
        openingDisplay = isAr
          ? `${Math.abs(openNum).toFixed(2)} دائن`
          : `${Math.abs(openNum).toFixed(2)} Cr`;
      } else if (openNum > 0) {
        openingDisplay = isAr
          ? `${openNum.toFixed(2)} مدين`
          : `${openNum.toFixed(2)} Dr`;
      }

      return {
        ...r,
        type: typeLabel,
        openingBalance: openingDisplay,
        balance: balanceDisplay,
      };
    });
  }
  const isBalanceSheet = report === "financial" && !view;

  const fromDate = p.get("from") || (data.fromDate as string) || "";
  const toDate = p.get("to") || (data.toDate as string) || "";

  let periodText = "";
  if (fromDate && toDate) {
    periodText = isAr
      ? `من ${fromDate} إلى ${toDate}`
      : `From ${fromDate} to ${toDate}`;
  } else if (toDate) {
    periodText = isAr ? `حتى ${toDate}` : `As of ${toDate}`;
  } else if (fromDate) {
    periodText = isAr ? `من ${fromDate}` : `From ${fromDate}`;
  } else {
    periodText = isAr ? "جميع الفترات حتى تاريخه" : "All periods to date";
  }

  const companyName = String(data.companyName || "");

  const reportMetadata: ReportMetadata = {
    companyName,
    reportTitle: title,
    period: periodText,
    fromDate,
    toDate,
  };

  const assetsVal = String(data.assets ?? "0.00");
  const liabilitiesVal = String(data.liabilities ?? "0.00");
  const equityVal = String(data.equity ?? "0.00");
  const unclosedProfitVal = String(data.unclosedProfit ?? "0.00");
  const totalEquityVal =
    data.totalEquity !== undefined
      ? String(data.totalEquity)
      : (Number(equityVal) + Number(unclosedProfitVal)).toFixed(2);
  const totalLiabilitiesAndEquityVal =
    data.totalLiabilitiesAndEquity !== undefined
      ? String(data.totalLiabilitiesAndEquity)
      : (Number(liabilitiesVal) + Number(totalEquityVal)).toFixed(2);
  const diffVal = String(data.difference ?? "0.00");

  const balanceSheetSummary: SummaryItem[] = isBalanceSheet
    ? [
        {
          label: isAr ? "إجمالي الأصول" : "Total Assets",
          value: assetsVal,
        },
        {
          label: isAr ? "إجمالي الالتزامات" : "Total Liabilities",
          value: liabilitiesVal,
        },
        {
          label: isAr
            ? "حقوق الملكية المسجلة قبل إضافة الربح أو الخسارة غير المقفلة"
            : "Recorded Equity Before Unclosed Profit/Loss",
          value: equityVal,
        },
        {
          label: isAr
            ? "الربح أو الخسارة غير المقفلة"
            : "Unclosed Profit or Loss",
          value: unclosedProfitVal,
        },
        {
          label: isAr
            ? "إجمالي حقوق الملكية شاملاً الربح أو الخسارة غير المقفلة"
            : "Total Equity Including Unclosed Profit/Loss",
          value: totalEquityVal,
        },
        {
          label: isAr
            ? "إجمالي الالتزامات وحقوق الملكية"
            : "Total Liabilities and Equity",
          value: totalLiabilitiesAndEquityVal,
        },
        {
          label: isAr ? "فرق الاتزان" : "Balance Difference",
          value: diffVal,
        },
      ]
    : [];

  const summaryFooter = isBalanceSheet ? (
    <div className="mt-4 pt-3 border-t border-green-100 text-xs text-ink-700 text-center font-medium bg-green-50/70 py-2.5 px-3 rounded-lg print:border-gray-300 print:bg-gray-100">
      {isAr
        ? `معادلة اتزان المركز المالي: إجمالي الأصول (${assetsVal}) = إجمالي الالتزامات (${liabilitiesVal}) + إجمالي حقوق الملكية شاملاً الأرباح (${totalEquityVal}) | فرق الاتزان: ${diffVal}`
        : `Balance Sheet Equilibrium: Total Assets (${assetsVal}) = Total Liabilities (${liabilitiesVal}) + Total Equity (${totalEquityVal}) | Balance Difference: ${diffVal}`}
    </div>
  ) : undefined;

  const reportFilename = isBalanceSheet
    ? `${isAr ? "قائمة-المركز-المالي" : "balance-sheet"}${toDate ? `-${toDate}` : ""}.csv`
    : report === "parties"
      ? `${isAr ? "تقرير-المديونية" : "outstanding-balances"}${toDate ? `-${toDate}` : ""}.csv`
      : undefined;

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
            { key: "label", label: isAr ? "البند" : "Item" },
            { key: "value", label: isAr ? "القيمة" : "Amount" },
          ]}
          metadata={reportMetadata}
          filename={`${isAr ? "قائمة-الدخل" : "income-statement"}${toDate ? `-${toDate}` : ""}.csv`}
        />
      )}{" "}
      {!ready ? (
        <p className="rounded-xl border bg-white p-6">
          {isAr
            ? "اختر الحساب بالاسم لعرض كشفه. لا تحتاج إلى إدخال حركات هنا."
            : "Select an account to view its statement."}
        </p>
      ) : loading ? (
        <p>{isAr ? "جارٍ إعداد التقرير…" : "Loading report…"}</p>
      ) : (
        <DataTable
          rows={rows}
          columns={columns.map(([key, label]) => ({ key, label }))}
          metadata={reportMetadata}
          summaryRows={isBalanceSheet ? balanceSheetSummary : undefined}
          summaryTitle={
            isAr
              ? "ملخص المركز المالي ومعادلة الاتزان"
              : "Balance Sheet Equation Summary"
          }
          summaryFooter={summaryFooter}
          filename={reportFilename}
        />
      )}
    </Workspace>
  );
}
