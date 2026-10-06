"use client";
import React, { useState } from "react";
import templates from "@/data/cost-templates.json";
import {
  api,
  buttonClass,
  DataTable,
  Field,
  inputClass,
  useLoad,
  Workspace,
} from "./Workspace";
type Row = {
  id: string;
  code: string;
  name: string;
  data: Record<string, string>;
};
export function DocumentView() {
  const history = useLoad<{ rows: Record<string, unknown>[] }>(
    "/api/documents",
    { rows: [] },
  );
  const items = useLoad<{ rows: Row[] }>("/api/registers/items", { rows: [] }),
    warehouses = useLoad<{ rows: Row[] }>("/api/registers/warehouses", {
      rows: [],
    }),
    parties = useLoad<{ rows: Row[] }>("/api/registers/parties", { rows: [] }),
    centers = useLoad<{ rows: Row[] }>("/api/registers/cost-centers", {
      rows: [],
    });
  const accounts = useLoad<{
    accounts: {
      code: string;
      name: string;
      isGroup: boolean;
      isActive: boolean;
    }[];
  }>("/api/accounts?flat=true", { accounts: [] });
  const [form, setForm] = useState<Record<string, string>>({
      type: "PURCHASE",
      date: new Date().toISOString().slice(0, 10),
      itemId: "",
      warehouse: "",
      party: "",
      accountCode: "",
      quantity: "",
      unitPrice: "",
      reference: "",
      description: "",
      costCenter: "",
      costItem: "",
      truck: "",
      shipment: "",
      notes: "",
    }),
    [weighed, setWeighed] = useState(false),
    [weights, setWeights] = useState<Record<string, string>>({
      weight: "0",
      tare: "0",
      bags: "0",
      bagDeduction: "0",
      discountRate: "0",
      inspectionRate: "0",
      pricePerTonne: "0",
    }),
    [key, setKey] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const requestKey = key || crypto.randomUUID();
    setKey(requestKey);
    try {
      await api("/api/documents", {
        ...form,
        quantity: form.quantity || "0",
        unitPrice: form.unitPrice || "0",
        requestKey,
        ...(weighed ? { weigh: weights } : {}),
      });
      await history.reload();
      setKey("");
      setMessage("تم ترحيل المستند والمخزون والقيد المحاسبي بنجاح");
      setForm({
        ...form,
        quantity: "",
        unitPrice: "",
        description: "",
        reference: "",
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Workspace
      title="المشتريات والمبيعات والمرتجعات"
      error={error || items.error}
      message={message}
    >
      <datalist id="document-cost-items">
        {[
          ...new Set(
            Object.values(templates).flatMap((t) =>
              Object.entries(t.labels)
                .filter(([k]) => k.startsWith("B"))
                .map(([, v]) => v),
            ),
          ),
        ].map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
      <form
        onSubmit={save}
        className="rounded-xl border bg-white p-5 space-y-5"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="نوع المستند">
            <select
              className={inputClass}
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              {[
                ["PURCHASE", "شراء"],
                ["SALE", "بيع"],
                ["PURCHASE_RETURN", "مرتجع مشتريات"],
                ["SALE_RETURN", "مرتجع مبيعات"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          {[
            ["itemId", "الصنف", items.data.rows],
            ["warehouse", "المخزن", warehouses.data.rows],
            ["party", "العميل / المورد", parties.data.rows],
            ["costCenter", "مركز التكلفة", centers.data.rows],
          ].map(([key, label, rows]) => (
            <Field key={String(key)} label={String(label)}>
              <select
                required={key !== "costCenter"}
                className={inputClass}
                value={form[String(key)]}
                onChange={(e) => {
                  const value = e.target.value;
                  if (key === "party") {
                    const party = parties.data.rows.find(
                      (p) => p.code === value,
                    );
                    setForm({
                      ...form,
                      party: value,
                      accountCode: party?.data.accountCode || form.accountCode,
                    });
                  } else set(String(key), value);
                }}
              >
                <option value="">اختر</option>
                {(rows as Row[]).map((r) => (
                  <option key={r.id} value={key === "itemId" ? r.id : r.code}>
                    {r.code} — {r.name}
                  </option>
                ))}
              </select>
            </Field>
          ))}
          <Field label="الحساب المقابل">
            <select
              required
              className={inputClass}
              value={form.accountCode}
              onChange={(e) => set("accountCode", e.target.value)}
            >
              <option value="">اختر</option>
              {accounts.data.accounts
                .filter((a) => !a.isGroup && a.isActive)
                .map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.name}
                  </option>
                ))}
            </select>
          </Field>
          {[
            ["date", "التاريخ", "date"],
            ["quantity", "الكمية", "number"],
            ["unitPrice", "سعر الوحدة", "number"],
            ["reference", "المرجع", "text"],
            ["description", "البيان", "text"],
            ["costItem", "بند التكلفة", "text"],
            ["truck", "رقم السيارة", "text"],
            ["shipment", "بيان الشحن", "text"],
            ["notes", "ملاحظات", "text"],
          ].map(([key, label, type]) => (
            <Field key={key} label={label}>
              <input
                list={key === "costItem" ? "document-cost-items" : undefined}
                required={
                  ["date", "description"].includes(key) ||
                  (!weighed && ["quantity", "unitPrice"].includes(key))
                }
                disabled={weighed && ["quantity", "unitPrice"].includes(key)}
                className={inputClass}
                type={type}
                min={type === "number" ? 0 : undefined}
                step="0.000001"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </Field>
          ))}
        </div>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={weighed}
            onChange={(e) => setWeighed(e.target.checked)}
          />
          حساب القيمة من الوزن وخصومات الأجولة والفحص
        </label>
        {weighed && (
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["weight", "الوزن"],
              ["tare", "الفارغ"],
              ["bags", "عدد الأجولة"],
              ["bagDeduction", "خصم الجوال بالكيلو"],
              ["discountRate", "نسبة الخصم (0–1)"],
              ["inspectionRate", "نسبة الفحص (0–1)"],
              ["pricePerTonne", "السعر للطن"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  required
                  min="0"
                  type="number"
                  step="0.000001"
                  className={inputClass}
                  value={weights[key]}
                  onChange={(e) =>
                    setWeights({ ...weights, [key]: e.target.value })
                  }
                />
              </Field>
            ))}
          </div>
        )}
        <p className="text-sm text-ink-600">
          في مستند الوزن: كمية المخزون هي القائم (الوزن − الفارغ)، والقيمة من
          الصافي بعد الخصومات × سعر الطن ÷ 1000.
        </p>
        <button disabled={busy} className={buttonClass}>
          {busy ? "جارٍ الترحيل…" : "حفظ وترحيل المستند"}
        </button>
      </form>
      <h2 className="font-bold">آخر 100 مستند</h2>
      <DataTable
        rows={history.data.rows}
        columns={[
          ["date", "التاريخ"],
          ["reference", "المرجع"],
          ["type", "المستند"],
          ["party", "الطرف"],
          ["item", "الصنف"],
          ["warehouse", "المخزن"],
          ["quantity", "القائم / الكمية"],
          ["bagLoss", "خصم الأجولة"],
          ["afterDiscount", "بعد الخصم"],
          ["net", "الصافي"],
          ["amount", "القيمة"],
          ["truck", "السيارة"],
          ["shipment", "بيان الشحن"],
          ["notes", "ملاحظات"],
        ].map(([key, label]) => ({ key, label }))}
      />
    </Workspace>
  );
}
