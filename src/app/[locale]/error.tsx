'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center p-4 text-ink-900 text-start">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-border shadow-card text-center space-y-6">
        
        <div className="flex justify-center">
          <Logo markSize={36} />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-danger-subtle text-danger mx-auto flex items-center justify-center border border-danger/20">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-danger uppercase tracking-wider font-mono">
            500 — خطأ في الخادم
          </span>
          <h1 className="font-kufi font-bold text-2xl text-ink-900">
            حدث خطأ غير متوقع
          </h1>
          <p className="text-xs text-ink-600 leading-relaxed font-light">
            تعذر إكمال العملية في الوقت الحالي. تم تسجيل التنبيه للمراجعة التقنية ولم تتأثر أي قيود أو دفاتر محاسبية.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-green-700 hover:bg-green-900 text-white font-bold text-xs shadow-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-border hover:bg-canvas text-ink-600 text-xs font-semibold transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </Link>
        </div>

      </div>
    </main>
  );
}
