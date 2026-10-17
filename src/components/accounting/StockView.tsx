"use client";
import { EntryRow } from "./EntrySheet";
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
import { usePermissions } from "@/components/auth/PermissionsProvider";
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
  const { can, isAdmin } = usePermissions();
  const canMovement = (isAdmin || can("stock.movement")) && !readOnly;

  const [query, setQuery] = useState(""),
    [filterItem, setFilterItem] = useState(""),
    [filterWarehouse, setFilterWarehouse] = useState("");
  const records = useLoad<{ rows: RecordRow[] }>("/api/registers/items?lookup=true", {
      rows: [],
    }),
    warehouses = useLoad<{ rows: RecordRow[] }>("/api/registers/warehouses?lookup=true", {
      rows: [],
    });
  const centers = useLoad<{ rows: RecordRow[] }>(
    canMovement ? "/api/registers/cost-centers?lookup=true" : null,
    { rows: [] },
  );
  const accounts = useLoad<{
    accounts: {
      code: string;
      name: string;
      isGroup: boolean;
      isActive: boolean;
    }[];
  }>(canMovement ? "/api/accounts?flat=true&lookup=true" : null, { accounts: [] });
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
    unitCost: "",
    counterpart: "",
    reference: "",
    description: "",
    costCenter: "",
    costItem: "",
  });
  const [logistics, setLogistics] = useState<Record<string, string>>({
    shipment: "",
    truck: "",
    farm: "",
    pivot: "",
    color: "",
    notes: "",
  });
  const [weighed, setWeighed] = useState(false),
    [weights, setWeights] = useState({ weight: "0", tare: "0", bags: "0" });
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [key, setKey] = useState("");

  type PreviewData = {
    item: {
      id: string;
      code: string;
      name: string;
      unit: string;
    };
    warehouses: Array<{
      warehouse: string;
      name: string;
      quantity: string;
      hasPositiveBalance: boolean;
    }>;
    cost: {
      hasCostAccess: boolean;
      hasCostBasis: boolean;
      costBasisReason?: string;
      averageCost: string | null;
    };
  };

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const requestIdRef = React.useRef(0);

  const fetchPreview = React.useCallback(
    async (itemId: string, date: string) => {
      if (!itemId || !date) {
        setPreview(null);
        setPreviewError("");
        setLoadingPreview(false);
        return;
      }
      const currentReqId = ++requestIdRef.current;
      setLoadingPreview(true);
      setPreviewError("");

      try {
        const queryParams = new URLSearchParams({
          preview: "true",
          itemId,
          date,
        });
        if (coldOnly) {
          queryParams.set("warehouseType", "COLD_STORAGE");
        }
        const res = await fetch(`/api/stock?${queryParams.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "فشل جلب بيانات رصيد الصنف وتكلفته");
        }
        const data: PreviewData = await res.json();
        // Stale response check
        if (currentReqId !== requestIdRef.current) return;

        setPreview(data);

        // Auto-selection & validation logic for ISSUE
        if (form.kind === "ISSUE") {
          const eligible = data.warehouses.filter((w) => w.hasPositiveBalance);
          if (eligible.length === 1) {
            setForm((prev) => ({ ...prev, warehouse: eligible[0].warehouse }));
          } else if (eligible.length > 1) {
            setForm((prev) => {
              const stillValid = eligible.some(
                (w) => w.warehouse === prev.warehouse,
              );
              return stillValid ? prev : { ...prev, warehouse: "" };
            });
          } else {
            setForm((prev) => ({ ...prev, warehouse: "" }));
          }
        }
      } catch (e) {
        if (currentReqId !== requestIdRef.current) return;
        setPreviewError((e as Error).message || "خطأ أثناء جلب أرصدة المخازن");
      } finally {
        if (currentReqId === requestIdRef.current) {
          setLoadingPreview(false);
        }
      }
    },
    [coldOnly, form.kind],
  );

  React.useEffect(() => {
    if (form.kind === "ISSUE") {
      fetchPreview(form.itemId, form.date);
    } else {
      setPreview(null);
      setPreviewError("");
      setLoadingPreview(false);
    }
  }, [form.itemId, form.date, form.kind, fetchPreview]);

  const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const selectedItemRow = records.data.rows.find((r) => r.id === form.itemId);
  const currentItemUnit =
    preview?.item.unit || selectedItemRow?.data?.unit || "";

  const eligibleWarehouses = React.useMemo(() => {
    if (form.kind !== "ISSUE") return [];
    return (preview?.warehouses || []).filter((w) => w.hasPositiveBalance);
  }, [form.kind, preview]);

  const selectedWhBalance = React.useMemo(() => {
    if (form.kind !== "ISSUE" || !form.warehouse) return null;
    return (
      preview?.warehouses.find((w) => w.warehouse === form.warehouse) || null
    );
  }, [form.kind, form.warehouse, preview]);

  const availableQuantity = selectedWhBalance
    ? Number(selectedWhBalance.quantity)
    : 0;

  const netQuantity = weighed
    ? Math.max(0, (Number(weights.weight) || 0) - (Number(weights.tare) || 0))
    : Number(form.quantity) || 0;

  const projectedQuantity = availableQuantity - netQuantity;
  const isOverdrawn =
    form.kind === "ISSUE" &&
    Boolean(form.warehouse) &&
    netQuantity > availableQuantity;

  const isWeighUnitInvalid =
    weighed &&
    Boolean(currentItemUnit) &&
    currentItemUnit !== "kg" &&
    currentItemUnit !== "كجم";

  const averageCostValue =
    preview?.cost?.averageCost != null
      ? Number(preview.cost.averageCost)
      : null;

  const totalEstimatedCost =
    averageCostValue != null && netQuantity > 0
      ? (Math.round(netQuantity * averageCostValue * 100) / 100).toFixed(2)
      : null;

  const isSaveDisabled =
    busy ||
    (form.kind === "ISSUE" &&
      (loadingPreview ||
        Boolean(previewError) ||
        !form.itemId ||
        !form.warehouse ||
        eligibleWarehouses.length === 0 ||
        isOverdrawn ||
        netQuantity <= 0 ||
        isWeighUnitInvalid));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.kind === "ISSUE") {
      if (!form.warehouse) {
        setError("يجب اختيار المخزن للصرف");
        return;
      }
      if (isOverdrawn) {
        setError(
          `الكمية المطلوبة (${netQuantity}) تتجاوز الرصيد المتاح بالمخزن (${availableQuantity})`,
        );
        return;
      }
      if (netQuantity <= 0) {
        setError("الكمية يجب أن تكون أكبر من صفر");
        return;
      }
      if (isWeighUnitInvalid) {
        setError("إذن الوزن يتطلب صنفاً بوحدة كيلوجرام");
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      const requestKey = key || crypto.randomUUID();
      setKey(requestKey);
      await api("/api/stock", {
        ...form,
        unitCost: form.kind === "ISSUE" ? "0" : form.unitCost || "0",
        quantity: weighed ? "1" : form.quantity,
        logistics,
        ...(weighed ? { weigh: weights } : {}),
        requestKey,
      });
      setKey("");
      setMessage("تم تسجيل حركة المخزون بنجاح");
      setForm({
        ...form,
        quantity: "",
        unitCost: "",
        description: "",
        reference: "",
      });
      setWeights({ weight: "0", tare: "0", bags: "0" });
      setLogistics({
        shipment: "",
        truck: "",
        farm: "",
        pivot: "",
        color: "",
        notes: "",
      });
      await stock.reload();
      if (form.kind === "ISSUE" && form.itemId) {
        await fetchPreview(form.itemId, form.date);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Workspace
      title={title}
      error={error || stock.error || (canMovement ? accounts.error : "")}
      message={message}
    >
      {canMovement && (
        <form
          onSubmit={save}
          className="rounded-xl border bg-white p-5 space-y-4"
        >
          <EntryRow>
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
                onChange={(e) => {
                  set("itemId", e.target.value);
                  if (form.kind === "ISSUE") {
                    set("warehouse", "");
                  }
                }}
              >
                <option value="">اختر الصنف</option>
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
                disabled={
                  loadingPreview ||
                  (form.kind === "ISSUE" &&
                    Boolean(form.itemId) &&
                    preview != null &&
                    eligibleWarehouses.length === 0)
                }
                className={inputClass}
                value={form.warehouse}
                onChange={(e) => set("warehouse", e.target.value)}
              >
                {form.kind === "ISSUE" ? (
                  !form.itemId ? (
                    <option value="">اختر الصنف أولاً</option>
                  ) : loadingPreview ? (
                    <option value="">جاري فحص أرصدة المخازن...</option>
                  ) : previewError ? (
                    <option value="">تعذر جلب الأرصدة</option>
                  ) : eligibleWarehouses.length === 0 ? (
                    <option value="">
                      لا يوجد رصيد متاح لهذا الصنف في تاريخ الإذن
                    </option>
                  ) : (
                    <>
                      <option value="">اختر المخزن</option>
                      {eligibleWarehouses.map((w) => (
                        <option key={w.warehouse} value={w.warehouse}>
                          {w.name} ({w.warehouse}) — الرصيد: {w.quantity}{" "}
                          {currentItemUnit}
                        </option>
                      ))}
                    </>
                  )
                ) : (
                  <>
                    <option value="">اختر المخزن</option>
                    {warehouses.data.rows
                      .filter(
                        (r) => !coldOnly || r.data.type === "COLD_STORAGE",
                      )
                      .map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.name}
                        </option>
                      ))}
                  </>
                )}
              </select>
            </Field>

            <Field label="التاريخ">
              <input
                required
                className={inputClass}
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>

            <Field
              label={`الكمية بوحدة الصنف ${currentItemUnit ? `(${currentItemUnit})` : ""}`}
            >
              <input
                disabled={weighed}
                required={!weighed}
                className={inputClass}
                type="number"
                step="0.001"
                min="0"
                value={
                  weighed
                    ? String(
                        Math.max(
                          0,
                          (Number(weights.weight) || 0) -
                            (Number(weights.tare) || 0),
                        ),
                      )
                    : form.quantity
                }
                onChange={(e) => set("quantity", e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === "0") {
                    set("quantity", "");
                  }
                  e.target.select();
                }}
              />
            </Field>

            {form.kind === "ISSUE" && (
              <Field label="تكلفة الوحدة التقديرية">
                <input
                  readOnly
                  className={`${inputClass} bg-canvas cursor-not-allowed font-mono font-medium text-center`}
                  value={
                    loadingPreview
                      ? "جاري الحساب..."
                      : !preview?.cost?.hasCostAccess
                      ? "غير مصرح"
                      : !preview?.cost?.hasCostBasis
                      ? "غير متاح"
                      : `${Number(preview.cost.averageCost).toFixed(4)} ج.م`
                  }
                  title={
                    preview?.cost?.hasCostBasis
                      ? `متوسط تكلفة الفترة للصنف بالمنشأة: ${Number(preview.cost.averageCost).toFixed(4)} ج.م`
                      : preview?.cost?.costBasisReason || "لا يوجد أساس تكلفة"
                  }
                />
              </Field>
            )}

            {form.kind === "ISSUE" && (
              <Field label="إجمالي التكلفة التقديرية">
                <input
                  readOnly
                  className={`${inputClass} bg-canvas cursor-not-allowed font-mono font-bold text-green-800 text-center`}
                  value={
                    loadingPreview
                      ? "جاري الحساب..."
                      : !preview?.cost?.hasCostAccess
                      ? "غير مصرح"
                      : !preview?.cost?.hasCostBasis
                      ? "غير متاح"
                      : totalEstimatedCost != null
                      ? `${totalEstimatedCost} ج.م`
                      : "0.00 ج.م"
                  }
                  title={
                    totalEstimatedCost != null
                      ? `إجمالي تكلفة الصرف التقديرية = ${netQuantity} × ${Number(preview?.cost?.averageCost || 0).toFixed(4)}`
                      : "يتم احتساب الإجمالي التقديري تلقائياً بمجرد إدخال الكمية"
                  }
                />
              </Field>
            )}

            {form.kind !== "ISSUE" && (
              <Field label="تكلفة الوحدة للوارد">
                <input
                  className={inputClass}
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.unitCost}
                  onChange={(e) => set("unitCost", e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === "0") {
                      set("unitCost", "");
                    }
                    e.target.select();
                  }}
                />
              </Field>
            )}

            <Field label="رقم الإذن">
              <input
                className={inputClass}
                type="text"
                value={form.reference}
                onChange={(e) => set("reference", e.target.value)}
              />
            </Field>

            <Field label="البيان">
              <input
                required
                className={inputClass}
                type="text"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </EntryRow>

          {form.kind === "ISSUE" && (
            <div className="space-y-2 pt-1 border-t border-dashed">
              {loadingPreview && (
                <div className="text-xs text-ink-500 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-700 animate-pulse" />
                  <span>
                    جاري فحص أرصدة المخازن وتكلفة الصنف في تاريخ الإذن...
                  </span>
                </div>
              )}

              {previewError && (
                <div className="flex items-center justify-between p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  <span>{previewError}</span>
                  <button
                    type="button"
                    onClick={() => fetchPreview(form.itemId, form.date)}
                    className="underline font-bold hover:text-red-950 px-2 py-0.5"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}

              {form.itemId &&
                !loadingPreview &&
                !previewError &&
                preview &&
                eligibleWarehouses.length === 0 && (
                  <div className="p-2.5 bg-amber-50 text-amber-900 text-xs rounded-lg border border-amber-200 font-medium">
                    لا يوجد رصيد متاح لهذا الصنف في تاريخ الإذن ({form.date})
                  </div>
                )}

              {form.warehouse && selectedWhBalance && (
                <div className="flex flex-wrap items-center gap-4 text-xs bg-canvas/70 p-2.5 rounded-lg border border-border">
                  <span className="text-ink-600">
                    الرصيد المتاح بالمخزن المحدد:{" "}
                    <strong className="text-ink-900 font-mono">
                      {availableQuantity}
                    </strong>{" "}
                    {currentItemUnit}
                  </span>
                  <span
                    className={
                      isOverdrawn ? "text-red-700 font-bold" : "text-ink-600"
                    }
                  >
                    الرصيد المتوقع بعد الصرف:{" "}
                    <strong className="font-mono">
                      {projectedQuantity.toFixed(3)}
                    </strong>{" "}
                    {currentItemUnit}
                  </span>
                </div>
              )}

              {isOverdrawn && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 font-bold">
                  تنبيه: الكمية المطلوبة ({netQuantity} {currentItemUnit}) تتجاوز
                  الرصيد المتاح ({availableQuantity} {currentItemUnit}) في
                  المخزن المحدد.
                </div>
              )}

              {isWeighUnitInvalid && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 font-semibold">
                  تنبيه: إدخال الوزن والفارغ متاح فقط للأصناف المقاسة بالكيلوجرام
                  (وحدة الصنف الحالية: {currentItemUnit}).
                </div>
              )}

              <p className="text-[11px] text-ink-500">
                * التكلفة المعروضة تقديرية مبنية على متوسط الفترة حتى تاريخ
                المستند. تتحدد التكلفة النهائية وحساب الفروق عند إقفال المخزون
                الدوري، وقد تتغير بإضافة مستندات أو تكاليف أخرى ضمن الفترة.
              </p>
            </div>
          )}

          <EntryRow label="التوجيه المحاسبي ومراكز التكلفة">
            {form.kind !== "ISSUE" && (
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
            )}
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
          </EntryRow>
          <EntryRow label="تفاصيل إذن المخزن">
            {[
              ["shipment", "بوليصة الشحن"],
              ["truck", "رقم السيارة"],
              ["farm", "المزرعة"],
              ["pivot", "البيفت"],
              ["color", "اللون"],
              ["notes", "ملاحظات"],
            ].map(([k, label]) => (
              <Field key={k} label={label}>
                <input
                  className={inputClass}
                  value={logistics[k]}
                  onChange={(e) =>
                    setLogistics({ ...logistics, [k]: e.target.value })
                  }
                />
              </Field>
            ))}
          </EntryRow>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={weighed}
              onChange={(e) => setWeighed(e.target.checked)}
            />
            إدخال الوزن والفارغ بدل الكمية (كجم)
          </label>
          {weighed && (
            <EntryRow label="وزن إذن المخزن">
              {[
                ["bags", "العدد"],
                ["weight", "الوزن"],
                ["tare", "الفارغ"],
              ].map(([k, label]) => (
                <Field key={k} label={label}>
                  <input
                    className={inputClass}
                    required
                    min="0"
                    type="number"
                    step="0.001"
                    value={weights[k as keyof typeof weights]}
                    onChange={(e) =>
                      setWeights({ ...weights, [k]: e.target.value })
                    }
                  />
                </Field>
              ))}
              <Field label="القائم">
                <input
                  className={inputClass}
                  readOnly
                  value={
                    (Number(weights.weight) || 0) - (Number(weights.tare) || 0)
                  }
                />
              </Field>
            </EntryRow>
          )}
          <p className="text-sm text-ink-600">
            تقييم المخزون بمتوسط الفترة. تكلفة الوارد تسجل بالمستند؛ تكلفة
            الصادر وقيمة الباقي تحددان عند إقفال المخزون. حركة الصرف وحدها لا
            تنشئ قيد تكلفة قبل الإقفال.
          </p>
          <button disabled={isSaveDisabled} className={buttonClass}>
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
          warehouse:
            warehouses.data.rows.find((w) => w.code === r.warehouse)?.name ||
            r.warehouse,
          kind:
            (
              {
                OPENING: "افتتاحي",
                RECEIPT: "إضافة",
                ISSUE: "صرف",
                WASTE: "هالك",
                RETURN_IN: "مردود وارد",
                RETURN_OUT: "مردود صادر",
                COUNT_GAIN: "زيادة جرد",
                COUNT_LOSS: "عجز جرد",
              } as Record<string, string>
            )[String(r.kind)] || r.kind,
          ...(((r.metadata as Record<string, unknown>)?.logistics as Record<
            string,
            string
          >) || {}),
          ...(((r.metadata as Record<string, unknown>)?.stockWeigh as Record<
            string,
            string
          >) || {}),
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
          ["reference", "رقم الإذن"],
          ["shipment", "بوليصة الشحن"],
          ["truck", "رقم السيارة"],
          ["farm", "المزرعة"],
          ["pivot", "البيفت"],
          ["color", "اللون"],
          ["bags", "العدد"],
          ["weight", "الوزن"],
          ["tare", "الفارغ"],
          ["notes", "ملاحظات"],
        ].map(([key, label]) => ({ key, label }))}
      />
    </Workspace>
  );
}
