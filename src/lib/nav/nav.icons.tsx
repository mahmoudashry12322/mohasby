'use client';

import React from 'react';
import {
  BookOpen,
  Package,
  Snowflake,
  Bank,
  Coins,
  ChartBar,
  Users,
  SlidersHorizontal,
  House,
  IconProps,
} from '@phosphor-icons/react';

export type NavIconName =
  | 'home'
  | 'accounting'
  | 'warehouses'
  | 'cold-storage'
  | 'banking'
  | 'costs'
  | 'reports'
  | 'hr'
  | 'setup';

export const NAV_ICON_MAP: Record<NavIconName, React.ComponentType<IconProps>> = {
  home: House,
  accounting: BookOpen,
  warehouses: Package,
  'cold-storage': Snowflake,
  banking: Bank,
  costs: Coins,
  reports: ChartBar,
  hr: Users,
  setup: SlidersHorizontal,
};

interface NavIconProps extends IconProps {
  name: string;
}

export const NavIcon: React.FC<NavIconProps> = ({ name, ...props }) => {
  const IconComponent = NAV_ICON_MAP[name as NavIconName] || House;
  return <IconComponent {...props} />;
};
