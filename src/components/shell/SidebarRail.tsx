'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CaretLeft, CaretRight, House } from '@phosphor-icons/react';
import { Logo } from '@/components/brand/Logo';
import { NAV_GROUPS, NavGroup } from '@/lib/nav/nav.config';
import { NavIcon } from '@/lib/nav/nav.icons';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { SidebarFlyout } from './SidebarFlyout';

interface SidebarRailProps {
  activeGroupSlug?: string;
  activePageSlug?: string;
  onExpand: () => void;
  className?: string;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  activeGroupSlug,
  activePageSlug,
  onExpand,
  className = '',
}) => {
  const pathname = usePathname();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const tGroup = useTranslations('nav.groups');
  const tShell = useTranslations('shell');

  const homeHref = locale === 'ar' ? '/dashboard' : '/en/dashboard';
  const isHomeActive = pathname === homeHref || pathname === `${homeHref}/`;

  const ExpandIcon = isRtl ? CaretLeft : CaretRight;

  const [openFlyoutGroup, setOpenFlyoutGroup] = useState<NavGroup | null>(null);
  const [flyoutTop, setFlyoutTop] = useState<number>(0);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleToggleFlyout = (group: NavGroup) => {
    if (openFlyoutGroup?.slug === group.slug) {
      setOpenFlyoutGroup(null);
    } else {
      const btn = triggerRefs.current[group.slug];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setFlyoutTop(rect.top);
      }
      setOpenFlyoutGroup(group);
    }
  };

  const handleCloseFlyout = (restoreFocus = false) => {
    const slug = openFlyoutGroup?.slug;
    setOpenFlyoutGroup(null);
    if (restoreFocus && slug && triggerRefs.current[slug]) {
      triggerRefs.current[slug]?.focus();
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={`w-[76px] shrink-0 h-screen sticky top-0 flex flex-col items-center bg-green-700 text-white select-none z-30 transition-[width] duration-260 ease-in-out ${className}`}
        aria-label="Collapsed Sidebar Navigation"
      >
        {/* 1. Top Logo Mark (64px) */}
        <div className="h-16 shrink-0 flex items-center justify-center border-b border-white/10 w-full">
          <Link
            href={homeHref}
            className="p-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label={tShell('home')}
          >
            <Logo variant="mark" theme="white" markSize={30} />
          </Link>
        </div>

        {/* 2. Rail Navigation Icons */}
        <div className="flex-1 w-full py-4 flex flex-col items-center space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-none">
          {/* Home Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={homeHref}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                  isHomeActive
                    ? 'bg-white/[0.12] text-accent-500 before:absolute before:start-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:bg-accent-500 before:rounded-full'
                    : 'text-white/80 hover:text-white hover:bg-white/[0.08]'
                }`}
                aria-label={tShell('home')}
                aria-current={isHomeActive ? 'page' : undefined}
              >
                <House size={22} weight={isHomeActive ? 'bold' : 'regular'} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side={isRtl ? 'left' : 'right'} sideOffset={8}>
              {tShell('home')}
            </TooltipContent>
          </Tooltip>

          <div className="w-8 border-t border-white/10 my-1" role="separator" />

          {/* 8 Group Icons */}
          {NAV_GROUPS.map((group) => {
            const isGroupActive = activeGroupSlug === group.slug;
            const isFlyoutOpen = openFlyoutGroup?.slug === group.slug;

            return (
              <Tooltip key={group.slug}>
                <TooltipTrigger asChild>
                  <button
                    ref={(el) => {
                      triggerRefs.current[group.slug] = el;
                    }}
                    type="button"
                    onClick={() => handleToggleFlyout(group)}
                    className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                      isGroupActive || isFlyoutOpen
                        ? 'bg-white/[0.12] text-accent-500 before:absolute before:start-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:bg-accent-500 before:rounded-full'
                        : 'text-white/80 hover:text-white hover:bg-white/[0.08]'
                    }`}
                    aria-label={tGroup(group.labelKey as any)}
                    aria-haspopup="menu"
                    aria-expanded={isFlyoutOpen}
                  >
                    <NavIcon
                      name={group.icon}
                      size={22}
                      weight={isGroupActive || isFlyoutOpen ? 'bold' : 'regular'}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side={isRtl ? 'left' : 'right'} sideOffset={8}>
                  {tGroup(group.labelKey as any)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* 3. Bottom Pinned Expand Control */}
        <div className="h-14 shrink-0 flex items-center justify-center border-t border-white/10 w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onExpand}
                className="w-12 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                aria-label={tShell('expandSidebar')}
              >
                <ExpandIcon size={18} weight="bold" />
              </button>
            </TooltipTrigger>
            <TooltipContent side={isRtl ? 'left' : 'right'} sideOffset={8}>
              {tShell('expandSidebar')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* 4. Active Floating Flyout */}
        {openFlyoutGroup && (
          <SidebarFlyout
            group={openFlyoutGroup}
            activeGroupSlug={activeGroupSlug}
            activePageSlug={activePageSlug}
            topPosition={flyoutTop}
            onClose={handleCloseFlyout}
          />
        )}
      </aside>
    </TooltipProvider>
  );
};
