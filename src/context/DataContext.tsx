import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import {
  AppTransaction,
  SavingsGoal,
  SubscriptionItem,
  CategoryBudget,
  Debt,
  PendingCollection,
  Category,
} from '../types';
import {
  getUserName,
  saveUserName as saveNameService,
  getStoredTransactions,
  saveTransactions,
  addTransaction as addTxService,
  updateTransaction as updateTxService,
  deleteTransaction as deleteTxService,
  deleteTransactionsForMonth as deleteMonthTxService,
  clearAllTransactions as clearAllTxService,
  getStoredGoals,
  addOrUpdateGoal as saveGoalService,
  deleteGoal as deleteGoalService,
  getStoredSubscriptions,
  saveStoredSubscriptions,
  addSubscription as addSubService,
  deleteSubscription as deleteSubService,
  getStoredBudgets,
  addOrUpdateBudget as addBudgetService,
  getDebts,
  addDebt as addDebtService,
  payDebt as payDebtService,
  deleteDebt as deleteDebtService,
  getPendingCollections,
  getCategories,
  addCategory as addCatService,
  getHasOnboarded,
  markHasOnboarded as markOnboardedService,
  resetAllAppData,
} from '../services/storageService';
import { calculateNextDueDate, advanceSubscriptionDueDate, isSameMonthAndYear, formatCurrency } from '../utils/formatters';
import { usePremium } from './PremiumContext';
import { useLocale } from './LocaleContext';
import { useCurrency } from './CurrencyContext';
import { notifySubscriptionRecorded, requestNotificationPermissions, syncSubscriptionReminders } from '../services/notificationService';

export type TabType = 'timeline' | 'goals' | 'subscriptions' | 'budget' | 'reports' | 'debts';

interface DataContextType {
  userName: string;
  updateUserName: (name: string) => Promise<void>;
  hasOnboarded: boolean;
  markOnboarded: () => Promise<void>;
  reloadAllData: () => Promise<void>;
  handleResetAllData: () => Promise<void>;
  isBalanceHidden: boolean;
  toggleBalanceHidden: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  categories: Category[];
  handleAddCategory: (name: string, type: 'income' | 'expense', iconName?: string, color?: string) => Promise<void>;

  transactions: AppTransaction[];
  handleAddTransaction: (tx: Omit<AppTransaction, 'id' | 'date'> & { date?: string }) => Promise<void>;
  handleUpdateTransaction: (id: string, tx: Omit<AppTransaction, 'id' | 'date'> & { date?: string }) => Promise<void>;
  handleDeleteTransaction: (id: string) => Promise<void>;
  handleDeleteTransactionsForMonth: (date: Date) => Promise<void>;
  handleClearAllTransactions: () => Promise<void>;

  goals: SavingsGoal[];
  handleSaveGoal: (goal: Partial<SavingsGoal>) => Promise<void>;
  handleDeleteGoal: (id: string) => Promise<void>;

  subscriptions: SubscriptionItem[];
  handleAddSubscription: (sub: Partial<SubscriptionItem> & Omit<SubscriptionItem, 'id'> & { id?: string }) => Promise<void>;
  handleDeleteSubscription: (id: string) => Promise<void>;

  budgets: CategoryBudget[];
  handleSaveBudget: (categoryName: string, allocatedAmount: number, iconName?: string, color?: string) => Promise<void>;

  debts: Debt[];
  handleAddDebt: (personName: string, type: 'given' | 'taken', amount: number, desc?: string, options?: { source?: 'split_expense'; accountType?: 'bank' | 'cash' }) => Promise<void>;
  handlePayDebt: (id: string, paidAmount: number) => Promise<void>;
  handleDeleteDebt: (id: string) => Promise<void>;

  pendingCollections: PendingCollection[];

  // Computed totals
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  bankBalance: number;
  cashBalance: number;
  totalSavedGoals: number;
  totalTargetGoals: number;
  totalMonthlySubscriptions: number;
  totalYearlySubscriptions: number;
  totalBudgetedSpending: number;
  totalUsedSpending: number;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPro, checkGoalAllowed, checkBudgetAllowed } = usePremium();
  const { language } = useLocale();
  const { currency } = useCurrency();
  const [userName, setUserName] = useState<string>('Kullanıcı');
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const loadingData = useRef<Promise<void> | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [pendingCollections, setPendingCollections] = useState<PendingCollection[]>([]);

  useEffect(() => {
    loadAllData();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void loadAllData();
    });
    return () => listener.remove();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    void (async () => {
      if (subscriptions.some((sub) => sub.isActive)) await requestNotificationPermissions();
      await syncSubscriptionReminders(subscriptions);
    })().catch((error) => console.warn('Could not schedule subscription reminders:', error));
  }, [subscriptions, isLoading, language, currency]);

  const loadAllData = (): Promise<void> => {
    if (loadingData.current) return loadingData.current;
    const task = (async () => {
    try {
      setIsLoading(true);
      const [name, onboardedStatus, catList, txs, goalList, subList, budgetList, debtList, pendingList] = await Promise.all([
        getUserName(),
        getHasOnboarded(),
        getCategories(),
        getStoredTransactions(),
        getStoredGoals(),
        getStoredSubscriptions(),
        getStoredBudgets(),
        getDebts(),
        getPendingCollections(),
      ]);

      // 1. Clean up any runaway duplicate subscription transactions caused by the previous loop
      let hasChanges = false;
      const seenAutoTxs = new Set<string>();
      const deduplicatedTxs: AppTransaction[] = [];

      for (const tx of txs) {
        if (tx.title.includes('Abonelik Ödemesi')) {
          const dateKey = tx.date ? tx.date.slice(0, 10) : '';
          const dedupeKey = `${tx.title.trim()}_${tx.rawAmount}_${dateKey}`;
          if (seenAutoTxs.has(dedupeKey)) {
            hasChanges = true;
            continue; // Drop duplicate auto transaction
          }
          seenAutoTxs.add(dedupeKey);
        }
        deduplicatedTxs.push(tx);
      }

      let updatedTxs = deduplicatedTxs;
      let updatedSubs = [...subList];
      const recordedSubscriptions: SubscriptionItem[] = [];

      const now = new Date();
      updatedSubs = updatedSubs.map((sub) => {
        if (sub.isActive && sub.nextDueDate) {
          const dueDate = new Date(sub.nextDueDate);
          if (!isNaN(dueDate.getTime()) && dueDate <= now) {
            // Check if already processed for this billing cycle / day
            const cycleKey = `${sub.id}_${now.getFullYear()}_${now.getMonth() + 1}`;
            const isAlreadyChargedToday = updatedTxs.some((t) => {
              const txDate = new Date(t.date);
              return (
                t.title.includes(sub.title) &&
                t.title.includes('Abonelik Ödemesi') &&
                txDate.getFullYear() === now.getFullYear() &&
                txDate.getMonth() === now.getMonth() &&
                txDate.getDate() === now.getDate()
              );
            });

            // Advance nextDueDate strictly into the future
            let advancedNextDue = advanceSubscriptionDueDate(sub.nextDueDate, sub.paymentDay || 1, sub.cycle || 'monthly');
            while (new Date(advancedNextDue) <= now) {
              advancedNextDue = advanceSubscriptionDueDate(advancedNextDue, sub.paymentDay || 1, sub.cycle || 'monthly');
            }

            if (!isAlreadyChargedToday) {
              hasChanges = true;
              const autoTx: AppTransaction = {
                id: `tx_sub_${sub.id}_${cycleKey}_${Date.now()}`,
                title: `${sub.title} Abonelik Ödemesi`,
                category: sub.category || 'Eğlence',
                date: new Date().toISOString(),
                amount: `-${formatCurrency(sub.amount)}`,
                rawAmount: sub.amount,
                type: 'expense',
                iconName: sub.iconName || 'repeat-outline',
                accountType: sub.accountType || 'bank',
                accountName: sub.accountType === 'cash' ? 'Nakit Cüzdan' : 'Banka Hesabı',
              };
              updatedTxs = [autoTx, ...updatedTxs];
              recordedSubscriptions.push(sub);
            }

            hasChanges = true;
            return {
              ...sub,
              nextDueDate: advancedNextDue,
              lastProcessedDate: now.toISOString(),
            };
          }
        }
        return sub;
      });

      if (hasChanges) {
        await saveTransactions(updatedTxs);
        await saveStoredSubscriptions(updatedSubs);
        for (const sub of recordedSubscriptions) void notifySubscriptionRecorded(sub);
      }

      setUserName(name);
      setHasOnboarded(onboardedStatus);
      setCategories(catList);
      setTransactions(updatedTxs);
      setGoals(goalList);
      setSubscriptions(updatedSubs);
      setBudgets(budgetList);
      setDebts(debtList);
      setPendingCollections(pendingList);
    } catch (error) {
      console.error('Error initializing DataContext:', error);
    } finally {
      setIsLoading(false);
    }
    })();
    loadingData.current = task;
    void task.finally(() => { if (loadingData.current === task) loadingData.current = null; });
    return task;
  };

  const markOnboarded = async () => {
    setHasOnboarded(true);
    await markOnboardedService();
  };

  const handleResetAllData = async () => {
    if (loadingData.current) await loadingData.current;
    await resetAllAppData();
    await loadAllData();
  };

  const updateUserName = async (name: string) => {
    setUserName(name);
    await saveNameService(name);
  };

  const toggleBalanceHidden = () => setIsBalanceHidden((prev) => !prev);

  const handleAddCategory = async (
    name: string,
    type: 'income' | 'expense',
    iconName?: string,
    color?: string
  ) => {
    if (!isPro) throw new Error('Özel kategori oluşturmak için Penny Pro gerekir.');
    const updated = await addCatService(name, type, iconName, color);
    setCategories(updated);
  };

  const handleAddTransaction = async (tx: Omit<AppTransaction, 'id' | 'date'> & { date?: string }) => {
    const updated = await addTxService(tx);
    setTransactions(updated);
  };

  const handleUpdateTransaction = async (id: string, tx: Omit<AppTransaction, 'id' | 'date'> & { date?: string }) => {
    const updated = await updateTxService(id, tx);
    setTransactions(updated);
  };

  const handleDeleteTransaction = async (id: string) => {
    const updated = await deleteTxService(id);
    setTransactions(updated);
  };

  const handleDeleteTransactionsForMonth = async (date: Date) => {
    const updated = await deleteMonthTxService(date);
    setTransactions(updated);
  };

  const handleClearAllTransactions = async () => {
    const updated = await clearAllTxService();
    setTransactions(updated);
  };

  const handleSaveGoal = async (goal: Partial<SavingsGoal>) => {
    if (!goal.id && !checkGoalAllowed(goals.length)) {
      throw new Error('Ücretsiz plandaki hedef sınırına ulaşıldı.');
    }
    const updated = await saveGoalService(goal);
    setGoals(updated);
  };

  const handleDeleteGoal = async (id: string) => {
    const updated = await deleteGoalService(id);
    setGoals(updated);
  };

  const handleSaveSubscription = async (
    sub: Partial<SubscriptionItem> & Omit<SubscriptionItem, 'id'> & { id?: string }
  ) => {
    const updated = await addSubService(sub as any);
    setSubscriptions(updated);
  };

  const handleSaveBudget = async (
    categoryName: string,
    allocatedAmount: number,
    iconName?: string,
    color?: string
  ) => {
    const normalizedCategory = categoryName.trim().toLocaleLowerCase('tr-TR');
    const alreadyExists = budgets.some((budget) => budget.categoryName.trim().toLocaleLowerCase('tr-TR') === normalizedCategory);
    if (!alreadyExists && !checkBudgetAllowed(budgets.length)) {
      throw new Error('Ücretsiz plandaki bütçe sınırına ulaşıldı.');
    }
    const updated = await addBudgetService(categoryName, allocatedAmount, iconName, color);
    setBudgets(updated);
  };

  const handleDeleteSubscription = async (id: string) => {
    const updated = await deleteSubService(id);
    setSubscriptions(updated);
  };

  const handleAddDebt = async (
    personName: string,
    type: 'given' | 'taken',
    amount: number,
    desc?: string,
    options?: { source?: 'split_expense'; accountType?: 'bank' | 'cash' }
  ) => {
    const updated = await addDebtService(personName, type, amount, desc, options);
    setDebts(updated);
  };

  const handlePayDebt = async (id: string, paidAmount: number) => {
    const updated = await payDebtService(id, paidAmount);
    setDebts(updated);
    const debt = debts.find((item) => item.id === id);
    if (debt?.type === 'given' && (debt.source === 'split_expense' || debt.description?.endsWith('Ortak Harcama Payı'))) {
      const accountType = debt.accountType || 'bank';
      const updatedTransactions = await addTxService({
        title: `${debt.personName} · Ortak Harcama Tahsilatı`,
        category: 'Ortak Harcama',
        amount: '',
        rawAmount: paidAmount,
        type: 'transfer',
        transferDirection: 'in',
        iconName: 'arrow-down-outline',
        accountType,
        accountName: accountType === 'cash' ? 'Nakit Cüzdan' : 'Banka Hesabı',
      });
      setTransactions(updatedTransactions);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    const updated = await deleteDebtService(id);
    setDebts(updated);
  };

  // Memoized computations
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (t.rawAmount || 0), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.rawAmount || 0), 0);
  }, [transactions]);

  const bankIncome = useMemo(() => {
    return transactions
      .filter((t) => (t.type === 'income' || (t.type === 'transfer' && t.transferDirection === 'in')) && (t.accountType === 'bank' || !t.accountType || t.accountName?.includes('Banka')))
      .reduce((sum, t) => sum + (t.rawAmount || 0), 0);
  }, [transactions]);

  const bankExpense = useMemo(() => {
    return transactions
      .filter((t) => (t.type === 'expense' || (t.type === 'transfer' && t.transferDirection === 'out')) && (t.accountType === 'bank' || !t.accountType || t.accountName?.includes('Banka')))
      .reduce((sum, t) => sum + (t.rawAmount || 0), 0);
  }, [transactions]);

  const bankBalance = useMemo(() => bankIncome - bankExpense, [bankIncome, bankExpense]);

  const cashIncome = useMemo(() => {
    return transactions
      .filter((t) => (t.type === 'income' || (t.type === 'transfer' && t.transferDirection === 'in')) && (t.accountType === 'cash' || t.accountName?.includes('Nakit')))
      .reduce((sum, t) => sum + (t.rawAmount || 0), 0);
  }, [transactions]);

  const cashExpense = useMemo(() => {
    return transactions
      .filter((t) => (t.type === 'expense' || (t.type === 'transfer' && t.transferDirection === 'out')) && (t.accountType === 'cash' || t.accountName?.includes('Nakit')))
      .reduce((sum, t) => sum + (t.rawAmount || 0), 0);
  }, [transactions]);

  const cashBalance = useMemo(() => cashIncome - cashExpense, [cashIncome, cashExpense]);

  const totalBalance = useMemo(() => bankBalance + cashBalance, [bankBalance, cashBalance]);

  const totalSavedGoals = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.savedAmount || 0), 0);
  }, [goals]);

  const totalTargetGoals = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  }, [goals]);

  const totalMonthlySubscriptions = useMemo(() => {
    return subscriptions
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + (s.cycle === 'monthly' ? s.amount : s.amount / 12), 0);
  }, [subscriptions]);

  const totalYearlySubscriptions = useMemo(
    () => totalMonthlySubscriptions * 12,
    [totalMonthlySubscriptions]
  );

  const totalBudgetedSpending = useMemo(() => {
    return budgets.reduce((sum, b) => sum + (b.allocatedAmount || 0), 0);
  }, [budgets]);

  const totalUsedSpending = useMemo(() => {
    const now = new Date();
    const budgetCategories = new Set(budgets.map((budget) => budget.categoryName.trim().toLocaleLowerCase('tr-TR')));
    return transactions
      .filter((tx) => tx.type === 'expense' && budgetCategories.has(tx.category.trim().toLocaleLowerCase('tr-TR')) && isSameMonthAndYear(tx.date, now))
      .reduce((sum, tx) => sum + (tx.rawAmount || 0), 0);
  }, [budgets, transactions]);

  return (
    <DataContext.Provider
      value={{
        userName,
        updateUserName,
        hasOnboarded,
        markOnboarded,
        reloadAllData: loadAllData,
        handleResetAllData,
        isBalanceHidden,
        toggleBalanceHidden,
        activeTab,
        setActiveTab,
        categories,
        handleAddCategory,
        transactions,
        handleAddTransaction,
        handleUpdateTransaction,
        handleDeleteTransaction,
        handleDeleteTransactionsForMonth,
        handleClearAllTransactions,
        goals,
        handleSaveGoal,
        handleDeleteGoal,
        subscriptions,
        handleAddSubscription: handleSaveSubscription,
        handleDeleteSubscription,
        budgets,
        handleSaveBudget,
        debts,
        handleAddDebt,
        handlePayDebt,
        handleDeleteDebt,
        pendingCollections,
        totalIncome,
        totalExpense,
        totalBalance,
        bankBalance,
        cashBalance,
        totalSavedGoals,
        totalTargetGoals,
        totalMonthlySubscriptions,
        totalYearlySubscriptions,
        totalBudgetedSpending,
        totalUsedSpending,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a DataProvider');
  }
  return ctx;
};
