import React from 'react';
import clsx from 'clsx';

export interface LeaderRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  className?: string;
}

export const LeaderRow: React.FC<LeaderRowProps> = ({
  label,
  value,
  sublabel,
  className,
}) => {
  return (
    <div className={clsx('w-full py-1.5 flex flex-col', className)}>
      <div className="flex items-baseline justify-between w-full gap-2">
        <span className="text-[14px] sm:text-[15px] font-medium text-ink-900 leading-snug">
          {label}
        </span>

        {/* Dotted Leader Line */}
        <span
          className="grow min-w-[16px] border-b border-dotted border-border mx-1.5 relative top-[-4px]"
          aria-hidden="true"
        />

        <span className="shrink-0 text-[14px] sm:text-[15px] font-medium text-ink-900 leading-none">
          {value}
        </span>
      </div>

      {sublabel && (
        <span className="text-[12px] text-ink-600 mt-0.5 leading-normal">
          {sublabel}
        </span>
      )}
    </div>
  );
};
