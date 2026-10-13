"use client";
import React, { useState } from "react";
import { EntrySheet } from "./EntrySheet";
import { journalIssues } from "@/lib/accounting/entry-validation";
import { useJournalDraft } from "./useJournalDraft";
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
  debit: "",
  credit: "",
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
  tools,
}: {
  title: string;
  kind?: string;
  tools?: React.ReactNode;
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
    [dimensions, setDimensions] = useState(false),
    [advancedDimensions, setAdvancedDimensions] = useState(false),
    [fitScreen, setFitScreen] = useState(true);
  const validation = journalIssues(lines);
  const [attempted, setAttempted] = useState(false);
  const draft = useJournalDraft(
    kind,
    { date, description, document, reference, requestKey, lines },
    (value) => {
      setDate(value.date);
      setDescription(value.description);
      setDocument(value.document);
      setReference(value.reference);
      setKey(value.requestKey);
      setLines(
        value.lines.map((l) => ({
          ...l,
          debit: l.debit === "0" ? "" : (l.debit ?? ""),
          credit: l.credit === "0" ? "" : (l.credit ?? ""),
        })),
      );
    },
  );
  function change(i: number, field: keyof Line, value: string) {
    setLines((ls) =>
      ls.map((l, j) => (j === i ? { ...l, [field]: value } : l)),
    );
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    setMessage("");
    if (
      !date ||
      !description.trim() ||
      Object.keys(validation.issues).length ||
      !validation.balanced
    ) {
      setError(
        !date || !description.trim()
          ? "أكمل التاريخ والبيان أولًا. الإدخال محفوظ مؤقتًا في هذا التبويب."
          : Object.keys(validation.issues).length
            ? "راجع السطور المحددة أسفل الحسابات. البيانات لم تُحفظ في الدفاتر."
            : "القيد غير متوازن: إجمالي المدين لازم يساوي إجمالي الدائن. أكمل القيد ثم احفظه.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const key = requestKey || crypto.randomUUID();
      setKey(key);
      const res = await api("/api/journal", {
        date,
        description,
        document,
        reference,
        kind,
        requestKey: key,
        lines: lines.map((l) => ({
          ...l,
          debit: l.debit.trim() || "0",
          credit: l.credit.trim() || "0",
        })),
      });
      setMessage(
        `تم حفظ المسودة رقم ${res.entry.number}. راجعها ثم اضغط ترحيل.`,
      );
      setLines([emptyLine(), emptyLine()]);
      setDescription("");
      setDocument("");
      setReference("");
      setAttempted(false);
      draft.clearNotice();
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
      {tools}
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
        noValidate
        className="rounded-xl border border-border bg-white p-5 space-y-5 print:hidden"
      >
        <h2 className="font-bold text-lg">قيد جديد</h2>
        <p className="text-sm text-ink-600">
          كل صف طرف في القيد. اختر الحساب ثم اكتب المبلغ في المدين أو الدائن.
          الحفظ ينشئ مسودة؛ الترحيل بعد المراجعة هو ما يؤثر في التقارير.
        </p>
        {draft.notice && (
          <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm">
            {draft.notice}
          </p>
        )}
        <fieldset disabled={busy || !draft.ready} className="min-w-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Field label="التاريخ">
              <input
                required
                type="date"
                className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-green-700 h-9"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="البيان">
              <input
                required
                className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-green-700 h-9"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Field label="نوع المستند">
              <input
                className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-green-700 h-9"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
              />
            </Field>
            <Field label="رقم الإذن / المرجع">
              <input
                className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-green-700 h-9"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Field>
          </div>
          {/* Smart Dimensions & Fit Screen Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-green-50/70 border border-green-200/70 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-green-900">أبعاد القيد:</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-ink-800 hover:text-green-900 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={dimensions}
                  onChange={(e) => setDimensions(e.target.checked)}
                  className="rounded text-green-700 focus:ring-green-600 w-4 h-4 cursor-pointer"
                />
                الحساب التحليلي ومراكز التكلفة
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-ink-800 hover:text-green-900 font-medium select-none">
                <input
                  type="checkbox"
                  checked={advancedDimensions}
                  onChange={(e) => setAdvancedDimensions(e.target.checked)}
                  className="rounded text-green-700 focus:ring-green-600 w-4 h-4 cursor-pointer"
                />
                تفاصيل التكاليف والزراعة (الموسم، المزرعة، البيفت، التدفقات)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFitScreen(!fitScreen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                  fitScreen
                    ? "bg-green-700 text-white border-green-800 ring-2 ring-green-600/30"
                    : "bg-white text-ink-700 border-border hover:bg-neutral-50"
                }`}
                title={
                  fitScreen
                    ? "الجدول مضبوط لملء عرض الشاشة بدون شريط تمرير أفقي"
                    : "التبديل إلى وضع العرض الممتد مع شريط تمرير أفقي"
                }
              >
                <span>{fitScreen ? "⛶ ملاءمة عرض الشاشة (بدون تمرير)" : "↔ عرض ممتد (شريط تمرير)"}</span>
              </button>
            </div>
          </div>

          <EntrySheet
            fitScreen={fitScreen}
            compact={fitScreen}
            label={
              kind === "OPENING"
                ? "جدول الأرصدة الافتتاحية"
                : "جدول قيد اليومية"
            }
          >
            <thead>
              <tr className={fitScreen ? "text-xs" : ""}>
                <th scope="col" className={fitScreen ? "w-7 px-1 text-center font-bold" : ""}>م</th>
                <th scope="col" className={fitScreen ? "min-w-[120px] font-bold" : ""}>رقم الحساب / اسم الحساب</th>
                {dimensions && (
                  <>
                    <th scope="col" className={fitScreen ? "min-w-[90px] font-bold" : ""}>الحساب التحليلي</th>
                    <th scope="col" className={fitScreen ? "min-w-[85px] font-bold" : ""}>مركز التكلفة</th>
                  </>
                )}
                {advancedDimensions && (
                  <>
                    {[
                      ["costType", "توجيه التكاليف", "min-w-[68px]"],
                      ["costItem", "بند التكلفة", "min-w-[68px]"],
                      ["season", "الموسم", "min-w-[58px]"],
                      ["farm", "المزرعة", "min-w-[58px]"],
                      ["pivot", "البيفت", "min-w-[50px]"],
                    ].map(([key, label, w]) => (
                      <th key={key} scope="col" className={fitScreen ? `${w} font-bold` : ""}>
                        {label}
                      </th>
                    ))}
                    <th scope="col" className={fitScreen ? "min-w-[68px] font-bold" : ""}>التدفق النقدي</th>
                  </>
                )}
                <th scope="col" className={fitScreen ? "min-w-[85px] font-bold" : ""}>البيان / ملاحظات</th>
                <th scope="col" className={fitScreen ? "min-w-[62px] text-center font-bold" : ""}>مدين</th>
                <th scope="col" className={fitScreen ? "min-w-[62px] text-center font-bold" : ""}>دائن</th>
                <th scope="col" className={fitScreen ? "w-7 px-0.5 text-center font-bold" : ""}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="computed text-center align-middle font-mono font-medium text-xs">{i + 1}</td>
                  <td className={fitScreen ? "min-w-[120px]" : "min-w-64"}>
                    <select
                      aria-label={`الحساب — بند ${i + 1}`}
                      aria-invalid={attempted && !!validation.issues[i]}
                      aria-describedby={
                        attempted && validation.issues[i]
                          ? `line-error-${i}`
                          : undefined
                      }
                      required
                      className={
                        fitScreen
                          ? "w-full rounded border border-border bg-white px-1 py-1 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-green-700 h-8"
                          : inputClass
                      }
                      value={l.accountCode}
                      onChange={(e) => change(i, "accountCode", e.target.value)}
                    >
                      <option value="">اختر الحساب بالاسم أو الكود</option>
                      {accounts.data.accounts
                        .filter((a) => !a.isGroup && a.isActive)
                        .map((a) => (
                          <option key={a.code} value={a.code}>
                            {a.name} — {a.code}
                          </option>
                        ))}
                    </select>
                    {attempted && validation.issues[i] && (
                      <p
                        id={`line-error-${i}`}
                        className="mt-0.5 text-[10px] text-red-700 font-semibold"
                      >
                        سطر {i + 1}: {validation.issues[i]}
                      </p>
                    )}
                  </td>
                  {dimensions && (
                    <>
                      <td className={fitScreen ? "min-w-[90px]" : "min-w-48"}>
                        <select
                          aria-label={`الحساب التحليلي — بند ${i + 1}`}
                          className={
                            fitScreen
                              ? "w-full rounded border border-border bg-white px-1 py-1 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-green-700 h-8"
                              : inputClass
                          }
                          value={l.party}
                          onChange={(e) => change(i, "party", e.target.value)}
                        >
                          <option value="">بدون</option>
                          {[...parties.data.rows, ...employees.data.rows].map(
                            (p, j) => (
                              <option key={p.code + j} value={p.code}>
                                {p.name} — {p.code}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                      <td className={fitScreen ? "min-w-[85px]" : "min-w-48"}>
                        <select
                          aria-label={`مركز التكلفة — بند ${i + 1}`}
                          className={
                            fitScreen
                              ? "w-full rounded border border-border bg-white px-1 py-1 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-green-700 h-8"
                              : inputClass
                          }
                          value={l.costCenter}
                          onChange={(e) =>
                            change(i, "costCenter", e.target.value)
                          }
                        >
                          <option value="">بدون</option>
                          {centers.data.rows.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </>
                  )}
                  {advancedDimensions && (
                    <>
                      {[
                        ["costType", "توجيه التكاليف", "min-w-[68px]"],
                        ["costItem", "بند التكلفة", "min-w-[68px]"],
                        ["season", "الموسم", "min-w-[58px]"],
                        ["farm", "المزرعة", "min-w-[58px]"],
                        ["pivot", "البيفت", "min-w-[50px]"],
                      ].map(([key, label, w]) => (
                        <td className={fitScreen ? w : "min-w-40"} key={key}>
                          <input
                            aria-label={`${label} — بند ${i + 1}`}
                            list={
                              key === "costItem"
                                ? "cost-item-labels"
                                : undefined
                            }
                            className={
                              fitScreen
                                ? "w-full rounded border border-border bg-white px-1 py-1 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-green-700 h-8"
                                : inputClass
                            }
                            value={l[key as keyof Line]}
                            onChange={(e) =>
                              change(i, key as keyof Line, e.target.value)
                            }
                          />
                        </td>
                      ))}
                      <td className={fitScreen ? "min-w-[68px]" : "min-w-40"}>
                        <select
                          aria-label={`تصنيف التدفق النقدي — بند ${i + 1}`}
                          className={
                            fitScreen
                              ? "w-full rounded border border-border bg-white px-1 py-1 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-green-700 h-8"
                              : inputClass
                          }
                          value={l.cashFlow}
                          onChange={(e) =>
                            change(i, "cashFlow", e.target.value)
                          }
                        >
                          <option value="">بدون</option>
                          <option value="OPERATING">تشغيلي</option>
                          <option value="INVESTING">استثماري</option>
                          <option value="FINANCING">تمويلي</option>
                        </select>
                      </td>
                    </>
                  )}
                  <td className={fitScreen ? "min-w-[85px]" : "min-w-52"}>
                    <input
                      aria-label={`بيان البند ${i + 1}`}
                      className={
                        fitScreen
                          ? "w-full rounded border border-border bg-white px-1.5 py-1 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-green-700 h-8"
                          : inputClass
                      }
                      value={l.description}
                      onChange={(e) => change(i, "description", e.target.value)}
                    />
                  </td>
                  {(["debit", "credit"] as const).map((key) => (
                    <td className={fitScreen ? "min-w-[62px]" : "min-w-36"} key={key}>
                      <input
                        aria-label={key === "debit" ? "مدين" : "دائن"}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder=""
                        className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          fitScreen
                            ? "w-full rounded border border-border bg-white px-1 py-1 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-green-700 h-8 text-center font-mono"
                            : inputClass
                        }`}
                        value={l[key] === "0" ? "" : (l[key] ?? "")}
                        onChange={(e) => change(i, key, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className={fitScreen ? "w-8 text-center align-middle" : ""}>
                    <button
                      type="button"
                      disabled={lines.length <= 2}
                      className={
                        fitScreen
                          ? "inline-flex items-center justify-center w-7 h-7 rounded text-red-600 hover:bg-red-50 hover:text-red-800 disabled:opacity-20 font-bold text-sm transition-colors"
                          : "whitespace-nowrap p-2 text-red-700 disabled:opacity-30"
                      }
                      title={`حذف البند ${i + 1}`}
                      aria-label={`حذف البند ${i + 1}`}
                      onClick={() => setLines(lines.filter((_, j) => i !== j))}
                    >
                      {fitScreen ? "✕" : "حذف البند"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </EntrySheet>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-ink-800 hover:bg-neutral-50 shadow-sm transition-all"
              disabled={lines.length >= 500}
              onClick={() => setLines([...lines, emptyLine()])}
            >
              + إضافة بند
            </button>
            <div
              className={`tabular-nums text-xs px-3 py-1.5 rounded-lg font-mono font-semibold border ${
                Math.abs(difference) < 0.001
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-amber-50 text-amber-900 border-amber-200"
              }`}
            >
              مدين: {debit.toFixed(2)} — دائن: {credit.toFixed(2)} — الفرق:{" "}
              {difference.toFixed(2)}
            </div>
            <button
              type="submit"
              disabled={busy || !draft.ready}
              className={`${buttonClass} px-4 py-1.5 text-xs font-semibold shadow-sm`}
            >
              {busy ? "جارٍ الحفظ…" : "حفظ مسودة"}
            </button>
          </div>
        </fieldset>
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
