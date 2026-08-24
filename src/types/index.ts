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
  type: 'given' | 'taken'; // given = Alacaklıyım (Bana borçlu), taken = Borçluyum (Ben borçluyum)
  amount: number;
  remainingAmount: number;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface PendingCollection {
  id: string;
  title: string; // Örn: Daire 3 Kirası, Müşteri Hakedişi, Yazılım Projesi Ödemesi
  expectedAmount: number;
  actualAmount: number;
  category: string;
  dueDate?: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: string;
  accountId?: string;
  isActive: boolean;
  nextDueDate: string;
}

export interface AppTransaction {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: string;
  rawAmount: number;
  type: TransactionType;
  iconName: string;
  accountId?: string;
  accountName?: string;
}

export interface SpendingCategory {
  name: string;
  value: string;
  widthPercentage: number;
}

export interface SavingsGoal {
  title: string;
  savedAmount: number;
  targetAmount: number;
  percentage: number;
  remainingAmount: number;
}

export interface FinancialOverview {
  totalBalance: string;
  balanceFraction: string;
  balanceChangePercentage: string;
  monthlyIncome: string;
  monthlyIncomeChange: string;
  monthlyExpense: string;
  monthlyExpenseChange: string;
}
