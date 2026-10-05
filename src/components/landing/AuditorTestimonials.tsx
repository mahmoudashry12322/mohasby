'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Quote, Sparkles } from 'lucide-react';

export const AuditorTestimonials: React.FC = () => {
  const t = useTranslations('testimonials');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const reviews = [
    {
      quote: t('review1Quote'),
      author: t('review1Author'),
      role: t('review1Role'),
    },
    {
      quote: t('review2Quote'),
      author: t('review2Author'),
      role: t('review2Role'),
    },
    {
      quote: t('review3Quote'),
      author: t('review3Author'),
      role: t('review3Role'),
    },
    {
      quote: t('review4Quote'),
      author: t('review4Author'),
      role: t('review4Role'),
    },
  ];

  return (
    <section id="testimonials" className="relative py-24 sm:py-32 bg-white overflow-hidden border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-green-700 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-green-700" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">{t('badge')}</span>
          </div>

          <h2 className="font-kufi text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
            {t('title')}
          </h2>
        </div>

        {/* 4 Testimonial Quote Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-7 sm:p-9 rounded-3xl bg-canvas border border-border hover:border-green-600/40 hover:bg-white hover:shadow-lg transition-all duration-300 space-y-6 flex flex-col justify-between shadow-xs text-start"
            >
              <div className="space-y-4">
                <Quote className={`w-8 h-8 text-green-700/40 ${isAr ? '' : 'rotate-180'}`} />
                <p className="text-sm sm:text-base text-ink-900 leading-relaxed font-normal">
                  &quot;{rev.quote}&quot;
                </p>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
                <div>
                  <span className="font-kufi text-xs sm:text-sm font-bold text-green-700 block">
                    {rev.author}
                  </span>
                  <span className="text-[11px] text-ink-600 font-normal mt-0.5 block">
                    {rev.role}
                  </span>
                </div>

                <span className="text-[10px] text-green-700 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 font-mono font-semibold">
                  VERIFIED CFO
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
