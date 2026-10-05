import React from 'react';
import clsx from 'clsx';

export type BadgeVariant = 'neutral' | 'green' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  pill?: boolean;
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
  pill = false,
  withDot = false,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral: 'bg-canvas text-ink-900 border border-border',
    green: 'bg-green-700/10 text-green-700 border border-green-700/20',
    accent: 'bg-accent-500/20 text-green-950 border border-accent-500/35 font-semibold',
    success: 'bg-success/12 text-success border border-success/25',
    warning: 'bg-warning/12 text-warning border border-warning/25',
    danger: 'bg-danger/12 text-danger border border-danger/25',
  };

  const dotStyles: Record<BadgeVariant, string> = {
    neutral: 'bg-ink-600',
    green: 'bg-green-700',
    accent: 'bg-accent-500',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[12px] font-medium leading-none select-none',
        pill ? 'rounded-full' : 'rounded-chip',
        variantStyles[variant],
        className
      )}
    >
      {withDot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', dotStyles[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
