import React from 'react';
import clsx from 'clsx';

export type MonogramDirection = 'balance' | 'tick' | 'ledger';

export interface MonogramProps {
  direction?: MonogramDirection;
  size?: number;
  className?: string;
  color?: 'green' | 'white' | 'accent' | 'current';
  withAccent?: boolean;
}

export const Monogram: React.FC<MonogramProps> = ({
  direction = 'tick',
  size = 36,
  className,
  color = 'green',
  withAccent = true,
}) => {
  const colorMap = {
    green: {
      body: '#1F4E42',
      accent: '#28A78F',
      background: '#FFFFFF',
    },
    white: {
      body: '#FFFFFF',
      accent: '#28A78F',
      background: '#1F4E42',
    },
    accent: {
      body: '#28A78F',
      accent: '#1F4E42',
      background: '#FFFFFF',
    },
    current: {
      body: 'currentColor',
      accent: '#28A78F',
      background: 'transparent',
    },
  };

  const c = colorMap[color];

  // DIRECTION 1: Meem with analytical balance beam tail
  if (direction === 'balance') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={clsx('shrink-0', className)}
        aria-label="شعار محاسبي — اتجاه ميزان العدالة المحاسبي"
      >
        {/* Meem Head */}
        <circle cx="22" cy="18" r="9" stroke={c.body} strokeWidth="3.5" />
        <circle cx="22" cy="18" r="3.5" fill={withAccent ? c.accent : c.body} />
        {/* Balance Beam Tail */}
        <path
          d="M22 27V36C22 36 10 36 6 36M22 36C22 36 34 36 42 36"
          stroke={c.body}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Suspended Trays Fulcrum */}
        <path d="M6 36L4 42H8L6 36Z" fill={withAccent ? c.accent : c.body} />
        <path d="M42 36L40 42H44L42 36Z" fill={withAccent ? c.accent : c.body} />
      </svg>
    );
  }

  // DIRECTION 3: Meem with folded ledger corner
  if (direction === 'ledger') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={clsx('shrink-0', className)}
        aria-label="شعار محاسبي — اتجاه طية دفتر اليومية"
      >
        {/* Ledger Page Outline */}
        <path
          d="M10 8H30L38 16V40H10V8Z"
          stroke={c.body}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Folded Corner Triangle */}
        <path
          d="M30 8V16H38"
          stroke={c.body}
          strokeWidth="3"
          fill={withAccent ? c.accent : 'none'}
        />
        {/* Architectural Meem Inside */}
        <circle cx="24" cy="27" r="6" stroke={c.body} strokeWidth="2.5" />
        <path
          d="M24 33V37"
          stroke={c.body}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // DIRECTION 2 (SELECTED PRIMARY): Meem with Audited Tick Mark
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('shrink-0', className)}
      aria-label="شعار محاسبي المعتمد"
    >
      {/* Outer Meem Geometry: Thick architectural loop */}
      <path
        d="M24 7C14.0589 7 6 15.0589 6 25C6 34.9411 14.0589 43 24 43C33.9411 43 42 34.9411 42 25C42 21.3 40.88 17.86 38.96 15"
        stroke={c.body}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Meem Descending Tail */}
      <path
        d="M38 15L43 9M38 15V27"
        stroke={c.body}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* The Balanced Tick Mark inside the counter */}
      <path
        d="M17 25.5L22.5 31L32 18"
        stroke={withAccent ? c.accent : c.body}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
