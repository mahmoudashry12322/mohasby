"use client";
import React, { useState } from "react";
import {
  api,
  buttonClass,
  DataTable,
  DateFilters,
  Field,
  inputClass,
  useLoad,
  Workspace,
} from "./Workspace";
type RecordRow = {
  id: string;
  code: string;
  name: string;
  data: Record<string, string>;
};
export function StockView({
  title,
  initialKind = "RECEIPT",
  readOnly = false,
  coldOnly = false,
}: {
  title: string;
  initialKind?: string;
  readOnly?: boolean;
  coldOnly?: boolean;
}) {
  const [query, setQuery] = useState(""),
    [filterItem, setFilterItem] = useState(""),
    [filterWarehouse, setFilterWarehouse] = useState("");
  const records = useLoad<{ rows: RecordRow[] }>("/api/registers/items", {
      rows: [],
    }),
    warehouses = useLoad<{ rows: RecordRow[] }>("/api/registers/warehouses", {
      rows: [],
    });
  const centers = useLoad<{ rows: RecordRow[] }>(
    "/api/registers/cost-centers",
    { rows: [] },
  );
  const accounts = useLoad<{
    accounts: {
      code: string;
      name: string;
      isGroup: boolean;
      isActive: boolean;
    }[];
  }>("/api/accounts?flat=true", { accounts: [] });
  const stock = useLoad<{
    rows: Record<string, unknown>[];
    balances: Record<string, unknown>[];
  }>(
    "/api/stock?" +
      query +
      (coldOnly ? "&warehouseType=COLD_STORAGE" : "") +
      "&itemId=" +
      encodeURIComponent(filterItem) +
      "&warehouse=" +
      encodeURIComponent(filterWarehouse),
    { rows: [], balances: [] },
  );
  const [form, setForm] = useState<Record<string, string>>({
    date: new Date().toISOString().slice(0, 10),
    itemId: "",
    warehouse: "",
    kind: initialKind,
    quantity: "",
    unitCost: "0",
    counterpart: "",
    reference: "",
    description: "",
    costCenter: "",
    costItem: "",
  });
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [key, setKey] = useState("");
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const requestKey = key || crypto.randomUUID();
    setKey(requestKey);
    try {
      await api("/api/stock", { ...form, requestKey });
      setKey("");
      setMessage("تم تسجيل حركة المخزون والمستند المرتبط إن وجد");
      setForm({ ...form, quantity: "", description: "", reference: "" });
      await stock.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Workspace title={title} error={error || stock.error} message={message}>
      {!readOnly && (
        <form
          onSubmit={save}
          className="rounded-xl border bg-white p-5 space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="نوع الحركة">
              <select
                className={inputClass}
                value={form.kind}
                onChange={(e) => set("kind", e.target.value)}
              >
                {[
                  ["OPENING", "رصيد افتتاحي"],
                  ["RECEIPT", "إضافة"],
                  ["ISSUE", "صرف"],
                  ["WASTE", "هالك"],
                  ["RETURN_IN", "مردود وارد"],
                  ["RETURN_OUT", "مردود صادر"],
                  ["COUNT_GAIN", "زيادة جرد"],
                  ["COUNT_LOSS", "عجز جرد"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="الصنف">
              <select
                required
                className={inputClass}
                value={form.itemId}
                onChange={(e) => set("itemId", e.target.value)}
              >
                <option value="">اختر</option>
                {records.data.rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.name} ({r.data.unit})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="المخزن / الثلاجة">
              <select
                required
                className={inputClass}
                value={form.warehouse}
                onChange={(e) => set("warehouse", e.target.value)}
              >
                <option value="">اختر</option>
                {warehouses.data.rows.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            {[
              ["date", "التاريخ", "date"],
              ["quantity", "الكمية بوحدة الصنف", "number"],
              ["unitCost", "تكلفة الوحدة للوارد", "number"],
              ["reference", "رقم الإذن", "text"],
              ["description", "البيان", "text"],
            ].map(([k, l, t]) => (
              <Field key={k} label={l}>
                <input
                  required={["date", "quantity", "description"].includes(k)}
                  className={inputClass}
                  type={t}
                  step="0.001"
                  min={t === "number" ? 0 : undefined}
                  value={form[k]}
                  onChange={(e) => set(k, e.target.value)}
                />
              </Field>
            ))}
            <Field label="الحساب المقابل (مورد / تكلفة / رأس مال)">
              <select
                required={["OPENING", "RECEIPT", "RETURN_OUT"].includes(
                  form.kind,
                )}
                className={inputClass}
                value={form.counterpart}
                onChange={(e) => set("counterpart", e.target.value)}
              >
                <option value="">اختر الحساب</option>
                {accounts.data.accounts
                  .filter((a) => !a.isGroup && a.isActive)
                  .map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} — {a.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="مركز التكلفة">
              <select
                className={inputClass}
                value={form.costCenter}
                onChange={(e) => set("costCenter", e.target.value)}
              >
                <option value="">بدون مركز</option>
                {centers.data.rows.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="بند التكلفة">
              <input
                className={inputClass}
                value={form.costItem}
                onChange={(e) => set("costItem", e.target.value)}
              />
            </Field>
          </div>
          <p className="text-sm text-ink-600">
            تقييم المخزون بمتوسط الفترة. تكلفة الوارد تسجل بالمستند؛ تكلفة
            الصادر وقيمة الباقي تحددان عند إقفال المخزون. حركة الصرف وحدها لا
            تنشئ قيد تكلفة قبل الإقفال.
          </p>
          <button disabled={busy} className={buttonClass}>
            حفظ وترحيل
          </button>
        </form>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        <DateFilters onChange={setQuery} />
        <Field label="تصفية بالصنف">
          <select
            className={inputClass}
            value={filterItem}
            onChange={(e) => setFilterItem(e.target.value)}
          >
            <option value="">الكل</option>
            {records.data.rows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="تصفية بالمخزن / الثلاجة">
          <select
            className={inputClass}
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
          >
            <option value="">الكل</option>
            {warehouses.data.rows
              .filter((r) => !coldOnly || r.data.type === "COLD_STORAGE")
              .map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
          </select>
        </Field>
      </div>
      <h2 className="font-bold text-lg">الأرصدة حتى نهاية الفترة</h2>
      <DataTable
        rows={stock.data.balances}
        columns={[
          ["code", "الصنف"],
          ["name", "الاسم"],
          ["warehouse", "المخزن"],
          ["received", "الوارد التراكمي"],
          ["issued", "الصادر التراكمي"],
          ["quantity", "الكمية المتبقية"],
          ["remainingPercent", "نسبة المتبقي"],
          ["averageCost", "متوسط التكلفة"],
          ["value", "القيمة"],
        ].map(([key, label]) => ({ key, label }))}
      />
      <h2 className="font-bold text-lg">الحركة</h2>
      <DataTable
        rows={stock.data.rows.map((r) => ({
          ...r,
          date: String(r.date).slice(0, 10),
          item: (r.item as RecordRow)?.name,
        }))}
        columns={[
          ["date", "التاريخ"],
          ["item", "الصنف"],
          ["warehouse", "المخزن"],
          ["kind", "النوع"],
          ["quantity", "الكمية"],
          ["runningQuantity", "الرصيد التراكمي"],
          ["unitCost", "تكلفة الوحدة"],
          ["value", "القيمة"],
          ["reference", "المرجع"],
        ].map(([key, label]) => ({ key, label }))}
      />
    </Workspace>
  );
}
