'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CaretDown } from '@phosphor-icons/react';
import { NavIcon } from '@/lib/nav/nav.icons';
import { NavGroup } from '@/lib/nav/nav.config';
import { SidebarItem } from './SidebarItem';
import { useLocale, useTranslations } from 'next-intl';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';

interface SidebarGroupProps {
  group: NavGroup;
  activeGroupSlug?: string;
  activePageSlug?: string;
  isOpenDefault?: boolean;
  isCollapsed?: boolean;
  onItemClick?: () => void;
  onGroupClickCollapsed?: (rect: DOMRect) => void;
  isFlyoutOpen?: boolean;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({
  group,
  activeGroupSlug,
  activePageSlug,
  isOpenDefault = false,
  isCollapsed = false,
  onItemClick,
  onGroupClickCollapsed,
  isFlyoutOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const tGroup = useTranslations('nav.groups');
  const tItem = useTranslations('nav.items');

  const isGroupActive = activeGroupSlug === group.slug;
  const contentId = `nav-group-${group.slug}-items`;

  // Toggle group accordion in expanded mode, or notify parent flyout in collapsed mode
  const handleGroupHeaderClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isCollapsed) {
      const rect = e.currentTarget.getBoundingClientRect();
      onGroupClickCollapsed?.(rect);
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  const itemsWithCluster = group.items;

  return (
    <div className="w-full mb-1">
      {/* Group Header Button */}
      <Tooltip open={isCollapsed ? undefined : false}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleGroupHeaderClick}
            aria-expanded={isCollapsed ? isFlyoutOpen : isOpen}
            aria-controls={contentId}
            className={`w-full flex items-center h-[44px] rounded-lg text-start transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset ${
              isGroupActive || isFlyoutOpen
                ? 'text-white font-semibold bg-white/[0.12]'
                : 'text-white/90 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {/* Fixed Icon container: 48px wide, centered at 38px from edge */}
            <div className="w-12 h-11 shrink-0 flex items-center justify-center">
              <NavIcon
                name={group.icon}
                size={20}
                weight={isGroupActive || isFlyoutOpen ? 'bold' : 'regular'}
                className={`transition-colors duration-150 ${
                  isGroupActive || isFlyoutOpen ? 'text-accent-500' : 'text-white/80'
                }`}
              />
            </div>

            {/* Group Label: fades out in 120ms when collapsing, fades in after 100ms when expanding */}
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
                {tGroup(group.labelKey as any)}
              </span>
            </div>

            {/* Chevron: rotates in 220ms ease-out in sync with accordion, fades out when collapsed */}
            <div
              style={{
                transition: isCollapsed
                  ? 'opacity 120ms ease-out 0ms'
                  : 'opacity 140ms ease-out 100ms',
              }}
              className={`shrink-0 flex items-center justify-center text-white/60 ms-2 me-2 whitespace-nowrap overflow-hidden ${
                isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <motion.div
                animate={{ rotate: !isCollapsed && isOpen ? 180 : 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex items-center justify-center"
              >
                <CaretDown size={14} weight="bold" />
              </motion.div>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side={isRtl ? 'left' : 'right'} sideOffset={8}>
          {tGroup(group.labelKey as any)}
        </TooltipContent>
      </Tooltip>

      {/* Accordion Body with Vertical Hierarchy Line (animates height over 220ms ease-out) */}
      <motion.div
        id={contentId}
        initial={false}
        animate={{
          height: !isCollapsed && isOpen ? 'auto' : 0,
          opacity: !isCollapsed && isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <div className="border-s border-white/[0.14] ms-6 ps-2.5 my-1 flex flex-col gap-0.5">
          {itemsWithCluster.map((item, index) => {
            const prevItem = index > 0 ? itemsWithCluster[index - 1] : null;
            const showHairline =
              prevItem &&
              prevItem.cluster !== undefined &&
              item.cluster !== undefined &&
              prevItem.cluster !== item.cluster;
            const href =
              locale === 'ar'
                ? `/dashboard/${group.slug}/${item.slug}`
                : `/en/dashboard/${group.slug}/${item.slug}`;
            const isItemActive = isGroupActive && activePageSlug === item.slug;

            return (
              <React.Fragment key={item.slug}>
                {showHairline && (
                  <div className="border-t border-white/10 my-2 mx-1" role="separator" />
                )}
                <SidebarItem
                  href={href}
                  label={tItem(item.labelKey as any)}
                  isActive={isItemActive}
                  onClick={onItemClick}
                />
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
