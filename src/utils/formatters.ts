/**
 * Safe currency, date, and subscription formatters for Penny
 */
import { getFormattingLocale } from '../context/LocaleContext';

const separators = () => {
  const parts = new Intl.NumberFormat(getFormattingLocale()).formatToParts(1234.5);
  return {
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? ',',
    group: parts.find((part) => part.type === 'group')?.value ?? '.',
  };
};

export const parseAmountSafely = (input: string | number | undefined | null): number => {
  if (input === undefined || input === null) return 0;
  if (typeof input === 'number') return isNaN(input) ? 0 : Math.round(input * 100) / 100;

  const str = input.toString().replace(/[^\d.,]/g, '');
  const lastDot = str.lastIndexOf('.');
  const lastComma = str.lastIndexOf(',');
  const candidate = Math.max(lastDot, lastComma);
  const trailingDigits = candidate < 0 ? 0 : str.slice(candidate + 1).replace(/\D/g, '').length;
  const hasBoth = lastDot >= 0 && lastComma >= 0;
  const decimalIndex = candidate >= 0 && (hasBoth || trailingDigits <= 2) ? candidate : -1;

  if (decimalIndex !== -1) {
    const intPart = str.slice(0, decimalIndex).replace(/\D/g, '');
    const decPart = str.slice(decimalIndex + 1).replace(/\D/g, '').slice(0, 2);
    const parsed = parseFloat(`${intPart || '0'}.${decPart || '0'}`);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  } else {
    const intPart = str.replace(/\D/g, '');
    if (!intPart) return 0;
    const parsed = parseFloat(intPart);
    return isNaN(parsed) ? 0 : parsed;
  }
};

/**
 * Formats live numeric entry using the selected language's separators.
 */
export const formatNumberInput = (input: string): string => {
  if (!input) return '';

  const { decimal, group } = separators();
  let str = input;
  // Accept a period as a decimal separator on comma-decimal keyboards.
  if (decimal !== '.' && str.endsWith('.') && !str.includes(decimal)) {
    str = str.slice(0, -1) + decimal;
  }
  if (decimal !== '.' && !str.includes(decimal) && str.includes('.')) {
    const lastDot = str.lastIndexOf('.');
    const digitsAfter = str.slice(lastDot + 1).replace(/\D/g, '').length;
    if (digitsAfter > 0 && digitsAfter <= 2) {
      str = `${str.slice(0, lastDot)}${decimal}${str.slice(lastDot + 1)}`;
    }
  }
  if (decimal === '.' && !str.includes(decimal) && str.includes(',')) {
    const lastComma = str.lastIndexOf(',');
    const digitsAfter = str.slice(lastComma + 1).replace(/\D/g, '').length;
    if (digitsAfter > 0 && digitsAfter <= 2) {
      str = `${str.slice(0, lastComma)}.${str.slice(lastComma + 1)}`;
    }
  }

  const decimalIndex = str.indexOf(decimal);

  if (decimalIndex !== -1) {
    const intPartRaw = str.slice(0, decimalIndex);
    const decPartRaw = str.slice(decimalIndex + decimal.length);

    const cleanIntDigits = intPartRaw.replace(/\D/g, '');
    const cleanInt = cleanIntDigits.length > 1 ? cleanIntDigits.replace(/^0+/, '') || '0' : cleanIntDigits || '0';
    const formattedInt = cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, group);

    // Clean decimal part (only digits, max 2 digits)
    const cleanDecDigits = decPartRaw.replace(/\D/g, '').slice(0, 2);

    if (str.endsWith(decimal) && cleanDecDigits.length === 0) {
      return `${formattedInt}${decimal}`;
    }

    return `${formattedInt}${decimal}${cleanDecDigits}`;
  } else {
    const cleanIntDigits = str.replace(/\D/g, '');
    if (!cleanIntDigits) return '';
    const cleanInt = cleanIntDigits.length > 1 ? cleanIntDigits.replace(/^0+/, '') || '0' : cleanIntDigits;
    return cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  }
};

export const formatCurrency = (amount: number): string => {
  const safeNum = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat(getFormattingLocale(), { style: 'currency', currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNum);
};

export const formatShortDate = (isoString?: string): string => {
  if (!isoString) return new Date().toLocaleDateString(getFormattingLocale(), { day: 'numeric', month: 'short' });
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString(getFormattingLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (isoString?: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const dateStr = date.toLocaleDateString(getFormattingLocale(), { day: 'numeric', month: 'short' });
  const timeStr = date.toLocaleTimeString(getFormattingLocale(), { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} · ${timeStr}`;
};

export const formatTimeOnly = (isoString?: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(getFormattingLocale(), { hour: '2-digit', minute: '2-digit' });
};

export const formatMonthYear = (dateInput?: string | Date): string => {
  let date: Date;
  if (!dateInput) {
    date = new Date();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
    if (isNaN(date.getTime())) date = new Date();
  }
  const month = date.toLocaleDateString(getFormattingLocale(), { month: 'long' });
  const year = date.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
};

export const isSameMonthAndYear = (d1: Date | string, d2: Date | string): boolean => {
  const date1 = typeof d1 === 'string' ? new Date(d1) : d1;
  const date2 = typeof d2 === 'string' ? new Date(d2) : d2;
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

export const changeMonth = (date: Date, offset: number): Date => {
  const newDate = new Date(date.getFullYear(), date.getMonth() + offset, 1);
  return newDate;
};


/**
 * Calculates exact next due ISO date string based on payment day of month (1-31)
 */
export const calculateNextDueDate = (paymentDay: number, cycle: 'monthly' | 'yearly' = 'monthly'): string => {
  const now = new Date();
  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth();

  const safeDay = Math.min(Math.max(paymentDay, 1), 31);
  const currentDay = now.getDate();

  if (cycle === 'monthly') {
    if (currentDay > safeDay) {
      targetMonth += 1;
    }
  } else {
    if (now.getMonth() > targetMonth || (now.getMonth() === targetMonth && currentDay > safeDay)) {
      targetYear += 1;
    }
  }

  const normalized = new Date(targetYear, targetMonth, 1);
  targetYear = normalized.getFullYear();
  targetMonth = normalized.getMonth();

  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const finalDay = Math.min(safeDay, maxDays);

  const targetDate = new Date(targetYear, targetMonth, finalDay, 12, 0, 0);
  return targetDate.toISOString();
};

/**
 * Advances a subscription due date strictly to the next billing cycle (+1 month or +1 year)
 * Guarantees that the new due date is strictly in the future, preventing loop charges.
 */
export const advanceSubscriptionDueDate = (
  currentDueDateStr: string | undefined,
  paymentDay: number,
  cycle: 'monthly' | 'yearly' = 'monthly'
): string => {
  const base = currentDueDateStr ? new Date(currentDueDateStr) : new Date();
  const validBase = isNaN(base.getTime()) ? new Date() : base;

  let targetYear = validBase.getFullYear();
  let targetMonth = validBase.getMonth() + (cycle === 'yearly' ? 0 : 1);
  if (cycle === 'yearly') {
    targetYear += 1;
  }

  const normalized = new Date(targetYear, targetMonth, 1);
  targetYear = normalized.getFullYear();
  targetMonth = normalized.getMonth();

  const safeDay = Math.min(Math.max(paymentDay, 1), 31);
  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const finalDay = Math.min(safeDay, maxDays);

  return new Date(targetYear, targetMonth, finalDay, 12, 0, 0).toISOString();
};

/**
 * Calculates days remaining from today to target date string accurately
 */
export const getDaysRemainingText = (dueDateStr?: string): string => {
  if (!dueDateStr) return new Intl.RelativeTimeFormat(getFormattingLocale(), { numeric: 'auto' }).format(3, 'day');
  const targetDate = new Date(dueDateStr);
  if (isNaN(targetDate.getTime())) return dueDateStr;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return getFormattingLocale() === 'tr-TR' ? 'Bugün ödeniyor' : new Intl.RelativeTimeFormat(getFormattingLocale(), { numeric: 'auto' }).format(0, 'day');
  if (diffDays === 1) return getFormattingLocale() === 'tr-TR' ? 'Yarın ödeniyor' : new Intl.RelativeTimeFormat(getFormattingLocale(), { numeric: 'auto' }).format(1, 'day');
  if (diffDays < 0) return getFormattingLocale() === 'tr-TR' ? `${Math.abs(diffDays)} gün gecikti` : new Intl.RelativeTimeFormat(getFormattingLocale(), { numeric: 'auto' }).format(diffDays, 'day');
  const date = targetDate.toLocaleDateString(getFormattingLocale(), { day: 'numeric', month: 'short' });
  return getFormattingLocale() === 'tr-TR' ? `${diffDays} gün sonra (${date})` : `${new Intl.RelativeTimeFormat(getFormattingLocale()).format(diffDays, 'day')} (${date})`;
};
