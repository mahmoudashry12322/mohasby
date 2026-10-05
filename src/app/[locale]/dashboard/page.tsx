'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { NAV_GROUPS } from '@/lib/nav/nav.config';
import { NavIcon } from '@/lib/nav/nav.icons';
export default function DashboardHomePage() {
  const locale = useLocale();
  const tGroup = useTranslations('nav.groups');
  const tItem = useTranslations('nav.items');
  const tShell = useTranslations('shell');

  const isRtl = locale === 'ar';
  const userName = isRtl ? 'محمد السعدني' : 'Mohamed El Saadany';

  // Format current date: dd/mm/yyyy with weekday
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateFormatted = `${day}/${month}/${year}`;

  const weekday = now.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
  });

  return (
    <div className="w-full">
      {/* 1. Header: Greeting & Date */}
      <div className="border-b border-border pb-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <h1 className="font-kufi font-bold text-2xl lg:text-3xl text-ink-900 tracking-tight">
            {tShell('greeting', { name: userName })}
          </h1>
          <div className="text-sm text-ink-canvas font-medium">
            <span>{weekday}</span>
            <span className="mx-2 text-border">•</span>
            <bdi dir="ltr" className="tabular-nums font-mono text-ink-900 font-semibold">
              {dateFormatted}
            </bdi>
          </div>
        </div>
        <p className="text-sm lg:text-base text-ink-canvas mt-2">
          {locale === 'ar'
            ? 'خريطة الدفاتر والمنظومة المحاسبية — اختر الوحدة للانتقال المباشر لدفاترها وسجلاتها.'
            : 'Operational system index — select a module to access journals and accounting records.'}
        </p>
      </div>

      {/* 2. Program Map / Index List (One row per group, wrapping links) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-kufi font-bold text-lg text-ink-900">
            {tShell('allPages')}
          </h2>
          <span className="text-xs text-ink-canvas font-medium tabular-nums">
            {locale === 'ar' ? '44 دفتراً وسجلاً' : '44 Journals & Registers'}
          </span>
        </div>

        <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden shadow-2xs">
          {NAV_GROUPS.map((group) => {
            return (
              <div
                key={group.slug}
                className="p-4 sm:p-6 flex flex-col md:flex-row md:items-start gap-4 hover:bg-canvas/40 transition-colors"
              >
                {/* Group Title & Icon */}
                <div className="md:w-60 shrink-0 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                    <NavIcon name={group.icon} size={22} weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[20px] text-ink-900 leading-tight">
                      {tGroup(group.labelKey as any)}
                    </h3>
                    <span className="text-[13px] text-ink-600 tabular-nums">
                      {group.items.length}{' '}
                      {locale === 'ar' ? 'صفحات' : 'pages'}
                    </span>
                  </div>
                </div>

                {/* Sub-pages Buttons Grid */}
                <div className="flex-1 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[10px] pt-1">
                  {group.items.map((item) => {
                    const href =
                      locale === 'ar'
                        ? `/dashboard/${group.slug}/${item.slug}`
                        : `/en/dashboard/${group.slug}/${item.slug}`;

                    return (
                      <Link
                        key={item.slug}
                        href={href}
                        className="min-h-[44px] px-[14px] py-2 rounded-[10px] text-center text-[15px] font-medium text-ink-900 bg-canvas border border-border flex items-center justify-center transition-[transform,background-color,border-color,color] duration-160 ease-out hover:-translate-y-[1px] hover:bg-green-100 hover:border-green-700 hover:text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:-translate-y-[1px] focus-visible:bg-green-100 focus-visible:border-green-700 focus-visible:text-green-900 active:translate-y-0 active:scale-[0.99] leading-snug break-words"
                      >
                        {tItem(item.labelKey as any)}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
