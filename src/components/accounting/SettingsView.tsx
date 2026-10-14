"use client";
import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  api,
  buttonClass,
  Field,
  inputClass,
  useLoad,
  Workspace,
} from "./Workspace";
import { UserManagementView, ManagedUser } from "./UserManagementView";
import {
  Users,
  Buildings,
  CalendarBlank,
  TrendUp,
} from "@phosphor-icons/react";

type Period = {
  id: string;
  name: string;
  start: string;
  end: string;
  isClosed: boolean;
};

export function SettingsView() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const {
    data,
    error: loadError,
    reload,
  } = useLoad<{
    company: { name: string; taxNumber?: string; commercialReg?: string };
    periods: Period[];
    users: ManagedUser[];
  }>("/api/settings", { company: { name: "" }, periods: [], users: [] });

  const [activeTab, setActiveTab] = useState<"users" | "company" | "periods" | "cashFlow">("users");
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const target = hash || tabParam;
      if (target === "company" || target === "periods" || target === "cashFlow" || target === "users") {
        setActiveTab(target as any);
      }
    }
  }, []);

  async function act(input: unknown) {
    setBusy(true);
    setError("");
    try {
      await api("/api/settings", input);
      setMessage("تم الحفظ بنجاح");
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
      setMessage(isAr ? "تم حفظ تصنيف التدفقات" : "Cash flow mapping saved");
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

  const tabs = [
    {
      id: "users" as const,
      label: isAr ? "المستخدمون والصلاحيات" : "Users & Permissions",
      icon: Users,
      badge: data.users ? data.users.length : undefined,
    },
    {
      id: "company" as const,
      label: isAr ? "بيانات الشركة" : "Company Profile",
      icon: Buildings,
    },
    {
      id: "periods" as const,
      label: isAr ? "الفترات المالية" : "Fiscal Periods",
      icon: CalendarBlank,
      badge: data.periods ? data.periods.length : undefined,
    },
    {
      id: "cashFlow" as const,
      label: isAr ? "تصنيف التدفقات" : "Cash Flow Mapping",
      icon: TrendUp,
    },
  ];

  return (
    <Workspace
      title={isAr ? "إعدادات المنشأة والمستخدمين والصلاحيات" : "Company Settings, Users & Permissions"}
      error={error || loadError}
      message={message}
    >
      {/* Navigation Tabs */}
      <div className="flex border-b border-border mb-6 gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (typeof window !== "undefined") {
                  window.history.replaceState(null, "", `#${tab.id}`);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-green-700 text-green-800 bg-green-50/70"
                  : "border-transparent text-ink-600 hover:text-ink-900 hover:bg-canvas/80"
              }`}
            >
              <Icon size={16} className={isActive ? "text-green-700" : "text-ink-400"} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive
                      ? "bg-green-700 text-white"
                      : "bg-surface-subtle text-ink-600"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Users and Custom Permissions (Active Default) */}
      {activeTab === "users" && (
        <div id="users" className="pt-1">
          <UserManagementView users={data.users || []} onRefresh={reload} />
        </div>
      )}

      {/* Tab 2: Company Information */}
      {activeTab === "company" && (
        <form
          key={data.company.name}
          onSubmit={(e) => submit(e, "company")}
          className="rounded-xl border bg-white p-5 space-y-4 max-w-4xl"
        >
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Buildings size={18} className="text-green-700" />
            <h2 className="font-bold text-sm text-ink-900">
              {isAr ? "بيانات المنشأة والنشاط" : "Company Information"}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["name", isAr ? "اسم الشركة" : "Company Name"],
              ["taxNumber", isAr ? "الرقم الضريبي" : "Tax Number"],
              ["commercialReg", isAr ? "السجل التجاري" : "Commercial Reg"],
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
            {isAr ? "حفظ بيانات الشركة" : "Save Company Info"}
          </button>
        </form>
      )}

      {/* Tab 3: Fiscal Periods */}
      {activeTab === "periods" && (
        <div className="space-y-6 max-w-4xl">
          <form
            onSubmit={(e) => submit(e, "period")}
            className="rounded-xl border bg-white p-5 space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <CalendarBlank size={18} className="text-green-700" />
              <h2 className="font-bold text-sm text-ink-900">
                {isAr ? "إضافة فترة مالية جديدة" : "New Fiscal Period"}
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label={isAr ? "اسم الفترة" : "Period Name"}>
                <input name="name" required className={inputClass} placeholder="2026" />
              </Field>
              <Field label={isAr ? "من" : "From"}>
                <input name="start" type="date" required className={inputClass} />
              </Field>
              <Field label={isAr ? "إلى" : "To"}>
                <input name="end" type="date" required className={inputClass} />
              </Field>
            </div>
            <button disabled={busy} className={buttonClass}>
              {isAr ? "إضافة فترة" : "Add Period"}
            </button>
          </form>

          <div className="rounded-xl border bg-white p-5 space-y-3">
            <h2 className="font-bold text-sm text-ink-900">
              {isAr ? "الفترات المالية الحالية" : "Current Fiscal Periods"}
            </h2>
            <p className="text-xs text-ink-600">
              {isAr
                ? "الإقفال يرحّل تسوية مخزون آخر الفترة ويمنع القيود والحركات في هذا التاريخ وما قبله. راجع الجرد والمستندات أولاً."
                : "Closing carries forward inventory adjustment and prevents alterations on or before this date."}
            </p>
            {data.periods.length === 0 ? (
              <p className="text-xs text-ink-400 py-4 text-center">
                {isAr ? "لا توجد فترات مالية مسجلة بعد" : "No fiscal periods recorded yet"}
              </p>
            ) : (
              data.periods.map((p) => (
                <div key={p.id} className="flex justify-between items-center border-b pb-3 text-xs">
                  <span>
                    <strong>{p.name}</strong> ({p.start.slice(0, 10)} — {p.end.slice(0, 10)}) —{" "}
                    <span className={p.isClosed ? "text-red-600 font-bold" : "text-green-700 font-bold"}>
                      {p.isClosed ? (isAr ? "مقفلة" : "Closed") : (isAr ? "مفتوحة" : "Open")}
                    </span>
                  </span>
                  <button
                    disabled={busy}
                    className={buttonClass}
                    onClick={() =>
                      act({ action: p.isClosed ? "reopen" : "close", id: p.id })
                    }
                  >
                    {p.isClosed ? (isAr ? "إعادة فتح" : "Reopen") : (isAr ? "إقفال" : "Close")}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Cash Flow Classification */}
      {activeTab === "cashFlow" && (
        <form
          onSubmit={mapping}
          className="rounded-xl border bg-white p-5 space-y-4 max-w-4xl"
        >
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <TrendUp size={18} className="text-green-700" />
            <h2 className="font-bold text-sm text-ink-900">
              {isAr ? "تصنيف حسابات التدفقات النقدية" : "Cash Flow Accounts Classification"}
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={isAr ? "كود الحساب التفصيلي" : "Account Code"}>
              <input required name="accountCode" className={inputClass} placeholder="101" />
            </Field>
            <Field label={isAr ? "التصنيف" : "Classification"}>
              <select name="cashFlow" className={inputClass}>
                {[
                  ["CASH", isAr ? "نقدية وبنوك" : "Cash & Banks"],
                  ["OPERATING_ASSET", isAr ? "أصل ضمن رأس المال العامل" : "Operating Asset"],
                  ["OPERATING_LIABILITY", isAr ? "التزام ضمن رأس المال العامل" : "Operating Liability"],
                  ["NONCASH", isAr ? "مصروف أو إيراد غير نقدي" : "Non-cash"],
                  ["INVESTING", isAr ? "استثماري" : "Investing"],
                  ["FINANCING", isAr ? "تمويلي" : "Financing"],
                  ["", isAr ? "بدون" : "None"],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button className={buttonClass}>
            {isAr ? "حفظ التصنيف" : "Save Mapping"}
          </button>
        </form>
      )}
    </Workspace>
  );
}
