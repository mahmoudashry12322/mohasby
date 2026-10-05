'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import clsx from 'clsx';

export interface LanguageSwitchProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const LanguageSwitch: React.FC<LanguageSwitchProps> = ({
  className,
  variant = 'light',
}) => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleSwitch = (newLocale: 'ar' | 'en') => {
    if (newLocale === locale) return;
    document.cookie = `mohasby_lang=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(pathname, { locale: newLocale });
  };

  const isDark = variant === 'dark';

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={clsx(
        'inline-flex items-center rounded-full p-1 text-[13px] font-sans font-medium select-none border transition-colors',
        isDark
          ? 'bg-green-900/90 border-green-700/60 text-white'
          : 'bg-white border-border text-ink-900 shadow-sm',
        className
      )}
    >
      <button
        type="button"
        onClick={() => handleSwitch('en')}
        className={clsx(
          'px-2.5 py-1 rounded-full text-[12px] font-medium transition-all duration-160',
          locale === 'en'
            ? isDark
              ? 'bg-accent-500 text-green-950 font-bold shadow-inner-light'
              : 'bg-green-700 text-white font-semibold'
            : isDark
            ? 'text-white/70 hover:text-white'
            : 'text-ink-600 hover:text-ink-900'
        )}
      >
        EN
      </button>

      <span
        className={clsx(
          'mx-1 w-px h-3',
          isDark ? 'bg-green-700' : 'bg-border'
        )}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={() => handleSwitch('ar')}
        className={clsx(
          'px-2.5 py-1 rounded-full text-[12px] font-medium transition-all duration-160',
          locale === 'ar'
            ? isDark
              ? 'bg-accent-500 text-green-950 font-bold shadow-inner-light'
              : 'bg-green-700 text-white font-semibold'
            : isDark
            ? 'text-white/70 hover:text-white'
            : 'text-ink-600 hover:text-ink-900'
        )}
      >
        عربي
      </button>
    </div>
  );
};
