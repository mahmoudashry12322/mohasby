import React from 'react';
import clsx from 'clsx';
import { Monogram, MonogramDirection } from './Monogram';

export type LogoVariant = 'horizontal' | 'stacked' | 'mark';
export type LogoTheme = 'green' | 'white' | 'mono-green' | 'mono-white';

export interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  direction?: MonogramDirection;
  markSize?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  theme = 'green',
  direction = 'tick',
  markSize = 34,
  className,
}) => {
  const isWhite = theme === 'white' || theme === 'mono-white';
  const isMono = theme === 'mono-green' || theme === 'mono-white';

  const textColor = isWhite ? 'text-white' : 'text-green-700';
  const subTextColor = isWhite ? 'text-border' : 'text-ink-600';

  const monogramColor = isWhite ? 'white' : 'green';

  if (variant === 'mark') {
    return (
      <div className={clsx('inline-flex items-center', className)}>
        <Monogram
          direction={direction}
          size={markSize}
          color={monogramColor}
          withAccent={!isMono}
        />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div
        className={clsx(
          'inline-flex flex-col items-center justify-center gap-2 text-center select-none',
          className
        )}
      >
        <Monogram
          direction={direction}
          size={markSize * 1.3}
          color={monogramColor}
          withAccent={!isMono}
        />
        <div className="flex flex-col items-center leading-none">
          <span
            className={clsx(
              'font-kufi font-bold text-[24px] tracking-tight leading-tight',
              textColor
            )}
          >
            محاسبي
          </span>
          <span
            className={clsx(
              'font-latin font-semibold text-[13px] tracking-wider uppercase mt-0.5',
              subTextColor
            )}
          >
            mohasby
          </span>
        </div>
      </div>
    );
  }

  // Horizontal lockup (Primary)
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-3 select-none leading-none',
        className
      )}
    >
      <Monogram
        direction={direction}
        size={markSize}
        color={monogramColor}
        withAccent={!isMono}
      />
      <div className="flex items-baseline gap-2">
        <span
          className={clsx(
            'font-kufi font-bold text-[22px] tracking-tight',
            textColor
          )}
        >
          محاسبي
        </span>
        <span
          className={clsx(
            'font-latin font-semibold text-[14px] lowercase tracking-normal',
            subTextColor
          )}
        >
          mohasby
        </span>
      </div>
    </div>
  );
};
