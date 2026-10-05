'use client';

import React from 'react';
import Link from 'next/link';

interface SidebarItemProps {
  href: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  href,
  label,
  isActive = false,
  onClick,
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center min-h-[40px] px-3 py-1.5 text-[14px] leading-snug rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset ${
        isActive
          ? 'font-semibold text-white bg-accent-500/15 before:absolute before:start-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-accent-500 before:rounded-full'
          : 'text-white/78 hover:text-white hover:bg-white/[0.08]'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="break-words text-start">{label}</span>
    </Link>
  );
};
