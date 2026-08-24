import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppTransaction,
  SavingsGoal,
  Account,
  Debt,
  Category,
  RecurringTransaction,
  PendingCollection,
} from '../types';

const STORAGE_KEYS = {
  USER_NAME: '@penny_user_name_v1',
  TRANSACTIONS: '@penny_transactions_v1',
  SAVINGS_GOAL: '@penny_savings_goal_v1',
  ACCOUNTS: '@penny_accounts_v1',
  DEBTS: '@penny_debts_v1',
  CATEGORIES: '@penny_categories_v1',
  RECURRING: '@penny_recurring_v1',
  PENDING_COLLECTIONS: '@penny_pending_collections_v1',
};

// Default Categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_market', name: 'Gıda & Market', icon: 'cart-outline', color: '#F59E0B', type: 'expense' },
  { id: 'cat_food', name: 'Yeme & İçme', icon: 'cafe-outline', color: '#EF4444', type: 'expense' },
  { id: 'cat_home', name: 'Ev & Yaşam', icon: 'home-outline', color: '#8B5CF6', type: 'expense' },
  { id: 'cat_transport', name: 'Ulaşım', icon: 'bus-outline', color: '#3B82F6', type: 'expense' },
  { id: 'cat_bills', name: 'Faturalar', icon: 'receipt-outline', color: '#6366F1', type: 'expense' },
  { id: 'cat_rent', name: 'Kira Geliri', icon: 'home-outline', color: '#10B981', type: 'income' },
  { id: 'cat_salary', name: 'Gelir / Maaş / Hakediş', icon: 'cash-outline', color: '#10B981', type: 'income' },
];

// Default Clean Accounts
const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_cash',
    name: 'Nakit Cüzdan',
    type: 'cash',
    balance: 0,
    currency: '₺',
    color: '#10B981',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_bank',
    name: 'Banka Hesabı',
    type: 'bank',
    balance: 0,
    currency: '₺',
    color: '#3B82F6',
    createdAt: new Date().toISOString(),
  },
];

// --- User Name Storage ---
export const getUserName = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
  } catch (error) {
    console.error('Error reading user name:', error);
    return null;
  }
};

export const saveUserName = async (name: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);
  } catch (error) {
    console.error('Error saving user name:', error);
  }
};

// --- Pending Collections Storage (Beklenen Tahsilatlar / Hakedişler) ---
export const getPendingCollections = async (): Promise<PendingCollection[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_COLLECTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading pending collections:', error);
    return [];
  }
};

export const savePendingCollections = async (
  items: PendingCollection[]
): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_COLLECTIONS, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving pending collections:', error);
  }
};

export const addPendingCollection = async (
  title: string,
  expectedAmount: number,
  category = 'Gelir / Maaş / Hakediş',
  dueDate?: string
): Promise<PendingCollection[]> => {
  const current = await getPendingCollections();
  const newItem: PendingCollection = {
    id: `col_${Date.now()}`,
    title,
    expectedAmount,
    actualAmount: 0,
    category,
    dueDate: dueDate || new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const updated = [newItem, ...current];
  await savePendingCollections(updated);
  return updated;
};

export const collectPendingCollection = async (
  id: string,
  collectedAmount: number,
  accountId?: string
): Promise<{ collections: PendingCollection[]; transactions: AppTransaction[] }> => {
  const current = await getPendingCollections();
  let targetItem: PendingCollection | undefined;

  const updatedCollections = current.map((item) => {
    if (item.id === id) {
      targetItem = item;
      const newActual = item.actualAmount + collectedAmount;
      return {
        ...item,
        actualAmount: newActual,
        status: newActual >= item.expectedAmount ? ('completed' as const) : ('pending' as const),
      };
    }
    return item;
  });

  await savePendingCollections(updatedCollections);

  let updatedTxs: AppTransaction[] = [];
  if (targetItem) {
    updatedTxs = await addTransaction({
      title: `${targetItem.title} (Tahsil Edildi)`,
      category: targetItem.category || 'Gelir / Maaş / Hakediş',
      amount: `+₺${collectedAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      rawAmount: collectedAmount,
      type: 'income',
      iconName: 'cash-outline',
      accountId,
    });
  } else {
    updatedTxs = await getStoredTransactions();
  }

  return { collections: updatedCollections, transactions: updatedTxs };
};

export const deletePendingCollection = async (id: string): Promise<PendingCollection[]> => {
  const current = await getPendingCollections();
  const updated = current.filter((c) => c.id !== id);
  await savePendingCollections(updated);
  return updated;
};

// --- Categories Storage ---
export const getCategories = async (): Promise<Category[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  } catch (error) {
    console.error('Error reading categories:', error);
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategories = async (categories: Category[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories:', error);
  }
};

export const addCategory = async (
  name: string,
  type: 'income' | 'expense',
  icon = 'pricetag-outline'
): Promise<Category[]> => {
  const current = await getCategories();
  const newCat: Category = {
    id: `cat_${Date.now()}`,
    name,
    type,
    icon,
    color: type === 'income' ? '#10B981' : '#1F4E3D',
    isCustom: true,
  };
  const updated = [...current, newCat];
  await saveCategories(updated);
  return updated;
};

// --- Accounts Storage ---
export const getAccounts = async (): Promise<Account[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : DEFAULT_ACCOUNTS;
  } catch (error) {
    console.error('Error reading accounts:', error);
    return DEFAULT_ACCOUNTS;
  }
};

export const saveAccounts = async (accounts: Account[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (error) {
    console.error('Error saving accounts:', error);
  }
};

// --- Transactions Storage ---
export const getStoredTransactions = async (): Promise<AppTransaction[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading transactions:', error);
    return [];
  }
};

export const saveTransactions = async (transactions: AppTransaction[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions:', error);
  }
};

export const addTransaction = async (
  newTx: Omit<AppTransaction, 'id' | 'date'>
): Promise<AppTransaction[]> => {
  const current = await getStoredTransactions();
  const createdTx: AppTransaction = {
    ...newTx,
    id: `tx_${Date.now()}`,
    date: new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  const updated = [createdTx, ...current];
  await saveTransactions(updated);

  if (newTx.accountId) {
    const accounts = await getAccounts();
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === newTx.accountId) {
        const change = newTx.type === 'income' ? newTx.rawAmount : -newTx.rawAmount;
        return { ...acc, balance: acc.balance + change };
      }
      return acc;
    });
    await saveAccounts(updatedAccounts);
  }

  return updated;
};

export const deleteTransaction = async (id: string): Promise<AppTransaction[]> => {
  const current = await getStoredTransactions();
  const updated = current.filter((t) => t.id !== id);
  await saveTransactions(updated);
  return updated;
};

// --- Recurring Transactions Storage ---
export const getRecurringTransactions = async (): Promise<RecurringTransaction[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RECURRING);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading recurring transactions:', error);
    return [];
  }
};

export const saveRecurringTransactions = async (
  items: RecurringTransaction[]
): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving recurring transactions:', error);
  }
};

export const addRecurringTransaction = async (
  title: string,
  amount: number,
  type: 'income' | 'expense',
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  category: string
): Promise<RecurringTransaction[]> => {
  const current = await getRecurringTransactions();
  const newItem: RecurringTransaction = {
    id: `rec_${Date.now()}`,
    title,
    amount,
    type,
    frequency,
    category,
    isActive: true,
    nextDueDate: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
  };
  const updated = [newItem, ...current];
  await saveRecurringTransactions(updated);
  return updated;
};

export const deleteRecurringTransaction = async (id: string): Promise<RecurringTransaction[]> => {
  const current = await getRecurringTransactions();
  const updated = current.filter((r) => r.id !== id);
  await saveRecurringTransactions(updated);
  return updated;
};

// --- Debts Storage ---
export const getDebts = async (): Promise<Debt[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DEBTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading debts:', error);
    return [];
  }
};

export const saveDebts = async (debts: Debt[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  } catch (error) {
    console.error('Error saving debts:', error);
  }
};

export const addDebt = async (
  personName: string,
  type: 'given' | 'taken',
  amount: number,
  description?: string
): Promise<Debt[]> => {
  const current = await getDebts();
  const newDebt: Debt = {
    id: `debt_${Date.now()}`,
    personName,
    type,
    amount,
    remainingAmount: amount,
    description,
    isCompleted: false,
    createdAt: new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
    }),
  };
  const updated = [...current, newDebt];
  await saveDebts(updated);
  return updated;
};

export const payDebt = async (debtId: string, paidAmount: number): Promise<Debt[]> => {
  const current = await getDebts();
  const updated = current.map((d) => {
    if (d.id === debtId) {
      const newRemaining = Math.max(d.remainingAmount - paidAmount, 0);
      return {
        ...d,
        remainingAmount: newRemaining,
        isCompleted: newRemaining === 0,
      };
    }
    return d;
  });
  await saveDebts(updated);
  return updated;
};

export const deleteDebt = async (debtId: string): Promise<Debt[]> => {
  const current = await getDebts();
  const updated = current.filter((d) => d.id !== debtId);
  await saveDebts(updated);
  return updated;
};

// --- Savings Goal Storage ---
export const getSavingsGoal = async (): Promise<SavingsGoal> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVINGS_GOAL);
    if (data) return JSON.parse(data);
  } catch (error) {
    console.error('Error reading savings goal:', error);
  }
  return {
    title: 'Tasarruf hedefi',
    savedAmount: 0,
    targetAmount: 10000,
    percentage: 0,
    remainingAmount: 10000,
  };
};

export const saveSavingsGoal = async (goal: SavingsGoal): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SAVINGS_GOAL, JSON.stringify(goal));
  } catch (error) {
    console.error('Error saving savings goal:', error);
  }
};
