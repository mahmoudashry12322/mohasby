'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { PageHeader } from './PageHeader';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { recordRecentPage } from '@/lib/nav/recent';

interface PlaceholderPageProps {
  title: string;
  description: string;
  groupSlug?: string;
  pageSlug?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  groupSlug,
  pageSlug,
}) => {
  const t = useTranslations('shell');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const homeHref = locale === 'ar' ? '/dashboard' : '/en/dashboard';

  // Automatically record visited page to recent list
  useEffect(() => {
    if (groupSlug && pageSlug) {
      recordRecentPage(groupSlug, pageSlug);
    }
  }, [groupSlug, pageSlug]);

  return (
    <div className="w-full">
      <PageHeader title={title} description={description} />

      <div className="mt-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-xl bg-white border border-border rounded-xl p-8 sm:p-12 shadow-sm text-center">
          <h2 className="font-kufi font-bold text-xl sm:text-2xl text-ink-900 mb-3">
            {t('inProgress')}
          </h2>

          <p className="text-ink-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-8">
            {description}
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
};
