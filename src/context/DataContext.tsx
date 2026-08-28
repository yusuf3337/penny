import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  addTransaction as addTxService,
  deleteTransaction as deleteTxService,
  getStoredGoals,
  addOrUpdateGoal as saveGoalService,
  deleteGoal as deleteGoalService,
  getStoredSubscriptions,
  addSubscription as addSubService,
  deleteSubscription as deleteSubService,
  getStoredBudgets,
  addOrUpdateBudget as addBudgetService,
  saveStoredBudgets,
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
  handleAddTransaction: (tx: Omit<AppTransaction, 'id' | 'date'>) => Promise<void>;
  handleDeleteTransaction: (id: string) => Promise<void>;

  goals: SavingsGoal[];
  handleSaveGoal: (goal: Partial<SavingsGoal>) => Promise<void>;
  handleDeleteGoal: (id: string) => Promise<void>;

  subscriptions: SubscriptionItem[];
  handleAddSubscription: (sub: Omit<SubscriptionItem, 'id'>) => Promise<void>;
  handleDeleteSubscription: (id: string) => Promise<void>;

  budgets: CategoryBudget[];
  handleSaveBudget: (categoryName: string, allocatedAmount: number, iconName?: string, color?: string) => Promise<void>;

  debts: Debt[];
  handleAddDebt: (personName: string, type: 'given' | 'taken', amount: number, desc?: string) => Promise<void>;
  handlePayDebt: (id: string, paidAmount: number) => Promise<void>;
  handleDeleteDebt: (id: string) => Promise<void>;

  pendingCollections: PendingCollection[];

  // Computed totals
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
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
  const [userName, setUserName] = useState<string>('Kullanıcı');
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [pendingCollections, setPendingCollections] = useState<PendingCollection[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
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

      setUserName(name);
      setHasOnboarded(onboardedStatus);
      setCategories(catList);
      setTransactions(txs);
      setGoals(goalList);
      setSubscriptions(subList);
      setBudgets(budgetList);
      setDebts(debtList);
      setPendingCollections(pendingList);
    } catch (error) {
      console.error('Error initializing DataContext:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markOnboarded = async () => {
    setHasOnboarded(true);
    await markOnboardedService();
  };

  const handleResetAllData = async () => {
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
    const updated = await addCatService(name, type, iconName, color);
    setCategories(updated);
  };

  const handleAddTransaction = async (tx: Omit<AppTransaction, 'id' | 'date'>) => {
    const updated = await addTxService(tx);
    setTransactions(updated);

    // Update corresponding category budget usage dynamically
    if (tx.type === 'expense') {
      const updatedBudgets = budgets.map((b) => {
        if (b.categoryName.toLowerCase() === tx.category.toLowerCase()) {
          return { ...b, usedAmount: b.usedAmount + tx.rawAmount };
        }
        return b;
      });
      setBudgets(updatedBudgets);
      await saveStoredBudgets(updatedBudgets);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const updated = await deleteTxService(id);
    setTransactions(updated);
  };

  const handleSaveGoal = async (goal: Partial<SavingsGoal>) => {
    const updated = await saveGoalService(goal);
    setGoals(updated);
  };

  const handleDeleteGoal = async (id: string) => {
    const updated = await deleteGoalService(id);
    setGoals(updated);
  };

  const handleSaveSubscription = async (sub: Omit<SubscriptionItem, 'id'>) => {
    const updated = await addSubService(sub);
    setSubscriptions(updated);
  };

  const handleSaveBudget = async (
    categoryName: string,
    allocatedAmount: number,
    iconName?: string,
    color?: string
  ) => {
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
    desc?: string
  ) => {
    const updated = await addDebtService(personName, type, amount, desc);
    setDebts(updated);
  };

  const handlePayDebt = async (id: string, paidAmount: number) => {
    const updated = await payDebtService(id, paidAmount);
    setDebts(updated);
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

  const totalBalance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

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
    return budgets.reduce((sum, b) => sum + (b.usedAmount || 0), 0);
  }, [budgets]);

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
        handleDeleteTransaction,
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
