"use client";

import React, { useState, useMemo } from "react";
import { useLoad, Workspace } from "./Workspace";
import {
  MagnifyingGlass,
  Funnel,
  Clock,
  User as UserIcon,
  CaretRight,
  CaretLeft,
  ArrowsClockwise,
} from "@phosphor-icons/react";

const ACTION_LABELS: Record<string, string> = {
  ENTRY_CREATED: "إنشاء مسودة قيد",
  ENTRY_POSTED: "ترحيل قيد محاسبي",
  ENTRY_VOIDED: "إلغاء مسودة قيد",
  ENTRY_REVERSED: "عكس قيد مرحّل",
  USER_CREATED: "إنشاء مستخدم جديد",
  USER_UPDATED: "تعديل مستخدم / صلاحيات",
  COMPANY_UPDATED: "تحديث بيانات المنشأة",
  PERIOD_CREATED: "إضافة فترة مالية",
  PERIOD_CLOSED: "إقفال فترة مالية",
  PERIOD_REOPENED: "إعادة فتح فترة مالية",
  STOCK_MOVED: "حركة مخزنية",
  DOCUMENT_CREATED: "إنشاء وترحيل مستند",
  REGISTER_CREATED: "إضافة سجل بالدليل",
  REGISTER_UPDATED: "تعديل سجل بالدليل",
  PAYROLL_POSTED: "ترحيل مسير رواتب",
  DEPRECIATION_POSTED: "تنفيذ إهلاك أصول",
  EQUITY_DISTRIBUTED: "ترحيل توزيع أرباح",
  ACCOUNT_CREATED: "إضافة حساب بالشجرة",
  ACCOUNT_UPDATED: "تعديل حساب بالشجرة",
};

interface AuditLogItem {
  id: string;
  createdAt: string;
  userId: string;
  actorName: string;
  actorUsername: string;
  action: string;
  entityId: string;
  detail: Record<string, any>;
}

export function AuditView() {
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
      return `${d.toLocaleDateString("ar-EG")} ${d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return iso;
    }
  };

  const cleanDetailDisplay = (detail: Record<string, any>) => {
    const copy = { ...detail };
    delete copy.actorName;
    delete copy.actorUsername;
    delete copy.actorRole;
    return copy;
  };

  return (
    <Workspace title="سجل النشاط والمراجعة الرقابية" error={error}>
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
              placeholder="بحث في الإجراء أو المرجع..."
              className="w-full h-10 px-3 pl-9 rounded-lg border border-border text-xs focus:outline-none focus:border-green-700"
            />
            <MagnifyingGlass className="w-4 h-4 text-ink-400 absolute left-3 top-3" />
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
              <option value="">كافة أنواع العمليات</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
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
              <option value="">كافة المستخدمين</option>
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
              title="من تاريخ"
              className="w-1/2 h-10 px-2 rounded-lg border border-border text-xs"
            />
            <span className="text-xs text-ink-400">إلى</span>
            <input
              type="date"
              value={toFilter}
              onChange={(e) => {
                setToFilter(e.target.value);
                setPage(1);
              }}
              title="إلى تاريخ"
              className="w-1/2 h-10 px-2 rounded-lg border border-border text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs text-ink-600">
          <div>
            إجمالي السجلات: <span className="font-bold text-ink-900">{data.total}</span> عملية
          </div>
          <button
            onClick={() => reload()}
            className="flex items-center gap-1 hover:text-green-700 font-medium"
          >
            <ArrowsClockwise className="w-3.5 h-3.5" />
            <span>تحديث السجل</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-canvas/60 border-b border-border text-ink-700 font-semibold">
              <tr>
                <th className="p-3">وقت العملية</th>
                <th className="p-3">المنفّذ</th>
                <th className="p-3">نوع العملية</th>
                <th className="p-3">رقم المرجع / المعرف</th>
                <th className="p-3">ملخص التغيير</th>
                <th className="p-3 text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-400">
                    لا توجد عمليات مسجلة مطابقة لمعايير البحث
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
                        {ACTION_LABELS[row.action] || row.action}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-ink-700">
                      {row.entityId}
                    </td>
                    <td className="p-3 text-ink-600 max-w-xs truncate">
                      {row.detail && Object.keys(cleanDetailDisplay(row.detail)).length > 0 ? (
                        JSON.stringify(cleanDetailDisplay(row.detail)).slice(0, 80)
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDetail(row)}
                        className="px-2.5 py-1 rounded bg-canvas hover:bg-border text-ink-700 text-[11px] font-medium"
                      >
                        عرض التفاصيل
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
            صفحة {page} من {Math.max(1, data.totalPages || 1)}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded border border-border bg-white text-ink-700 hover:bg-canvas disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 font-medium"
            >
              <CaretRight className="w-3.5 h-3.5" />
              <span>السابق</span>
            </button>
            <button
              disabled={page >= (data.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded border border-border bg-white text-ink-700 hover:bg-canvas disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 font-medium"
            >
              <span>التالي</span>
              <CaretLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-border shadow-2xl space-y-4 text-start">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-ink-900">
                تفاصيل العملية: {ACTION_LABELS[selectedDetail.action] || selectedDetail.action}
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
                <span className="text-ink-500">الوقت:</span>
                <span className="font-mono">{formatDateTime(selectedDetail.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed">
                <span className="text-ink-500">المنفّذ:</span>
                <span className="font-medium">
                  {selectedDetail.actorName} {selectedDetail.actorUsername ? `(@${selectedDetail.actorUsername})` : ""}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed">
                <span className="text-ink-500">معرف المنفّذ:</span>
                <span className="font-mono text-[11px]">{selectedDetail.userId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed">
                <span className="text-ink-500">المرجع:</span>
                <span className="font-mono font-medium">{selectedDetail.entityId}</span>
              </div>
              <div className="pt-2">
                <div className="text-ink-500 mb-1.5 font-medium">البيانات التفصيلية:</div>
                <pre className="p-3 bg-canvas rounded-lg text-[11px] font-mono overflow-auto max-h-48 border border-border dir-ltr text-left">
                  {JSON.stringify(cleanDetailDisplay(selectedDetail.detail), null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </Workspace>
  );
}
