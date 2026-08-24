import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { HeaderSection } from '../components/home/HeaderSection';
import { BalanceCard } from '../components/home/BalanceCard';
import { SummaryCardsRow } from '../components/home/SummaryCardsRow';
import { PendingCollectionsCard } from '../components/home/PendingCollectionsCard';
import { SpendingAnalysisCard } from '../components/home/SpendingAnalysisCard';
import { RecurringSection } from '../components/home/RecurringSection';
import { SavingsGoalCard } from '../components/home/SavingsGoalCard';
import { RecentTransactionsCard } from '../components/home/RecentTransactionsCard';
import { BottomNavBar, TabType } from '../components/common/BottomNavBar';
import { UserNameModal } from '../components/modals/UserNameModal';
import { AddTransactionModal } from '../components/modals/AddTransactionModal';
import { EditSavingsGoalModal } from '../components/modals/EditSavingsGoalModal';
import { AddCategoryModal } from '../components/modals/AddCategoryModal';
import { AddRecurringModal } from '../components/modals/AddRecurringModal';
import { AddPendingCollectionModal } from '../components/modals/AddPendingCollectionModal';
import { TransactionsScreen } from './TransactionsScreen';
import { DebtsScreen } from './DebtsScreen';
import { ReportsScreen } from './ReportsScreen';
import { COLORS } from '../constants/colors';
import {
  AppTransaction,
  SavingsGoal,
  SpendingCategory,
  RecurringTransaction,
  PendingCollection,
} from '../types';
import {
  getUserName,
  saveUserName,
  getStoredTransactions,
  addTransaction,
  deleteTransaction,
  getSavingsGoal,
  saveSavingsGoal,
  addCategory,
  getRecurringTransactions,
  addRecurringTransaction,
  deleteRecurringTransaction,
  getPendingCollections,
  addPendingCollection,
  collectPendingCollection,
  deletePendingCollection,
} from '../services/storageService';
import { formatCurrency } from '../utils/formatters';

export const HomeScreen = () => {
  const [userName, setUserName] = useState<string>('');
  const [isNameModalVisible, setIsNameModalVisible] = useState<boolean>(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState<boolean>(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState<boolean>(false);
  const [isRecurringModalVisible, setIsRecurringModalVisible] = useState<boolean>(false);
  const [isPendingModalVisible, setIsPendingModalVisible] = useState<boolean>(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);

  const [categoryRefreshKey, setCategoryRefreshKey] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringTransaction[]>([]);
  const [pendingCollections, setPendingCollections] = useState<PendingCollection[]>([]);

  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal>({
    title: 'Tasarruf hedefi',
    savedAmount: 0,
    targetAmount: 10000,
    percentage: 0,
    remainingAmount: 10000,
  });

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const storedName = await getUserName();
    if (storedName) {
      setUserName(storedName);
    } else {
      setIsNameModalVisible(true);
    }

    const storedTxs = await getStoredTransactions();
    setTransactions(storedTxs);

    const storedGoal = await getSavingsGoal();
    setSavingsGoal(storedGoal);

    const recs = await getRecurringTransactions();
    setRecurringItems(recs);

    const collections = await getPendingCollections();
    setPendingCollections(collections);
  };

  const handleSaveUserName = async (name: string) => {
    setUserName(name);
    await saveUserName(name);
    setIsNameModalVisible(false);
  };

  const handleAddTransaction = async (newTx: Omit<AppTransaction, 'id' | 'date'>) => {
    const updatedList = await addTransaction(newTx);
    setTransactions(updatedList);
  };

  const handleDeleteTransaction = async (id: string) => {
    const updatedList = await deleteTransaction(id);
    setTransactions(updatedList);
  };

  const handleSaveSavingsGoal = async (updatedGoal: SavingsGoal) => {
    setSavingsGoal(updatedGoal);
    await saveSavingsGoal(updatedGoal);
  };

  const handleAddCategory = async (name: string, type: 'income' | 'expense') => {
    await addCategory(name, type);
    setCategoryRefreshKey((prev) => prev + 1);
    setIsCategoryModalVisible(false);
    setIsAddModalVisible(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalVisible(false);
    setIsAddModalVisible(true);
  };

  const handleOpenAddCategory = () => {
    setIsAddModalVisible(false);
    setTimeout(() => {
      setIsCategoryModalVisible(true);
    }, 150);
  };

  const handleAddRecurring = async (
    title: string,
    amount: number,
    type: 'income' | 'expense',
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
    category: string
  ) => {
    const updated = await addRecurringTransaction(title, amount, type, frequency, category);
    setRecurringItems(updated);
  };

  const handleExecuteRecurring = async (item: RecurringTransaction) => {
    const formattedAmount = `${item.type === 'income' ? '+' : '-'}₺${item.amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
    })}`;
    const updatedTxs = await addTransaction({
      title: item.title,
      category: item.category || 'Düzenli',
      amount: formattedAmount,
      rawAmount: item.amount,
      type: item.type,
      iconName: item.type === 'income' ? 'arrow-down-left' : 'repeat-outline',
    });
    setTransactions(updatedTxs);
  };

  const handleDeleteRecurring = async (id: string) => {
    const updated = await deleteRecurringTransaction(id);
    setRecurringItems(updated);
  };

  const handleAddPendingCollection = async (title: string, amount: number, category: string) => {
    const updated = await addPendingCollection(title, amount, category);
    setPendingCollections(updated);
  };

  const handleCollectPendingCollection = async (id: string, amount: number) => {
    const res = await collectPendingCollection(id, amount);
    setPendingCollections(res.collections);
    setTransactions(res.transactions);
  };

  const handleDeletePendingCollection = async (id: string) => {
    const updated = await deletePendingCollection(id);
    setPendingCollections(updated);
  };

  // Dynamic calculations derived from real user transactions
  const totalIncomeNum = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.rawAmount, 0);

  const totalExpenseNum = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.rawAmount, 0);

  const totalBalanceNum = totalIncomeNum - totalExpenseNum;

  // Split balance display e.g. "₺28.846" and ",50"
  const formattedBalanceStr = formatCurrency(totalBalanceNum);
  const splitIndex = formattedBalanceStr.indexOf(',');
  const totalBalanceDisplay = splitIndex !== -1 ? formattedBalanceStr.slice(0, splitIndex) : formattedBalanceStr;
  const balanceFractionDisplay = splitIndex !== -1 ? formattedBalanceStr.slice(splitIndex) : ',00';

  // Dynamic Spending Categories calculation
  const categoryMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.rawAmount;
    });

  const spendingCategories: SpendingCategory[] = Object.keys(categoryMap).map((catName) => {
    const catVal = categoryMap[catName];
    const percentage = totalExpenseNum > 0 ? Math.round((catVal / totalExpenseNum) * 100) : 0;
    return {
      name: catName,
      value: formatCurrency(catVal),
      widthPercentage: Math.max(percentage, 10),
    };
  });

  return (
    <View style={styles.container}>
      {activeTab === 'overview' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <HeaderSection
            userName={userName || 'Kullanıcı'}
            onAvatarPress={() => setIsNameModalVisible(true)}
          />

          <BalanceCard
            totalBalance={totalBalanceDisplay}
            fraction={balanceFractionDisplay}
            changePercentage={transactions.length > 0 ? '+100%' : '0%'}
            isHidden={isBalanceHidden}
            onToggleHide={() => setIsBalanceHidden(!isBalanceHidden)}
          />

          <SummaryCardsRow
            incomeAmount={isBalanceHidden ? '••••••' : formatCurrency(totalIncomeNum)}
            incomeChange={totalIncomeNum > 0 ? '+Gelir' : '₺0,00'}
            expenseAmount={isBalanceHidden ? '••••••' : formatCurrency(totalExpenseNum)}
            expenseChange={totalExpenseNum > 0 ? '-Gider' : '₺0,00'}
          />

          <PendingCollectionsCard
            collections={pendingCollections}
            onAddPress={() => setIsPendingModalVisible(true)}
            onCollect={handleCollectPendingCollection}
            onDelete={handleDeletePendingCollection}
          />

          <RecurringSection
            recurringItems={recurringItems}
            onAddPress={() => setIsRecurringModalVisible(true)}
            onExecute={handleExecuteRecurring}
            onDelete={handleDeleteRecurring}
          />

          {spendingCategories.length > 0 ? (
            <SpendingAnalysisCard
              categories={spendingCategories}
              onViewReport={() => setActiveTab('reports')}
            />
          ) : null}

          <SavingsGoalCard
            goal={savingsGoal}
            onEditPress={() => setIsGoalModalVisible(true)}
          />

          <RecentTransactionsCard
            transactions={transactions}
            onAddPress={() => setIsAddModalVisible(true)}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </ScrollView>
      )}

      {activeTab === 'transactions' && <TransactionsScreen />}

      {activeTab === 'debts' && <DebtsScreen />}

      {activeTab === 'reports' && <ReportsScreen />}

      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddPress={() => setIsAddModalVisible(true)}
      />

      <UserNameModal
        visible={isNameModalVisible}
        onSave={handleSaveUserName}
      />

      <AddTransactionModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSave={handleAddTransaction}
        onOpenAddCategory={handleOpenAddCategory}
        refreshKey={categoryRefreshKey}
      />

      <EditSavingsGoalModal
        visible={isGoalModalVisible}
        currentGoal={savingsGoal}
        onClose={() => setIsGoalModalVisible(false)}
        onSave={handleSaveSavingsGoal}
      />

      <AddCategoryModal
        visible={isCategoryModalVisible}
        onClose={handleCloseCategoryModal}
        onSave={handleAddCategory}
      />

      <AddRecurringModal
        visible={isRecurringModalVisible}
        onClose={() => setIsRecurringModalVisible(false)}
        onSave={handleAddRecurring}
      />

      <AddPendingCollectionModal
        visible={isPendingModalVisible}
        onClose={() => setIsPendingModalVisible(false)}
        onSave={handleAddPendingCollection}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
