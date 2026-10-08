"use client";
import React, { useState } from "react";
import type { RegisterKind } from "@/lib/accounting/registers";
import { registerFields } from "@/lib/accounting/register-fields";
import {
  employmentDuration,
  payrollAmounts,
} from "@/lib/accounting/payroll-calculations";
import {
  api,
  buttonClass,
  Field,
  inputClass,
  useLoad,
  Workspace,
} from "./Workspace";
type Row = {
  id: string;
  code: string;
  name: string;
  version: number;
  isActive: boolean;
  data: Record<string, string>;
};
export function RegisterView({
  kind,
  title,
  partyType,
}: {
  kind: RegisterKind;
  title: string;
  partyType?: string;
}) {
  const {
    data,
    error: loadError,
    reload,
  } = useLoad<{ rows: Row[] }>("/api/registers/" + kind, { rows: [] });
  const blank = () =>
    Object.fromEntries(
      registerFields[kind].map((f) => [
        f.key,
        f.options?.[0] || (f.type === "number" ? "0" : ""),
      ]),
    );
  const [code, setCode] = useState(""),
    [name, setName] = useState(""),
    [fields, setFields] = useState<Record<string, string>>({
      ...blank(),
      ...(partyType ? { type: partyType } : {}),
    }),
    [version, setVersion] = useState<number>(),
    [active, setActive] = useState(true);
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState("");
  function reset() {
    setCode("");
    setName("");
    setFields({ ...blank(), ...(partyType ? { type: partyType } : {}) });
    setVersion(undefined);
    setActive(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/registers/" + kind, {
        code,
        name,
        data: fields,
        version,
        isActive: active,
      });
      reset();
      setMessage("تم حفظ السجل");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function depreciate(id: string) {
    const date = window.prompt("إهلاك حتى نهاية الشهر YYYY-MM-DD");
    if (!date) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/assets/" + id + "/depreciate", { date });
      setMessage("تم ترحيل قيد الإهلاك");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const rows = data.rows.filter(
    (r) =>
      (!partyType || r.data.type === partyType) &&
      (r.code + r.name).includes(search),
  );
  return (
    <Workspace title={title} error={error || loadError} message={message}>
      <form
        onSubmit={save}
        className="rounded-xl border border-border bg-white p-5 space-y-4 print:hidden"
      >
        <h2 className="font-bold">{version ? "تعديل السجل" : "إضافة سجل"}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="الكود">
            <input
              required
              readOnly={!!version}
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
          <Field label="الاسم">
            <input
              required
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          {registerFields[kind]
            .filter((f) => !(partyType && f.key === "type"))
            .map((f) => (
              <Field key={f.key} label={f.label}>
                {f.options ? (
                  <select
                    className={inputClass}
                    value={fields[f.key] || ""}
                    onChange={(e) =>
                      setFields({ ...fields, [f.key]: e.target.value })
                    }
                  >
                    {f.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={inputClass}
                    type={f.type || "text"}
                    step={f.type === "number" ? "0.000001" : undefined}
                    min={f.type === "number" ? 0 : undefined}
                    value={fields[f.key] || ""}
                    onChange={(e) =>
                      setFields({ ...fields, [f.key]: e.target.value })
                    }
                  />
                )}
              </Field>
            ))}
        </div>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          فعال
        </label>
        <div className="flex gap-3">
          <button className={buttonClass} disabled={busy}>
            حفظ
          </button>
          {version && (
            <button type="button" onClick={reset}>
              إلغاء التعديل
            </button>
          )}
        </div>
      </form>
      <input
        aria-label="بحث"
        className={inputClass}
        placeholder="بحث بالكود أو الاسم"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm text-right">
          <thead className="bg-green-50">
            <tr>
              <th className="p-3">الكود</th>
              <th>الاسم</th>
              <th>الحالة</th>
              <th>البيانات</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.code}</td>
                <td>{r.name}</td>
                <td>{r.isActive ? "فعال" : "موقوف"}</td>
                <td className="p-3 text-xs">
                  {registerFields[kind]
                    .filter((f) => r.data[f.key])
                    .map((f) => `${f.label}: ${r.data[f.key]}`)
                    .join("، ")}
                  {kind === "employees" &&
                    (() => {
                      const amounts = payrollAmounts(r.data.basicSalary, []),
                        tenure = employmentDuration(
                          r.data.startDate,
                          new Date().toISOString().slice(0, 10),
                        );
                      return (
                        <p className="mt-2 font-semibold">
                          اليومية: {amounts.daily} — الساعة: {amounts.hourly} —
                          مدة الخدمة: {tenure.days} يوم / {tenure.months} شهر /{" "}
                          {tenure.years} سنة
                        </p>
                      );
                    })()}
                </td>
                <td className="p-3">
                  <button
                    className="text-green-800 underline"
                    onClick={() => {
                      setCode(r.code);
                      setName(r.name);
                      setFields(r.data);
                      setVersion(r.version);
                      setActive(r.isActive);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    تعديل
                  </button>
                  {kind === "assets" && (
                    <button
                      disabled={busy}
                      className="mr-3 text-green-800 underline"
                      onClick={() => depreciate(r.id)}
                    >
                      ترحيل الإهلاك
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  لا توجد سجلات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Workspace>
  );
}
