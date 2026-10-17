"use client";

import React, { useState, useMemo } from "react";
import {
  PERMISSION_DEFINITIONS,
  PermissionKey,
} from "@/lib/auth/permissions";
import {
  MagnifyingGlass,
  UserPlus,
  PencilSimple,
  Key,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Warning,
  Check,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";

export interface ManagedUser {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
}

interface UserManagementViewProps {
  users: ManagedUser[];
  onRefresh: () => Promise<void> | void;
}

export function UserManagementView({ users, onRefresh }: UserManagementViewProps) {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [resettingUser, setResettingUser] = useState<ManagedUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Group permission definitions by category
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const def of PERMISSION_DEFINITIONS) {
      if (!groups[def.category]) groups[def.category] = [];
      groups[def.category].push(def);
    }
    return groups;
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warning className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 font-bold">
            ✕
          </button>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header & Actions */}
      <div className="bg-white p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-700/10 border border-green-700/20 flex items-center justify-center text-green-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-ink-900">
              المستخدمون والصلاحيات المخصصة
            </h3>
            <p className="text-xs text-ink-500">
              إدارة موظفي الشركة، وتحديد الصلاحيات الدقيقة لكل موظف على شاشات وعمليات النظام.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setError(null);
            setSuccess(null);
            setIsCreateOpen(true);
          }}
          className="h-10 px-4 rounded-lg bg-green-700 hover:bg-green-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-3 border-b border-border bg-canvas/30">
          <div className="relative max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو اسم الدخول أو البريد..."
              className="w-full h-9 px-3 pl-8 rounded-lg border border-border text-xs focus:outline-none focus:border-green-700"
            />
            <MagnifyingGlass className="w-4 h-4 text-ink-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-canvas/60 border-b border-border text-ink-700 font-semibold">
              <tr>
                <th className="p-3">الاسم الكامل</th>
                <th className="p-3">اسم الدخول</th>
                <th className="p-3">البريد الإلكتروني</th>
                <th className="p-3">نوع الحساب</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">الصلاحيات الممنوحة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-ink-400">
                    لا يوجد مستخدمون مطابقون للبحث
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-canvas/30 transition-colors">
                    <td className="p-3 font-semibold text-ink-900">{u.name}</td>
                    <td className="p-3 font-mono text-ink-700">
                      {u.username ? `@${u.username}` : "—"}
                    </td>
                    <td className="p-3 font-mono text-ink-600">
                      {u.email || "—"}
                    </td>
                    <td className="p-3">
                      {u.role === "admin" ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                          مدير كامل
                        </span>
                      ) : u.role === "auditor" ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px]">
                          مراجع (قراءة فقط)
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          موظف / محاسب
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>نشط</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>معطّل</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {u.role === "admin" ? (
                        <span className="text-green-700 font-semibold">
                          كافة صلاحيات الشركة (كاملة)
                        </span>
                      ) : (
                        <span className="font-mono text-ink-700">
                          {Array.isArray(u.permissions) ? u.permissions.length : 0} صلاحية
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setError(null);
                            setSuccess(null);
                            setEditingUser(u);
                          }}
                          className="px-2.5 py-1 rounded bg-canvas hover:bg-border text-ink-700 font-medium flex items-center gap-1"
                          title="تعديل البيانات والصلاحيات"
                        >
                          <PencilSimple className="w-3.5 h-3.5" />
                          <span>تعديل الصلاحيات</span>
                        </button>
                        <button
                          onClick={() => {
                            setError(null);
                            setSuccess(null);
                            setResettingUser(u);
                          }}
                          className="px-2 py-1 rounded bg-canvas hover:bg-border text-ink-700 font-medium flex items-center gap-1"
                          title="إعادة تعيين كلمة المرور"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>كلمة المرور</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateOpen && (
        <UserEditorModal
          mode="create"
          groupedPermissions={groupedPermissions}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={async (msg) => {
            setIsCreateOpen(false);
            setSuccess(msg);
            await onRefresh();
          }}
          onError={(err) => setError(err)}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <UserEditorModal
          mode="edit"
          user={editingUser}
          groupedPermissions={groupedPermissions}
          onClose={() => setEditingUser(null)}
          onSuccess={async (msg) => {
            setEditingUser(null);
            setSuccess(msg);
            await onRefresh();
          }}
          onError={(err) => setError(err)}
        />
      )}

      {/* Password Reset Modal */}
      {resettingUser && (
        <PasswordResetModal
          user={resettingUser}
          onClose={() => setResettingUser(null)}
          onSuccess={async (msg) => {
            setResettingUser(null);
            setSuccess(msg);
            await onRefresh();
          }}
          onError={(err) => setError(err)}
        />
      )}
    </div>
  );
}

// User Editor Modal (Create / Edit)
function UserEditorModal({
  mode,
  user,
  groupedPermissions,
  onClose,
  onSuccess,
  onError,
}: {
  mode: "create" | "edit";
  user?: ManagedUser;
  groupedPermissions: Record<string, any[]>;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (err: string) => void;
}) {
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(user?.role || "accountant");
  const [isActive, setIsActive] = useState(user ? user.isActive : true);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(
    new Set(Array.isArray(user?.permissions) ? user?.permissions : []),
  );
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Toggle single permission with dependency checking
  const togglePermission = (key: string, dependsOn?: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // If unchecking a parent view permission, remove dependent child actions
        for (const def of PERMISSION_DEFINITIONS) {
          if ((def as any).dependsOn === key) {
            next.delete(def.key);
          }
        }
      } else {
        next.add(key);
        // If checking an action that depends on view, automatically add view!
        if (dependsOn) {
          next.add(dependsOn);
        }
      }
      return next;
    });
  };

  const selectAllCategory = (items: typeof PERMISSION_DEFINITIONS[number][]) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      items.forEach((item) => next.add(item.key));
      return next;
    });
  };

  const deselectAllCategory = (items: typeof PERMISSION_DEFINITIONS[number][]) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      items.forEach((item) => next.delete(item.key));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setLocalError(null);

    try {
      const endpoint = mode === "create" ? "/api/users" : `/api/users/${user?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const payload: Record<string, any> = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim() ? email.trim().toLowerCase() : null,
        role,
        isActive,
        permissions: role === "admin" ? [] : Array.from(selectedPerms),
      };

      if (mode === "create") {
        if (!password) throw new Error("كلمة المرور مطلوبة للمستخدم الجديد");
        payload.password = password;
      } else if (password) {
        payload.password = password;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "حدث خطأ أثناء حفظ المستخدم");
      }

      onSuccess(data.message || (mode === "create" ? "تم إنشاء المستخدم بنجاح" : "تم حفظ التعديلات بنجاح"));
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-border shadow-2xl my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-base text-ink-900">
              {mode === "create" ? "إضافة مستخدم جديد وتحديد صلاحياته" : `تعديل المستخدم: ${user?.name}`}
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              احفظ البيانات والصلاحيات معاً، لتمكينه من الدخول فوراً بالصلاحيات المحددة.
            </p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {localError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <Warning className="w-4 h-4 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          {/* User Basic Info Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-900">
                الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد عبد الله"
                className="w-full h-10 px-3 rounded-lg border border-border text-xs focus:outline-none focus:border-green-700"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-900">
                اسم الدخول (Username) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: ahmad_acc"
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg border border-border text-xs font-mono focus:outline-none focus:border-green-700"
              />
              <p className="text-[10px] text-ink-400">
                أحرف إنجليزية وأرقام ونقاط أو شرطات، وبدون علامة @
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-900">
                البريد الإلكتروني <span className="text-ink-400 font-normal">(اختياري للحسابات الجديدة)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@domain.com"
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg border border-border text-xs font-mono focus:outline-none focus:border-green-700"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-900">
                {mode === "create" ? "كلمة المرور *" : "تغيير كلمة المرور (اتركه فارغاً للإبقاء على الحالية)"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required={mode === "create"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "create" ? "أدخل كلمة المرور" : "كلمة المرور الجديدة"}
                  dir="ltr"
                  className="w-full h-10 px-3 pe-10 rounded-lg border border-border text-xs font-mono focus:outline-none focus:border-green-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-ink-400 hover:text-ink-700 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeSlash className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-900">
                نوع الحساب
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border text-xs bg-white text-ink-900 focus:outline-none focus:border-green-700"
              >
                <option value="accountant">موظف / محاسب (صلاحيات مخصصة بالجدول)</option>
                <option value="admin">مدير كامل (كافة صلاحيات الشركة)</option>
                <option value="auditor">مراجع (قراءة فقط للمسموح به)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="modalIsActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-green-700 focus:ring-green-700 cursor-pointer"
              />
              <label htmlFor="modalIsActive" className="text-xs font-semibold text-ink-900 cursor-pointer">
                الحساب مفعل ونشط
              </label>
            </div>
          </div>

          {/* Permissions Matrix */}
          {role === "admin" ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <span className="font-bold">ملاحظة:</span> دور «مدير كامل» يمنح كافة الصلاحيات داخل هذه الشركة تلقائياً، ولا يتطلب تحديد خانات فردية.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h4 className="font-bold text-xs text-ink-900">
                    جدول تحديد الصلاحيات حسب الأقسام
                  </h4>
                  <p className="text-[11px] text-ink-500">
                    اختر ما يحق لهذا الموظف عرضه أو تنفيذه. منح إجراء (مثل إضافة أو ترحيل) يتضمن تلقائياً صلاحية العرض التابعة له.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-green-700">
                  المحدد: {selectedPerms.size} صلاحية
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([category, defs]) => {
                  const allSelected = defs.every((d) => selectedPerms.has(d.key));
                  return (
                    <div
                      key={category}
                      className="border border-border rounded-xl p-3.5 bg-canvas/20 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-ink-900">{category}</span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => (allSelected ? deselectAllCategory(defs) : selectAllCategory(defs))}
                            className="text-green-700 hover:underline font-medium"
                          >
                            {allSelected ? "إلغاء تحديد القسم" : "تحديد كافة القسم"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        {defs.map((def) => {
                          const checked = selectedPerms.has(def.key);
                          return (
                            <label
                              key={def.key}
                              className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                checked
                                  ? "bg-green-50/70 border-green-200 text-green-950 font-medium"
                                  : "bg-white border-border text-ink-700 hover:bg-canvas/50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission(def.key, (def as any).dependsOn)}
                                className="w-4 h-4 rounded text-green-700 focus:ring-green-700 mt-0.5 cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="leading-snug">{def.label}</div>
                                <div className="text-[10px] text-ink-500 font-normal leading-tight mt-0.5">
                                  {def.description}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border bg-white hover:bg-canvas text-xs font-semibold text-ink-700"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-xs font-bold shadow-sm disabled:opacity-50"
            >
              {busy ? "جاري الحفظ..." : mode === "create" ? "إنشاء المستخدم" : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Password Reset Modal
function PasswordResetModal({
  user,
  onClose,
  onSuccess,
  onError,
}: {
  user: ManagedUser;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (err: string) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setLocalError(null);

    try {
      if (!newPassword.trim()) {
        throw new Error("يرجى إدخال كلمة المرور الجديدة");
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إعادة تعيين كلمة المرور");
      }

      onSuccess(`تمت إعادة تعيين كلمة المرور للمستخدم ${user.name} بنجاح، وأُلغيت جلساته السابقة.`);
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full border border-border shadow-2xl p-6 space-y-4 text-start">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-ink-900 font-bold text-sm">
            <Key className="w-4 h-4 text-green-700" />
            <span>إعادة تعيين كلمة المرور</span>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 font-bold text-xs">
            ✕
          </button>
        </div>

        <p className="text-xs text-ink-600 leading-relaxed">
          إعادة تعيين كلمة المرور للمستخدم <strong className="text-ink-900">{user.name}</strong> ({user.username ? `@${user.username}` : user.email}). سيتم إلغاء تسجيل دخوله الحالي فوراً.
        </p>

        {localError && (
          <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
            <Warning className="w-4 h-4 shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-900">
              كلمة المرور الجديدة *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                dir="ltr"
                className="w-full h-10 px-3 pe-10 rounded-lg border border-border text-xs font-mono focus:outline-none focus:border-green-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-ink-400 hover:text-ink-700 focus:outline-none"
              >
                {showPassword ? (
                  <EyeSlash className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink-700 hover:bg-canvas"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-xs font-bold shadow-sm disabled:opacity-50"
            >
              {busy ? "جاري التعيين..." : "تعيين وتأكيد"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
