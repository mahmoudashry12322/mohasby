import React from 'react';
import { useTranslations } from 'next-intl';

interface PageFrameProps {
  children: React.ReactNode;
  width?: 'default' | 'full';
  className?: string;
}

export const PageFrame: React.FC<PageFrameProps> = ({
  children,
  width = 'default',
  className = '',
}) => {
  const t = useTranslations('shell');

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-canvas">
      {/* Skip link for keyboard accessibility */}
      <nav aria-label="Skip navigation">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-green-700 focus:text-white focus:rounded-lg focus:shadow-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm font-semibold"
        >
          {t('skipToContent')}
        </a>
      </nav>

      <main
        id="main-content"
        className={`w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8 ${
          width === 'full' ? 'max-w-full' : 'max-w-[1440px] mx-auto'
        } ${className}`}
      >
        {children}
      </main>
    </div>
  );
};
