import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppTransaction,
  SavingsGoal,
  Account,
  Debt,
  Category,
  SubscriptionItem,
  PendingCollection,
  CategoryBudget,
} from '../types';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { parseAmountSafely } from '../utils/formatters';

const STORAGE_KEYS = {
  USER_NAME: '@penny_user_name_v1',
  HAS_ONBOARDED: '@penny_has_onboarded_v1',
  TRANSACTIONS: '@penny_transactions_v2',
  SAVINGS_GOALS: '@penny_savings_goals_v2',
  ACCOUNTS: '@penny_accounts_v1',
  DEBTS: '@penny_debts_v1',
  CATEGORIES: '@penny_categories_v2',
  SUBSCRIPTIONS: '@penny_subscriptions_v2',
  PENDING_COLLECTIONS: '@penny_pending_collections_v1',
  BUDGETS: '@penny_budgets_v2',
};

// Default Categories matching SINCAP screenshots
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_tech', name: 'Teknoloji', icon: 'laptop-outline', color: '#3B82F6', type: 'expense' },
  { id: 'cat_home', name: 'Ev', icon: 'home-outline', color: '#F59E0B', type: 'expense' },
  { id: 'cat_food', name: 'Yemek', icon: 'fast-food-outline', color: '#EF4444', type: 'expense' },
  { id: 'cat_bills', name: 'Faturalar', icon: 'receipt-outline', color: '#6366F1', type: 'expense' },
  { id: 'cat_health', name: 'Sağlık', icon: 'medical-outline', color: '#10B981', type: 'expense' },
  { id: 'cat_transport', name: 'Ulaşım', icon: 'bus-outline', color: '#8B5CF6', type: 'expense' },
  { id: 'cat_fun', name: 'Eğlence', icon: 'game-controller-outline', color: '#EC4899', type: 'expense' },
  { id: 'cat_salary', name: 'Maaş / Hakediş', icon: 'cash-outline', color: '#0D9488', type: 'income' },
];

// Clean Default Arrays (No Fake Data)
export const DEFAULT_GOALS: SavingsGoal[] = [];
export const DEFAULT_SUBSCRIPTIONS: SubscriptionItem[] = [];
export const DEFAULT_BUDGETS: CategoryBudget[] = [];
export const DEFAULT_TRANSACTIONS: AppTransaction[] = [];

// Helper to safely load JSON
const loadStoredItem = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
    return fallback;
  }
};

export const getCategories = async (): Promise<Category[]> => {
  return loadStoredItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
};

export const addCategory = async (
  name: string,
  type: 'income' | 'expense',
  icon = 'pricetag-outline',
  color = '#0D9488'
): Promise<Category[]> => {
  const current = await getCategories();
  const newCat: Category = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: name.trim(),
    type,
    icon,
    color,
    isCustom: true,
  };
  const updated = [...current, newCat];
  await saveStoredItem(STORAGE_KEYS.CATEGORIES, updated);
  return updated;
};

export const getAccounts = async (): Promise<Account[]> => {
  return loadStoredItem(STORAGE_KEYS.ACCOUNTS, [
    { id: 'acc_cash', name: 'Nakit Cüzdan', type: 'cash', balance: 0, currency: '₺', color: '#10B981', createdAt: new Date().toISOString() },
    { id: 'acc_bank', name: 'Banka Hesabı', type: 'bank', balance: 0, currency: '₺', color: '#3B82F6', createdAt: new Date().toISOString() },
  ]);
};

const saveStoredItem = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
};

// --- Storage API ---
export const getUserName = async (): Promise<string> => {
  const name = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
  return name || 'Kullanıcı';
};

export const saveUserName = async (name: string): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name.trim());
};

export const getStoredTransactions = async (): Promise<AppTransaction[]> => {
  return loadStoredItem(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
};

export const saveTransactions = async (txs: AppTransaction[]): Promise<void> => {
  await saveStoredItem(STORAGE_KEYS.TRANSACTIONS, txs);
};

export const addTransaction = async (
  tx: Omit<AppTransaction, 'id' | 'date'>
): Promise<AppTransaction[]> => {
  const current = await getStoredTransactions();
  const rawAmount = parseAmountSafely(tx.rawAmount);
  const created: AppTransaction = {
    ...tx,
    rawAmount,
    amount: `${tx.type === 'income' ? '+' : '-'}₺${rawAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date: new Date().toISOString(),
  };
  const updated = [created, ...current];
  await saveTransactions(updated);
  return updated;
};

export const deleteTransaction = async (id: string): Promise<AppTransaction[]> => {
  const current = await getStoredTransactions();
  const updated = current.filter((t) => t.id !== id);
  await saveTransactions(updated);
  return updated;
};

export const getStoredGoals = async (): Promise<SavingsGoal[]> => {
  return loadStoredItem(STORAGE_KEYS.SAVINGS_GOALS, DEFAULT_GOALS);
};

export const saveStoredGoals = async (goals: SavingsGoal[]): Promise<void> => {
  await saveStoredItem(STORAGE_KEYS.SAVINGS_GOALS, goals);
};

export const addOrUpdateGoal = async (goal: Partial<SavingsGoal>): Promise<SavingsGoal[]> => {
  const current = await getStoredGoals();
  const target = parseAmountSafely(goal.targetAmount || 10000);
  const saved = parseAmountSafely(goal.savedAmount || 0);
  const percentage = target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;

  if (goal.id) {
    const updated = current.map((g) =>
      g.id === goal.id
        ? {
            ...g,
            ...goal,
            savedAmount: saved,
            targetAmount: target,
            percentage,
            remainingAmount: Math.max(target - saved, 0),
            isCompleted: saved >= target,
          }
        : g
    );
    await saveStoredGoals(updated);
    return updated;
  } else {
    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: goal.title?.trim() || 'Yeni Hedef',
      category: goal.category || 'Genel',
      savedAmount: saved,
      targetAmount: target,
      percentage,
      remainingAmount: Math.max(target - saved, 0),
      isCompleted: saved >= target,
      iconName: goal.iconName || 'flag-outline',
    };
    const updated = [newGoal, ...current];
    await saveStoredGoals(updated);
    return updated;
  }
};

export const deleteGoal = async (id: string): Promise<SavingsGoal[]> => {
  const current = await getStoredGoals();
  const updated = current.filter((g) => g.id !== id);
  await saveStoredGoals(updated);
  return updated;
};

export const getStoredSubscriptions = async (): Promise<SubscriptionItem[]> => {
  return loadStoredItem(STORAGE_KEYS.SUBSCRIPTIONS, DEFAULT_SUBSCRIPTIONS);
};

export const saveStoredSubscriptions = async (subs: SubscriptionItem[]): Promise<void> => {
  await saveStoredItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);
};

export const addSubscription = async (
  sub: Omit<SubscriptionItem, 'id'>
): Promise<SubscriptionItem[]> => {
  const current = await getStoredSubscriptions();
  const amount = parseAmountSafely(sub.amount);
  const newSub: SubscriptionItem = {
    ...sub,
    amount,
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  };
  const updated = [newSub, ...current];
  await saveStoredSubscriptions(updated);
  return updated;
};

export const deleteSubscription = async (id: string): Promise<SubscriptionItem[]> => {
  const current = await getStoredSubscriptions();
  const updated = current.filter((s) => s.id !== id);
  await saveStoredSubscriptions(updated);
  return updated;
};

export const getStoredBudgets = async (): Promise<CategoryBudget[]> => {
  return loadStoredItem(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
};

export const saveStoredBudgets = async (budgets: CategoryBudget[]): Promise<void> => {
  await saveStoredItem(STORAGE_KEYS.BUDGETS, budgets);
};

export const addOrUpdateBudget = async (
  categoryName: string,
  allocatedAmount: number,
  iconName?: string,
  color?: string
): Promise<CategoryBudget[]> => {
  const current = await getStoredBudgets();
  const safeAllocated = parseAmountSafely(allocatedAmount);
  const existingIndex = current.findIndex(
    (b) => b.categoryName.toLowerCase() === categoryName.toLowerCase()
  );

  if (existingIndex !== -1) {
    current[existingIndex].allocatedAmount = safeAllocated;
    if (iconName) current[existingIndex].iconName = iconName;
    if (color) current[existingIndex].color = color;
  } else {
    current.push({
      id: `b_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      categoryName: categoryName.trim(),
      allocatedAmount: safeAllocated,
      usedAmount: 0,
      badgeText: 'Yeni Bütçe',
      iconName: iconName || 'pricetag-outline',
      color: color || '#0D9488',
    });
  }

  await saveStoredBudgets(current);
  return [...current];
};

export const getDebts = async (): Promise<Debt[]> => {
  return loadStoredItem(STORAGE_KEYS.DEBTS, []);
};

export const saveDebts = async (debts: Debt[]): Promise<void> => {
  await saveStoredItem(STORAGE_KEYS.DEBTS, debts);
};

export const addDebt = async (
  personName: string,
  type: 'given' | 'taken',
  amount: number,
  description?: string
): Promise<Debt[]> => {
  const current = await getDebts();
  const safeAmount = parseAmountSafely(amount);
  const newDebt: Debt = {
    id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    personName: personName.trim(),
    type,
    amount: safeAmount,
    remainingAmount: safeAmount,
    description: description?.trim(),
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };
  const updated = [newDebt, ...current];
  await saveDebts(updated);
  return updated;
};

export const payDebt = async (debtId: string, paidAmount: number): Promise<Debt[]> => {
  const current = await getDebts();
  const safePaid = parseAmountSafely(paidAmount);
  const updated = current.map((d) => {
    if (d.id === debtId) {
      const newRemaining = Math.max(d.remainingAmount - safePaid, 0);
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

export const getPendingCollections = async (): Promise<PendingCollection[]> => {
  return loadStoredItem(STORAGE_KEYS.PENDING_COLLECTIONS, []);
};

export const savePendingCollections = async (items: PendingCollection[]): Promise<void> => {
  await saveStoredItem(STORAGE_KEYS.PENDING_COLLECTIONS, items);
};

// Onboarding Status
export const getHasOnboarded = async (): Promise<boolean> => {
  return loadStoredItem(STORAGE_KEYS.HAS_ONBOARDED, false);
};

export const markHasOnboarded = async (): Promise<void> => {
  await saveStoredItem(STORAGE_KEYS.HAS_ONBOARDED, true);
};

// Backup & Restore
export const exportAllDataJSON = async (): Promise<string> => {
  const [name, txs, goalList, subList, budgetList, debtList, catList] = await Promise.all([
    getUserName(),
    getStoredTransactions(),
    getStoredGoals(),
    getStoredSubscriptions(),
    getStoredBudgets(),
    getDebts(),
    getCategories(),
  ]);

  const backupObj = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    userName: name,
    transactions: txs,
    goals: goalList,
    subscriptions: subList,
    budgets: budgetList,
    debts: debtList,
    categories: catList,
  };

  return JSON.stringify(backupObj, null, 2);
};

export const exportTransactionsCSV = async (): Promise<string> => {
  const txs = await getStoredTransactions();
  let csv = 'Tarih;İşlem Tipi;Kategori;Başlık;Tutar (TL)\n';
  txs.forEach((t) => {
    const typeStr = t.type === 'income' ? 'Gelir' : 'Gider';
    const cleanTitle = (t.title || '').replace(/;/g, ',');
    const cleanCat = (t.category || '').replace(/;/g, ',');
    const formattedDate = new Date(t.date).toLocaleDateString('tr-TR');
    csv += `"${formattedDate}";"${typeStr}";"${cleanCat}";"${cleanTitle}";"${t.rawAmount}"\n`;
  });
  return csv;
};

export const importAllDataJSON = async (jsonString: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') return false;

    if (Array.isArray(data.transactions)) await saveStoredItem(STORAGE_KEYS.TRANSACTIONS, data.transactions);
    if (Array.isArray(data.goals)) await saveStoredItem(STORAGE_KEYS.SAVINGS_GOALS, data.goals);
    if (Array.isArray(data.subscriptions)) await saveStoredItem(STORAGE_KEYS.SUBSCRIPTIONS, data.subscriptions);
    if (Array.isArray(data.budgets)) await saveStoredItem(STORAGE_KEYS.BUDGETS, data.budgets);
    if (Array.isArray(data.debts)) await saveStoredItem(STORAGE_KEYS.DEBTS, data.debts);
    if (Array.isArray(data.categories)) await saveStoredItem(STORAGE_KEYS.CATEGORIES, data.categories);
    if (data.userName) await saveUserName(data.userName);
    await markHasOnboarded();
    return true;
  } catch (err) {
    console.error('Error importing backup JSON:', err);
    return false;
  }
};

export const resetAllAppData = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.USER_NAME,
    STORAGE_KEYS.HAS_ONBOARDED,
    STORAGE_KEYS.TRANSACTIONS,
    STORAGE_KEYS.SAVINGS_GOALS,
    STORAGE_KEYS.DEBTS,
    STORAGE_KEYS.CATEGORIES,
    STORAGE_KEYS.SUBSCRIPTIONS,
    STORAGE_KEYS.BUDGETS,
  ]);
};

// File-based Share & Import
export const shareBackupFileJSON = async (): Promise<boolean> => {
  try {
    const jsonStr = await exportAllDataJSON();
    const fileName = `penny_yedek_${new Date().toISOString().slice(0, 10)}.json`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, jsonStr, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Penny Yedeğini Kaydet',
        UTI: 'public.json',
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error sharing JSON backup file:', err);
    return false;
  }
};

export const shareTransactionsFileCSV = async (): Promise<boolean> => {
  try {
    const csvStr = await exportTransactionsCSV();
    const fileName = `penny_islemler_${new Date().toISOString().slice(0, 10)}.csv`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvStr, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Penny Excel Raporunu Kaydet',
        UTI: 'public.comma-separated-values-text',
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error sharing CSV file:', err);
    return false;
  }
};

export const pickAndImportBackupFileJSON = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (res.canceled || !res.assets || res.assets.length === 0) {
      return { success: false, message: 'İptal edildi' };
    }

    const fileUri = res.assets[0].uri;
    const jsonStr = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const success = await importAllDataJSON(jsonStr);
    if (success) {
      return { success: true, message: 'Yedek dosyası başarıyla yüklendi!' };
    } else {
      return { success: false, message: 'Seçilen dosya geçerli bir Penny yedek JSON dosyası değil.' };
    }
  } catch (err) {
    console.error('Error picking/importing backup file:', err);
    return { success: false, message: 'Dosya okunurken bir hata oluştu.' };
  }
};
