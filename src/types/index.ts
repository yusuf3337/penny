export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isCustom?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit_card' | 'other';
  balance: number;
  currency: string;
  color: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  personName: string;
  type: 'given' | 'taken'; // given = Alacaklıyım, taken = Borçluyum
  amount: number;
  remainingAmount: number;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface PendingCollection {
  id: string;
  title: string;
  expectedAmount: number;
  actualAmount: number;
  category: string;
  dueDate?: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface SubscriptionItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  cycle: 'monthly' | 'yearly';
  paymentDay: number; // 1-31 (Day of month)
  nextDueDate: string; // ISO date string
  lastProcessedDate?: string;
  iconName?: string;
  color?: string;
  isActive: boolean;
  reviewNote?: string;
  accountType?: 'bank' | 'cash';
}

export type RecurringTransaction = SubscriptionItem;

export interface CategoryBudget {
  id: string;
  categoryName: string;
  allocatedAmount: number;
  usedAmount: number;
  badgeText?: string;
  iconName?: string;
  color?: string;
}

export interface AppTransaction {
  id: string;
  title: string;
  category: string;
  date: string; // ISO timestamp
  amount: string;
  rawAmount: number;
  type: TransactionType;
  iconName: string;
  accountId?: string;
  accountName?: string;
  accountType?: 'bank' | 'cash';
}

export interface SpendingCategory {
  name: string;
  value: string;
  rawAmount: number;
  widthPercentage: number;
  color: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  category: string;
  savedAmount: number;
  targetAmount: number;
  percentage: number;
  remainingAmount: number;
  isCompleted: boolean;
  dueDate?: string;
  iconName?: string;
}
