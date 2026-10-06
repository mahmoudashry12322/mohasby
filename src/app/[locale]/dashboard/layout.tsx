import React from "react";
import { cookies } from "next/headers";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { parseNavCookie, NAV_COOKIE_NAME } from "@/lib/nav/nav.state";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: {
    default: "الرئيسية | محاسبي",
    template: "%s | محاسبي",
  },
  description:
    "لوحة تحكم محاسبي — المنظومة المحاسبية المتكاملة للشركات التجارية والتبريد والتخزين.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await currentUser())) redirect("/login");
  const cookieStore = await cookies();
  const navCookie = cookieStore.get(NAV_COOKIE_NAME)?.value;
  const navState = parseNavCookie(navCookie);

  return (
    <DashboardShell initialCollapsed={navState.collapsed}>
      {children}
    </DashboardShell>
  );
}
