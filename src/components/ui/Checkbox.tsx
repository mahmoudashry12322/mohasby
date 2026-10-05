'use client';

import React from 'react';
import clsx from 'clsx';
import { Check } from '@phosphor-icons/react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, id, checked, defaultChecked, onChange, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex items-center gap-2.5 select-none">
        <label htmlFor={inputId} className="relative flex items-center cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={clsx(
              'w-5 h-5 rounded-[4px] border border-border bg-white transition-all duration-150',
              'peer-checked:bg-green-700 peer-checked:border-green-700',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-accent-500 peer-focus-visible:ring-offset-2',
              'flex items-center justify-center text-white',
              className
            )}
          >
            <Check size={14} weight="bold" className="opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </label>
        {label && (
          <label htmlFor={inputId} className="text-[14px] text-ink-900 cursor-pointer font-normal">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
