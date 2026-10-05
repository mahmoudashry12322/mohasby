'use client';

import React, { useState } from 'react';
import { Input, InputProps } from './Input';
import { Eye, EyeSlash } from '@phosphor-icons/react';

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'endIcon'> {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      showPasswordLabel = 'إظهار كلمة المرور',
      hidePasswordLabel = 'إخفاء كلمة المرور',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        endIcon={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="p-1 text-ink-600 hover:text-ink-900 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeSlash size={19} weight="regular" />
            ) : (
              <Eye size={19} weight="regular" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
