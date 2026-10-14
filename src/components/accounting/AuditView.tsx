"use client";

import React, { useState, useMemo } from "react";
import { useLoad, Workspace } from "./Workspace";
import { useLocale } from "next-intl";
import {
  MagnifyingGlass,
  Clock,
  User as UserIcon,
  CaretRight,
  CaretLeft,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  FileText,
  Tag,
  ArrowsLeftRight,
} from "@phosphor-icons/react";

const ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  ENTRY_CREATED: { ar: "إنشاء مسودة قيد", en: "Draft entry created" },
  ENTRY_CREATED_POSTED: { ar: "إنشاء وترحيل قيد", en: "Entry created & posted" },
  ENTRY_POSTED: { ar: "ترحيل قيد محاسبي", en: "Journal entry posted" },
  ENTRY_VOIDED: { ar: "إلغاء مسودة قيد", en: "Draft entry voided" },
  ENTRY_REVERSED: { ar: "عكس قيد مرحّل", en: "Posted entry reversed" },
  USER_CREATED: { ar: "إنشاء مستخدم جديد", en: "New user created" },
  USER_UPDATED: { ar: "تعديل مستخدم / صلاحيات", en: "User / permissions updated" },
  COMPANY_UPDATED: { ar: "تحديث بيانات المنشأة", en: "Company profile updated" },
  PERIOD_CREATED: { ar: "إضافة فترة مالية", en: "Fiscal period created" },
  PERIOD_CLOSED: { ar: "إقفال فترة مالية", en: "Fiscal period closed" },
  PERIOD_REOPENED: { ar: "إعادة فتح فترة مالية", en: "Fiscal period reopened" },
  STOCK_MOVED: { ar: "حركة مخزنية", en: "Stock movement" },
  STOCK_POSTED: { ar: "ترحيل حركة مخزنية", en: "Stock movement posted" },
  INVENTORY_CLOSED: { ar: "إقفال المخزون الدوري", en: "Periodic inventory closed" },
  DOCUMENT_CREATED: { ar: "إنشاء مستند", en: "Document created" },
  DOCUMENT_POSTED: { ar: "إنشاء وترحيل مستند", en: "Document posted" },
  REGISTER_CREATED: { ar: "إضافة سجل بالدليل", en: "Register record created" },
  REGISTER_SAVED: { ar: "حفظ سجل بالدليل", en: "Register record saved" },
  REGISTER_UPDATED: { ar: "تعديل سجل بالدليل", en: "Register record updated" },
  PAYROLL_MOVEMENT_CREATED: { ar: "إنشاء حركة رواتب", en: "Payroll movement created" },
  PAYROLL_MOVEMENT_VOIDED: { ar: "إلغاء حركة رواتب", en: "Payroll movement voided" },
  PAYROLL_POSTED: { ar: "ترحيل مسير رواتب", en: "Payroll posted" },
  ASSET_DEPRECIATED: { ar: "تنفيذ إهلاك أصل", en: "Asset depreciation executed" },
  DEPRECIATION_POSTED: { ar: "ترحيل إهلاك أصول", en: "Asset depreciation posted" },
  COST_INPUTS_SAVED: { ar: "حفظ مدخلات التكاليف", en: "Cost inputs saved" },
  EQUITY_INPUTS_SAVED: { ar: "حفظ مدخلات حقوق الملكية", en: "Equity inputs saved" },
  EQUITY_DISTRIBUTED: { ar: "ترحيل توزيع أرباح", en: "Profit distribution posted" },
  DISTRIBUTION_SAVED: { ar: "حفظ توزيع أرباح", en: "Profit distribution saved" },
  ACCOUNT_CREATED: { ar: "إضافة حساب بالشجرة", en: "Account created in chart" },
  ACCOUNT_UPDATED: { ar: "تعديل حساب بالشجرة", en: "Account updated in chart" },
};

const KIND_LABELS: Record<string, { ar: string; en: string }> = {
  items: { ar: "دليل الأصناف", en: "Items Directory" },
  customers: { ar: "دليل العملاء", en: "Customers Directory" },
  suppliers: { ar: "دليل الموردين", en: "Suppliers Directory" },
  partners: { ar: "دليل الشركاء", en: "Partners Directory" },
  warehouses: { ar: "دليل المخازن", en: "Warehouses Directory" },
  "cost-centers": { ar: "مراكز التكلفة", en: "Cost Centers" },
  "cost-items": { ar: "دليل التكاليف", en: "Cost Items" },
  farms: { ar: "دليل المزارع", en: "Farms Directory" },
  banks: { ar: "دليل البنوك", en: "Banks Directory" },
  employees: { ar: "دليل الموظفين", en: "Employees Directory" },
  assets: { ar: "سجل الأصول", en: "Asset Register" },
  lookups: { ar: "قوائم الحسابات", en: "Lookup Lists" },
};

function getActionLabel(action: string, isAr: boolean): string {
  const item = ACTION_LABELS[action];
  if (item) return isAr ? item.ar : item.en;
  return action.replace(/_/g, " ").toLowerCase();
}

function getKindLabel(kind: string, isAr: boolean): string {
  const item = KIND_LABELS[kind];
  if (item) return isAr ? item.ar : item.en;
  return kind;
}

interface AuditLogItem {
  id: string;
  createdAt: string;
  userId: string;
  actorName: string;
  actorUsername: string;
  action: string;
  entityId: string;
  entryNumber?: number | null;
  entryDescription?: string | null;
  detail: Record<string, any>;
}

function cleanDetailDisplay(detail: Record<string, any>) {
  const copy = { ...detail };
  delete copy.actorName;
  delete copy.actorUsername;
  delete copy.actorRole;
  return copy;
}

function renderSummary(row: AuditLogItem, isAr: boolean): string {
  const d = cleanDetailDisplay(row.detail || {});
  const parts: string[] = [];

  if (row.entryNumber) {
    if (row.entryDescription) parts.push(row.entryDescription);
  } else if (d.name || d.code) {
    if (d.name) parts.push(isAr ? `الاسم: ${d.name}` : `Name: ${d.name}`);
    if (d.code) parts.push(isAr ? `الكود: ${d.code}` : `Code: ${d.code}`);
    if (d.kind) parts.push(isAr ? `الدليل: ${getKindLabel(d.kind, isAr)}` : `Kind: ${getKindLabel(d.kind, isAr)}`);
  } else if (d.updatedName || d.role) {
    if (d.updatedName) parts.push(isAr ? `المستخدم: ${d.updatedName}` : `User: ${d.updatedName}`);
    if (d.role) parts.push(isAr ? `الدور: ${d.role}` : `Role: ${d.role}`);
    if (d.isActive !== undefined) {
      parts.push(d.isActive ? (isAr ? "الحالة: نشط" : "Status: Active") : (isAr ? "الحالة: معطل" : "Status: Inactive"));
    }
  }

  // Handle recorded changes/diffs if present
  if (d.changes && typeof d.changes === "object" && !Array.isArray(d.changes)) {
    const changeList: string[] = [];
    for (const [k, v] of Object.entries(d.changes)) {
      if (v && typeof v === "object" && "before" in v && "after" in v) {
        changeList.push(`${k}: ${(v as any).before ?? "—"} ➔ ${(v as any).after ?? "—"}`);
      } else {
        changeList.push(k);
      }
    }
    if (changeList.length > 0) parts.push(changeList.join(", "));
  }

  if (d.before && d.after && typeof d.before === "object" && typeof d.after === "object") {
    const diffKeys = Object.keys(d.after).filter((k) => d.before[k] !== d.after[k]);
    if (diffKeys.length > 0) {
      parts.push(diffKeys.map((k) => `${k}: ${d.before[k] ?? "—"} ➔ ${d.after[k] ?? "—"}`).join(", "));
    }
  }

  if (parts.length === 0) {
    const simpleKeys = Object.keys(d).filter(
      (k) => typeof d[k] !== "object" || d[k] === null,
    );
    for (const k of simpleKeys.slice(0, 3)) {
      parts.push(`${k}: ${d[k]}`);
    }
  }

  return parts.length > 0 ? parts.join(" | ") : "—";
}

export function AuditView() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<AuditLogItem | null>(null);

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (search.trim()) params.set("search", search.trim());
    if (actionFilter) params.set("action", actionFilter);
    if (userFilter) params.set("userId", userFilter);
    if (fromFilter) params.set("from", fromFilter);
    if (toFilter) params.set("to", toFilter);
    return `/api/audit?${params.toString()}`;
  }, [page, search, actionFilter, userFilter, fromFilter, toFilter]);

  const { data, error, reload } = useLoad<{
    rows: AuditLogItem[];
    total: number;
    totalPages: number;
    users: Array<{ id: string; name: string; username: string | null }>;
  }>(queryUrl, { rows: [], total: 0, totalPages: 1, users: [] });

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString(isAr ? "ar-EG" : "en-US")} ${d.toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return iso;
    }
  };

  return (
    <Workspace
      title={isAr ? "سجل النشاط والمراجعة الرقابية" : "Audit Log & Supervisory Records"}
      error={error}
    >
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-border space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={isAr ? "بحث في الإجراء، رقم القيد، أو المرجع..." : "Search action, entry #, or ref..."}
              className={`w-full h-10 px-3 ${isAr ? "pl-9" : "pr-9"} rounded-lg border border-border text-xs focus:outline-none focus:border-green-700`}
            />
            <MagnifyingGlass
              className={`w-4 h-4 text-ink-400 absolute ${isAr ? "left-3" : "right-3"} top-3`}
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg border border-border text-xs bg-white text-ink-900 focus:outline-none focus:border-green-700"
            >
              <option value="">{isAr ? "كافة أنواع العمليات" : "All Operation Types"}</option>
              {Object.entries(ACTION_LABELS).map(([key]) => (
                <option key={key} value={key}>
                  {getActionLabel(key, isAr)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg border border-border text-xs bg-white text-ink-900 focus:outline-none focus:border-green-700"
            >
              <option value="">{isAr ? "كافة المستخدمين" : "All Users"}</option>
              {data.users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.username ? `(@${u.username})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromFilter}
              onChange={(e) => {
                setFromFilter(e.target.value);
                setPage(1);
              }}
              title={isAr ? "من تاريخ" : "From date"}
              className="w-1/2 h-10 px-2 rounded-lg border border-border text-xs"
            />
            <span className="text-xs text-ink-400">{isAr ? "إلى" : "to"}</span>
            <input
              type="date"
              value={toFilter}
              onChange={(e) => {
                setToFilter(e.target.value);
                setPage(1);
              }}
              title={isAr ? "إلى تاريخ" : "To date"}
              className="w-1/2 h-10 px-2 rounded-lg border border-border text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs text-ink-600">
          <div>
            {isAr ? (
              <>
                إجمالي السجلات: <span className="font-bold text-ink-900">{data.total}</span> عملية
              </>
            ) : (
              <>
                Total Records: <span className="font-bold text-ink-900">{data.total}</span> operations
              </>
            )}
          </div>
          <button
            onClick={() => reload()}
            className="flex items-center gap-1 hover:text-green-700 font-medium"
          >
            <ArrowsClockwise className="w-3.5 h-3.5" />
            <span>{isAr ? "تحديث السجل" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${isAr ? "text-right" : "text-left"} text-xs`}>
            <thead className="bg-canvas/60 border-b border-border text-ink-700 font-semibold">
              <tr>
                <th className="p-3">{isAr ? "وقت العملية" : "Timestamp"}</th>
                <th className="p-3">{isAr ? "المنفّذ" : "Operator"}</th>
                <th className="p-3">{isAr ? "نوع العملية" : "Operation"}</th>
                <th className="p-3">{isAr ? "رقم القيد / المرجع" : "Entry # / Reference"}</th>
                <th className="p-3">{isAr ? "ملخص التغيير والبيان" : "Change Summary"}</th>
                <th className="p-3 text-center">{isAr ? "التفاصيل" : "Details"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-400">
                    {isAr
                      ? "لا توجد عمليات مسجلة مطابقة لمعايير البحث"
                      : "No audit records found matching search criteria"}
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-canvas/30 transition-colors">
                    <td className="p-3 whitespace-nowrap text-ink-600 font-mono">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="p-3 whitespace-nowrap font-medium text-ink-900">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-green-700 shrink-0" />
                        <span>{row.actorName}</span>
                        {row.actorUsername && (
                          <span className="text-ink-400 font-mono text-[11px]">
                            (@{row.actorUsername})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded bg-green-50 text-green-800 border border-green-200/50 font-medium">
                        {getActionLabel(row.action, isAr)}
                      </span>
                    </td>
                    <td className="p-3 text-ink-700">
                      {row.entryNumber ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-800 font-mono text-xs">
                            {isAr ? `قيد #${row.entryNumber}` : `Entry #${row.entryNumber}`}
                          </span>
                          {row.entryDescription && (
                            <span
                              className="text-[11px] text-ink-500 truncate max-w-[220px]"
                              title={row.entryDescription}
                            >
                              {row.entryDescription}
                            </span>
                          )}
                        </div>
                      ) : row.detail?.name || row.detail?.code ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-ink-900">
                            {row.detail.name || row.detail.code}
                          </span>
                          {row.detail.code && row.detail.name && (
                            <span className="text-[11px] text-ink-400 font-mono">
                              {row.detail.code}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span
                          className="font-mono text-ink-600 truncate max-w-[140px] inline-block"
                          title={row.entityId}
                        >
                          {row.entityId}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-ink-600 max-w-sm truncate">
                      {renderSummary(row, isAr)}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDetail(row)}
                        className="px-2.5 py-1 rounded bg-canvas hover:bg-border text-ink-700 text-[11px] font-medium"
                      >
                        {isAr ? "عرض التفاصيل" : "View Details"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-3 border-t border-border flex items-center justify-between text-xs">
          <div className="text-ink-500">
            {isAr
              ? `صفحة ${page} من ${Math.max(1, data.totalPages || 1)}`
              : `Page ${page} of ${Math.max(1, data.totalPages || 1)}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded border border-border bg-white text-ink-700 hover:bg-canvas disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 font-medium"
            >
              {isAr ? <CaretRight className="w-3.5 h-3.5" /> : <CaretLeft className="w-3.5 h-3.5" />}
              <span>{isAr ? "السابق" : "Previous"}</span>
            </button>
            <button
              disabled={page >= (data.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded border border-border bg-white text-ink-700 hover:bg-canvas disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 font-medium"
            >
              <span>{isAr ? "التالي" : "Next"}</span>
              {isAr ? <CaretLeft className="w-3.5 h-3.5" /> : <CaretRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-sm animate-fade-in">
          <div
            className={`bg-white rounded-2xl p-6 max-w-lg w-full border border-border shadow-2xl space-y-4 ${
              isAr ? "text-right" : "text-left"
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-ink-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-700" />
                <span>
                  {isAr ? "تفاصيل العملية:" : "Operation Details:"}{" "}
                  {getActionLabel(selectedDetail.action, isAr)}
                </span>
              </h3>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-ink-400 hover:text-ink-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-ink-700">
              <div className="flex justify-between py-1 border-b border-dashed">
                <span className="text-ink-500">{isAr ? "الوقت:" : "Timestamp:"}</span>
                <span className="font-mono">{formatDateTime(selectedDetail.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed">
                <span className="text-ink-500">{isAr ? "المنفّذ:" : "Operator:"}</span>
                <span className="font-medium">
                  {selectedDetail.actorName}{" "}
                  {selectedDetail.actorUsername ? `(@${selectedDetail.actorUsername})` : ""}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed">
                <span className="text-ink-500">{isAr ? "معرف المنفّذ:" : "Operator ID:"}</span>
                <span className="font-mono text-[11px]">{selectedDetail.userId}</span>
              </div>

              {/* Journal Entry details if present */}
              {selectedDetail.entryNumber && (
                <div className="flex justify-between py-1.5 border-b border-dashed bg-green-50/60 px-2 rounded">
                  <span className="text-ink-600 font-semibold">{isAr ? "رقم وبيان القيد:" : "Entry # & Desc:"}</span>
                  <span className="font-bold text-green-800">
                    {isAr ? `قيد رقم #${selectedDetail.entryNumber}` : `Entry #${selectedDetail.entryNumber}`}
                    {selectedDetail.entryDescription ? ` - ${selectedDetail.entryDescription}` : ""}
                  </span>
                </div>
              )}

              {/* Technical ID retained inside details */}
              <div className="flex justify-between py-1 border-b border-dashed">
                <span className="text-ink-500">{isAr ? "المعرّف التقني:" : "Technical Entity ID:"}</span>
                <span className="font-mono text-[11px] select-all bg-canvas px-1.5 py-0.5 rounded border border-border">
                  {selectedDetail.entityId}
                </span>
              </div>

              {/* Human-readable Record Data */}
              {(() => {
                const d = cleanDetailDisplay(selectedDetail.detail || {});
                const hasNameOrCode = d.name || d.code || d.kind;
                const changes = d.changes && typeof d.changes === "object" ? d.changes : null;
                const hasDiff = d.before && d.after && typeof d.before === "object" && typeof d.after === "object";

                return (
                  <div className="pt-2 space-y-3">
                    {hasNameOrCode && (
                      <div className="bg-canvas p-3 rounded-lg border border-border space-y-1.5">
                        <div className="font-bold text-ink-900 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-green-700" />
                          <span>{isAr ? "بيانات السجل:" : "Record Info:"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-ink-700 pt-1">
                          {d.kind && (
                            <div>
                              <span className="text-ink-400">{isAr ? "الدليل: " : "Kind: "}</span>
                              <span className="font-medium">{getKindLabel(d.kind, isAr)}</span>
                            </div>
                          )}
                          {d.code && (
                            <div>
                              <span className="text-ink-400">{isAr ? "الكود: " : "Code: "}</span>
                              <span className="font-mono font-medium">{d.code}</span>
                            </div>
                          )}
                          {d.name && (
                            <div className="col-span-2">
                              <span className="text-ink-400">{isAr ? "الاسم: " : "Name: "}</span>
                              <span className="font-semibold text-ink-900">{d.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Diff / Changes Table if present */}
                    {(changes || hasDiff) && (
                      <div className="space-y-1.5">
                        <div className="font-bold text-ink-900 flex items-center gap-1.5">
                          <ArrowsLeftRight className="w-3.5 h-3.5 text-blue-600" />
                          <span>{isAr ? "الحقول التي تغيرت:" : "Changed Fields:"}</span>
                        </div>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <table className={`w-full ${isAr ? "text-right" : "text-left"} text-[11px]`}>
                            <thead className="bg-canvas font-semibold text-ink-700 border-b border-border">
                              <tr>
                                <th className="p-2">{isAr ? "الحقل" : "Field"}</th>
                                <th className="p-2">{isAr ? "القيمة السابقة" : "Before"}</th>
                                <th className="p-2">{isAr ? "القيمة الجديدة" : "After"}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {changes
                                ? Object.entries(changes).map(([field, val]) => (
                                    <tr key={field} className="hover:bg-canvas/30">
                                      <td className="p-2 font-medium text-ink-900">{field}</td>
                                      <td className="p-2 text-ink-500 font-mono">
                                        {val && typeof val === "object" && "before" in val
                                          ? String((val as any).before ?? "—")
                                          : "—"}
                                      </td>
                                      <td className="p-2 text-green-700 font-mono font-medium">
                                        {val && typeof val === "object" && "after" in val
                                          ? String((val as any).after ?? "—")
                                          : String(val)}
                                      </td>
                                    </tr>
                                  ))
                                : Object.keys(d.after).map((field) => (
                                    <tr key={field} className="hover:bg-canvas/30">
                                      <td className="p-2 font-medium text-ink-900">{field}</td>
                                      <td className="p-2 text-ink-500 font-mono">
                                        {String(d.before[field] ?? "—")}
                                      </td>
                                      <td className="p-2 text-green-700 font-mono font-medium">
                                        {String(d.after[field] ?? "—")}
                                      </td>
                                    </tr>
                                  ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Clean Key-Value items for other properties */}
                    {(() => {
                      const excludeKeys = new Set([
                        "name",
                        "code",
                        "kind",
                        "changes",
                        "before",
                        "after",
                        "actorName",
                        "actorUsername",
                        "actorRole",
                      ]);
                      const otherEntries = Object.entries(d).filter(
                        ([k]) => !excludeKeys.has(k),
                      );
                      if (otherEntries.length === 0) return null;

                      return (
                        <div className="space-y-1.5">
                          <div className="font-bold text-ink-800 text-[11px]">
                            {isAr ? "بيانات إضافية مسجلة:" : "Additional Recorded Attributes:"}
                          </div>
                          <div className="bg-canvas/50 p-2.5 rounded-lg border border-border grid grid-cols-2 gap-2 text-[11px]">
                            {otherEntries.map(([k, v]) => (
                              <div key={k}>
                                <span className="text-ink-400">{k}: </span>
                                <span className="font-mono text-ink-800">
                                  {typeof v === "object" && v !== null
                                    ? JSON.stringify(v)
                                    : String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Expandable Raw JSON */}
                    <details className="pt-1 text-[11px] text-ink-500">
                      <summary className="cursor-pointer hover:text-ink-800 font-medium select-none">
                        {isAr ? "عرض البيانات الخام (JSON)" : "View Raw JSON Data"}
                      </summary>
                      <pre className="mt-1.5 p-3 bg-canvas rounded-lg text-[10px] font-mono overflow-auto max-h-40 border border-border dir-ltr text-left">
                        {JSON.stringify(d, null, 2)}
                      </pre>
                    </details>
                  </div>
                );
              })()}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white font-bold text-xs"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Workspace>
  );
}
