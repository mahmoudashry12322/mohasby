"use client";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  useEffect(() => {
    console.error("Dashboard rendering error", error);
  }, [error]);
  return (
    <section
      role="alert"
      dir="rtl"
      className="rounded-xl border border-red-200 bg-white p-6 space-y-4"
    >
      <h1 className="text-xl font-bold">تعذر عرض هذه الصفحة</h1>
      <p>
        اضغط إعادة المحاولة. لو حدث الخطأ أثناء الحفظ، راجع السجلات قبل تكرار
        العملية.
      </p>
      {error.digest && <p className="text-sm">مرجع الخطأ: {error.digest}</p>}
      <div className="flex gap-4">
        <button
          className="rounded-lg bg-green-700 px-4 py-2 text-white"
          onClick={reset}
        >
          إعادة المحاولة
        </button>
        <Link
          className="rounded-lg border px-4 py-2"
          href={`/${locale}/dashboard`}
        >
          لوحة التحكم
        </Link>
      </div>
    </section>
  );
}
