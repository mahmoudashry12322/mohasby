'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export const MarqueeStrip: React.FC = () => {
  const t = useTranslations();
  const statements: string[] = t.raw('marquee');

  return (
    <div className="relative w-full bg-emerald-50/80 border-y border-emerald-200/70 py-4 overflow-hidden z-20 shadow-xs">
      {/* Side Ambient Fades */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-r from-emerald-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-l from-emerald-50 to-transparent z-10 pointer-events-none" />

      {/* Marquee Track */}
      <div className="flex whitespace-nowrap overflow-hidden">
        <div className="animate-marquee-slow flex items-center gap-8">
          {[...statements, ...statements].map((phrase, idx) => (
            <div key={idx} className="flex items-center gap-8 flex-shrink-0">
              <span className="text-xs sm:text-sm font-semibold text-green-700 tracking-wide">
                {phrase}
              </span>
              <span className="inline-flex items-center justify-center text-emerald-500 text-xs">
                ✦
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
