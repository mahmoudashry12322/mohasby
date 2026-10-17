'use client';

import React, { useState, useEffect } from 'react';
import { usePwa } from '@/contexts/PwaContext';
import { Monitor, Smartphone, Download, X, Sparkles } from 'lucide-react';
import Image from 'next/image';

export const PwaInstallBanner: React.FC = () => {
  const {
    isInstalled,
    showBanner,
    platform,
    installApp,
    dismissBanner,
  } = usePwa();

  const [mounted, setMounted] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!showBanner) return null;

  const isDesktop = platform === 'desktop';
  const isIos = platform === 'ios';

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await installApp();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <aside
      aria-label="تثبيت تطبيق محاسبي"
      dir="rtl"
      className="fixed top-0 inset-x-0 z-50 h-[48px] sm:h-[46px] bg-gradient-to-r from-[#04100D] via-[#0D2620] to-[#1A443B] text-white border-b border-accent-500/30 shadow-[0_4px_20px_rgba(4,14,11,0.4)] flex items-center transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Right side: Icon + Badge + Description */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* App Icon Mark */}
          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm">
            <Image
              src="/icons/icon-192x192.png"
              alt="تطبيق محاسبي"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Platform Badge */}
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-500/20 border border-accent-500/40 text-accent-400 text-[10px] font-bold tracking-wide shrink-0">
            {isDesktop ? (
              <>
                <Monitor className="w-3 h-3" />
                <span>نسخة الديسكتوب والويندوز</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3 h-3" />
                <span>{isIos ? 'نسخة الآيفون' : 'تطبيق الموبايل'}</span>
              </>
            )}
          </span>

          {/* Announcement Text */}
          <div className="truncate text-xs sm:text-[13px] text-white/95">
            <span className="font-bold text-accent-400 ml-1">
              {isInstalled ? 'تطبيق مُحاسبي جاهز:' : 'حمّل تطبيقنا الآن:'}
            </span>
            {isDesktop ? (
              <span className="hidden lg:inline text-white/80">
                {isInstalled
                  ? 'التطبيق مثبت على جهازك — يمكنك تشغيله مباشرة بدون متصفح'
                  : 'تثبيت فوري بضغطة واحدة لتجربة مكتبية متكاملة وسريعة على الكمبيوتر'}
              </span>
            ) : (
              <span className="hidden sm:inline text-white/80">
                أيقونة سريعة ومباشرة على شاشتك الرئيسية كأي تطبيق أصلي
              </span>
            )}
            <span className="inline sm:hidden text-white/90">
              {isInstalled ? 'شغّل التطبيق كبرنامج مستقل' : 'ثبّت التطبيق على جهازك بضغطة واحدة'}
            </span>
          </div>
        </div>

        {/* Left side: Install CTA Button + Dismiss Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="group relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 active:scale-95 text-green-950 font-bold text-xs shadow-[0_2px_10px_rgba(40,167,143,0.35)] transition-all duration-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-green-950 group-hover:rotate-12 transition-transform" />
            <span>
              {isInstalling
                ? 'جاري التحميل...'
                : isInstalled
                  ? 'فتح / تشغيل التطبيق'
                  : 'تثبيت التطبيق الآن'}
            </span>
            <span className="hidden sm:inline text-[10px] font-normal opacity-80">
              {isInstalled ? '(مُثبّت)' : '(خطوة واحدة)'}
            </span>
          </button>

          <button
            onClick={dismissBanner}
            title="إغلاق التنبيه"
            aria-label="إغلاق التنبيه"
            className="p-1 sm:p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );
};
