'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const SeparatorIcon = isRtl ? CaretLeft : CaretRight;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-ink-600 ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 && (
                <SeparatorIcon
                  size={12}
                  weight="bold"
                  className="text-ink-600/60 shrink-0 select-none"
                  aria-hidden="true"
                />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-ink-600 hover:text-green-700 transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? 'text-ink-900 font-semibold truncate max-w-[200px] sm:max-w-none'
                      : 'text-ink-600 select-none'
                  }
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
