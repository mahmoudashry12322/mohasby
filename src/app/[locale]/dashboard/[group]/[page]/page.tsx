import React from 'react';
import { notFound } from 'next/navigation';
import { getNavItem, getAllRouteParams } from '@/lib/nav/nav.config';
import { PlaceholderPage } from '@/components/shell/PlaceholderPage';
import { ChartOfAccountsView } from '@/components/accounting/ChartOfAccountsView';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

interface PageProps {
  params: {
    locale: string;
    group: string;
    page: string;
  };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params: { locale, group, page },
}: PageProps): Promise<Metadata> {
  const match = getNavItem(group, page);
  if (!match) {
    return {
      title: locale === 'ar' ? 'الصفحة غير موجودة | محاسبي' : 'Page Not Found | Mohasby',
    };
  }

  const t = await getTranslations({ locale, namespace: 'nav.items' });
  const title = t(match.item.labelKey as any);

  return {
    title: locale === 'ar' ? `${title} | محاسبي` : `${title} | Mohasby`,
    description: match.item.descriptionKey,
  };
}

export default async function GenericDashboardPage({
  params: { locale, group, page },
}: PageProps) {
  const match = getNavItem(group, page);

  if (!match) {
    notFound();
  }

  // Chart of Accounts module
  if (group === 'accounting' && page === 'chart-of-accounts') {
    return <ChartOfAccountsView />;
  }

  const tItems = await getTranslations({ locale, namespace: 'nav.items' });
  const tDesc = await getTranslations({ locale, namespace: 'nav.descriptions' });

  const title = tItems(match.item.labelKey as any);
  const description = tDesc(match.item.descriptionKey as any);

  return (
    <PlaceholderPage
      title={title}
      description={description}
      groupSlug={group}
      pageSlug={page}
    />
  );
}

