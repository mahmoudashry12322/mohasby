'use client';

import React from 'react';
import { usePwa } from '@/contexts/PwaContext';
import { CheckCircle2, X } from 'lucide-react';
import Image from 'next/image';

export const PwaSuccessToast: React.FC = () => {
  const { isSuccessToastOpen, setIsSuccessToastOpen } = usePwa();

  if (!isSuccessToastOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-green-950 text-white rounded-2xl p-4 shadow-2xl border border-accent-500/30 flex items-start gap-3.5 animate-slide-up" dir="rtl">
      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md">
        <Image
          src="/icons/icon-192x192.png"
          alt="شعار محاسبي"
          width={40}
          height={40}
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-accent-400 font-bold text-xs mb-1">
          <CheckCircle2 className="w-4 h-4 text-accent-400" />
          <span>تم تثبيت التطبيق بنجاح!</span>
        </div>
        <p className="text-[11px] text-white/80 leading-relaxed">
          ستجد أيقونة &quot;مُحاسبي&quot; الآن على سطح المكتب أو شاشة هاتفك الرئيسية لتشغيله بنقرة واحدة كبرنامج مستقل.
        </p>
      </div>

      <button
        onClick={() => setIsSuccessToastOpen(false)}
        className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"
        aria-label="إغلاق"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
