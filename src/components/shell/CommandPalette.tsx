'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { MagnifyingGlass, X, Clock, ArrowRight, ArrowLeft } from '@phosphor-icons/react';
import { searchNavItems, SearchResultItem } from '@/lib/nav/search';
import { NAV_GROUPS } from '@/lib/nav/nav.config';
import { useRecentPages, recordRecentPage, RecentPageDetail } from '@/lib/nav/recent';
import arMessages from '../../../messages/ar.json';
import enMessages from '../../../messages/en.json';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const tGroup = useTranslations('nav.groups');
  const tItem = useTranslations('nav.items');
  const tShell = useTranslations('shell');

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const EnterIcon = isRtl ? ArrowLeft : ArrowRight;

  const recentPages = useRecentPages();

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchNavItems(query, arMessages, enMessages);
  }, [query]);

  // Default suggestions when query is empty: recent pages or top essential pages
  const defaultItems = useMemo(() => {
    if (recentPages.length > 0) {
      return recentPages.map(({ group, item }: RecentPageDetail) => ({
        group,
        item,
        labelAr: (arMessages.nav.items as any)[item.labelKey] || '',
        labelEn: (enMessages.nav.items as any)[item.labelKey] || '',
        descAr: (arMessages.nav.descriptions as any)[item.descriptionKey] || '',
        descEn: (enMessages.nav.descriptions as any)[item.descriptionKey] || '',
        score: 1,
      })) as SearchResultItem[];
    }

    const defaultSlugs = [
      { group: 'accounting', page: 'journal-entries' },
      { group: 'accounting', page: 'chart-of-accounts' },
      { group: 'accounting', page: 'trial-balance' },
      { group: 'warehouses', page: 'warehouse-journal' },
      { group: 'cold-storage', page: 'cold-storage-journal' },
    ];

    return defaultSlugs
      .map(({ group, page }) => {
        const g = NAV_GROUPS.find((grp) => grp.slug === group);
        const item = g?.items.find((it) => it.slug === page);
        if (!g || !item) return null;
        return {
          group: g,
          item,
          labelAr: (arMessages.nav.items as any)[item.labelKey] || '',
          labelEn: (enMessages.nav.items as any)[item.labelKey] || '',
          descAr: (arMessages.nav.descriptions as any)[item.descriptionKey] || '',
          descEn: (enMessages.nav.descriptions as any)[item.descriptionKey] || '',
          score: 1,
        } as SearchResultItem;
      })
      .filter(Boolean) as SearchResultItem[];
  }, [recentPages]);

  const displayedItems = query.trim() ? searchResults : defaultItems;

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard shortcut (Ctrl/Cmd + K) globally
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < displayedItems.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayedItems.length - 1));
        } else if (e.key === 'Enter') {
          if (displayedItems[selectedIndex]) {
            e.preventDefault();
            handleSelect(displayedItems[selectedIndex]);
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, displayedItems, selectedIndex, onClose]);

  const handleSelect = (result: SearchResultItem) => {
    recordRecentPage(result.group.slug, result.item.slug);
    const href =
      locale === 'ar'
        ? `/dashboard/${result.group.slug}/${result.item.slug}`
        : `/en/dashboard/${result.group.slug}/${result.item.slug}`;
    onClose();
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-0 sm:pt-20 px-0 sm:px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-green-950/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Modal */}
      <div
        className="relative z-10 w-full sm:max-w-[560px] h-full sm:h-auto max-h-full sm:max-h-[520px] bg-white sm:rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Search pages"
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-border bg-canvas/40 shrink-0">
          <MagnifyingGlass size={20} weight="bold" className="text-ink-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              locale === 'ar'
                ? 'ابحث عن أي دفتر، كشف، أو قائمة مالية...'
                : 'Search journals, statements, or accounting pages...'
            }
            className="flex-1 bg-transparent text-sm sm:text-base text-ink-900 placeholder:text-ink-600 outline-none border-none p-0 focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-ink-600 hover:text-ink-900 rounded-md"
              aria-label="Clear query"
            >
              <X size={16} weight="bold" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden p-1 text-ink-600 hover:text-ink-900 rounded-md"
            aria-label="Close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {displayedItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink-600">
              {locale === 'ar' ? 'لا توجد صفحة بهذا الاسم.' : 'No pages found with this name.'}
            </div>
          ) : (
            <>
              {!query.trim() && (
                <div className="px-3 py-1.5 text-xs font-semibold text-ink-600 flex items-center gap-1.5">
                  <Clock size={14} weight="bold" />
                  <span>{tShell('recentPages')}</span>
                </div>
              )}

              {displayedItems.map((result, idx) => {
                const isSelected = idx === selectedIndex;
                const itemLabel = locale === 'ar' ? result.labelAr : result.labelEn;
                const groupLabel = tGroup(result.group.labelKey as any);

                return (
                  <button
                    key={`${result.group.slug}-${result.item.slug}`}
                    type="button"
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-start transition-colors outline-none ${
                      isSelected
                        ? 'bg-green-700/10 text-green-950 font-medium'
                        : 'text-ink-900 hover:bg-canvas'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate leading-tight">
                        {itemLabel}
                      </span>
                      <span className="text-xs text-ink-600 truncate mt-0.5">
                        {groupLabel}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="shrink-0 flex items-center gap-1 text-xs text-green-700 font-medium ms-3">
                        <span>{locale === 'ar' ? 'فتح' : 'Open'}</span>
                        <EnterIcon size={14} weight="bold" />
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Palette Footer Helper */}
        <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-canvas/60 border-t border-border text-[11px] text-ink-600 shrink-0">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-border rounded text-[10px]">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-white border border-border rounded text-[10px]">↓</kbd>{' '}
              {locale === 'ar' ? 'للتنقل' : 'Navigate'}
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-border rounded text-[10px]">Enter</kbd>{' '}
              {locale === 'ar' ? 'للاختيار' : 'Select'}
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-border rounded text-[10px]">Esc</kbd>{' '}
              {locale === 'ar' ? 'للإغلاق' : 'Close'}
            </span>
          </div>
          <span>{NAV_GROUPS.reduce((acc, g) => acc + g.items.length, 0)} {locale === 'ar' ? 'صفحة مسجلة' : 'pages'}</span>
        </div>
      </div>
    </div>
  );
};
