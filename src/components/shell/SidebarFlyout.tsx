'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { NavGroup } from '@/lib/nav/nav.config';

interface SidebarFlyoutProps {
  group: NavGroup;
  activeGroupSlug?: string;
  activePageSlug?: string;
  topPosition: number;
  onClose: (restoreFocus?: boolean) => void;
}

export const SidebarFlyout: React.FC<SidebarFlyoutProps> = ({
  group,
  activeGroupSlug,
  activePageSlug,
  topPosition,
  onClose,
}) => {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const tGroup = useTranslations('nav.groups');
  const tItem = useTranslations('nav.items');

  const flyoutRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  const isGroupActive = activeGroupSlug === group.slug;

  // Clamp vertical position within viewport
  const clampedTop = Math.max(16, Math.min(topPosition - 20, typeof window !== 'undefined' ? window.innerHeight - 380 : topPosition));

  // Keyboard navigation: ArrowUp, ArrowDown, Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(true);
        return;
      }

      const activeEl = document.activeElement;
      const currentIndex = itemsRef.current.findIndex((el) => el === activeEl);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < itemsRef.current.length - 1 ? currentIndex + 1 : 0;
        itemsRef.current[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : itemsRef.current.length - 1;
        itemsRef.current[prevIndex]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        onClose(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={flyoutRef}
      style={{ top: `${clampedTop}px` }}
      className={`fixed z-50 w-[264px] bg-white border border-border rounded-xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150 select-none ${
        isRtl ? 'right-[84px]' : 'left-[84px]'
      }`}
      role="menu"
      aria-label={tGroup(group.labelKey as any)}
    >
      {/* Flyout Header */}
      <div className="px-4 py-2 border-b border-border/80 mb-1">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-ink-600">
          {tGroup(group.labelKey as any)}
        </h3>
      </div>

      {/* Flyout Items with Hairlines */}
      <div className="max-h-[70vh] overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin">
        {group.items.map((item, index) => {
          const prevItem = index > 0 ? group.items[index - 1] : null;
          const showHairline =
            prevItem &&
            prevItem.cluster !== undefined &&
            item.cluster !== undefined &&
            prevItem.cluster !== item.cluster;

          const isItemActive = isGroupActive && activePageSlug === item.slug;
          const href =
            locale === 'ar'
              ? `/dashboard/${group.slug}/${item.slug}`
              : `/en/dashboard/${group.slug}/${item.slug}`;

          return (
            <React.Fragment key={item.slug}>
              {showHairline && (
                <div className="border-t border-border/60 my-1.5 mx-2" role="separator" />
              )}
              <Link
                ref={(el) => {
                  itemsRef.current[index] = el;
                }}
                href={href}
                onClick={() => onClose(false)}
                role="menuitem"
                className={`relative flex items-center min-h-[38px] px-3 py-1.5 text-xs sm:text-[13px] leading-snug rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${
                  isItemActive
                    ? 'font-semibold text-green-950 bg-green-700/10 before:absolute before:start-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-green-700 before:rounded-full'
                    : 'text-ink-900 hover:text-green-950 hover:bg-canvas'
                }`}
                aria-current={isItemActive ? 'page' : undefined}
              >
                <span className="truncate">{tItem(item.labelKey as any)}</span>
              </Link>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
