import Link from "next/link";
import { workbookGuides } from "@/lib/accounting/workbook-guides";
export function PageGuide({ page, locale }: { page: string; locale: string }) {
  const item = workbookGuides.find((p) => p.page === page);
  if (!item) return null;
  const { guide } = item;
  return (
    <aside
      dir="rtl"
      data-page-guide={page}
      className="mb-5 rounded-xl border border-green-200 bg-green-50/60 p-4 print:hidden"
    >
      <p className="font-semibold text-green-900">
        {item.label} ·{" "}
        {guide.mode === "report"
          ? "عرض تقرير"
          : guide.mode === "schedule"
            ? "مدخلات ونتائج محسوبة"
            : "إدخال بيانات"}
      </p>
      <p className="mt-2 text-sm">{guide.steps[0]}</p>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer font-semibold text-green-800">
          إزاي أستخدم الصفحة؟
        </summary>
        <ol className="my-3 list-decimal space-y-2 pr-5">
          {guide.steps.slice(1).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-ink-700">{guide.note}</p>
        <div className="mt-3 flex flex-wrap gap-4">
          {guide.related
            .map((slug) => workbookGuides.find((p) => p.page === slug))
            .filter(Boolean)
            .map((p) => (
              <Link
                key={p!.page}
                href={`/${locale}${p!.href}`}
                className="text-green-800 underline"
              >
                {p!.label}
              </Link>
            ))}
        </div>
      </details>
    </aside>
  );
}
