'use client';

import React, { useState } from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      startIcon,
      endIcon,
      className,
      id,
      onBlur,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [touched, setTouched] = useState(false);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      if (onBlur) {
        onBlur(e);
      }
    };

    const showError = touched && Boolean(error);

    return (
      <div className="w-full text-start space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[14px] font-medium text-ink-900 leading-tight"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {startIcon && (
            <span className="absolute start-3.5 text-ink-400 pointer-events-none flex items-center">
              {startIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            onBlur={handleBlur}
            aria-invalid={showError ? 'true' : undefined}
            aria-describedby={showError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={clsx(
              'w-full h-[48px] rounded-input bg-white px-3.5 text-[15px] text-ink-900 transition-all duration-150',
              'placeholder:text-ink-400',
              showError
                ? 'border-[1.5px] border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                : 'border border-border focus:border-green-700 focus:ring-2 focus:ring-accent-500/30',
              'outline-none',
              startIcon && 'ps-10',
              endIcon && 'pe-10',
              className
            )}
            {...props}
          />

          {endIcon && (
            <span className="absolute end-3.5 text-ink-400 flex items-center">
              {endIcon}
            </span>
          )}
        </div>

        {showError && (
          <p id={`${inputId}-error`} className="text-[13px] text-danger leading-tight font-medium" role="alert">
            {error}
          </p>
        )}

        {!showError && hint && (
          <p id={`${inputId}-hint`} className="text-[12px] text-ink-600 leading-tight">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
