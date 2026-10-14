"use client";
import React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import buttons from "@/data/workbook-home.json";
import { usePermissions } from "@/components/auth/PermissionsProvider";

export default function DashboardHomePage() {
  const locale = useLocale();
  const t = useTranslations("nav.items");
  const { isAdmin, canPage, isLoading } = usePermissions();

  // For manager: preserves all 45 Excel buttons in original layout.
  // For employee: filters to permitted subset without gaps in dashboard grid.
  const visibleButtons = isAdmin
    ? buttons
    : buttons.filter((b) => canPage(b.page));

  const isRepacked = !isAdmin && visibleButtons.length < buttons.length;

  return (
    <section
      aria-label={locale === "ar" ? "الصفحة الرئيسية للبرنامج" : "Program home"}
      dir="rtl"
    >
      {visibleButtons.length === 0 && !isLoading ? (
        <div className="bg-white border border-border rounded-xl p-8 text-center max-w-md mx-auto my-12">
          <h3 className="font-bold text-sm text-ink-900 mb-2">
            {locale === "ar"
              ? "لم يتم تفعيل صلاحيات شاشات بعد"
              : "No page permissions assigned yet"}
          </h3>
          <p className="text-xs text-ink-500 leading-relaxed">
            {locale === "ar"
              ? "يرجى مراجعة مدير النظام لمنحك صلاحيات الوصول للشاشات والعمليات المطلوبة."
              : "Please contact your system administrator to grant you access to the required pages."}
          </p>
        </div>
      ) : (
        <nav
          aria-label={locale === "ar" ? "أزرار البرنامج" : "Workbook navigation"}
          className={`workbook-home ${isRepacked ? "workbook-repacked" : ""}`}
        >
          {visibleButtons.map((button) => (
            <Link
              key={button.cell}
              data-workbook-cell={button.cell}
              href={`/${locale}/dashboard/${button.group}/${button.page}`}
              style={
                !isRepacked
                  ? ({
                      "--workbook-column": button.column,
                      "--workbook-row": button.row,
                    } as React.CSSProperties)
                  : undefined
              }
              className="workbook-button"
            >
              {locale === "ar" ? button.label : t(button.labelKey as never)}
            </Link>
          ))}
        </nav>
      )}
    </section>
  );
}
