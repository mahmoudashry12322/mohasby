import React from "react";
import { notFound } from "next/navigation";
import { getNavItem, getAllRouteParams } from "@/lib/nav/nav.config";
import { modules } from "@/lib/accounting/modules";
import { ModuleView } from "@/components/accounting/ModuleView";
import { ChartOfAccountsView } from "@/components/accounting/ChartOfAccountsView";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    locale: string;
    group: string;
    page: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, group, page } = await params;
  const match = getNavItem(group, page);
  if (!match) {
    return {
      title:
        locale === "ar"
          ? "الصفحة غير موجودة | محاسبي"
          : "Page Not Found | Mohasby",
    };
  }

  const t = await getTranslations({ locale, namespace: "nav.items" });
  const title = t(match.item.labelKey as any);

  return {
    title: locale === "ar" ? `${title} | محاسبي` : `${title} | Mohasby`,
    description: match.item.descriptionKey,
  };
}

export default async function GenericDashboardPage({ params }: PageProps) {
  const { locale, group, page } = await params;
  const match = getNavItem(group, page);

  if (!match) {
    notFound();
  }

  // Chart of Accounts module
  if (group === "accounting" && page === "chart-of-accounts") {
    return <ChartOfAccountsView />;
  }

  const tItems = await getTranslations({ locale, namespace: "nav.items" });
  const tDesc = await getTranslations({
    locale,
    namespace: "nav.descriptions",
  });

  const title = tItems(match.item.labelKey as any);
  const description = tDesc(match.item.descriptionKey as any);

  const workflow = modules[page];
  if (!workflow) notFound();
  return <ModuleView key={page} module={workflow} title={title} />;
}
