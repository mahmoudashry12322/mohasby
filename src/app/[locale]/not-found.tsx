import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { FileQuestion, ArrowRight } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center p-4 text-ink-900 text-start">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-border shadow-card text-center space-y-6">
        
        <div className="flex justify-center">
          <Logo markSize={36} />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-canvas text-ink-600 mx-auto flex items-center justify-center border border-border">
          <FileQuestion className="w-8 h-8 text-green-700" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-green-700 uppercase tracking-wider font-mono">
            404 — الصفحة غير موجودة
          </span>
          <h1 className="font-kufi font-bold text-2xl text-ink-900">
            السند أو الرابط غير متاح
          </h1>
          <p className="text-xs text-ink-600 leading-relaxed font-light">
            الصفحة التي تحاول الوصول إليها قد تم نقلها أو حذفها، أو أن رقم المستند غير صحيح.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-green-700 hover:bg-green-900 text-white font-bold text-xs shadow-md transition-colors"
          >
            <span>العودة إلى الصفحة الرئيسية</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>

      </div>
    </main>
  );
}
