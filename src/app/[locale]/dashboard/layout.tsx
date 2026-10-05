import React from 'react';
import { cookies } from 'next/headers';
import { DashboardShell } from '@/components/shell/DashboardShell';
import { parseNavCookie, NAV_COOKIE_NAME } from '@/lib/nav/nav.state';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'الرئيسية | محاسبي',
    template: '%s | محاسبي',
  },
  description: 'لوحة تحكم محاسبي — المنظومة المحاسبية المتكاملة للشركات التجارية والتبريد والتخزين.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const navCookie = cookieStore.get(NAV_COOKIE_NAME)?.value;
  const navState = parseNavCookie(navCookie);

  return (
    <DashboardShell initialCollapsed={navState.collapsed}>
      {children}
    </DashboardShell>
  );
}
