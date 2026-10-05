'use client';

import React from 'react';
import clsx from 'clsx';

export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'secondary-dark'
  | 'ghost'
  | 'danger'
  | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      isLoading = false,
      disabled = false,
      children,
      className,
      icon,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const baseStyles =
      'relative inline-flex items-center justify-center font-sans transition-all duration-160 ease-ledger select-none rounded-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2';

    const variantStyles: Record<ButtonVariant, string> = {
      primary: clsx(
        'bg-green-700 text-white font-semibold px-[22px] py-[12px] text-[15px]',
        'shadow-card hover:bg-green-900 hover:-translate-y-[1px] hover:shadow-elevated active:translate-y-0 active:scale-[0.99]',
        'disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:bg-green-700 disabled:shadow-none disabled:cursor-not-allowed'
      ),
      accent: clsx(
        'bg-accent-500 text-green-950 font-bold px-[24px] py-[13px] text-[15px] shadow-inner-light shadow-card',
        'hover:bg-accent-600 hover:-translate-y-[1px] hover:shadow-accent-glow active:translate-y-0 active:scale-[0.99]',
        'disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:bg-accent-500 disabled:shadow-none disabled:cursor-not-allowed'
      ),
      secondary: clsx(
        'bg-white border border-border text-ink-900 font-semibold px-[22px] py-[12px] text-[15px]',
        'hover:bg-canvas hover:border-green-700/40 active:scale-[0.99]',
        'disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed'
      ),
      'secondary-dark': clsx(
        'bg-transparent border-[1.5px] border-white/45 text-white font-semibold px-[22px] py-[12px] text-[15px]',
        'hover:bg-white/10 hover:border-white/70 active:scale-[0.99]',
        'disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed'
      ),
      ghost: clsx(
        'group bg-transparent text-green-700 font-medium px-3 py-2 text-[14px]',
        'hover:text-green-900 hover:bg-green-700/8 active:scale-[0.99]',
        'disabled:opacity-40 disabled:cursor-not-allowed'
      ),
      danger: clsx(
        'bg-transparent border-[1.5px] border-danger text-danger font-semibold px-[22px] py-[12px] text-[15px]',
        'hover:bg-danger hover:text-white active:scale-[0.99]',
        'disabled:opacity-40 disabled:hover:bg-transparent disabled:text-danger disabled:cursor-not-allowed'
      ),
      icon: clsx(
        'w-[40px] h-[40px] p-0 text-green-700 border border-border bg-white',
        'hover:bg-canvas hover:text-green-900 active:scale-[0.98]',
        'disabled:opacity-40 disabled:cursor-not-allowed'
      ),
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {/* Loading Spinner with reserved width */}
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="opacity-90">{children}</span>
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-2">
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="relative">
              {children}
              {variant === 'ghost' && (
                <span className="absolute bottom-0 start-0 w-0 h-[1.5px] bg-current transition-all duration-200 group-hover:w-full" />
              )}
            </span>
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
