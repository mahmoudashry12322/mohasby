'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, Scale, Warehouse, Receipt, ShieldCheck } from 'lucide-react';

export const AuditHeritage: React.FC = () => {
  const t = useTranslations('heritage');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const pillars = [
    {
      icon: Scale,
      title: t('pillar1Title'),
      desc: t('pillar1Desc'),
    },
    {
      icon: Warehouse,
      title: t('pillar2Title'),
      desc: t('pillar2Desc'),
    },
    {
      icon: Receipt,
      title: t('pillar3Title'),
      desc: t('pillar3Desc'),
    },
    {
      icon: ShieldCheck,
      title: t('pillar4Title'),
      desc: t('pillar4Desc'),
    },
  ];

  return (
    <section id="heritage" className="relative py-24 sm:py-32 bg-canvas overflow-hidden border-t border-border">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 right-0 w-[35rem] h-[35rem] rounded-full bg-emerald-500/5 filter blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Editorial Split Header & Heritage Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Column: Documentary Photography & Floating Quote Stamp */}
          <div className="lg:col-span-6 relative">
            <div className="relative h-[420px] sm:h-[520px] w-full rounded-3xl overflow-hidden border border-border shadow-lg">
              <Image
                src="/images/storage.webp"
                alt="Sadat City Produce Cold Storage Facility"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-1000 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Floating Quote Stamp */}
              <div className="absolute bottom-6 left-6 right-6 p-5 sm:p-6 rounded-2xl bg-white/95 border border-border/80 backdrop-blur-md shadow-xl text-start">
                <p className="text-xs sm:text-sm text-ink-900 leading-relaxed font-normal">
                  &quot;{t('quote')}&quot;
                </p>
                <span className="text-[10px] text-green-700 uppercase tracking-wider block mt-2 font-bold">
                  {t('author')}
                </span>
              </div>
            </div>

            {/* Accent Floating Insignia Stamp */}
            <div className="hidden sm:flex absolute -top-5 -right-5 w-24 h-24 rounded-full bg-emerald-50 border-2 border-green-700/30 items-center justify-center p-3 shadow-lg">
              <span className="font-kufi text-green-700 text-[10px] text-center font-bold leading-tight">
                {isAr ? 'معايير مصرية معتمدة' : 'EAS Standards'}
              </span>
            </div>
          </div>

          {/* Right Column: Narrative & 4 Pillars of Excellence */}
          <div className="lg:col-span-6 space-y-8 text-start">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-green-700 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-green-700" />
                <span className="text-[11px] uppercase tracking-wider font-semibold">{t('badge')}</span>
              </div>

              <h2 className="font-kufi text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
                {t('title')}
              </h2>

              <p className="text-sm sm:text-base text-ink-600 font-normal leading-relaxed">
                {t('subtitle')}
              </p>
            </div>

            {/* 4 Pillars of Excellence Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {pillars.map((pillar, idx) => {
                const PIcon = pillar.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-border hover:border-green-600/40 hover:shadow-md transition-all duration-300 space-y-2.5 shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-green-700 flex items-center justify-center">
                      <PIcon className="w-4 h-4" />
                    </div>
                    <h4 className="font-kufi font-bold text-sm text-ink-900">
                      {pillar.title}
                    </h4>
                    <p className="text-xs text-ink-600 font-normal leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
