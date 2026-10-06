"use client";
import React, { useEffect, useState } from "react";
import {
  api,
  buttonClass,
  DataTable,
  Field,
  inputClass,
  useLoad,
  Workspace,
} from "./Workspace";
const fields = [
  ["capital", "رأس المال"],
  ["funding", "التمويل والمدفوعات"],
  ["withdrawals", "المسحوبات النقدية"],
  ["receivedRevenue", "إيرادات استلمها الشريك"],
  ["offset", "مقاصة مديونية"],
  ["drawingInterest", "فوائد المسحوبات"],
  ["capitalInterest", "فوائد رأس المال"],
  ["salary", "رواتب خاصة بالشريك"],
];
export function EquityView({ title }: { title: string }) {
  const [from, setFrom] = useState(new Date().getUTCFullYear() + "-01-01"),
    [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const result = useLoad<{
    rows: Record<string, string>[];
    inputs: Record<string, Record<string, string>>;
    profit?: string;
    costs?: string;
    pendingInventoryAdjustment?: string;
  }>("/api/equity?" + new URLSearchParams({ from, to }), {
    rows: [],
    inputs: {},
  });
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>(
      {},
    ),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setInputs(result.data.inputs);
    setMessage("");
  }, [result.data]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/equity", { from, to, inputs });
      await result.reload();
      setMessage("تم حفظ مدخلات الفترة وإعادة الحساب");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const columns = (x: string[][]) => x.map(([key, label]) => ({ key, label }));
  return (
    <Workspace title={title} error={error || result.error} message={message}>
      <div className="flex gap-3">
        <Field label="من تاريخ">
          <input
            className={inputClass}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field label="حتى تاريخ">
          <input
            className={inputClass}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
      </div>
      <p className="rounded-xl border bg-white p-4">
        صافي الربح المرحل: {result.data.profit || "—"} | مصروفات الفترة:{" "}
        {result.data.costs || "—"} | تسوية مخزون غير مرحلة:{" "}
        {result.data.pendingInventoryAdjustment || "—"}
      </p>
      <p className="text-sm">
        نتائج تحليلية لا تنشئ قيداً تلقائياً. رأس المال والتمويل والفوائد
        والمسحوبات مدخلات الفترة كما في Excel. نسب التوزيع من دليل الشركاء؛ ترك
        كل النسب صفراً يوزع بالتساوي. الرصيد الدفتري يعرض مستقلاً للمطابقة. راجع
        تسوية المخزون قبل اعتماد الربح.
      </p>
      <form onSubmit={save} className="space-y-3 print:hidden">
        {result.data.rows.map((p) => (
          <details className="rounded-xl border bg-white p-4" key={p.code}>
            <summary className="cursor-pointer font-bold">
              مدخلات {p.name}
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {fields.map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    value={inputs[p.code]?.[key] || ""}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        [p.code]: {
                          ...inputs[p.code],
                          [key]: e.target.value || "0",
                        },
                      })
                    }
                  />
                </Field>
              ))}
            </div>
          </details>
        ))}
        <button
          disabled={busy || result.loading || !result.data.rows.length}
          className={buttonClass}
        >
          حفظ وإعادة الحساب
        </button>
      </form>
      <h2 className="font-bold">توزيع الأرباح والخسائر</h2>
      <DataTable
        rows={result.data.rows}
        columns={columns([
          ["name", "الشريك"],
          ["capital", "رأس المال"],
          ["capitalRatio", "نسبة رأس المال"],
          ["ratio", "نسبة التوزيع"],
          ["profitShare", "نصيب الربح / الخسارة"],
          ["profitCurrent", "صافي الجاري بعد الفوائد والمسحوبات"],
          ["endingCapital", "رأس المال بعد التوزيع"],
        ])}
      />
      <h2 className="font-bold">تسوية التمويل والتكاليف</h2>
      <DataTable
        rows={result.data.rows}
        columns={columns([
          ["name", "الشريك"],
          ["funding", "التمويل"],
          ["costShare", "نصيب التكاليف"],
          ["fundingOffset", "فرق التمويل والتكلفة"],
          ["totalDrawings", "المسحوبات والإيرادات والمقاصة"],
          ["settlement", "صافي التسوية"],
          ["ledgerBalance", "الرصيد الدفتري (مدين − دائن)"],
        ])}
      />
    </Workspace>
  );
}
