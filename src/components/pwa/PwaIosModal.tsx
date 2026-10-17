'use client';

import React from 'react';
import { usePwa } from '@/contexts/PwaContext';
import { Share2, PlusSquare, X, Smartphone, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export const PwaIosModal: React.FC = () => {
  const { isIosModalOpen, setIsIosModalOpen, platform } = usePwa();

  if (!isIosModalOpen) return null;

  const isIos = platform === 'ios';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border p-6 text-ink-900 overflow-hidden animate-slide-up"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={() => setIsIosModalOpen(false)}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-canvas transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Logo */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0">
            <Image
              src="/icons/icon-192x192.png"
              alt="شعار محاسبي"
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-bold text-base text-green-950 font-kufi">
              {isIos ? 'تثبيت تطبيق مُحاسبي على الآيفون' : 'تثبيت تطبيق مُحاسبي'}
            </h3>
            <p className="text-xs text-ink-600">
              خطوة واحدة للحصول على التطبيق على شاشتك الرئيسية
            </p>
          </div>
        </div>

        {/* Steps */}
        {isIos ? (
          <div className="space-y-3.5 mb-6 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-canvas border border-border/80">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-800 flex items-center justify-center shrink-0 font-bold text-sm">
                1
              </div>
              <div className="text-xs text-ink-900 leading-relaxed pt-1">
                اضغط على زر المشاركة{' '}
                <span className="inline-flex items-center gap-1 font-bold text-green-800 bg-white px-2 py-0.5 rounded border border-border">
                  <Share2 className="w-3.5 h-3.5" /> مشاركة
                </span>{' '}
                في شريط متصفح Safari السفلي.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-canvas border border-border/80">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-800 flex items-center justify-center shrink-0 font-bold text-sm">
                2
              </div>
              <div className="text-xs text-ink-900 leading-relaxed pt-1">
                اسحب للأعلى واضغط على{' '}
                <span className="inline-flex items-center gap-1 font-bold text-green-800 bg-white px-2 py-0.5 rounded border border-border">
                  <PlusSquare className="w-3.5 h-3.5" /> إضافة إلى الصفحة الرئيسية
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-canvas border border-border/80">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-800 flex items-center justify-center shrink-0 font-bold text-sm">
                3
              </div>
              <div className="text-xs text-ink-900 leading-relaxed pt-1">
                اضغط على <span className="font-bold text-green-800">إضافة (Add)</span> في الزاوية العلوية، وستظهر أيقونة التطبيق فوراً على شاشة هاتفك!
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-6 text-xs text-ink-600 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-canvas border border-border flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink-900 mb-1">تثبيت التطبيق على جهازك</p>
                <p>
                  يمكنك تثبيت تطبيق مُحاسبي مباشرة من خلال شريط عنوان المتصفح بالضغط على أيقونة التثبيت (⊕) أو من قائمة المتصفح واختيار &quot;تثبيت التطبيق&quot;.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits reminder */}
        <div className="flex items-center gap-2 text-[11px] text-green-800 bg-green-50/80 p-2.5 rounded-lg border border-green-200/60 mb-5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-accent-500" />
          <span>يعمل بدون شريط متصفح وبسرعة فائقة مع إمكانية الوصول المباشر من الشاشة.</span>
        </div>

        {/* Confirm Button */}
        <button
          onClick={() => setIsIosModalOpen(false)}
          className="w-full py-2.5 px-4 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
        >
          فهمت، حسناً
        </button>
      </div>
    </div>
  );
};
