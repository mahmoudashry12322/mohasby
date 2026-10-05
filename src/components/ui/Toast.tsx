'use client';

import React from 'react';
import clsx from 'clsx';
import { CheckCircle, WarningCircle, Info, X } from '@phosphor-icons/react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className,
}) => {
  const iconMap = {
    success: <CheckCircle size={20} weight="fill" className="text-success shrink-0" />,
    warning: <WarningCircle size={20} weight="fill" className="text-warning shrink-0" />,
    error: <WarningCircle size={20} weight="fill" className="text-danger shrink-0" />,
    info: <Info size={20} weight="fill" className="text-info shrink-0" />,
  };

  return (
    <div
      role="status"
      className={clsx(
        'flex items-start gap-3 p-4 rounded-card bg-white border border-border shadow-elevated max-w-sm w-full',
        className
      )}
    >
      {iconMap[type]}
      <div className="grow text-start">
        <h5 className="text-[14px] font-semibold text-ink-900 leading-tight">
          {title}
        </h5>
        {message && (
          <p className="text-[13px] text-ink-600 mt-1 leading-normal">
            {message}
          </p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-ink-400 hover:text-ink-900 p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500"
          aria-label="إغلاق الإشعار"
        >
          <X size={16} weight="bold" />
        </button>
      )}
    </div>
  );
};
