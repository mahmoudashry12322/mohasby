/**
 * Formats a monetary amount for Egyptian accounting.
 * Negative numbers are rendered inside brackets e.g. (25,000.00).
 * Never uses red/green to imply good/bad for debit vs credit.
 */
export function formatAccountingMoney(
  amount: number,
  currency: string = 'ج.م',
  locale: string = 'ar'
): { text: string; isNegative: boolean } {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  if (isNegative) {
    return {
      text: `(${formattedNumber}) ${currency}`,
      isNegative: true,
    };
  }

  return {
    text: `${formattedNumber} ${currency}`,
    isNegative: false,
  };
}

export function formatAccountingNumber(
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value);
}
