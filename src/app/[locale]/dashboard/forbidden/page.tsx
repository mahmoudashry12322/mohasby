'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { PageHeader } from '@/components/shell/PageHeader';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';

export default function DashboardForbidden() {
  const t = useTranslations('shell');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const homeHref = locale === 'ar' ? '/dashboard' : '/en/dashboard';

  return (
    <div className="w-full">
      <PageHeader
        title={t('forbiddenTitle')}
        description=""
      />

      <div className="mt-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-xl bg-white border border-border rounded-xl p-8 sm:p-12 shadow-sm text-center">
          <h2 className="font-kufi font-bold text-xl sm:text-2xl text-ink-900 mb-3">
            {t('forbiddenTitle')}
          </h2>

          <p className="text-ink-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-8">
            {t('forbiddenDesc')}
          </p>

          <Link href={homeHref}>
            <Button variant="ghost" className="gap-2">
              {!isRtl && <BackIcon size={16} />}
              <span>{t('backHome')}</span>
              {isRtl && <BackIcon size={16} />}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
