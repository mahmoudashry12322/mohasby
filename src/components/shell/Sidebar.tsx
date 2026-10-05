'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CaretLeft, CaretRight, House } from '@phosphor-icons/react';
import { Logo } from '@/components/brand/Logo';
import { NAV_GROUPS, NavGroup } from '@/lib/nav/nav.config';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { SidebarGroup } from './SidebarGroup';
import { SidebarFlyout } from './SidebarFlyout';

interface SidebarProps {
  activeGroupSlug?: string;
  activePageSlug?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeGroupSlug,
  activePageSlug,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  const pathname = usePathname();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const t = useTranslations('shell');

  const homeHref = locale === 'ar' ? '/dashboard' : '/en/dashboard';
  const isHomeActive = pathname === homeHref || pathname === `${homeHref}/`;

  // Flyout state when collapsed
  const [openFlyoutGroup, setOpenFlyoutGroup] = useState<NavGroup | null>(null);
  const [flyoutTop, setFlyoutTop] = useState<number>(0);

  // Collapse button icon:
  // RTL: Collapsed -> point left (into page). Expanded -> point right (towards edge).
  // LTR: Collapsed -> point right (into page). Expanded -> point left (towards edge).
  const ToggleIcon = isCollapsed
    ? (isRtl ? CaretLeft : CaretRight)
    : (isRtl ? CaretRight : CaretLeft);

  const handleToggleFlyout = (group: NavGroup, rect: DOMRect) => {
    if (openFlyoutGroup?.slug === group.slug) {
      setOpenFlyoutGroup(null);
    } else {
      setFlyoutTop(rect.top);
      setOpenFlyoutGroup(group);
    }
  };

  const handleCloseFlyout = () => {
    setOpenFlyoutGroup(null);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        id="sidebar-root"
        style={{
          transition: 'width 260ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
        className={`shrink-0 h-screen sticky top-0 flex flex-col bg-green-700 text-white select-none z-30 overflow-hidden ${
          isCollapsed ? 'w-[76px]' : 'w-[280px]'
        } ${className}`}
        aria-label="Sidebar Navigation"
      >
        {/* 1. Header: Logo Lockup (64px) */}
        <div className="h-16 shrink-0 flex items-center px-3.5 border-b border-white/10 overflow-hidden">
          <Link
            href={homeHref}
            className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-lg py-1"
            aria-label={t('home')}
          >
            {/* Stationary Monogram: 48px slot centered at 38px from edge */}
            <div className="w-12 h-11 shrink-0 flex items-center justify-center">
              <Logo variant="mark" theme="white" markSize={30} />
            </div>

            {/* Brand Text: Fades out in 120ms when collapsing, fades in after 100ms when expanding */}
            <div
              style={{
                transition: isCollapsed
                  ? 'opacity 120ms ease-out 0ms'
                  : 'opacity 140ms ease-out 100ms',
              }}
              className={`ms-1.5 flex items-baseline gap-2 whitespace-nowrap overflow-hidden ${
                isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <span className="font-kufi font-bold text-[22px] tracking-tight text-white">
                محاسبي
              </span>
              <span className="font-latin font-semibold text-[14px] lowercase tracking-normal text-border">
                mohasby
              </span>
            </div>
          </Link>
        </div>

        {/* 2. Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
          {/* Home Item */}
          <Tooltip open={isCollapsed ? undefined : false}>
            <TooltipTrigger asChild>
              <Link
                href={homeHref}
                className={`relative flex items-center h-[44px] rounded-lg text-start transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset mb-2 ${
                  isHomeActive
                    ? 'font-semibold text-white bg-accent-500/15 before:absolute before:start-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-accent-500 before:rounded-full'
                    : 'text-white/90 hover:text-white hover:bg-white/[0.06]'
                }`}
                aria-current={isHomeActive ? 'page' : undefined}
                aria-label={t('home')}
              >
                {/* Fixed Icon container centered at 38px */}
                <div className="w-12 h-11 shrink-0 flex items-center justify-center">
                  <House
                    size={20}
                    weight={isHomeActive ? 'bold' : 'regular'}
                    className={`transition-colors duration-150 ${
                      isHomeActive ? 'text-accent-500' : 'text-white/80'
                    }`}
                  />
                </div>

                {/* Home Label */}
                <div
                  style={{
                    transition: isCollapsed
                      ? 'opacity 120ms ease-out 0ms'
                      : 'opacity 140ms ease-out 100ms',
                  }}
                  className={`ms-1 min-w-0 flex-1 whitespace-nowrap overflow-hidden ${
                    isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  <span className="text-[15px] font-semibold leading-none">
                    {t('home')}
                  </span>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side={isRtl ? 'left' : 'right'} sideOffset={8}>
              {t('home')}
            </TooltipContent>
          </Tooltip>

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
                isCollapsed={isCollapsed}
                onGroupClickCollapsed={(rect) => handleToggleFlyout(group, rect)}
                isFlyoutOpen={openFlyoutGroup?.slug === group.slug}
              />
            );
          })}
        </div>

        {/* 3. Pinned Bottom Bar: Collapse / Expand Control */}
        <div className="h-14 shrink-0 px-3.5 flex items-center border-t border-white/10 bg-green-700/80 backdrop-blur-sm">
          <Tooltip open={isCollapsed ? undefined : false}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-full h-10 flex items-center rounded-lg text-white/75 hover:text-white hover:bg-white/[0.08] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                aria-label={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
              >
                {/* Fixed Toggle Icon slot centered at 38px */}
                <div className="w-12 h-10 shrink-0 flex items-center justify-center text-white/70">
                  <ToggleIcon size={18} weight="bold" />
                </div>

                {/* Bottom Bar Label */}
                <div
                  style={{
                    transition: isCollapsed
                      ? 'opacity 120ms ease-out 0ms'
                      : 'opacity 140ms ease-out 100ms',
                  }}
                  className={`ms-1 min-w-0 flex-1 whitespace-nowrap overflow-hidden ${
                    isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  <span className="font-medium text-xs sm:text-sm">
                    {t('collapseSidebar')}
                  </span>
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side={isRtl ? 'left' : 'right'} sideOffset={8}>
              {t('expandSidebar')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* 4. Active Floating Flyout when Collapsed */}
        {isCollapsed && openFlyoutGroup && (
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
