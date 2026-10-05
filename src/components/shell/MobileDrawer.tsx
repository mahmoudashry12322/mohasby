'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { X, House } from '@phosphor-icons/react';
import { Logo } from '@/components/brand/Logo';
import { NAV_GROUPS } from '@/lib/nav/nav.config';
import { SidebarGroup } from './SidebarGroup';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeGroupSlug?: string;
  activePageSlug?: string;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeGroupSlug,
  activePageSlug,
}) => {
  const pathname = usePathname();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const t = useTranslations('shell');

  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const homeHref = locale === 'ar' ? '/dashboard' : '/en/dashboard';
  const isHomeActive = pathname === homeHref || pathname === `${homeHref}/`;

  // Close on route change only
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Lock body scroll and trap focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element inside drawer
      setTimeout(() => {
        const closeBtn = drawerRef.current?.querySelector('button');
        closeBtn?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* 1. Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-green-950/50 backdrop-blur-xs transition-opacity duration-260 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Slide-out Drawer Panel */}
      <div
        ref={drawerRef}
        className={`relative z-10 w-[min(86vw,320px)] h-full flex flex-col bg-green-700 text-white shadow-2xl transition-transform duration-260 ease-out animate-in ${
          isRtl ? 'slide-in-from-right' : 'slide-in-from-left'
        } pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        {/* Drawer Header */}
        <div className="h-16 shrink-0 px-5 flex items-center justify-between border-b border-white/10">
          <Link href={homeHref} onClick={onClose} className="p-1">
            <Logo variant="horizontal" theme="white" markSize={28} />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Close menu"
          >
            <X size={22} weight="bold" />
          </button>
        </div>

        {/* Scrollable Group List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          {/* Home Item */}
          <Link
            href={homeHref}
            onClick={onClose}
            className={`relative flex items-center h-[48px] px-3.5 rounded-lg text-start transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
              isHomeActive
                ? 'font-semibold text-white bg-accent-500/15 before:absolute before:start-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-accent-500 before:rounded-full'
                : 'text-white/90 hover:text-white hover:bg-white/[0.06]'
            }`}
            aria-current={isHomeActive ? 'page' : undefined}
          >
            <House
              size={22}
              weight={isHomeActive ? 'bold' : 'regular'}
              className={`shrink-0 me-3 ${isHomeActive ? 'text-accent-500' : 'text-white/80'}`}
            />
            <span className="text-[15px] font-semibold">{t('home')}</span>
          </Link>

          <div className="border-t border-white/10 my-2" role="separator" />

          {/* 8 Groups */}
          {NAV_GROUPS.map((group) => {
            const isGroupOpen = activeGroupSlug === group.slug;
            return (
              <SidebarGroup
                key={group.slug}
                group={group}
                activeGroupSlug={activeGroupSlug}
                activePageSlug={activePageSlug}
                isOpenDefault={isGroupOpen}
                onItemClick={onClose}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
