"use client";
import React, { useEffect, useState } from "react";
import templates from "@/data/cost-templates.json";
import {
  api,
  buttonClass,
  DateFilters,
  Field,
  inputClass,
  useLoad,
  Workspace,
} from "./Workspace";
export function CostView({ type }: { type: keyof typeof templates }) {
  const template = templates[type],
    centers = useLoad<{
      rows: { code: string; name: string; data: { type: string } }[];
    }>("/api/registers/cost-centers", { rows: [] });
  const [center, setCenter] = useState(""),
    [query, setQuery] = useState(""),
    [inputs, setInputs] = useState<Record<string, string>>({}),
    [values, setValues] = useState<Record<string, string>>({}),
    [issues, setIssues] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [sourceLines, setSourceLines] = useState(0);
  async function load() {
    if (!center) return;
    setBusy(true);
    setError("");
    try {
      const result = await api(
        `/api/costs/${type}?center=${encodeURIComponent(center)}&${query}`,
      );
      setInputs(result.inputs);
      setValues(result.values);
      setIssues(result.errors);
      setSourceLines(result.sourceLines);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, [center, query, type]); // eslint-disable-line react-hooks/exhaustive-deps
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/costs/" + type, {
        center,
        from: new URLSearchParams(query).get("from") || "1900-01-01",
        to: new URLSearchParams(query).get("to") || "9999-12-31",
        inputs: Object.fromEntries(
          Object.entries(inputs).filter(([, v]) => v !== ""),
        ),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Workspace title={template.title} error={error}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="مركز التكلفة">
          <select
            className={inputClass}
            value={center}
            onChange={(e) => setCenter(e.target.value)}
          >
            <option value="">اختر</option>
            {centers.data.rows
              .filter((c) => c.data.type === type)
              .map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
          </select>
        </Field>
        <DateFilters onChange={setQuery} />
      </div>
      {center && (
        <>
          <form
            onSubmit={save}
            className="rounded-xl border bg-white p-5 space-y-4"
          >
            <h2 className="font-bold">مدخلات التقرير</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(template.inputs).map(([cell, label]) => (
                <Field key={cell} label={`${label} (${cell})`}>
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    className={inputClass}
                    value={inputs[cell] ?? ""}
                    onChange={(e) =>
                      setInputs({ ...inputs, [cell]: e.target.value })
                    }
                  />
                </Field>
              ))}
            </div>
            <button disabled={busy} className={buttonClass}>
              حفظ المدخلات وحساب التقرير
            </button>
          </form>
          <div className="flex justify-between text-sm">
            <span>بنود القيود المرتبطة بالفترة: {sourceLines}</span>
            <button
              className="underline print:hidden"
              onClick={() => window.print()}
            >
              طباعة / PDF
            </button>
          </div>
          {Object.keys(issues).length > 0 && (
            <div role="status" className="rounded-lg bg-amber-50 p-3 text-sm">
              بعض النتائج غير متاحة بسبب مدخلات ناقصة أو قسمة على صفر. التفاصيل
              تظهر بجوار الخلية.
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-green-50">
                <tr>
                  <th className="p-3 text-right">البند</th>
                  {["C", "D", "E", "F"].map((c) => (
                    <th key={c} className="p-3">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {template.rows.map((row) => (
                  <tr key={row.row} className="border-t">
                    <td className="p-3">{row.label || `بند ${row.row}`}</td>
                    {["C", "D", "E", "F"].map((col) => {
                      const cell = col + row.row;
                      return (
                        <td
                          key={cell}
                          className="p-3 tabular-nums"
                          title={issues[cell] || cell}
                        >
                          {values[cell] ?? inputs[cell] ?? ""}
                          {issues[cell] && (
                            <span className="block max-w-48 whitespace-normal text-xs text-amber-800">
                              {issues[cell]}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-ink-600">
            بنود التكلفة مرتبطة باسم البند ومركز التكلفة المسجلين في القيود.
            مبالغ التقارير المالية بالعملة المحلية، وأسعار التحويل تدخل صراحة في
            مدخلات التقرير عند الحاجة.
          </p>
        </>
      )}
    </Workspace>
  );
}
