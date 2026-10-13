"use client";
import Link from "next/link";
import { useLocale } from "next-intl";
import { EntryRow } from "./EntrySheet";
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
  const locale = useLocale();
  const balances = useLoad<{
    rows: { code: string; debit: string; credit: string; balance: string }[];
  }>(kind === "parties" ? "/api/reports/parties" : null, { rows: [] });
  const accounts = useLoad<{
    accounts: {
      code: string;
      name: string;
      isGroup: boolean;
      isActive: boolean;
    }[];
  }>("/api/accounts?flat=true", { accounts: [] });
  const optionNames: Record<string, string> = {
    CUSTOMER: "عميل",
    SUPPLIER: "مورد",
    PARTNER: "شريك",
    WAREHOUSE: "مخزن",
    COLD_STORAGE: "ثلاجة",
    FARMING: "زراعات",
    IMPORT: "استيراد",
    EXPORT: "تصدير",
    MANUFACTURING: "تصنيع",
    ANIMAL: "إنتاج حيواني",
    kg: "كيلوجرام",
    tonne: "طن",
    unit: "وحدة",
  };
  const visibleFields = registerFields[kind].filter(
    (f) =>
      !(partyType && f.key === "type") &&
      !(kind === "parties" && partyType !== "PARTNER" && f.key === "share"),
  );
  const accountField = (key: string) =>
    key === "accountCode" || key.endsWith("Account");
  const fieldCell = (f: (typeof visibleFields)[number]) => (
    <Field key={f.key} label={f.label}>
      {accountField(f.key) ? (
        <select
          className={inputClass}
          value={fields[f.key] || ""}
          onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
        >
          <option value="">اختر الحساب بالاسم</option>
          {accounts.data.accounts
            .filter((a) => !a.isGroup && a.isActive)
            .map((a) => (
              <option key={a.code} value={a.code}>
                {a.name} — {a.code}
              </option>
            ))}
        </select>
      ) : f.options ? (
        <select
          className={inputClass}
          value={fields[f.key] || ""}
          onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
        >
          {f.options.map((o) => (
            <option key={o} value={o}>
              {optionNames[o] || o}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={inputClass}
          type={f.type || "text"}
          step={f.type === "number" ? "0.000001" : undefined}
          min={f.type === "number" ? 0 : undefined}
          value={fields[f.key] || ""}
          onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
        />
      )}
    </Field>
  );
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
    <Workspace
      title={title}
      error={error || loadError || balances.error}
      message={message}
    >
      <form
        onSubmit={save}
        className="rounded-xl border border-border bg-white p-5 space-y-4 print:hidden"
      >
        <h2 className="font-bold">{version ? "تعديل السجل" : "إضافة سجل"}</h2>
        <EntryRow label={title + " — إدخال"}>
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
          {visibleFields.filter((f) => !accountField(f.key)).map(fieldCell)}
        </EntryRow>
        {visibleFields.some((f) => accountField(f.key)) && (
          <details
            open={kind === "parties" || undefined}
            className="rounded-lg border p-3"
          >
            <summary className="cursor-pointer font-semibold">
              ربط الحسابات المحاسبية
            </summary>
            <p className="my-2 text-sm text-ink-600">
              اختَر الحسابات مرة عند إعداد السجل؛ ستُستخدم في الترحيل. اطلب من
              المحاسب تحديدها عند إعداد الشركة.
            </p>
            <EntryRow label="حسابات الترحيل">
              {visibleFields.filter((f) => accountField(f.key)).map(fieldCell)}
            </EntryRow>
          </details>
        )}
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
      <div
        className="max-w-full overflow-x-auto rounded-xl border bg-white"
        tabIndex={0}
        role="region"
        aria-label={title + " — السجلات"}
      >
        <table className="entry-sheet w-full text-sm text-right">
          <thead>
            <tr>
              <th scope="col">الكود</th>
              <th scope="col">الاسم</th>
              {kind === "parties" && (
                <>
                  <th>مدين</th>
                  <th>دائن</th>
                  <th>الرصيد</th>
                  <th>حالة الرصيد</th>
                </>
              )}
              {visibleFields.flatMap((f) => [
                <th scope="col" key={f.key}>
                  {f.label}
                </th>,
                ...(kind === "employees" && f.key === "basicSalary"
                  ? [
                      <th key="daily">اجر اليوم</th>,
                      <th key="hourly">اجر الساعة</th>,
                    ]
                  : []),
                ...(kind === "employees" && f.key === "startDate"
                  ? [
                      <th key="today">تاريخ اليوم</th>,
                      <th key="days">عدد ايام العمل</th>,
                      <th key="months">عدد شهور</th>,
                      <th key="years">عدد السنين</th>,
                    ]
                  : []),
              ])}
              <th scope="col">الحالة</th>
              <th scope="col">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const amounts =
                kind === "employees"
                  ? payrollAmounts(r.data.basicSalary || "0", [])
                  : null;
              const today = new Date().toISOString().slice(0, 10),
                tenure =
                  kind === "employees"
                    ? employmentDuration(r.data.startDate, today)
                    : null;
              const balance = balances.data.rows.find((b) => b.code === r.code);
              return (
                <tr key={r.id}>
                  <td>{r.code}</td>
                  <td className="min-w-40">{r.name}</td>
                  {kind === "parties" && (
                    <>
                      <td className="computed">{balance?.debit ?? "—"}</td>
                      <td className="computed">{balance?.credit ?? "—"}</td>
                      <td className="computed">
                        {balance?.balance.replace(/^-/, "") ?? "—"}
                      </td>
                      <td className="computed">
                        {!balance
                          ? "—"
                          : Number(balance.balance) === 0
                            ? "متوازن"
                            : balance.balance.startsWith("-")
                              ? "دائن"
                              : "مدين"}
                      </td>
                    </>
                  )}
                  {visibleFields.flatMap((f) => [
                    <td key={f.key} className="whitespace-nowrap">
                      {accountField(f.key)
                        ? accounts.data.accounts.find(
                            (a) => a.code === r.data[f.key],
                          )?.name ||
                          r.data[f.key] ||
                          "—"
                        : optionNames[r.data[f.key]] || r.data[f.key] || "—"}
                    </td>,
                    ...(amounts && f.key === "basicSalary"
                      ? [
                          <td className="computed" key="daily">
                            {amounts.daily}
                          </td>,
                          <td className="computed" key="hourly">
                            {amounts.hourly}
                          </td>,
                        ]
                      : []),
                    ...(tenure && f.key === "startDate"
                      ? [
                          <td className="computed" key="today">
                            {today}
                          </td>,
                          <td className="computed" key="days">
                            {tenure.days}
                          </td>,
                          <td className="computed" key="months">
                            {tenure.months}
                          </td>,
                          <td className="computed" key="years">
                            {tenure.years}
                          </td>,
                        ]
                      : []),
                  ])}
                  <td>{r.isActive ? "فعال" : "موقوف"}</td>
                  <td className="whitespace-nowrap">
                    <button
                      className="p-2 text-green-800 underline"
                      onClick={() => {
                        setCode(r.code);
                        setName(r.name);
                        setFields({ ...blank(), ...r.data });
                        setVersion(r.version);
                        setActive(r.isActive);
                        setMessage("");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      تعديل
                    </button>
                    {kind === "parties" && r.data.accountCode && (
                      <Link
                        className="p-2 text-green-800 underline"
                        href={`/${locale}/dashboard/accounting/account-statement?${new URLSearchParams({ account: r.data.accountCode, party: r.code })}`}
                      >
                        كشف حساب
                      </Link>
                    )}
                    {kind === "assets" && (
                      <button
                        disabled={busy}
                        className="p-2 text-green-800 underline"
                        onClick={() => depreciate(r.id)}
                      >
                        ترحيل الإهلاك
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td
                  colSpan={visibleFields.length + 10}
                  className="p-8 text-center"
                >
                  لا توجد سجلات. أضف أول سجل من صف الإدخال أعلاه.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Workspace>
  );
}
