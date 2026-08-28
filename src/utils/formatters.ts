/**
 * Safe currency, date, and subscription formatters for Penny
 */

export const parseAmountSafely = (input: string | number | undefined | null): number => {
  if (input === undefined || input === null) return 0;
  if (typeof input === 'number') return isNaN(input) ? 0 : input;

  const cleaned = input
    .replace(/[₺$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.max(parsed, 0);
};

/**
 * Formats a live user text input into formatted Turkish number style (e.g. 50000 -> 50.000, 1000000 -> 1.000.000)
 * Supports numbers of any size up to trillions without rounding or truncating.
 */
export const formatNumberInput = (input: string): string => {
  if (!input) return '';

  // Split integer part and decimal part using comma
  const parts = input.split(',');

  // Integer part: remove all non-digit characters
  const rawInt = parts[0].replace(/\D/g, '');
  if (!rawInt) return '';

  // Remove unnecessary leading zeros unless it's just '0'
  const cleanInt = rawInt.length > 1 ? rawInt.replace(/^0+/, '') || '0' : rawInt;

  // Insert thousand dots (Turkish format: 50.000 / 1.000.000 / 500.000.000.000)
  const formattedInt = cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Handle decimal part if comma is present
  if (parts.length > 1) {
    const decDigits = parts[1].replace(/\D/g, '').slice(0, 2);
    return `${formattedInt},${decDigits}`;
  }

  if (input.endsWith(',')) {
    return `${formattedInt},`;
  }

  return formattedInt;
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

export const formatMonthYear = (isoString?: string): string => {
  const date = isoString ? new Date(isoString) : new Date();
  if (isNaN(date.getTime())) return 'Ağustos 2026';
  const month = date.toLocaleDateString('tr-TR', { month: 'long' });
  const year = date.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
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
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }
  } else {
    if (now.getMonth() > targetMonth || (now.getMonth() === targetMonth && currentDay > safeDay)) {
      targetYear += 1;
    }
  }

  // Get max days in target month
  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const finalDay = Math.min(safeDay, maxDays);

  const targetDate = new Date(targetYear, targetMonth, finalDay, 12, 0, 0);
  return targetDate.toISOString();
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
