import React from "react";
import { cookies } from "next/headers";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { parseNavCookie, NAV_COOKIE_NAME } from "@/lib/nav/nav.state";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { PermissionsProvider } from "@/components/auth/PermissionsProvider";

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
  const user = await currentUser();
  if (!user) redirect("/login");
  const cookieStore = await cookies();
  const navCookie = cookieStore.get(NAV_COOKIE_NAME)?.value;
  const navState = parseNavCookie(navCookie);

  const u = user as any;
  const initialUser = {
    id: user.id,
    companyId: user.companyId,
    role: user.role,
    isActive: user.isActive,
    permissions: Array.isArray(u.permissions)
      ? (u.permissions as string[])
      : [],
    name: user.name,
    username: u.username || null,
    email: user.email,
    company: { name: user.company.name },
  };

  return (
    <PermissionsProvider initialUser={initialUser}>
      <DashboardShell
        initialCollapsed={navState.collapsed}
        userRole={user.role}
      >
        {children}
      </DashboardShell>
    </PermissionsProvider>
  );
}
