'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, ArrowDown, Play, CheckCircle2, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onOpenDemo?: () => void;
  onOpenVoucherDemo?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDemo, onOpenVoucherDemo }) => {
  const t = useTranslations('hero');
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-canvas to-white pt-28 pb-20">
      {/* Full-Bleed Editorial Media Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-desk.webp"
          alt="Egyptian Senior Accountant Ledger Desk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 transition-transform duration-10000 ease-out hover:scale-100 filter brightness-100 contrast-105"
        />

        {/* Editorial Light Overlays: Clean luminous gradient providing pure white clarity behind text while keeping the desk scene clearly visible */}
        <div
          className={`absolute inset-0 ${
            isAr
              ? 'bg-gradient-to-l from-white/95 via-white/75 via-45% to-white/20'
              : 'bg-gradient-to-r from-white/95 via-white/75 via-45% to-white/20'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-transparent to-white/30" />
      </div>

      {/* Atmospheric Ambient Light Flares */}
      <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-emerald-500/10 filter blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[32rem] h-[32rem] rounded-full bg-green-700/5 filter blur-[150px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 w-full pt-8 md:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left / Start Column: Narrative and CTAs */}
          <div className="lg:col-span-7 space-y-7 text-start">
            
            {/* Insignia Badge with Pulse Dot */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-green-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[11px] sm:text-xs font-semibold tracking-wide">
                {t('badge')}
              </span>
            </div>

            {/* Headline with High-End Gradient Accent */}
            <div className="space-y-3">
              <h1 className="font-kufi text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 leading-[1.25]">
                {t('titleLine1')} <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600">
                  {t('titleLine2')}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-green-700 font-semibold leading-relaxed">
                {t('subtitle')}
              </p>
            </div>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base text-ink-600 leading-relaxed max-w-2xl font-normal">
              {t('description')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onOpenDemo}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm shadow-[0_4px_16px_rgba(31,78,66,0.25)] hover:shadow-[0_6px_24px_rgba(31,78,66,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                <span>{t('exploreBtn')}</span>
              </button>

              <button
                onClick={onOpenVoucherDemo}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white border border-border text-ink-900 hover:text-green-700 hover:bg-gray-50 hover:border-green-600/40 transition-all duration-300 text-sm font-semibold shadow-xs"
              >
                <Play className="w-4 h-4 text-green-700" />
                <span>{t('demoBtn')}</span>
              </button>
            </div>

            {/* Craftsmanship Pillars / Stats Row */}
            <div className="pt-6 border-t border-border grid grid-cols-3 gap-4 max-w-xl">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-700 font-kufi">{t('stat1')}</p>
                <p className="text-[11px] sm:text-xs text-ink-600 mt-1">{t('stat1Label')}</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-700 font-kufi">{t('stat2')}</p>
                <p className="text-[11px] sm:text-xs text-ink-600 mt-1">{t('stat2Label')}</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-700 font-kufi">{t('stat3')}</p>
                <p className="text-[11px] sm:text-xs text-ink-600 mt-1">{t('stat3Label')}</p>
              </div>
            </div>

          </div>

          {/* Right / End Column: Authentic Live Journal Voucher Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl bg-white p-6 sm:p-7 shadow-[0_20px_50px_rgba(7,28,24,0.08)] border border-border overflow-hidden space-y-5">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                    <h3 className="font-kufi font-bold text-sm text-ink-900">{t('voucherTitle')}</h3>
                  </div>
                  <p className="text-[11px] text-ink-600">{t('voucherDate')}</p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-green-700 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                  <span>{t('balancedBadge')}</span>
                </div>
              </div>

              {/* Journal Table Lines with Strict Accounting Rules */}
              <div className="space-y-3 text-xs">
                
                {/* Debit Line 1 */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="font-medium text-ink-900">{t('debit1Label')}</span>
                  <span className="tabular-nums font-semibold text-green-700">
                    {t('debit1Amount')} <span className="text-[10px] text-ink-600 font-normal">{t('currency')}</span>
                  </span>
                </div>

                {/* Debit Line 2 */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="font-medium text-ink-900">{t('debit2Label')}</span>
                  <span className="tabular-nums font-semibold text-green-700">
                    {t('debit2Amount')} <span className="text-[10px] text-ink-600 font-normal">{t('currency')}</span>
                  </span>
                </div>

                {/* Credit Line 1 */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="font-medium text-ink-900">{t('credit1Label')}</span>
                  <span className="tabular-nums font-semibold text-green-700">
                    {t('credit1Amount')} <span className="text-[10px] text-ink-600 font-normal">{t('currency')}</span>
                  </span>
                </div>
              </div>

              {/* Accounting Double-Rule Grand Totals */}
              <div className="accounting-double-rule pt-3 pb-2 flex items-center justify-between font-bold text-sm bg-canvas px-3 rounded-lg border border-border/50">
                <span className="text-ink-900 font-kufi">إجمالي الطرفين (متزن)</span>
                <div className="flex items-center gap-4 tabular-nums">
                  <span className="text-green-700 font-bold">{t('totalDebit')}</span>
                  <span className="text-border">|</span>
                  <span className="text-green-700 font-bold">{t('totalCredit')} {t('currency')}</span>
                </div>
              </div>

              {/* Security Seal */}
              <div className="flex items-center justify-between text-[11px] text-ink-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  <span>توقيع إلكتروني مشفر • غير قابل للتعديل بعد الترحيل</span>
                </div>
                <span className="font-mono text-[10px] text-ink-400">ETA-V4</span>
              </div>

            </div>

            {/* Glowing Backdrop Behind Card */}
            <div className="absolute -inset-2 rounded-3xl bg-emerald-500/10 filter blur-xl -z-10" />
          </div>

        </div>
      </div>

      {/* Floating Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 pointer-events-none opacity-75 animate-bounce">
        <span className="text-[10px] font-semibold text-ink-400">{t('scroll')}</span>
        <ArrowDown className="w-3.5 h-3.5 text-green-700" />
      </div>
    </section>
  );
};
