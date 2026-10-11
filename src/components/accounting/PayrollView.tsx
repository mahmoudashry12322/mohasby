"use client";
import React, { useState } from "react";
import {
  api,
  buttonClass,
  Field,
  inputClass,
  useLoad,
  Workspace,
  DataTable,
} from "./Workspace";

const movementFields = [
  ["advance", "سلف"],
  ["absenceDays", "غياب (أيام)"],
  ["deductionDays", "خصومات (أيام)"],
  ["insurance", "تامينات اجتماعية"],
  ["allowances", "بدلات"],
  ["bonusDays", "مكافات : حوافز (أيام)"],
  ["overtimeDays", "اضافى بالايام"],
  ["overtimeHours", "اضافى بالساعة"],
] as const;
const columns = [
  ["code", "كود الموظف"],
  ["name", "اسم الموظف"],
  ["job", "الوظيفة"],
  ["basic", "الراتب الاساسى"],
  ["daily", "اجر اليوم"],
  ["hourly", "اجر الساعة"],
  ["allowances", "بدلات"],
  ["bonus", "حوافز"],
  ["overtimeDays", "اضافى بالايام"],
  ["overtimeHours", "اضافى بالساعة"],
  ["gross", "اجمالى الاستحقاقات"],
  ["advances", "سلف"],
  ["absence", "غياب"],
  ["deductions", "خصومات"],
  ["insurance", "تامينات اجتماعية"],
  ["withheld", "اجمالى الاستقطاعات"],
  ["net", "صافى الراتب المستحق"],
].map(([key, label]) => ({ key, label }));
export function PayrollView({ title, view }: { title: string; view: string }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)),
    [employee, setEmployee] = useState(""),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [cashAccount, setCashAccount] = useState("");
  const [fields, setFields] = useState<Record<string, string>>(
      Object.fromEntries(movementFields.map(([key]) => [key, "0"])),
    ),
    [key, setKey] = useState(() => crypto.randomUUID()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const {
    data,
    reload,
    error: loadError,
  } = useLoad<{ rows: Record<string, any>[]; totals: Record<string, string> }>(
    "/api/payroll?month=" + month,
    { rows: [], totals: {} },
  );
  const accounts = useLoad<{
    accounts: { code: string; name: string; isGroup: boolean }[];
  }>("/api/accounts?flat=true", { accounts: [] });
  const rows = data.rows.filter((r) => !employee || r.code === employee);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/payroll", {
        action: "movement",
        employee,
        date,
        cashAccount,
        requestKey: key,
        ...fields,
      });
      setKey(crypto.randomUUID());
      setMonth(date.slice(0, 7));
      setMessage("تم حفظ حركة المرتب");
      setFields(Object.fromEntries(movementFields.map(([k]) => [k, "0"])));
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function post(code: string) {
    if (!window.confirm("ترحيل استحقاق مرتب الشهر وإقفال تعديل حركاته؟"))
      return;
    setBusy(true);
    setError("");
    try {
      await api("/api/payroll", { action: "post", employee: code, month });
      setMessage("تم ترحيل استحقاق المرتب");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function voidMovement(id: string) {
    if (!window.confirm("إلغاء الحركة وعكس سلفتها إن وجدت؟")) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/payroll", { action: "void-movement", id });
      setMessage("تم إلغاء الحركة");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Workspace title={title} error={error || loadError} message={message}>
      <div className="flex flex-wrap gap-4 print:hidden">
        <Field label="الشهر والسنة">
          <input
            className={inputClass}
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </Field>
        <Field label="الموظف">
          <select
            className={inputClass}
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
          >
            <option value="">كل الموظفين</option>
            {data.rows.map((r) => (
              <option key={r.code} value={r.code}>
                {r.code} — {r.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {view === "journal" && (
        <form
          onSubmit={save}
          className="rounded-xl border bg-white p-5 space-y-4 print:hidden"
        >
          <h2 className="font-bold">إضافة حركة مرتبات</h2>
          <p className="text-sm">
            أجر اليوم = الأساسي ÷ 30، وأجر الساعة = أجر اليوم ÷ 8. السلفة تُرحّل
            إلى الدفاتر عند الحفظ.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="تاريخ الحركة">
              <input
                required
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            {movementFields.map(([k, label]) => (
              <Field key={k} label={label}>
                <input
                  required
                  min="0"
                  step="0.000001"
                  type="number"
                  className={inputClass}
                  value={fields[k]}
                  onChange={(e) =>
                    setFields({ ...fields, [k]: e.target.value })
                  }
                />
              </Field>
            ))}
            <Field label="حساب صرف السلفة">
              <select
                className={inputClass}
                value={cashAccount}
                onChange={(e) => setCashAccount(e.target.value)}
              >
                <option value="">اختر عند صرف سلفة</option>
                {accounts.data.accounts
                  .filter((a) => !a.isGroup)
                  .map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} — {a.name}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
          <button className={buttonClass} disabled={busy || !employee}>
            حفظ حركة المرتب
          </button>
        </form>
      )}
      {view === "payslip" && !employee ? (
        <p>اختر الموظف لعرض مفردات راتبه وحركات الشهر.</p>
      ) : (
        <>
          <DataTable rows={rows} columns={columns} />
          {rows.map((row) => (
            <section
              key={row.code}
              className="rounded-xl border bg-white p-4 space-y-3"
            >
              <h2 className="font-bold">
                {row.name} — {month}
              </h2>
              {view !== "statement" && (
                <>
                  <DataTable
                    rows={row.movements || []}
                    columns={[
                      { key: "date", label: "التاريخ" },
                      ...movementFields.map(([key, label]) => ({ key, label })),
                    ]}
                  />
                  {!row.entryId && (
                    <div className="flex flex-wrap gap-3 print:hidden">
                      {(row.movements || []).map(
                        (movement: Record<string, string>) => (
                          <button
                            key={movement.id}
                            disabled={busy}
                            className="rounded-lg border px-3 py-2 text-sm"
                            onClick={() => voidMovement(movement.id)}
                          >
                            إلغاء حركة {movement.date}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                  <h3 className="font-semibold">السلف من القيود المرحلة</h3>
                  <DataTable
                    rows={row.advanceLines || []}
                    columns={[
                      { key: "date", label: "التاريخ" },
                      { key: "number", label: "رقم القيد" },
                      { key: "amount", label: "سلف" },
                    ]}
                  />
                </>
              )}
              <div className="print:hidden">
                {row.entryId ? (
                  <span role="status">استحقاق المرتب مرحل</span>
                ) : (
                  <button
                    className={buttonClass}
                    disabled={busy}
                    onClick={() => post(row.code)}
                  >
                    ترحيل استحقاق المرتب
                  </button>
                )}
              </div>
            </section>
          ))}
        </>
      )}
    </Workspace>
  );
}
