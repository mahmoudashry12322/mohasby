import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function ForbiddenPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center p-4 text-ink-900 text-start">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-border shadow-card text-center space-y-6">
        
        <div className="flex justify-center">
          <Logo markSize={36} />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-danger-subtle text-danger mx-auto flex items-center justify-center border border-danger/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-danger uppercase tracking-wider font-mono">
            403 — غير مصرح بالدخول
          </span>
          <h1 className="font-kufi font-bold text-2xl text-ink-900">
            صلاحيات الحساب غير كافية
          </h1>
          <p className="text-xs text-ink-600 leading-relaxed font-light">
            ليس لديك تصريح للوصول إلى هذا الدفتر المالي أو السجل المحاسبي. يرجى تسجيل الدخول بحساب يمتلك صلاحيات الإدارة أو المراجعة.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={`/${locale}/login`}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-green-700 hover:bg-green-900 text-white font-bold text-xs shadow-md transition-colors"
          >
            <span>تسجيل الدخول بحساب مصرح</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>

      </div>
    </main>
  );
}
