'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X, Check, ArrowBendDownRight, Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { AccountNode } from '@/app/api/accounts/route';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedAccount: AccountNode) => void;
  initialParentCode?: string | null;
  editingAccount?: AccountNode | null;
  allAccounts: AccountNode[];
}

export const AccountFormModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialParentCode = null,
  editingAccount = null,
  allAccounts,
}) => {
  const t = useTranslations('coa');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [parentCode, setParentCode] = useState<string>(initialParentCode || '');
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [nameEn, setNameEn] = useState<string>('');
  const [accountClass, setAccountClass] = useState<string>('الأصول');
  const [nature, setNature] = useState<'مدين' | 'دائن'>('مدين');
  const [statementType, setStatementType] = useState<'قائمة المركز المالي' | 'قائمة الدخل'>('قائمة المركز المالي');
  const [isGroup, setIsGroup] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-generate code when parentCode changes in "Add" mode
  useEffect(() => {
    if (editingAccount) {
      setCode(editingAccount.code);
      setName(editingAccount.name);
      setNameEn(editingAccount.nameEn || '');
      setAccountClass(editingAccount.accountClass);
      setNature(editingAccount.nature as 'مدين' | 'دائن');
      setStatementType(editingAccount.statementType as any);
      setParentCode(editingAccount.parentCode || '');
      setIsGroup(editingAccount.isGroup);
      setIsActive(editingAccount.isActive);
      return;
    }

    if (parentCode) {
      const parent = allAccounts.find((a) => a.code === parentCode);
      if (parent) {
        setAccountClass(parent.accountClass);
        setNature(parent.nature as 'مدين' | 'دائن');
        setStatementType(parent.statementType as any);

        // Find existing children of this parent
        const children = allAccounts.filter((a) => a.parentCode === parentCode);
        if (children.length === 0) {
          // Default first child code
          if (parent.code.length === 1) {
            setCode(`${parent.code}1`);
          } else if (parent.code.length === 2) {
            setCode(`${parent.code}01`);
          } else {
            setCode(`${parent.code}01`);
          }
        } else {
          // Suggest next numeric code
          const suffixes = children
            .map((c) => {
              const suffix = c.code.slice(parent.code.length);
              const num = parseInt(suffix, 10);
              return isNaN(num) ? 0 : num;
            })
            .sort((a, b) => b - a);

          const nextNum = (suffixes[0] || 0) + 1;
          const padLength = children[0]?.code.slice(parent.code.length).length || 2;
          const nextSuffix = String(nextNum).padStart(padLength, '0');
          setCode(`${parent.code}${nextSuffix}`);
        }
      }
    } else {
      // Root account suggestion
      setCode('');
    }
  }, [parentCode, editingAccount, allAccounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!code.trim() || !name.trim()) {
      setErrorMessage('يرجى كتابة كود الحساب واسمه باللغة العربية.');
      return;
    }

    setIsLoading(true);

    try {
      if (editingAccount) {
        // Edit existing account
        const res = await fetch(`/api/accounts/${editingAccount.code}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            nameEn: nameEn.trim() || null,
            isActive,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل تحديث الحساب');

        onSuccess(data.account);
        onClose();
      } else {
        // Create new account
        const res = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: code.trim(),
            name: name.trim(),
            nameEn: nameEn.trim() || null,
            accountClass,
            nature,
            statementType,
            parentCode: parentCode || null,
            isGroup,
            companyId: 1,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل إضافة الحساب');

        onSuccess(data.account);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-border shadow-elevated overflow-hidden text-start">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-canvas/60">
          <div>
            <h3 className="font-kufi font-bold text-lg text-ink-900">
              {editingAccount ? t('editAccount') : t('addAccount')}
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              {editingAccount
                ? `تعديل بيانات الحساب (${editingAccount.code} - ${editingAccount.name})`
                : 'إنشاء حساب جديد وربطه بالهيكل المحاسبي'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-600 hover:bg-canvas transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
              <Warning size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parent Account selector (disabled if editing) */}
          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1.5">
              {t('parentAccount')}
            </label>
            <select
              value={parentCode}
              disabled={Boolean(editingAccount)}
              onChange={(e) => setParentCode(e.target.value)}
              className="w-full h-11 px-3.5 text-sm bg-white border border-border rounded-input text-ink-900 focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition-all disabled:bg-canvas disabled:text-ink-600"
            >
              <option value="">{t('noParent')}</option>
              {allAccounts
                .filter((a) => a.isGroup || a.level < 4)
                .map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.name} ({a.accountClass})
                  </option>
                ))}
            </select>
          </div>

          {/* Code & Name fields in grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-900 mb-1.5">
                {t('code')} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                disabled={Boolean(editingAccount)}
                onChange={(e) => setCode(e.target.value)}
                placeholder="110101"
                className="w-full h-11 px-3.5 text-sm font-mono tracking-wider bg-white border border-border rounded-input text-ink-900 focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition-all disabled:bg-canvas disabled:text-ink-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-ink-900 mb-1.5">
                {t('name')} (بالعربية) <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: سيارات نقل البضائع"
                className="w-full h-11 px-3.5 text-sm bg-white border border-border rounded-input text-ink-900 focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition-all"
              />
            </div>
          </div>

          {/* Optional English Name */}
          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1.5">
              {t('nameEn')} (اختياري)
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Delivery Trucks"
              dir="ltr"
              className="w-full h-11 px-3.5 text-sm bg-white border border-border rounded-input text-ink-900 focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition-all"
            />
          </div>

          {/* Classification & Nature (when adding) */}
          {!editingAccount && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">
                  {t('class')}
                </label>
                <select
                  value={accountClass}
                  disabled={Boolean(parentCode)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAccountClass(val);
                    if (val === 'الأصول' || val === 'المصروفات') {
                      setNature('مدين');
                    } else {
                      setNature('دائن');
                    }
                    if (val === 'الإيرادات' || val === 'المصروفات') {
                      setStatementType('قائمة الدخل');
                    } else {
                      setStatementType('قائمة المركز المالي');
                    }
                  }}
                  className="w-full h-11 px-3 text-xs bg-white border border-border rounded-input text-ink-900 focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition-all disabled:bg-canvas"
                >
                  <option value="الأصول">الأصول</option>
                  <option value="الخصوم">الخصوم</option>
                  <option value="حقوق الملكية">حقوق الملكية</option>
                  <option value="الإيرادات">الإيرادات</option>
                  <option value="المصروفات">المصروفات</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">
                  {t('nature')}
                </label>
                <select
                  value={nature}
                  disabled={Boolean(parentCode)}
                  onChange={(e) => setNature(e.target.value as any)}
                  className="w-full h-11 px-3 text-xs bg-white border border-border rounded-input text-ink-900 focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition-all disabled:bg-canvas"
                >
                  <option value="مدين">{t('debit')} (مدين)</option>
                  <option value="دائن">{t('credit')} (دائن)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">
                  {t('statement')}
                </label>
                <select
                  value={statementType}
                  disabled={Boolean(parentCode)}
                  onChange={(e) => setStatementType(e.target.value as any)}
                  className="w-full h-11 px-3 text-xs bg-white border border-border rounded-input text-ink-900 focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition-all disabled:bg-canvas"
                >
                  <option value="قائمة المركز المالي">{t('balanceSheet')}</option>
                  <option value="قائمة الدخل">{t('incomeStatement')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Account Type Radio (Group vs Postable Leaf) */}
          {!editingAccount && (
            <div className="pt-2 border-t border-border">
              <label className="block text-xs font-semibold text-ink-900 mb-2">
                {t('accountType')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsGroup(false)}
                  className={`p-3 rounded-xl border text-start transition-all ${
                    !isGroup
                      ? 'border-green-700 bg-green-700/5 text-green-950 font-semibold ring-1 ring-green-700/20'
                      : 'border-border bg-white text-ink-600 hover:bg-canvas'
                  }`}
                >
                  <div className="text-xs font-bold text-ink-900 mb-0.5">
                    {t('postableLeaf')}
                  </div>
                  <div className="text-[11px] text-ink-600 leading-tight">
                    تقيد عليه العمليات والفواتير مباشرة
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsGroup(true)}
                  className={`p-3 rounded-xl border text-start transition-all ${
                    isGroup
                      ? 'border-green-700 bg-green-700/5 text-green-950 font-semibold ring-1 ring-green-700/20'
                      : 'border-border bg-white text-ink-600 hover:bg-canvas'
                  }`}
                >
                  <div className="text-xs font-bold text-ink-900 mb-0.5">
                    {t('groupHeader')}
                  </div>
                  <div className="text-[11px] text-ink-600 leading-tight">
                    حساب رئيسي يضم تحته فروعاً ولا يقبل قيوداً مباشرة
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Active status toggle (for editing) */}
          {editingAccount && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-border">
              <div>
                <span className="text-xs font-bold text-ink-900 block">
                  حالة الحساب في النظام
                </span>
                <span className="text-[11px] text-ink-600">
                  عند تعطيل الحساب لن يظهر في القوائم المنسدلة لقيود اليومية الجديدة
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {isActive ? 'نشط ومفعّل' : 'معطل مؤقتاً'}
              </button>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="gap-2"
            >
              <Check size={16} weight="bold" />
              <span>{t('save')}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
