import React from 'react';
import clsx from 'clsx';

export interface DividerProps {
  variant?: 'single' | 'double' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ variant = 'single', className }) => {
  if (variant === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={clsx('w-px self-stretch bg-border', className)}
      />
    );
  }

  if (variant === 'double') {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={clsx('w-full border-b-[3px] border-double border-green-700 my-2', className)}
      />
    );
  }

  return (
    <hr
      className={clsx('w-full border-t border-border my-2', className)}
    />
  );
};
