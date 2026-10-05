'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PencilSimple, Plus, CheckCircle, Prohibit } from '@phosphor-icons/react';
import { AccountNode } from '@/app/api/accounts/route';

interface AccountTableProps {
  accounts: AccountNode[];
  onAddChild: (parentCode: string) => void;
  onEdit: (account: AccountNode) => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  onAddChild,
  onEdit,
}) => {
  const t = useTranslations('coa');
  const [sortField, setSortField] = useState<'code' | 'name'>('code');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: 'code' | 'name') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedAccounts = [...accounts].sort((a, b) => {
    if (sortField === 'code') {
      return sortAsc ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code);
    } else {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
  });

  if (accounts.length === 0) {
    return (
      <div className="py-16 text-center text-ink-600 text-sm">
        {t('noResults')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full text-start text-xs border-collapse">
        <thead>
          <tr className="bg-canvas border-b border-border text-ink-900 font-semibold">
            <th
              onClick={() => handleSort('code')}
              className="py-3 px-4 text-start cursor-pointer hover:text-green-700 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <span>{t('code')}</span>
                {sortField === 'code' && (sortAsc ? '↑' : '↓')}
              </span>
            </th>
            <th
              onClick={() => handleSort('name')}
              className="py-3 px-4 text-start cursor-pointer hover:text-green-700 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <span>{t('name')}</span>
                {sortField === 'name' && (sortAsc ? '↑' : '↓')}
              </span>
            </th>
            <th className="py-3 px-4 text-start">{t('class')}</th>
            <th className="py-3 px-4 text-start">{t('nature')}</th>
            <th className="py-3 px-4 text-start">{t('statement')}</th>
            <th className="py-3 px-4 text-start">{t('accountType')}</th>
            <th className="py-3 px-4 text-start">{t('balance')}</th>
            <th className="py-3 px-4 text-start">{t('status')}</th>
            <th className="py-3 px-4 text-center">{t('actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {sortedAccounts.map((acc) => (
            <tr
              key={acc.code}
              className={`hover:bg-canvas/50 transition-colors ${
                !acc.isActive ? 'opacity-50 line-through' : ''
              }`}
            >
              {/* Code */}
              <td className="py-3 px-4">
                <span
                  dir="ltr"
                  className="font-mono text-xs font-semibold text-green-800 bg-green-700/10 px-2 py-0.5 rounded"
                >
                  {acc.code}
                </span>
              </td>

              {/* Name */}
              <td className="py-3 px-4">
                <div className="font-medium text-ink-900">{acc.name}</div>
                {acc.nameEn && (
                  <div dir="ltr" className="text-[10px] text-ink-400">
                    {acc.nameEn}
                  </div>
                )}
              </td>

              {/* Class */}
              <td className="py-3 px-4 text-ink-600">{acc.accountClass}</td>

              {/* Nature */}
              <td className="py-3 px-4">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    acc.nature === 'مدين'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {acc.nature}
                </span>
              </td>

              {/* Statement */}
              <td className="py-3 px-4 text-ink-600">{acc.statementType}</td>

              {/* Type (Group / Leaf) */}
              <td className="py-3 px-4">
                {acc.isGroup ? (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                    رئيسي (تجميعي)
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-ink-600 bg-canvas border border-border px-1.5 py-0.5 rounded">
                    فرعي (يقبل القيود)
                  </span>
                )}
              </td>

              {/* Balance */}
              <td className="py-3 px-4 font-mono tabular-nums text-start" dir="ltr">
                {acc.balance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>

              {/* Status */}
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    acc.isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      acc.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span>{acc.isActive ? t('active') : t('inactive')}</span>
                </span>
              </td>

              {/* Actions */}
              <td className="py-3 px-4 text-center">
                <div className="inline-flex items-center gap-1">
                  {acc.isGroup && (
                    <button
                      type="button"
                      onClick={() => onAddChild(acc.code)}
                      title={t('addChild')}
                      className="w-7 h-7 rounded flex items-center justify-center text-green-700 hover:bg-green-700/10 transition-colors"
                    >
                      <Plus size={14} weight="bold" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEdit(acc)}
                    title={t('edit')}
                    className="w-7 h-7 rounded flex items-center justify-center text-ink-600 hover:bg-canvas transition-colors"
                  >
                    <PencilSimple size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
