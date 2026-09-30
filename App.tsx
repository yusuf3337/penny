import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DataProvider, useData } from './src/context/DataContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { SubscriptionsScreen } from './src/screens/SubscriptionsScreen';
import { BudgetScreen } from './src/screens/BudgetScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { DebtsScreen } from './src/screens/DebtsScreen';
import { BottomNavBar } from './src/components/common/BottomNavBar';
import { AddTransactionModal } from './src/components/modals/AddTransactionModal';
import { AddGoalModal } from './src/components/modals/AddGoalModal';
import { AddSubscriptionModal } from './src/components/modals/AddSubscriptionModal';
import { AddBudgetModal } from './src/components/modals/AddBudgetModal';
import { AddDebtModal } from './src/components/modals/AddDebtModal';
import { UserNameModal } from './src/components/modals/UserNameModal';
import { AddCategoryModal } from './src/components/modals/AddCategoryModal';
import { SettingsModal } from './src/components/modals/SettingsModal';
import { COLORS } from './src/constants/colors';

import { SplitExpenseModal } from './src/components/modals/SplitExpenseModal';

const MainNavigator = () => {
  const {
    activeTab,
    setActiveTab,
    userName,
    updateUserName,
    hasOnboarded,
    markOnboarded,
    isLoading,
    handleAddTransaction,
    handleSaveGoal,
    handleAddSubscription,
    handleSaveBudget,
    handleAddDebt,
    handleAddCategory,
  } = useData();

  // Modals state per active tab
  const [isAddTxModalVisible, setIsAddTxModalVisible] = useState(false);
  const [isAddGoalModalVisible, setIsAddGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isAddSubModalVisible, setIsAddSubModalVisible] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [isAddBudgetModalVisible, setIsAddBudgetModalVisible] = useState(false);
  const [isAddDebtModalVisible, setIsAddDebtModalVisible] = useState(false);
  const [isSplitModalVisible, setIsSplitModalVisible] = useState(false);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  // Auto show initial onboarding name modal ONLY ONCE if user hasn't onboarded yet
  useEffect(() => {
    if (!isLoading && !hasOnboarded && (!userName || userName === 'Kullanıcı')) {
      setIsNameModalVisible(true);
    }
  }, [isLoading, hasOnboarded, userName]);

  // Trigger modal depending on current active tab
  const handleOpenActiveTabModal = () => {
    switch (activeTab) {
      case 'goals':
        setEditingGoal(null);
        setIsAddGoalModalVisible(true);
        break;
      case 'subscriptions':
        setEditingSub(null);
        setIsAddSubModalVisible(true);
        break;
      case 'budget':
        setIsAddBudgetModalVisible(true);
        break;
      case 'debts':
        setIsAddDebtModalVisible(true);
        break;
      default:
        setIsAddTxModalVisible(true);
        break;
    }
  };

  return (
    <View style={styles.appWrap}>
      {activeTab === 'timeline' && (
        <HomeScreen
          onOpenAddModal={() => setIsAddTxModalVisible(true)}
          onOpenNameModal={() => setIsNameModalVisible(true)}
          onOpenSettingsModal={() => setIsSettingsModalVisible(true)}
          onOpenSplitModal={() => setIsSplitModalVisible(true)}
        />
      )}

      {activeTab === 'goals' && (
        <GoalsScreen
          onOpenGoalModal={(goal) => {
            setEditingGoal(goal || null);
            setIsAddGoalModalVisible(true);
          }}
        />
      )}

      {activeTab === 'subscriptions' && (
        <SubscriptionsScreen
          onOpenAddModal={(sub) => {
            setEditingSub(sub || null);
            setIsAddSubModalVisible(true);
          }}
        />
      )}

      {activeTab === 'budget' && (
        <BudgetScreen onOpenAddModal={() => setIsAddBudgetModalVisible(true)} />
      )}

      {activeTab === 'reports' && (
        <ReportsScreen onOpenAddModal={() => setIsAddTxModalVisible(true)} />
      )}

      {activeTab === 'debts' && (
        <DebtsScreen
          onOpenAddModal={() => setIsAddDebtModalVisible(true)}
          onOpenSplitModal={() => setIsSplitModalVisible(true)}
        />
      )}

      {/* Dynamic Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddPress={handleOpenActiveTabModal}
      />

      {/* Screen Specific Modals */}
      <AddTransactionModal
        visible={isAddTxModalVisible}
        onClose={() => setIsAddTxModalVisible(false)}
        onSave={handleAddTransaction}
        onOpenAddCategory={() => {
          setIsAddTxModalVisible(false);
          setTimeout(() => setIsCategoryModalVisible(true), 150);
        }}
      />

      <AddGoalModal
        visible={isAddGoalModalVisible}
        initialGoal={editingGoal}
        onClose={() => {
          setIsAddGoalModalVisible(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />

      <AddSubscriptionModal
        visible={isAddSubModalVisible}
        initialSub={editingSub}
        onClose={() => {
          setIsAddSubModalVisible(false);
          setEditingSub(null);
        }}
        onSave={handleAddSubscription}
      />

      <AddBudgetModal
        visible={isAddBudgetModalVisible}
        onClose={() => setIsAddBudgetModalVisible(false)}
        onSave={handleSaveBudget}
      />

      <AddDebtModal
        visible={isAddDebtModalVisible}
        onClose={() => setIsAddDebtModalVisible(false)}
        onSave={handleAddDebt}
      />

      <SplitExpenseModal
        visible={isSplitModalVisible}
        onClose={() => setIsSplitModalVisible(false)}
        onAddDebt={handleAddDebt}
        onAddTransaction={handleAddTransaction}
      />

      <UserNameModal
        visible={isNameModalVisible}
        onSave={async (name) => {
          await updateUserName(name);
          await markOnboarded();
          setIsNameModalVisible(false);
        }}
      />

      <AddCategoryModal
        visible={isCategoryModalVisible}
        onClose={() => {
          setIsCategoryModalVisible(false);
          setIsAddTxModalVisible(true);
        }}
        onSave={async (name, type, iconName, color) => {
          await handleAddCategory(name, type, iconName, color);
          setIsCategoryModalVisible(false);
          setIsAddTxModalVisible(true);
        }}
      />

      <SettingsModal
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
      />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <StatusBar style="dark" />
          <MainNavigator />
        </SafeAreaView>
      </DataProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appWrap: {
    flex: 1,
  },
});
