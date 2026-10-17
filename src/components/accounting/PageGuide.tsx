"use client";
import React, { useState } from "react";
import Link from "next/link";
import { workbookGuides } from "@/lib/accounting/workbook-guides";

export function PageGuide({ page, locale }: { page: string; locale: string }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const item = workbookGuides.find((p) => p.page === page);
  if (!item || isDismissed) return null;
  const { guide } = item;

  return (
    <aside
      dir="rtl"
      data-page-guide={page}
      className="mb-4 rounded-xl border border-green-200 bg-green-50/60 p-3.5 print:hidden transition-all text-xs"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-green-900 text-sm">
          {item.label} ·{" "}
          {guide.mode === "report"
            ? "عرض تقرير"
            : guide.mode === "schedule"
              ? "مدخلات ونتائج محسوبة"
              : "إدخال بيانات"}
        </p>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-green-800 hover:text-green-950 text-xs px-2 py-0.5 rounded hover:bg-green-100/70 transition-colors"
          title="إخفاء لوحة الإرشادات لتوفير مساحة رأسية"
        >
          ✕ إخفاء الإرشادات
        </button>
      </div>
      <p className="mt-1.5 text-xs text-ink-700">{guide.steps[0]}</p>
      <details className="mt-1.5 text-xs">
        <summary className="cursor-pointer font-semibold text-green-800 hover:underline">
          إزاي أستخدم الصفحة؟
        </summary>
        <ol className="my-2 list-decimal space-y-1 pr-5">
          {guide.steps.slice(1).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-ink-600 mt-1">{guide.note}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {guide.related
            .map((slug) => workbookGuides.find((p) => p.page === slug))
            .filter(Boolean)
            .map((p) => (
              <Link
                key={p!.page}
                href={`/${locale}${p!.href}`}
                className="text-green-800 underline hover:text-green-950 font-medium"
              >
                {p!.label}
              </Link>
            ))}
        </div>
      </details>
    </aside>
  );
}
