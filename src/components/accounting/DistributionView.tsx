"use client";
import React, { useEffect, useState } from "react";
import template from "@/data/distribution-template.json";
import {
  api,
  buttonClass,
  Field,
  inputClass,
  useLoad,
  Workspace,
} from "./Workspace";
import { RegisterView } from "./RegisterView";
export function DistributionView() {
  const [from, setFrom] = useState(new Date().getFullYear() + "-01-01"),
    [to, setTo] = useState(new Date().toISOString().slice(0, 10)),
    [inputs, setInputs] = useState<Record<string, string>>({}),
    [first, setFirst] = useState(""),
    [second, setSecond] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const r = useLoad<{
    inputs: Record<string, string>;
    first: string;
    second: string;
    version: number;
    context: Record<string, string>;
    partners: { code: string; name: string }[];
    values: Record<string, string>;
    errors: Record<string, string>;
  }>("/api/equity/distribution?" + new URLSearchParams({ from, to }), {
    inputs: {},
    first: "",
    second: "",
    version: 0,
    context: {},
    partners: [],
    values: {},
    errors: {},
  });
  useEffect(() => {
    setInputs(r.data.inputs);
    setFirst(r.data.first);
    setSecond(r.data.second);
  }, [r.data]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/equity/distribution", {
        from,
        to,
        first,
        second,
        version: r.data.version,
        inputs: Object.fromEntries(
          Object.entries(inputs).filter(([, v]) => v !== ""),
        ),
      });
      await r.reload();
      setMessage("تم حفظ التوزيع وإعادة الحساب");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const labels = template.labels as Record<string, string>,
    selectors = template.selectors as Record<string, string>;
  const value = (cell: string) =>
    r.data.values[cell] ??
    (selectors[cell] ? r.data.context[selectors[cell]] : undefined) ??
    inputs[cell] ??
    labels[cell] ??
    "";
  return (
    <Workspace
      title="توزيع حقوق ملكية"
      error={error || r.error}
      message={message}
    >
      <details
        className="rounded-xl border bg-white p-4 print:hidden"
        onToggle={(e) => {
          if (!e.currentTarget.open) void r.reload();
        }}
      >
        <summary className="cursor-pointer font-semibold">
          إدارة الشركاء
        </summary>
        <RegisterView kind="parties" partyType="PARTNER" title="الشركاء" />
      </details>
      <form
        onSubmit={save}
        className="space-y-4 rounded-xl border bg-white p-5 print:hidden"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="من تاريخ">
            <input
              type="date"
              required
              className={inputClass}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="حتى تاريخ">
            <input
              type="date"
              required
              className={inputClass}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
          {[
            [first, setFirst, "الشريك الأول"],
            [second, setSecond, "الشريك الثاني"],
          ].map(([v, set, label]) => (
            <Field key={String(label)} label={String(label)}>
              <select
                required
                className={inputClass}
                value={String(v)}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
              >
                <option value="">اختر</option>
                {r.data.partners.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
        <p className="text-sm">
          التسوية لشريكين بالمناصفة كما في النموذج. أدخل التمويل والمسحوبات وحصص
          الربح بإشارتها المحاسبية؛ النتائج تحليلية ولا ترحّل قيدًا تلقائيًا.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(template.inputs).map(([cell, label]) => (
            <Field key={cell} label={label}>
              <input
                type="number"
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
        <button className={buttonClass} disabled={busy}>
          حفظ وحساب التوزيع
        </button>
      </form>
      <button
        className={buttonClass + " print:hidden"}
        onClick={() => window.print()}
      >
        طباعة / PDF
      </button>
      <div className="overflow-x-auto border rounded-xl bg-white">
        <table className="w-full text-sm text-right">
          <caption className="p-4 font-bold">
            قائمة توزيع حقوق الملكية — {from} / {to}
          </caption>
          <tbody>
            {template.rows.map((row) => (
              <tr
                key={row}
                className={
                  template.headers.includes(row)
                    ? "bg-green-50 font-bold"
                    : "border-t"
                }
              >
                {["B", "C", "D", "E", "F"].map((col) => {
                  const cell = col + row;
                  return (
                    <td key={cell} className="p-3" data-cell={cell}>
                      {value(cell)}
                      {r.data.errors[cell] && (
                        <span className="block text-amber-800">
                          {r.data.errors[cell]}
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
    </Workspace>
  );
}
