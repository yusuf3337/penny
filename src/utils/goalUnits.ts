import { getActiveCurrency } from '../context/CurrencyContext';
import { getFormattingLocale } from '../context/LocaleContext';
import { SavingsGoal } from '../types';

export type GoalUnit = NonNullable<SavingsGoal['unit']>;
export const GOAL_UNITS: GoalUnit[] = ['TRY', 'USD', 'EUR', 'XAU_G'];

export const goalUnit = (goal: SavingsGoal): GoalUnit => goal.unit ?? getActiveCurrency();

export const formatGoalAmount = (amount: number, unit: GoalUnit): string => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    if (unit === 'XAU_G') {
      return `${new Intl.NumberFormat(getFormattingLocale(), { maximumFractionDigits: 2 }).format(safeAmount)} g`;
    }
    return new Intl.NumberFormat(getFormattingLocale(), {
      style: 'currency', currency: unit, minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `${safeAmount.toFixed(2)} ${unit === 'XAU_G' ? 'g' : unit}`;
  }
};

export const goalUnitSymbol = (unit: GoalUnit): string =>
  ({ TRY: '₺', USD: '$', EUR: '€', GBP: '£', CHF: 'CHF', KRW: '₩', CNY: '¥', JPY: '¥', RUB: '₽', XAU_G: 'g' })[unit];
