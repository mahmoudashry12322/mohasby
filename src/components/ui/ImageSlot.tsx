'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import clsx from 'clsx';

export interface ImageSlotProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackLabel?: string;
  containerClassName?: string;
}

export const ImageSlot: React.FC<ImageSlotProps> = ({
  src,
  alt,
  fallbackLabel,
  containerClassName,
  className,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={clsx(
        'relative overflow-hidden bg-green-900 select-none',
        containerClassName
      )}
    >
      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className={clsx('transition-opacity duration-300', className)}
          {...props}
        />
      ) : null}

      {/* Fallback pattern: Dark Green with faint ledger ruling */}
      {hasError && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center ledger-ruled-dark border border-green-700/50"
          aria-label={alt}
        >
          <div className="w-10 h-10 rounded-full border border-accent-500/40 flex items-center justify-center text-accent-500 mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15L16 10L5 21" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-kufi text-[13px] font-medium text-white/90 leading-tight">
            {fallbackLabel || alt}
          </span>
          <span className="text-[11px] font-sans text-white/60 mt-1">
            {typeof src === 'string' ? src.replace('/images/', '') : 'image slot'}
          </span>
        </div>
      )}
    </div>
  );
};
