import React from 'react';
import clsx from 'clsx';
import { formatAccountingMoney } from '@/lib/format/money';

export interface MoneyProps {
  amount: number;
  currency?: string;
  className?: string;
  showCurrency?: boolean;
}

export const Money: React.FC<MoneyProps> = ({
  amount,
  currency = 'ج.م',
  className,
  showCurrency = true,
}) => {
  const { text, isNegative } = formatAccountingMoney(amount, showCurrency ? currency : '');

  return (
    <bdi
      className={clsx(
        'tabular-nums font-sans font-medium text-[15px]',
        isNegative ? 'text-danger' : 'text-ink-900',
        className
      )}
    >
      {text}
    </bdi>
  );
};
