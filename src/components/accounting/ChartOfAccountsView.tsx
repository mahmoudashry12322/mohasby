'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Plus,
  MagnifyingGlass,
  TreeStructure,
  Table,
  ArrowsInLineVertical,
  ArrowsOutLineVertical,
  ArrowClockwise,
  CheckCircle,
  BuildingOffice,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/shell/PageHeader';
import { AccountNode } from '@/app/api/accounts/route';
import { AccountStatsBar } from './AccountStatsBar';
import { AccountTree } from './AccountTree';
import { AccountTable } from './AccountTable';
import { AccountFormModal } from './AccountFormModal';

export const ChartOfAccountsView: React.FC = () => {
  const t = useTranslations('coa');
  const locale = useLocale();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [treeData, setTreeData] = useState<AccountNode[]>([]);
  const [flatAccounts, setFlatAccounts] = useState<AccountNode[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    assets: 0,
    liabilities: 0,
    equity: 0,
    revenue: 0,
    expenses: 0,
  });

  // UI state
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    new Set(['1', '2', '3', '4', '5', '11', '12', '21', '31', '41', '51', '52', '53', '54'])
  );

  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<AccountNode | null>(null);
  const [parentCodeForNew, setParentCodeForNew] = useState<string | null>(null);

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ companyId: '1' });
      if (classFilter !== 'all') {
        params.append('class', classFilter);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await fetch(`/api/accounts?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل في تحميل دليل الحسابات');
      }

      setStats(data.stats);

      if (data.flatList) {
        setFlatAccounts(data.flatList);
      } else if (data.accounts) {
        setFlatAccounts(data.accounts);
      }

      setTreeData(data.accounts || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء تحميل الحسابات');
    } finally {
      setLoading(false);
    }
  }, [classFilter, searchQuery]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Toggle tree node expand/collapse
  const toggleExpand = (code: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allCodes = new Set<string>();
    flatAccounts.forEach((a) => {
      if (a.isGroup || (a.children && a.children.length > 0)) {
        allCodes.add(a.code);
      }
    });
    setExpandedKeys(allCodes);
  };

  const collapseAll = () => {
    setExpandedKeys(new Set(['1', '2', '3', '4', '5']));
  };

  // Actions
  const handleOpenAddModal = (parentCode: string | null = null) => {
    setEditingAccount(null);
    setParentCodeForNew(parentCode);
    setModalOpen(true);
  };

  const handleOpenEditModal = (account: AccountNode) => {
    setEditingAccount(account);
    setParentCodeForNew(account.parentCode);
    setModalOpen(true);
  };

  const handleModalSuccess = (account: AccountNode) => {
    if (editingAccount) {
      showToast(t('updatedSuccess'));
    } else {
      showToast(t('createdSuccess'));
    }
    fetchAccounts();
  };

  return (
    <div className="w-full pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 end-8 z-50 flex items-center gap-2 px-4 py-3 bg-green-900 text-white rounded-xl shadow-elevated border border-green-700/50 text-sm font-medium animate-bounce">
          <CheckCircle size={20} className="text-accent-500" weight="fill" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas border border-border text-xs text-ink-600">
              <BuildingOffice size={16} className="text-green-700" />
              <span>شركة نموذجية للتجارة والصناعة (فرع 1)</span>
            </div>

            <Button
              variant="primary"
              onClick={() => handleOpenAddModal()}
              className="gap-2"
            >
              <Plus size={16} weight="bold" />
              <span>{t('addAccount')}</span>
            </Button>
          </div>
        }
      />

      {/* Stats Cards Row */}
      <AccountStatsBar
        stats={stats}
        activeFilter={classFilter}
        onFilterChange={(filter) => setClassFilter(filter)}
      />

      {/* Toolbar */}
      <div className="bg-white border border-border rounded-xl p-3.5 mb-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={18}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-10 ps-10 pe-3 text-xs sm:text-sm bg-canvas border border-border rounded-lg text-ink-900 placeholder:text-ink-400 focus:bg-white focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition-all"
          />
        </div>

        {/* Right: View toggle & expand controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Tree expand / collapse buttons (only in tree mode) */}
          {viewMode === 'tree' && (
            <div className="hidden sm:flex items-center gap-1 border-e border-border pe-2 me-1">
              <button
                type="button"
                onClick={expandAll}
                title={t('expandAll')}
                className="h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs text-ink-600 hover:bg-canvas hover:text-ink-900 transition-colors"
              >
                <ArrowsOutLineVertical size={16} />
                <span className="hidden xl:inline">{t('expandAll')}</span>
              </button>
              <button
                type="button"
                onClick={collapseAll}
                title={t('collapseAll')}
                className="h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs text-ink-600 hover:bg-canvas hover:text-ink-900 transition-colors"
              >
                <ArrowsInLineVertical size={16} />
                <span className="hidden xl:inline">{t('collapseAll')}</span>
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchAccounts()}
            title="تحديث البيانات"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-600 hover:bg-canvas hover:text-green-700 transition-colors border border-border"
          >
            <ArrowClockwise size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* View Mode Switcher (Tree vs Table) */}
          <div className="flex items-center p-1 bg-canvas border border-border rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'tree'
                  ? 'bg-white text-green-800 shadow-xs'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <TreeStructure size={15} />
              <span>{t('treeView')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-green-800 shadow-xs'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Table size={15} />
              <span>{t('tableView')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-700 border-t-transparent mb-3" />
          <p className="text-ink-600 text-sm">جاري تحميل شجرة الحسابات...</p>
        </div>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-8 text-center text-danger shadow-xs">
          <p className="font-semibold text-sm mb-2">{error}</p>
          <Button variant="secondary" onClick={() => fetchAccounts()}>
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl p-4 sm:p-6 shadow-xs">
          {viewMode === 'tree' ? (
            <AccountTree
              accounts={treeData}
              onAddChild={(parentCode) => handleOpenAddModal(parentCode)}
              onEdit={(account) => handleOpenEditModal(account)}
              expandedKeys={expandedKeys}
              toggleExpand={toggleExpand}
            />
          ) : (
            <AccountTable
              accounts={flatAccounts}
              onAddChild={(parentCode) => handleOpenAddModal(parentCode)}
              onEdit={(account) => handleOpenEditModal(account)}
            />
          )}
        </div>
      )}

      {/* Account Add/Edit Modal */}
      <AccountFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        initialParentCode={parentCodeForNew}
        editingAccount={editingAccount}
        allAccounts={flatAccounts}
      />
    </div>
  );
};
