"use client";
import React, { useState } from "react";
import {
  api,
  buttonClass,
  DataTable,
  Field,
  inputClass,
  Workspace,
} from "./Workspace";
const configs = {
  weigh: {
    title: "حساب الوزن والخصومات",
    fields: [
      ["weight", "الوزن"],
      ["tare", "الفارغ"],
      ["bags", "العدد"],
      ["bagDeduction", "خصم الجوال بالكيلو"],
      ["discountRate", "نسبة الخصم (0–1)"],
      ["inspectionRate", "نسبة الفحص (0–1)"],
      ["pricePerTonne", "السعر للطن"],
    ],
    results: [
      ["gross", "القائم"],
      ["bagLoss", "خصم الأجولة"],
      ["netKg", "صافي كيلو"],
      ["discount", "الخصم"],
      ["afterDiscount", "صافي بعد الخصم"],
      ["inspection", "خصم الفحص"],
      ["net", "الصافي النهائي"],
      ["amount", "القيمة"],
    ],
  },
  import: {
    title: "حساب تكلفة الاستيراد",
    fields: [
      ["goods", "قيمة البضاعة بالعملة الأجنبية"],
      ["freight", "الشحن"],
      ["insuranceRate", "نسبة التأمين (0–1)"],
      ["customsRate", "نسبة الجمارك (0–1)"],
      ["fees", "المصاريف الأخرى بالعملة الأجنبية"],
      ["quantity", "الكمية"],
      ["exchangeRate", "سعر التحويل للعملة المحلية"],
    ],
    results: [
      ["freightTotal", "البضاعة والشحن"],
      ["insurance", "التأمين"],
      ["customs", "الجمارك"],
      ["foreignTotal", "الإجمالي بالعملة الأجنبية"],
      ["localTotal", "الإجمالي المحلي"],
      ["foreignUnit", "تكلفة الوحدة الأجنبية"],
      ["localUnit", "تكلفة الوحدة المحلية"],
    ],
  },
  depreciation: {
    title: "حساب إهلاك الأصل",
    fields: [
      ["cost", "قيمة الأصل"],
      ["additions", "الإضافات"],
      ["prior", "إهلاك سابق"],
      ["rate", "النسبة السنوية (0–1)"],
      ["months", "عدد الأشهر (0–12)"],
      ["residual", "القيمة المتبقية"],
    ],
    results: [
      ["base", "أساس الإهلاك"],
      ["expense", "مصروف الإهلاك"],
      ["accumulated", "مجمع الإهلاك"],
      ["net", "صافي القيمة الدفترية"],
    ],
  },
};
export function CalculatorView({ type }: { type: keyof typeof configs }) {
  const config = configs[type];
  const [values, setValues] = useState<Record<string, string>>(
      Object.fromEntries(config.fields.map(([key]) => [key, "0"])),
    ),
    [result, setResult] = useState<Record<string, string>>({}),
    [error, setError] = useState("");
  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      setResult((await api("/api/calculations", { type, ...values })).result);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Workspace title={config.title} error={error}>
      <form
        onSubmit={calculate}
        className="space-y-4 rounded-xl border bg-white p-5"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {config.fields.map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                required
                type="number"
                min="0"
                step="0.000001"
                className={inputClass}
                value={values[key]}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
              />
            </Field>
          ))}
        </div>
        <button className={buttonClass}>احسب</button>
      </form>
      <DataTable
        rows={config.results.map(([key, label]) => ({
          label,
          value: result[key] ?? "—",
        }))}
        columns={[
          { key: "label", label: "البند" },
          { key: "value", label: "النتيجة" },
        ]}
      />
      <p className="text-sm text-ink-600">
        الحاسبة لا تنشئ قيداً. النتائج تراجع قبل إدخال المستند المحاسبي.
      </p>
    </Workspace>
  );
}
