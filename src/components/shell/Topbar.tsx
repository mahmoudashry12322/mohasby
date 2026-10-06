"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  MagnifyingGlass,
  Bell,
  User as UserIcon,
  SignOut,
  Gear,
  List,
} from "@phosphor-icons/react";
import { Breadcrumb, BreadcrumbItem } from "./Breadcrumb";

interface TopbarProps {
  pageTitle: string;
  breadcrumbs: BreadcrumbItem[];
  onOpenMobileDrawer?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  pageTitle,
  breadcrumbs,
  onOpenMobileDrawer,
  onOpenCommandPalette,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("shell");

  const [user, setUser] = useState({ name: "", email: "", role: "" });
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || { name: "", email: "", role: "" }))
      .catch(() => {});
  }, []);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Detect scroll for subtle shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Language switch handler preserving path
  const handleLocaleChange = (targetLocale: "ar" | "en") => {
    if (targetLocale === locale) return;

    let targetPath: string;
    if (targetLocale === "en") {
      targetPath = pathname.startsWith("/en") ? pathname : `/en${pathname}`;
    } else {
      targetPath = pathname.replace(/^\/en/, "") || "/dashboard";
    }
    router.push(targetPath);
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // The server still validates the session on subsequent requests
    }
    router.push("/login");
  };

  return (
    <header
      className={`sticky top-0 z-20 h-16 bg-white border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-shadow duration-200 ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      {/* 1. Start Side: Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger trigger for mobile/tablet */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="lg:hidden p-2 -ms-2 text-ink-600 hover:text-ink-900 rounded-lg focus-visible:ring-2 focus-visible:ring-accent-500"
          aria-label="Open navigation drawer"
        >
          <List size={22} weight="bold" />
        </button>

        <div className="flex flex-col min-w-0">
          <Breadcrumb items={breadcrumbs} className="hidden sm:flex" />
          <h1 className="font-kufi font-bold text-base sm:text-lg lg:text-xl text-ink-900 truncate leading-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* 2. Future Company / Fiscal Period Selector Slot */}
      <div className="hidden xl:block flex-1" aria-hidden="true" />

      {/* 3. End Side: Search, Language, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search Trigger Button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 h-9 px-3 text-xs sm:text-sm text-ink-600 bg-canvas hover:bg-border/40 border border-border rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          aria-label={t("searchPlaceholder")}
        >
          <MagnifyingGlass size={16} weight="bold" className="text-ink-600" />
          <span className="hidden md:inline font-normal text-ink-600">
            {t("searchPlaceholder")}
          </span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-ink-600 bg-white border border-border rounded shadow-2xs">
            <bdi dir="ltr">{t("searchShortcut")}</bdi>
          </kbd>
        </button>

        {/* Language Switch Segmented Button */}
        <div className="hidden sm:inline-flex items-center p-0.5 bg-canvas border border-border rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => handleLocaleChange("ar")}
            className={`px-2 py-1 rounded-md transition-colors ${
              locale === "ar"
                ? "bg-white text-green-950 font-bold shadow-2xs"
                : "text-ink-canvas hover:text-ink-900"
            }`}
          >
            عربي
          </button>
          <button
            type="button"
            onClick={() => handleLocaleChange("en")}
            className={`px-2 py-1 rounded-md transition-colors font-latin ${
              locale === "en"
                ? "bg-white text-green-950 font-bold shadow-2xs"
                : "text-ink-canvas hover:text-ink-900"
            }`}
          >
            EN
          </button>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative p-2 text-ink-600 hover:text-ink-900 hover:bg-canvas rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label={t("notifications")}
            aria-expanded={isNotificationsOpen}
          >
            <Bell size={20} weight="regular" />
            {/* Unread indicator dot */}
            <span className="absolute top-2 end-2 w-2 h-2 bg-accent-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute end-0 mt-2 w-72 bg-white border border-border rounded-xl shadow-lg p-4 z-40 origin-top-right">
                <div className="text-xs font-semibold text-ink-600 border-b border-border pb-2 mb-3">
                  {t("notifications")}
                </div>
                <div className="py-6 text-center text-sm text-ink-600">
                  {t("noNotifications")}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 sm:pe-2 hover:bg-canvas rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label={t("userProfile")}
            aria-expanded={isUserMenuOpen}
          >
            <div className="w-8 h-8 rounded-full bg-green-700 text-white font-semibold text-xs flex items-center justify-center select-none shrink-0 shadow-2xs">
              {locale === "ar" ? "مس" : "MS"}
            </div>
            <div className="hidden lg:flex flex-col text-start leading-none">
              <span className="text-xs font-bold text-ink-900 truncate">
                {user.name}
              </span>
              <span className="text-[11px] text-ink-600 mt-0.5">
                {user.role === "admin"
                  ? t("systemAdmin")
                  : user.role === "auditor"
                    ? locale === "ar"
                      ? "مراجع"
                      : "Auditor"
                    : locale === "ar"
                      ? "محاسب"
                      : "Accountant"}
              </span>
            </div>
          </button>

          {/* User Dropdown */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute end-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-lg py-1.5 z-40 origin-top-right">
                <div className="px-3.5 py-2 border-b border-border">
                  <p className="text-xs font-bold text-ink-900">{user.name}</p>
                  <p className="text-[11px] text-ink-600 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push(
                        (locale === "ar" ? "" : "/en") +
                          "/dashboard/setup/settings",
                      );
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-ink-900 hover:bg-canvas transition-colors text-start"
                  >
                    <UserIcon size={16} className="text-ink-600" />
                    <span>{t("userProfile")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push(
                        (locale === "ar" ? "" : "/en") +
                          "/dashboard/setup/settings",
                      );
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-ink-900 hover:bg-canvas transition-colors text-start"
                  >
                    <Gear size={16} className="text-ink-600" />
                    <span>{t("userSettings")}</span>
                  </button>
                </div>

                <div className="border-t border-border pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-danger hover:bg-danger/5 transition-colors text-start font-medium"
                  >
                    <SignOut size={16} className="text-danger" />
                    <span>{t("signOut")}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
