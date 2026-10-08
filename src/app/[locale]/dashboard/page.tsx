"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import buttons from "@/data/workbook-home.json";

export default function DashboardHomePage() {
  const locale = useLocale();
  const t = useTranslations("nav.items");
  return (
    <section
      aria-label={locale === "ar" ? "الصفحة الرئيسية للبرنامج" : "Program home"}
      dir="rtl"
    >
      <nav
        aria-label={locale === "ar" ? "أزرار البرنامج" : "Workbook navigation"}
        className="workbook-home"
      >
        {buttons.map((button) => (
          <Link
            key={button.cell}
            data-workbook-cell={button.cell}
            href={`/${locale}/dashboard/${button.group}/${button.page}`}
            style={
              {
                "--workbook-column": button.column,
                "--workbook-row": button.row,
              } as React.CSSProperties
            }
            className="workbook-button"
          >
            {locale === "ar" ? button.label : t(button.labelKey as never)}
          </Link>
        ))}
      </nav>
    </section>
  );
}
