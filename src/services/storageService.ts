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
import { parseAmountSafely, formatCurrency } from '../utils/formatters';
import { getFormattingLocale, localize } from '../context/LocaleContext';
import { getActiveCurrency, getCurrencySymbol } from '../context/CurrencyContext';

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

// Default Categories matching  screenshots
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
    { id: 'acc_cash', name: 'Nakit Cüzdan', type: 'cash', balance: 0, currency: getCurrencySymbol(), color: '#10B981', createdAt: new Date().toISOString() },
    { id: 'acc_bank', name: 'Banka Hesabı', type: 'bank', balance: 0, currency: getCurrencySymbol(), color: '#3B82F6', createdAt: new Date().toISOString() },
  ]);
};

const saveStoredItem = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
    throw err;
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
  tx: Omit<AppTransaction, 'id' | 'date'> & { date?: string }
): Promise<AppTransaction[]> => {
  const current = await getStoredTransactions();
  const rawAmount = parseAmountSafely(tx.rawAmount);
  const created: AppTransaction = {
    ...tx,
    rawAmount,
    amount: `${tx.type === 'income' || (tx.type === 'transfer' && tx.transferDirection === 'in') ? '+' : '-'}${formatCurrency(rawAmount)}`,
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date: tx.date || new Date().toISOString(),
  };
  const updated = [created, ...current];
  await saveTransactions(updated);
  return updated;
};

export const updateTransaction = async (
  id: string,
  changes: Omit<AppTransaction, 'id' | 'date'> & { date?: string }
): Promise<AppTransaction[]> => {
  const current = await getStoredTransactions();
  const existing = current.find((tx) => tx.id === id);
  if (!existing || existing.type === 'transfer') throw new Error('İşlem düzenlenemedi.');
  const rawAmount = parseAmountSafely(changes.rawAmount);
  if (rawAmount <= 0) throw new Error('Geçersiz tutar.');
  const updated = current.map((tx) => tx.id === id ? {
    ...tx,
    ...changes,
    id,
    date: changes.date || tx.date,
    rawAmount,
    amount: `${changes.type === 'income' ? '+' : '-'}${formatCurrency(rawAmount)}`,
  } : tx);
  await saveTransactions(updated);
  return updated;
};

export const deleteTransaction = async (id: string): Promise<AppTransaction[]> => {
  const current = await getStoredTransactions();
  const updated = current.filter((t) => t.id !== id);
  await saveTransactions(updated);
  return updated;
};

export const deleteTransactionsForMonth = async (date: Date): Promise<AppTransaction[]> => {
  const current = await getStoredTransactions();
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth();
  const updated = current.filter((t) => {
    const txDate = new Date(t.date);
    if (isNaN(txDate.getTime())) return true;
    return !(txDate.getFullYear() === targetYear && txDate.getMonth() === targetMonth);
  });
  await saveTransactions(updated);
  return updated;
};

export const clearAllTransactions = async (): Promise<AppTransaction[]> => {
  await saveTransactions([]);
  return [];
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
  sub: Partial<SubscriptionItem> & Omit<SubscriptionItem, 'id'> & { id?: string }
): Promise<SubscriptionItem[]> => {
  const current = await getStoredSubscriptions();
  const amount = parseAmountSafely(sub.amount);

  if (sub.id) {
    const updated = current.map((s) =>
      s.id === sub.id
        ? {
            ...s,
            ...sub,
            amount,
          }
        : s
    );
    await saveStoredSubscriptions(updated);
    return updated;
  } else {
    const newSub: SubscriptionItem = {
      ...sub,
      amount,
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
    const updated = [newSub, ...current];
    await saveStoredSubscriptions(updated);
    return updated;
  }
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
  color?: string,
  budgetId?: string
): Promise<CategoryBudget[]> => {
  const current = await getStoredBudgets();
  const safeAllocated = parseAmountSafely(allocatedAmount);
  if (!categoryName.trim() || safeAllocated <= 0) throw new Error('Geçersiz bütçe.');
  const existingIndex = current.findIndex(
    (b) => budgetId ? b.id === budgetId : b.categoryName.trim().toLocaleLowerCase('tr-TR') === categoryName.trim().toLocaleLowerCase('tr-TR')
  );

  if (budgetId && existingIndex === -1) throw new Error('Bütçe bulunamadı.');
  if (budgetId && current.some((budget) => budget.id !== budgetId && budget.categoryName.trim().toLocaleLowerCase('tr-TR') === categoryName.trim().toLocaleLowerCase('tr-TR'))) {
    throw new Error('Bu kategori için zaten bir zarf var.');
  }

  if (existingIndex !== -1) {
    current[existingIndex] = {
      ...current[existingIndex],
      categoryName: categoryName.trim(),
      allocatedAmount: safeAllocated,
      iconName: iconName || current[existingIndex].iconName,
      color: color || current[existingIndex].color,
    };
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
  description?: string,
  options?: { source?: 'split_expense'; accountType?: 'bank' | 'cash' }
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
    source: options?.source,
    accountType: options?.accountType,
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
  const [name, txs, goalList, subList, budgetList, debtList, catList, pendingList] = await Promise.all([
    getUserName(),
    getStoredTransactions(),
    getStoredGoals(),
    getStoredSubscriptions(),
    getStoredBudgets(),
    getDebts(),
    getCategories(),
    getPendingCollections(),
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
    pendingCollections: pendingList,
  };

  return JSON.stringify(backupObj, null, 2);
};

export const exportTransactionsCSV = async (): Promise<string> => {
  const txs = await getStoredTransactions();
  const locale = getFormattingLocale();
  const decimal = ['tr', 'de', 'fr', 'ru', 'it'].includes(locale.split('-')[0]) ? ',' : '.';
  const delimiter = decimal === ',' ? ';' : ',';
  const amountFormatter = new Intl.NumberFormat(locale, { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cell = (value: string | number) => {
    const text = String(value ?? '');
    const formula = /^[=+@]/.test(text) || (text.startsWith('-') && !/^-\d+(,\d+)?$/.test(text));
    const safe = formula ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const rows = [
    ['Tarih', 'İşlem Tipi', 'Kategori', 'Başlık', 'Hesap', `Tutar (${getActiveCurrency()})`].map((label) => localize(label)),
    ...[...txs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((t) => [
        new Date(t.date).toLocaleDateString(locale),
        localize(t.type === 'income' ? 'Gelir' : t.type === 'expense' ? 'Gider' : 'Hesap Hareketi'),
        t.category || '',
        t.title || '',
        t.accountName || localize(t.accountType === 'cash' ? 'Nakit' : 'Banka'),
        amountFormatter.format(t.type === 'income' || (t.type === 'transfer' && t.transferDirection === 'in') ? (t.rawAmount || 0) : -(t.rawAmount || 0)),
      ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(cell).join(delimiter)).join('\r\n')}\r\n`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const isDateString = (value: unknown): value is string =>
  isNonEmptyString(value) && Number.isFinite(Date.parse(value));

const backupItemChecks: Record<string, (value: Record<string, unknown>) => boolean> = {
  transactions: (item) => isNonEmptyString(item.id) && isNonEmptyString(item.title) &&
    isNonEmptyString(item.category) && isDateString(item.date) &&
    isNonEmptyString(item.amount) && isAmount(item.rawAmount) &&
    ['income', 'expense', 'transfer'].includes(String(item.type)) && isNonEmptyString(item.iconName),
  goals: (item) => isNonEmptyString(item.id) && isNonEmptyString(item.title) &&
    isAmount(item.savedAmount) && isAmount(item.targetAmount),
  subscriptions: (item) => isNonEmptyString(item.id) && isNonEmptyString(item.title) &&
    isAmount(item.amount) && isNonEmptyString(item.category) &&
    ['monthly', 'yearly'].includes(String(item.cycle)) &&
    typeof item.paymentDay === 'number' && item.paymentDay >= 1 && item.paymentDay <= 31 &&
    isDateString(item.nextDueDate) && typeof item.isActive === 'boolean',
  budgets: (item) => isNonEmptyString(item.id) && isNonEmptyString(item.categoryName) &&
    isAmount(item.allocatedAmount) && isAmount(item.usedAmount),
  debts: (item) => isNonEmptyString(item.id) && isNonEmptyString(item.personName) &&
    ['given', 'taken'].includes(String(item.type)) && isAmount(item.amount) &&
    isAmount(item.remainingAmount) && typeof item.isCompleted === 'boolean',
  categories: (item) => isNonEmptyString(item.id) && isNonEmptyString(item.name) &&
    isNonEmptyString(item.icon) && isNonEmptyString(item.color) &&
    ['income', 'expense', 'transfer'].includes(String(item.type)),
  pendingCollections: (item) => isNonEmptyString(item.id) && isNonEmptyString(item.title) &&
    isAmount(item.expectedAmount) && isAmount(item.actualAmount) &&
    ['pending', 'completed'].includes(String(item.status)),
};

const backupStorageKeys: Record<string, string> = {
  transactions: STORAGE_KEYS.TRANSACTIONS,
  goals: STORAGE_KEYS.SAVINGS_GOALS,
  subscriptions: STORAGE_KEYS.SUBSCRIPTIONS,
  budgets: STORAGE_KEYS.BUDGETS,
  debts: STORAGE_KEYS.DEBTS,
  categories: STORAGE_KEYS.CATEGORIES,
  pendingCollections: STORAGE_KEYS.PENDING_COLLECTIONS,
};
const requiredBackupSections = ['transactions', 'goals', 'subscriptions', 'budgets', 'debts', 'categories'];

export const importAllDataJSON = async (jsonString: string): Promise<boolean> => {
  try {
    const data: unknown = JSON.parse(jsonString);
    if (!isRecord(data) || data.version !== '1.0' || !isNonEmptyString(data.userName) ||
      requiredBackupSections.some((section) => !Array.isArray(data[section]))) return false;
    const backupUserName = data.userName as string;

    const presentSections = Object.keys(backupStorageKeys);
    for (const section of presentSections) {
      const values = section === 'pendingCollections' && data[section] === undefined ? [] : data[section];
      if (!Array.isArray(values) || !values.every((value) => isRecord(value) && backupItemChecks[section](value))) {
        return false;
      }
    }

    const entries: [string, string][] = presentSections.map((section) =>
      [backupStorageKeys[section], JSON.stringify(section === 'pendingCollections' && data[section] === undefined ? [] : data[section])]);
    entries.push([STORAGE_KEYS.USER_NAME, backupUserName.trim()]);
    entries.push([STORAGE_KEYS.HAS_ONBOARDED, JSON.stringify(true)]);
    const previous = await AsyncStorage.multiGet(entries.map(([key]) => key));
    try {
      await AsyncStorage.multiSet(entries);
    } catch (writeError) {
      const existing = previous.filter(([, value]) => value !== null) as [string, string][];
      const absent = previous.filter(([, value]) => value === null).map(([key]) => key);
      try {
        if (existing.length) await AsyncStorage.multiSet(existing);
        if (absent.length) await AsyncStorage.multiRemove(absent);
      } catch (rollbackError) {
        console.error('Could not roll back failed backup import:', rollbackError);
      }
      throw writeError;
    }
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
    STORAGE_KEYS.ACCOUNTS,
    STORAGE_KEYS.DEBTS,
    STORAGE_KEYS.CATEGORIES,
    STORAGE_KEYS.SUBSCRIPTIONS,
    STORAGE_KEYS.PENDING_COLLECTIONS,
    STORAGE_KEYS.BUDGETS,
    '@penny_is_pro_v1',
    '@penny_pro_plan_v1',
    '@penny_pro_expiry_v1',
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
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (res.canceled || !res.assets || res.assets.length === 0) {
      return { success: false, message: 'İptal edildi' };
    }

    const selectedFile = res.assets[0];
    if (!selectedFile.name.toLowerCase().endsWith('.json')) {
      return { success: false, message: 'Lütfen Penny tarafından oluşturulmuş bir .json yedek dosyası seçin.' };
    }
    if (selectedFile.size !== undefined && selectedFile.size > 20 * 1024 * 1024) {
      return { success: false, message: 'Yedek dosyası çok büyük (en fazla 20 MB).' };
    }
    const fileUri = selectedFile.uri;
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
