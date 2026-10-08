"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Sidebar } from "./Sidebar";
import { MobileDrawer } from "./MobileDrawer";
import { CommandPalette } from "./CommandPalette";
import { Topbar } from "./Topbar";
import { PageFrame } from "./PageFrame";
import { BreadcrumbItem } from "./Breadcrumb";
import { getNavItem } from "@/lib/nav/nav.config";
import { setNavStateCookie } from "@/lib/nav/nav.state";

interface DashboardShellProps {
  children: React.ReactNode;
  initialCollapsed?: boolean;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  initialCollapsed = false,
}) => {
  const pathname = usePathname();
  const locale = useLocale();
  const tNavGroups = useTranslations("nav.groups");
  const tNavItems = useTranslations("nav.items");
  const tShell = useTranslations("shell");

  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useState(initialCollapsed);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Hydration ready flag to prevent initial cookie state transition flicker
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Toggle collapse state and persist to cookie
  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      setNavStateCookie({
        collapsed: next,
        openGroups: ["accounting"],
      });
      return next;
    });
  };

  // Global keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Parse current route from pathname
  const { isHome, activeGroupSlug, activePageSlug, pageTitle, breadcrumbs } =
    useMemo(() => {
      const clean = pathname.replace(/^\/(ar|en)/, "") || "/";
      const segments = clean.split("/").filter(Boolean); // ['dashboard', 'group', 'page']

      const homeHref = locale === "ar" ? "/dashboard" : "/en/dashboard";

      if (segments.length <= 1) {
        return {
          isHome: true,
          activeGroupSlug: undefined,
          activePageSlug: undefined,
          pageTitle: tShell("home"),
          breadcrumbs: [
            { label: tShell("home"), href: homeHref, isCurrent: true },
          ] as BreadcrumbItem[],
        };
      }

      if (segments[1] === "forbidden") {
        return {
          isHome: false,
          activeGroupSlug: undefined,
          activePageSlug: undefined,
          pageTitle: tShell("forbiddenTitle"),
          breadcrumbs: [
            { label: tShell("home"), href: homeHref },
            { label: tShell("forbiddenTitle"), isCurrent: true },
          ] as BreadcrumbItem[],
        };
      }

      const groupSlug = segments[1];
      const pageSlug = segments[2];

      const match = getNavItem(groupSlug, pageSlug);

      if (!match) {
        return {
          isHome: false,
          activeGroupSlug: groupSlug,
          activePageSlug: pageSlug,
          pageTitle: tShell("notFoundTitle"),
          breadcrumbs: [
            { label: tShell("home"), href: homeHref },
            { label: tShell("notFoundTitle"), isCurrent: true },
          ] as BreadcrumbItem[],
        };
      }

      const groupLabel = tNavGroups(match.group.labelKey as any);
      const itemLabel = tNavItems(match.item.labelKey as any);

      return {
        isHome: false,
        activeGroupSlug: match.group.slug,
        activePageSlug: match.item.slug,
        pageTitle: itemLabel,
        breadcrumbs: [
          { label: tShell("home"), href: homeHref },
          { label: groupLabel },
          { label: itemLabel, isCurrent: true },
        ] as BreadcrumbItem[],
      };
    }, [pathname, locale, tNavGroups, tNavItems, tShell]);

  return (
    <div
      data-ready={isReady ? "true" : "false"}
      className="min-h-screen flex bg-canvas text-ink-900 selection:bg-accent-500/30 selection:text-green-950"
    >
      {/* 1. Desktop Animated Sidebar */}
      <div
        className={isHome ? "hidden" : "hidden lg:block shrink-0 print:!hidden"}
      >
        <Sidebar
          activeGroupSlug={activeGroupSlug}
          activePageSlug={activePageSlug}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* 2. Mobile & Tablet Drawer (< 1024px) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeGroupSlug={activeGroupSlug}
        activePageSlug={activePageSlug}
      />

      {/* 3. Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* 4. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar
          pageTitle={pageTitle}
          breadcrumbs={breadcrumbs}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Page Content */}
        <PageFrame width={isHome ? "full" : "default"}>{children}</PageFrame>
      </div>
    </div>
  );
};
