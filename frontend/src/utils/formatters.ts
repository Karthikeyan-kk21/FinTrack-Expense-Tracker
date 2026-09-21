const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
  JPY: '¥',
  CNY: '¥',
  SGD: 'S$',
};

export const getCurrencySymbol = (currency: string = 'INR'): string => {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
};

export const formatCurrency = (
  amount: number | string | undefined | null,
  currency: string = 'INR'
): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${getCurrencySymbol(currency)}0.00`;
  }
  const num = Number(amount);
  const symbol = getCurrencySymbol(currency);
  
  return `${symbol}${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatMonthYear = (month: number, year: number): string => {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

export const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
};
