'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  TreeStructure,
  Vault,
  Receipt,
  Scales,
  TrendUp,
  TrendDown,
} from '@phosphor-icons/react';

interface StatsProps {
  stats: {
    total: number;
    assets: number;
    liabilities: number;
    equity: number;
    revenue: number;
    expenses: number;
  };
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const AccountStatsBar: React.FC<StatsProps> = ({
  stats,
  activeFilter,
  onFilterChange,
}) => {
  const t = useTranslations('coa');

  const items = [
    {
      key: 'all',
      title: t('totalAccounts'),
      count: stats.total,
      icon: TreeStructure,
      bg: 'bg-green-700/8 text-green-700 border-green-700/20',
      activeBorder: 'border-green-700 ring-2 ring-green-700/20',
    },
    {
      key: 'الأصول',
      title: t('assets'),
      count: stats.assets,
      icon: Vault,
      bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25',
      activeBorder: 'border-emerald-600 ring-2 ring-emerald-600/20',
      tag: 'مدين',
      tagColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      key: 'الخصوم',
      title: t('liabilities'),
      count: stats.liabilities,
      icon: Receipt,
      bg: 'bg-amber-500/10 text-amber-700 border-amber-500/25',
      activeBorder: 'border-amber-600 ring-2 ring-amber-600/20',
      tag: 'دائن',
      tagColor: 'bg-amber-100 text-amber-800',
    },
    {
      key: 'حقوق الملكية',
      title: t('equity'),
      count: stats.equity,
      icon: Scales,
      bg: 'bg-blue-500/10 text-blue-700 border-blue-500/25',
      activeBorder: 'border-blue-600 ring-2 ring-blue-600/20',
      tag: 'دائن',
      tagColor: 'bg-blue-100 text-blue-800',
    },
    {
      key: 'الإيرادات',
      title: t('revenue'),
      count: stats.revenue,
      icon: TrendUp,
      bg: 'bg-teal-500/10 text-teal-700 border-teal-500/25',
      activeBorder: 'border-teal-600 ring-2 ring-teal-600/20',
      tag: 'دائن',
      tagColor: 'bg-teal-100 text-teal-800',
    },
    {
      key: 'المصروفات',
      title: t('expenses'),
      count: stats.expenses,
      icon: TrendDown,
      bg: 'bg-rose-500/10 text-rose-700 border-rose-500/25',
      activeBorder: 'border-rose-600 ring-2 ring-rose-600/20',
      tag: 'مدين',
      tagColor: 'bg-rose-100 text-rose-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeFilter === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onFilterChange(item.key)}
            className={`flex flex-col text-start p-3.5 rounded-xl bg-white border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${
              isActive
                ? `${item.activeBorder} shadow-sm bg-gradient-to-b from-white to-canvas/60`
                : 'border-border'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.bg}`}
              >
                <Icon size={18} weight={isActive ? 'bold' : 'regular'} />
              </div>
              {item.tag && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.tagColor}`}
                >
                  {item.tag}
                </span>
              )}
            </div>

            <span className="text-xs text-ink-600 font-medium truncate mb-1">
              {item.title}
            </span>

            <span className="text-2xl font-bold font-mono text-ink-900 tabular-nums leading-none">
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
