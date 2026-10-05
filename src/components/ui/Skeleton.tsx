import React from 'react';
import clsx from 'clsx';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      aria-hidden="true"
      className={clsx('animate-pulse bg-border/60 rounded-chip', className)}
    />
  );
};
