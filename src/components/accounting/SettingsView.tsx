"use client";
import React, { useState } from "react";
import {
  api,
  buttonClass,
  DataTable,
  Field,
  inputClass,
  useLoad,
  Workspace,
} from "./Workspace";
import { UserManagementView, ManagedUser } from "./UserManagementView";

type Period = {
  id: string;
  name: string;
  start: string;
  end: string;
  isClosed: boolean;
};

export function SettingsView() {
  const {
    data,
    error: loadError,
    reload,
  } = useLoad<{
    company: { name: string; taxNumber?: string; commercialReg?: string };
    periods: Period[];
    users: ManagedUser[];
  }>("/api/settings", { company: { name: "" }, periods: [], users: [] });

  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);

  async function act(input: unknown) {
    setBusy(true);
    setError("");
    try {
      await api("/api/settings", input);
      setMessage("تم الحفظ");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function mapping(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api(
        "/api/accounts/" + encodeURIComponent(String(f.get("accountCode"))),
        { cashFlow: f.get("cashFlow") },
        "PUT",
      );
      setMessage("تم حفظ تصنيف التدفقات");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function submit(e: React.FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void act({
      action,
      ...Object.fromEntries(f.entries()),
      ...(action === "user" ? { isActive: true } : {}),
    });
  }

  return (
    <Workspace
      title="إعدادات الشركة والفترات والمستخدمين"
      error={error || loadError}
      message={message}
    >
      {/* 1. Company Information */}
      <form
        key={data.company.name}
        onSubmit={(e) => submit(e, "company")}
        className="rounded-xl border bg-white p-5 space-y-4"
      >
        <h2 className="font-bold text-sm text-ink-900">بيانات الشركة</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["name", "اسم الشركة"],
            ["taxNumber", "الرقم الضريبي"],
            ["commercialReg", "السجل التجاري"],
          ].map(([name, label]) => (
            <Field key={name} label={label}>
              <input
                name={name}
                defaultValue={String(
                  data.company[name as keyof typeof data.company] || "",
                )}
                required={name === "name"}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
        <button disabled={busy} className={buttonClass}>
          حفظ بيانات الشركة
        </button>
      </form>

      {/* 2. Fiscal Periods */}
      <form
        onSubmit={(e) => submit(e, "period")}
        className="rounded-xl border bg-white p-5 space-y-4"
      >
        <h2 className="font-bold text-sm text-ink-900">فترة مالية جديدة</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="اسم الفترة">
            <input name="name" required className={inputClass} />
          </Field>
          <Field label="من">
            <input name="start" type="date" required className={inputClass} />
          </Field>
          <Field label="إلى">
            <input name="end" type="date" required className={inputClass} />
          </Field>
        </div>
        <button disabled={busy} className={buttonClass}>
          إضافة فترة
        </button>
      </form>

      <div className="rounded-xl border bg-white p-5 space-y-3">
        <h2 className="font-bold text-sm text-ink-900">الفترات المالية الحالية</h2>
        <p className="text-xs text-ink-600">
          الإقفال يرحّل تسوية مخزون آخر الفترة ويمنع القيود والحركات في هذا
          التاريخ وما قبله. راجع الجرد والمستندات أولاً.
        </p>
        {data.periods.map((p) => (
          <div key={p.id} className="flex justify-between items-center border-b pb-3 text-xs">
            <span>
              <strong>{p.name}</strong> ({p.start.slice(0, 10)} — {p.end.slice(0, 10)}) —{" "}
              <span className={p.isClosed ? "text-red-600 font-bold" : "text-green-700 font-bold"}>
                {p.isClosed ? "مقفلة" : "مفتوحة"}
              </span>
            </span>
            <button
              disabled={busy}
              className={buttonClass}
              onClick={() =>
                act({ action: p.isClosed ? "reopen" : "close", id: p.id })
              }
            >
              {p.isClosed ? "إعادة فتح" : "إقفال"}
            </button>
          </div>
        ))}
      </div>

      {/* 3. Cash Flow Classification */}
      <form
        onSubmit={mapping}
        className="rounded-xl border bg-white p-5 space-y-4"
      >
        <h2 className="font-bold text-sm text-ink-900">تصنيف حسابات التدفقات النقدية</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="كود الحساب التفصيلي">
            <input required name="accountCode" className={inputClass} />
          </Field>
          <Field label="التصنيف">
            <select name="cashFlow" className={inputClass}>
              {[
                ["CASH", "نقدية وبنوك"],
                ["OPERATING_ASSET", "أصل ضمن رأس المال العامل"],
                ["OPERATING_LIABILITY", "التزام ضمن رأس المال العامل"],
                ["NONCASH", "مصروف أو إيراد غير نقدي"],
                ["INVESTING", "استثماري"],
                ["FINANCING", "تمويلي"],
                ["", "بدون"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <button className={buttonClass}>حفظ التصنيف</button>
      </form>

      {/* 4. Users and Custom Permissions (Active Section) */}
      <div className="pt-2">
        <UserManagementView users={data.users || []} onRefresh={reload} />
      </div>
    </Workspace>
  );
}
