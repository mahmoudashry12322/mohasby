'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Languages } from 'lucide-react';

export const FloatingLanguageToggle: React.FC = () => {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const targetLocale = isAr ? 'en' : 'ar';

  return (
    <aside
      aria-label={isAr ? 'تبديل اللغة السريع' : 'Quick language switcher'}
      className={`hidden md:block fixed bottom-6 ${isAr ? 'left-6' : 'right-6'} z-30`}
    >
      <Link
        href={`/${targetLocale}`}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-950/90 hover:bg-green-900 border border-accent-500/40 text-accent-500 hover:text-white shadow-[0_10px_30px_rgba(4,14,11,0.8)] backdrop-blur-md text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <Languages className="w-4 h-4 text-accent-500" />
        <span>{isAr ? 'English' : 'العربية'}</span>
      </Link>
    </aside>
  );
};
