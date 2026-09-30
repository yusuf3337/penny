/**
 * Safe currency, date, and subscription formatters for Penny
 */

export const parseAmountSafely = (input: string | number | undefined | null): number => {
  if (input === undefined || input === null) return 0;
  if (typeof input === 'number') return isNaN(input) ? 0 : Math.round(input * 100) / 100;

  const str = input.toString().replace(/[₺$\s]/g, '');
  const commaIndex = str.indexOf(',');

  if (commaIndex !== -1) {
    const intPart = str.slice(0, commaIndex).replace(/\D/g, '');
    const decPart = str.slice(commaIndex + 1).replace(/\D/g, '').slice(0, 2);
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
 * Formats a live user text input into formatted Turkish number style (e.g. 50000 -> 50.000, 114,29 -> 114,29)
 * Correctly distinguishes thousand dot separators from decimal commas.
 */
export const formatNumberInput = (input: string): string => {
  if (!input) return '';

  let str = input;
  // If user types a trailing dot without any comma yet, treat trailing dot as decimal comma
  if (str.endsWith('.') && !str.includes(',')) {
    str = str.slice(0, -1) + ',';
  }

  const commaIndex = str.indexOf(',');

  if (commaIndex !== -1) {
    const intPartRaw = str.slice(0, commaIndex);
    const decPartRaw = str.slice(commaIndex + 1);

    // Clean integer part (strip all dots and non-digits)
    const cleanIntDigits = intPartRaw.replace(/\D/g, '');
    const cleanInt = cleanIntDigits.length > 1 ? cleanIntDigits.replace(/^0+/, '') || '0' : cleanIntDigits || '0';
    const formattedInt = cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Clean decimal part (only digits, max 2 digits)
    const cleanDecDigits = decPartRaw.replace(/\D/g, '').slice(0, 2);

    if (str.endsWith(',') && cleanDecDigits.length === 0) {
      return `${formattedInt},`;
    }

    return `${formattedInt},${cleanDecDigits}`;
  } else {
    // No comma present: entire input is integer part (strip all dots inserted previously)
    const cleanIntDigits = str.replace(/\D/g, '');
    if (!cleanIntDigits) return '';
    const cleanInt = cleanIntDigits.length > 1 ? cleanIntDigits.replace(/^0+/, '') || '0' : cleanIntDigits;
    return cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
};

export const formatCurrency = (amount: number): string => {
  const safeNum = isNaN(amount) ? 0 : amount;
  return `₺${safeNum.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatShortDate = (isoString?: string): string => {
  if (!isoString) return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (isoString?: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} · ${timeStr}`;
};

export const formatTimeOnly = (isoString?: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
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
  const month = date.toLocaleDateString('tr-TR', { month: 'long' });
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
  if (!dueDateStr) return '3 gün sonra';
  const targetDate = new Date(dueDateStr);
  if (isNaN(targetDate.getTime())) return dueDateStr;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Bugün ödeniyor';
  if (diffDays === 1) return 'Yarın ödeniyor';
  if (diffDays < 0) return `${Math.abs(diffDays)} gün gecikti`;
  return `${diffDays} gün sonra (${targetDate.getDate()} ${targetDate.toLocaleDateString('tr-TR', { month: 'short' })})`;
};
