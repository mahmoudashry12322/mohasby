"use client";
import React, { useState } from "react";
import templates from "@/data/cost-templates.json";
import {
  api,
  buttonClass,
  Field,
  inputClass,
  useLoad,
  Workspace,
} from "./Workspace";

type Line = {
  accountCode: string;
  debit: string;
  credit: string;
  description: string;
  party: string;
  costCenter: string;
  costType: string;
  costItem: string;
  season: string;
  farm: string;
  pivot: string;
  cashFlow: string;
};
const emptyLine = (): Line => ({
  accountCode: "",
  debit: "0",
  credit: "0",
  description: "",
  party: "",
  costCenter: "",
  costType: "",
  costItem: "",
  season: "",
  farm: "",
  pivot: "",
  cashFlow: "",
});
type Account = {
  code: string;
  name: string;
  isGroup: boolean;
  isActive: boolean;
};
type Entry = {
  id: string;
  number: number;
  date: string;
  description: string;
  status: string;
  lines: (Line & { account: { name: string } })[];
};
export function JournalView({
  title,
  kind = "GENERAL",
}: {
  title: string;
  kind?: string;
}) {
  const accounts = useLoad<{ accounts: Account[] }>("/api/accounts?flat=true", {
    accounts: [],
  });
  const parties = useLoad<{ rows: { code: string; name: string }[] }>(
    "/api/registers/parties",
    { rows: [] },
  );
  const centers = useLoad<{ rows: { code: string; name: string }[] }>(
    "/api/registers/cost-centers",
    { rows: [] },
  );
  const employees = useLoad<{ rows: { code: string; name: string }[] }>(
    "/api/registers/employees",
    { rows: [] },
  );
  const [page, setPage] = useState(1);
  const entries = useLoad<{ entries: Entry[]; total: number }>(
    `/api/journal?page=${page}${kind === "GENERAL" ? "" : "&kind=" + kind}`,
    { entries: [], total: 0 },
  );
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [description, setDescription] = useState(""),
    [document, setDocument] = useState(""),
    [reference, setReference] = useState("");
  const [requestKey, setKey] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [dimensions, setDimensions] = useState(false);
  function change(i: number, field: keyof Line, value: string) {
    setLines((ls) =>
      ls.map((l, j) => (j === i ? { ...l, [field]: value } : l)),
    );
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const key = requestKey || crypto.randomUUID();
    setKey(key);
    try {
      const res = await api("/api/journal", {
        date,
        description,
        document,
        reference,
        kind,
        requestKey: key,
        lines,
      });
      setMessage(
        `تم حفظ المسودة رقم ${res.entry.number}. راجعها ثم اضغط ترحيل.`,
      );
      setLines([emptyLine(), emptyLine()]);
      setDescription("");
      setKey("");
      await entries.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function action(id: string, action: string) {
    let reversalDate: string | null = null;
    if (action === "reverse") {
      reversalDate = window.prompt(
        "تاريخ قيد العكس YYYY-MM-DD",
        new Date().toISOString().slice(0, 10),
      );
      if (!reversalDate) return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/api/journal/" + id, {
        action,
        ...(reversalDate ? { date: reversalDate } : {}),
      });
      setMessage("تم تنفيذ العملية");
      await entries.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const debit = lines.reduce((a, l) => a + (Number(l.debit) || 0), 0),
    credit = lines.reduce((a, l) => a + (Number(l.credit) || 0), 0),
    difference = debit - credit;
  return (
    <Workspace
      title={title}
      error={error || entries.error || accounts.error}
      message={message}
    >
      <datalist id="cost-item-labels">
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
        className="rounded-xl border border-border bg-white p-5 space-y-5 print:hidden"
      >
        <h2 className="font-bold text-lg">قيد جديد</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="التاريخ">
            <input
              required
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="البيان">
            <input
              required
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="نوع المستند">
            <input
              className={inputClass}
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />
          </Field>
          <Field label="رقم الإذن / المرجع">
            <input
              className={inputClass}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </Field>
        </div>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={dimensions}
            onChange={(e) => setDimensions(e.target.checked)}
          />
          إظهار الحساب التحليلي ومراكز التكلفة والموسم والتدفقات
        </label>
        <div className="space-y-3">
          {lines.map((l, i) => (
            <div
              key={i}
              className="rounded-lg border border-border p-3 space-y-3"
            >
              <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                <Field label={`الحساب — بند ${i + 1}`}>
                  <select
                    required
                    className={inputClass}
                    value={l.accountCode}
                    onChange={(e) => change(i, "accountCode", e.target.value)}
                  >
                    <option value="">اختر الحساب</option>
                    {accounts.data.accounts
                      .filter((a) => !a.isGroup && a.isActive)
                      .map((a) => (
                        <option value={a.code} key={a.code}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="مدين">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className={inputClass}
                    value={l.debit}
                    onChange={(e) => change(i, "debit", e.target.value)}
                  />
                </Field>
                <Field label="دائن">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className={inputClass}
                    value={l.credit}
                    onChange={(e) => change(i, "credit", e.target.value)}
                  />
                </Field>
                <button
                  type="button"
                  disabled={lines.length <= 2}
                  className="self-end p-2 text-red-700 disabled:opacity-30"
                  onClick={() => setLines(lines.filter((_, j) => i !== j))}
                >
                  حذف البند
                </button>
              </div>
              {dimensions && (
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="العميل / المورد / الشريك">
                    <select
                      className={inputClass}
                      value={l.party}
                      onChange={(e) => change(i, "party", e.target.value)}
                    >
                      <option value="">بدون</option>
                      {[...parties.data.rows, ...employees.data.rows].map(
                        (p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Field label="مركز التكلفة">
                    <select
                      className={inputClass}
                      value={l.costCenter}
                      onChange={(e) => change(i, "costCenter", e.target.value)}
                    >
                      <option value="">بدون</option>
                      {centers.data.rows.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {[
                    ["costType", "توجيه التكاليف"],
                    ["costItem", "بند التكلفة"],
                    ["season", "الموسم"],
                    ["farm", "المزرعة"],
                    ["pivot", "البيفت"],
                    ["description", "بيان البند"],
                  ].map(([key, label]) => (
                    <Field key={key} label={label}>
                      <input
                        list={
                          key === "costItem" ? "cost-item-labels" : undefined
                        }
                        className={inputClass}
                        value={l[key as keyof Line]}
                        onChange={(e) =>
                          change(i, key as keyof Line, e.target.value)
                        }
                      />
                    </Field>
                  ))}
                  <Field label="تصنيف التدفق النقدي">
                    <select
                      className={inputClass}
                      value={l.cashFlow}
                      onChange={(e) => change(i, "cashFlow", e.target.value)}
                    >
                      <option value="">بدون</option>
                      <option value="OPERATING">تشغيلي</option>
                      <option value="INVESTING">استثماري</option>
                      <option value="FINANCING">تمويلي</option>
                    </select>
                  </Field>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            className="rounded-lg border p-2"
            onClick={() => setLines([...lines, emptyLine()])}
          >
            + إضافة بند
          </button>
          <div className="tabular-nums text-sm">
            مدين: {debit.toFixed(2)} — دائن: {credit.toFixed(2)} — الفرق:{" "}
            {difference.toFixed(2)}
          </div>
          <button disabled={busy} className={buttonClass}>
            {busy ? "جارٍ الحفظ…" : "حفظ مسودة"}
          </button>
        </div>
      </form>
      <div className="space-y-4">
        <h2 className="font-bold text-lg">
          القيود المسجلة ({entries.data.total})
        </h2>
        {entries.loading && <p>جارٍ التحميل…</p>}
        {entries.data.entries.map((e) => (
          <details
            key={e.id}
            className="rounded-xl border border-border bg-white p-4"
          >
            <summary className="cursor-pointer font-semibold">
              #{e.number} — {e.date.slice(0, 10)} — {e.description}{" "}
              <span className="mr-3 text-green-700">
                {e.status === "POSTED"
                  ? "مرحل"
                  : e.status === "VOID"
                    ? "ملغى"
                    : "مسودة"}
              </span>
            </summary>
            <div className="overflow-x-auto py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>الحساب</th>
                    <th>مدين</th>
                    <th>دائن</th>
                  </tr>
                </thead>
                <tbody>
                  {e.lines.map((l, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">
                        {l.accountCode} — {l.account.name}
                      </td>
                      <td>{l.debit}</td>
                      <td>{l.credit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 print:hidden">
              {e.status === "DRAFT" && (
                <>
                  <button
                    disabled={busy}
                    className={buttonClass}
                    onClick={() => action(e.id, "post")}
                  >
                    ترحيل
                  </button>
                  <button
                    disabled={busy}
                    className="rounded-lg border px-4 py-2"
                    onClick={() => action(e.id, "void")}
                  >
                    إلغاء المسودة
                  </button>
                </>
              )}
              {e.status === "POSTED" && (
                <button
                  disabled={busy}
                  className="rounded-lg border px-4 py-2"
                  onClick={() => action(e.id, "reverse")}
                >
                  إنشاء قيد عكسي
                </button>
              )}
            </div>
          </details>
        ))}
        <div className="flex gap-3">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            السابق
          </button>
          <span>{page}</span>
          <button
            disabled={page * 50 >= entries.data.total}
            onClick={() => setPage(page + 1)}
          >
            التالي
          </button>
        </div>
      </div>
    </Workspace>
  );
}
