"use client";
import React, { useCallback, useEffect, useRef, useId, useState } from "react";

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
export function useLoad<T>(url: string | null, initial: T) {
  const [data, setData] = useState<T>(initial),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const initialRef = useRef(initial);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    if (!url) {
      setData(initialRef.current);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await api(url);
      if (current === generation.current) {
        setData(result);
        setError("");
      }
    } catch (e) {
      if (current === generation.current) setError((e as Error).message);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    void reload();
    return () => {
      generation.current++;
    };
  }, [reload]);
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
  return (
    <section className="space-y-6" dir="rtl">
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
export function DataTable({
  rows,
  columns,
}: {
  rows: Record<string, unknown>[];
  columns: { key: string; label: string }[];
}) {
  function exportCsv() {
    const escape = (v: unknown) => {
      let s = String(v ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const content =
      "\ufeff" +
      [
        columns.map((c) => escape(c.label)).join(","),
        ...rows.map((r) => columns.map((c) => escape(r[c.key])).join(",")),
      ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-3">
      <div className="flex gap-3 print:hidden">
        <button type="button" className={buttonClass} onClick={exportCsv}>
          تصدير CSV
        </button>
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-2 text-sm"
          onClick={() => window.print()}
        >
          طباعة / PDF
        </button>
        <span className="self-center text-sm">{rows.length} سجل</span>
      </div>
      <div
        className="max-w-full overflow-x-auto rounded-xl border border-border bg-white"
        tabIndex={0}
        role="region"
        aria-label="جدول النتائج"
      >
        <table className="w-full border-collapse text-right text-sm">
          <thead className="bg-green-50 text-green-900">
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
                className="border-b last:border-0 hover:bg-canvas"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="whitespace-nowrap border-x border-green-100 p-3 tabular-nums"
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
                  لا توجد بيانات للفلاتر المختارة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function DateFilters({
  onChange,
}: {
  onChange: (query: string) => void;
}) {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
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
      <Field label="من تاريخ">
        <input
          type="date"
          className={inputClass}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </Field>
      <Field label="حتى تاريخ">
        <input
          type="date"
          className={inputClass}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </Field>
      <button className={buttonClass}>عرض</button>
    </form>
  );
}
