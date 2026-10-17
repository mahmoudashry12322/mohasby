"use client";
import React, { useCallback, useEffect, useRef, useId, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";

export const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-green-700";
export const buttonClass =
  "rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50";
export async function api(url: string, data?: unknown, method = "POST") {
  let response: Response;
  try {
    response = await fetch(
      url,
      data === undefined
        ? { cache: "no-store" }
        : {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          },
    );
  } catch {
    throw new Error(
      "انقطع الاتصال. البيانات ما زالت في النموذج؛ راجع السجلات قبل إعادة محاولة الحفظ.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "تعذر قراءة رد الخادم. البيانات ما زالت في النموذج؛ راجع السجلات قبل إعادة محاولة الحفظ.",
    );
  }
  if (response.status === 401)
    throw new Error(
      "انتهت جلسة الدخول. احتفظ بالبيانات وسجّل الدخول في تبويب آخر ثم أعد المحاولة.",
    );
  if (!response.ok || !result.success) {
    const labels: Record<string, string> = {
      date: "التاريخ",
      description: "البيان",
      accountCode: "الحساب",
      debit: "مدين",
      credit: "دائن",
      quantity: "الكمية",
      warehouse: "المخزن",
      itemId: "الصنف",
      name: "الاسم",
      code: "الكود",
      employee: "الموظف",
      cashAccount: "حساب صرف السلفة",
      unitCost: "تكلفة الوحدة",
    };
    const details = Array.isArray(result.issues)
      ? result.issues
          .slice(0, 5)
          .map((issue: { path: string }) => {
            const parts = String(issue.path).split(".");
            return (
              (parts[0] === "lines" ? `السطر ${Number(parts[1]) + 1}: ` : "") +
              (labels[parts.at(-1)!] || "حقل غير مكتمل")
            );
          })
          .join("، ")
      : "";
    throw new Error(
      (result.error || "تعذر تنفيذ العملية") +
        (details ? " — راجع: " + details : ""),
    );
  }
  return result;
}
export function useLoad<T>(
  url: string | null,
  initial: T,
  options?: { pollInterval?: number },
) {
  const [data, setData] = useState<T>(initial),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const initialRef = useRef(initial);

  const reload = useCallback(
    async (silent = false) => {
      const current = ++generation.current;
      if (!url) {
        setData(initialRef.current);
        setError("");
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const result = await api(url);
        if (current === generation.current) {
          setData(result);
          setError("");
        }
      } catch (e) {
        if (current === generation.current && !silent)
          setError((e as Error).message);
      } finally {
        if (current === generation.current && !silent) setLoading(false);
      }
    },
    [url],
  );

  useEffect(() => {
    void reload();
    return () => {
      generation.current++;
    };
  }, [reload]);

  // Real-time synchronization across company users:
  // Polls every 10 seconds for visible tabs and refetches immediately when tab refocuses.
  // Does not interfere with active dirty inputs or draft form entries.
  useEffect(() => {
    if (!url) return;

    const intervalMs = options?.pollInterval ?? 10000;
    const interval = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        void reload(true);
      }
    }, intervalMs);

    const onVisibilityOrFocus = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        void reload(true);
      }
    };

    window.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
    };
  }, [url, reload, options?.pollInterval]);

  return { data, error, loading, reload };
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <label className="relative block space-y-1 text-sm text-ink-700">
      <span id={id}>{label}</span>
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<Record<string, unknown>>,
            { "aria-labelledby": id },
          )
        : children}
    </label>
  );
}
export function Workspace({
  title,
  children,
  error,
  message,
}: {
  title: string;
  children: React.ReactNode;
  error?: string;
  message?: string;
}) {
  const locale = useLocale();
  const isAr = locale !== "en";
  return (
    <section className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="border-b border-border pb-5">
        <h1 className="font-kufi text-2xl font-bold text-ink-900">{title}</h1>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-900"
        >
          {message}
        </div>
      )}
      {children}
    </section>
  );
}

export type SummaryItem = {
  label: string;
  value: string | number;
};

export type ReportMetadata = {
  companyName?: string;
  reportTitle?: string;
  period?: string;
  fromDate?: string;
  toDate?: string;
};

export function DataTable({
  rows,
  columns,
  metadata,
  summaryRows,
  summaryTitle,
  summaryFooter,
  filename,
}: {
  rows: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  metadata?: ReportMetadata;
  summaryRows?: SummaryItem[];
  summaryTitle?: string;
  summaryFooter?: React.ReactNode;
  filename?: string;
}) {
  const locale = useLocale();
  const isAr = locale !== "en";

  function exportCsv() {
    function escapeValue(v: unknown): string {
      if (v === null || v === undefined) return '""';
      if (typeof v === "number") {
        return isFinite(v) ? String(v) : '""';
      }
      const s = String(v).trim();
      const cleanNum = s.replace(/,/g, "");
      // Preserve purely numeric values (positive or negative decimal or integer, e.g. -100.00, 12800.00, 0, 0.00)
      // so Excel parses them as native numbers and allows =SUM()
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

    const lines: string[] = [];

    // 1. Report Metadata Header (Company Name, Report Title, Applied Period)
    const hasMeta =
      metadata?.companyName || metadata?.reportTitle || metadata?.period;
    if (hasMeta) {
      if (metadata?.companyName) {
        lines.push(
          `${escapeValue(isAr ? "اسم الشركة" : "Company Name")},${escapeValue(metadata.companyName)}`,
        );
      }
      if (metadata?.reportTitle) {
        lines.push(
          `${escapeValue(isAr ? "اسم التقرير" : "Report Title")},${escapeValue(metadata.reportTitle)}`,
        );
      }
      if (metadata?.period) {
        lines.push(
          `${escapeValue(isAr ? "الفترة" : "Period")},${escapeValue(metadata.period)}`,
        );
      }
      lines.push(""); // empty row separation
    }

    // 2. Table Column Headers
    lines.push(columns.map((c) => escapeValue(c.label)).join(","));

    // 3. Table Rows
    for (const r of rows) {
      lines.push(columns.map((c) => escapeValue(r[c.key])).join(","));
    }

    // 4. Summary & Balance Equilibrium Section
    if (summaryRows && summaryRows.length > 0) {
      lines.push(""); // empty row separation
      const title =
        summaryTitle || (isAr ? "ملخص المركز المالي" : "Financial Summary");
      lines.push(
        `${escapeValue(title)},${escapeValue(isAr ? "القيمة" : "Amount")}`,
      );
      for (const item of summaryRows) {
        lines.push(`${escapeValue(item.label)},${escapeValue(item.value)}`);
      }
    }

    const content = "\ufeff" + lines.join("\r\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasMeta =
    metadata?.companyName || metadata?.reportTitle || metadata?.period;

  return (
    <div className="space-y-3">
      {/* Printable Report Header (hidden on screen, visible on print) */}
      {hasMeta && (
        <div className="hidden print:block mb-6 border-b border-gray-300 pb-4 text-ink-900">
          <div className="flex justify-between items-start">
            <div>
              {metadata?.companyName && (
                <h1 className="text-xl font-bold">{metadata.companyName}</h1>
              )}
              {metadata?.reportTitle && (
                <h2 className="text-lg font-semibold text-green-900 mt-1">
                  {metadata.reportTitle}
                </h2>
              )}
            </div>
            <div className="text-sm text-gray-600 text-left" dir="ltr">
              {metadata?.period && (
                <p className="font-medium text-gray-800">{metadata.period}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {isAr ? "تاريخ الطباعة: " : "Print Date: "}
                {new Date().toISOString().slice(0, 10)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Screen action buttons (hidden on print) */}
      <div className="flex gap-3 print:hidden">
        <button type="button" className={buttonClass} onClick={exportCsv}>
          {isAr ? "تصدير CSV" : "Export CSV"}
        </button>
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-canvas"
          onClick={() => window.print()}
        >
          {isAr ? "طباعة / PDF" : "Print / PDF"}
        </button>
        <span className="self-center text-sm">
          {isAr ? `${rows.length} سجل` : `${rows.length} records`}
        </span>
      </div>

      {/* Table */}
      <div
        className="max-w-full overflow-x-auto rounded-xl border border-border bg-white print:border-gray-300 print:overflow-visible"
        tabIndex={0}
        role="region"
        aria-label={isAr ? "جدول النتائج" : "Results Table"}
      >
        <table className="w-full border-collapse text-right text-sm">
          <thead className="bg-green-50 text-green-900 print:bg-gray-100">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="whitespace-nowrap border-b p-3">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={String(row.id ?? i)}
                className="border-b last:border-0 hover:bg-canvas print:border-gray-200"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="whitespace-nowrap border-x border-green-100 p-3 tabular-nums print:border-gray-200"
                  >
                    {String(row[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-ink-600"
                >
                  {isAr
                    ? "لا توجد بيانات للفلاتر المختارة"
                    : "No data for selected filters"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary section (visible on both screen and print) */}
      {summaryRows && summaryRows.length > 0 && (
        <div className="mt-6 rounded-xl border border-green-200 bg-white p-5 shadow-sm print:shadow-none print:border-gray-400 print:mt-4 break-inside-avoid">
          <div className="flex items-center justify-between border-b border-green-100 pb-3 mb-4">
            <h3 className="font-bold text-base text-green-950">
              {summaryTitle ||
                (isAr ? "ملخص المركز المالي" : "Financial Summary")}
            </h3>
            {metadata?.period && (
              <span className="text-xs text-gray-500 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                {metadata.period}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {summaryRows.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-green-100 bg-green-50/50 p-3 flex flex-col justify-between print:border-gray-300 print:bg-gray-50"
              >
                <span className="text-xs text-gray-600 leading-snug mb-1.5">
                  {item.label}
                </span>
                <span className="text-lg font-bold tabular-nums text-gray-900">
                  {typeof item.value === "number"
                    ? item.value.toFixed(2)
                    : String(item.value)}
                </span>
              </div>
            ))}
          </div>
          {summaryFooter}
        </div>
      )}
    </div>
  );
}

export function DateFilters({
  onChange,
}: {
  onChange: (query: string) => void;
}) {
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(searchParams?.get("from") || "");
  const [to, setTo] = useState(searchParams?.get("to") || "");
  const locale = useLocale();
  const isAr = locale !== "en";
  return (
    <form
      className="flex flex-wrap items-end gap-3 print:hidden"
      onSubmit={(e) => {
        e.preventDefault();
        onChange(
          new URLSearchParams({
            ...(from ? { from } : {}),
            ...(to ? { to } : {}),
          }).toString(),
        );
      }}
    >
      <Field label={isAr ? "من تاريخ" : "From Date"}>
        <input
          type="date"
          className={inputClass}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </Field>
      <Field label={isAr ? "حتى تاريخ" : "To Date"}>
        <input
          type="date"
          className={inputClass}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </Field>
      <button className={buttonClass}>{isAr ? "عرض" : "Apply"}</button>
    </form>
  );
}
