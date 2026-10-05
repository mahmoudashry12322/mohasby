'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const BrandPanel: React.FC = () => {
  const t = useTranslations('loginPage');
  const [animationStep, setAnimationStep] = useState<number>(0);

  useEffect(() => {
    // Self-writing balanced voucher chip sequence once on load per Part 9.1
    const t1 = setTimeout(() => setAnimationStep(1), 300);  // Title
    const t2 = setTimeout(() => setAnimationStep(2), 700);  // Debit line
    const t3 = setTimeout(() => setAnimationStep(3), 1100); // Credit line
    const t4 = setTimeout(() => setAnimationStep(4), 1500); // Double-rule & Balanced tick

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div className="relative w-full lg:flex-1 h-auto lg:h-full lg:min-h-screen bg-green-900 ledger-ruled-dark px-6 py-4 sm:py-5 lg:p-16 flex flex-col justify-between overflow-hidden text-start">
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 right-10 w-80 h-80 rounded-full bg-accent-500/10 filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-green-700/20 filter blur-[140px] pointer-events-none" />

      {/* Mobile Header (<lg): Logo + single-line tagline (collapses to ~100-120px header) */}
      <div className="lg:hidden relative z-10 flex items-center justify-between gap-4 py-2">
        <Logo theme="white" markSize={30} />
        <span className="text-xs text-accent-500 font-bold font-kufi">{t('brandLine')}</span>
      </div>

      {/* Desktop Top Section (lg+): Large Logo */}
      <div className="hidden lg:block relative z-10 space-y-4">
        <Logo theme="white" markSize={42} />
      </div>

      {/* Desktop Center Section (lg+): Headline and Self-writing Balanced Entry Chip */}
      <div className="hidden lg:block relative z-10 my-auto py-8 space-y-8 max-w-lg">
        <div className="space-y-3">
          <h1 className="font-kufi text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            {t('brandLine')}
          </h1>
          <p className="text-sm sm:text-base text-accent-500/90 font-medium leading-relaxed">
            {t('brandSub')}
          </p>
        </div>

        {/* Self-writing Balanced Entry Chip (Part 9.1 Signature) */}
        <div className="rounded-2xl bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-[0_20px_50px_rgba(4,14,11,0.5)] border border-white/20 text-ink-900 space-y-3 transition-all duration-500">
          
          {/* Voucher Header */}
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <span className="font-kufi font-bold text-xs text-ink-900">
              {animationStep >= 1 ? t('chipTitle') : '...'}
            </span>
            {animationStep >= 4 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success bg-success-subtle px-2 py-0.5 rounded-md animate-fade-in border border-success/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('chipBalanced')}</span>
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
            )}
          </div>

          {/* Lines */}
          <div className="space-y-2 text-xs">
            {animationStep >= 2 && (
              <div className="flex items-center justify-between animate-fade-in">
                <span className="text-ink-600">{t('chipDebit')}</span>
                <span className="tabular-nums font-semibold text-green-700">
                  {t('chipDebitAmount')}
                </span>
              </div>
            )}

            {animationStep >= 3 && (
              <div className="flex items-center justify-between animate-fade-in">
                <span className="text-ink-600">{t('chipCredit')}</span>
                <span className="tabular-nums font-semibold text-ink-900">
                  {t('chipCreditAmount')}
                </span>
              </div>
            )}
          </div>

          {/* Double-rule equilibrium */}
          {animationStep >= 4 && (
            <div className="accounting-double-rule pt-2 flex items-center justify-between text-xs font-bold bg-canvas/70 px-2.5 py-1.5 rounded animate-fade-in">
              <span className="text-ink-900">تطابق الرصيدين</span>
              <span className="tabular-nums text-green-700 font-mono">1,000,000.00 ج.م</span>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Bottom Section (lg+): Security & Audit Stamp */}
      <div className="hidden lg:flex relative z-10 pt-4 border-t border-green-800/80 items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent-500" />
          <span>{t('brandAudit')}</span>
        </div>
        <span className="font-mono text-[10px] text-white/40">TLS 1.3</span>
      </div>
    </div>
  );
};
