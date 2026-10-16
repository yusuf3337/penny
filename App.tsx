import './global.css';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { HeroUINativeProvider } from 'heroui-native';
import { DataProvider, useData } from './src/context/DataContext';
import { PremiumProvider, usePremium } from './src/context/PremiumContext';
import { AppDialogProvider } from './src/context/AppDialogContext';
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
import { SettingsModal } from './src/components/modals/SettingsModal';
import { ProUpgradeModal } from './src/components/modals/ProUpgradeModal';
import { COLORS } from './src/constants/colors';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LocaleProvider, useLocale } from './src/context/LocaleContext';

import { SplitExpenseModal } from './src/components/modals/SplitExpenseModal';

const MainNavigator = () => {
  useLocale(); // Re-render date and currency labels when the language changes.
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
    goals,
  } = useData();

  const { isPro, openPaywall } = usePremium();

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
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  useEffect(() => {
    if (!isPro) {
      setIsAddDebtModalVisible(false);
      setIsSplitModalVisible(false);
    }
  }, [isPro]);

  const handleOpenDebtModal = () => {
    if (!isPro) {
      openPaywall('debt_tracking');
      return;
    }
    setIsAddDebtModalVisible(true);
  };

  // Auto show initial onboarding name modal ONLY ONCE if user hasn't onboarded yet
  useEffect(() => {
    if (
      !isLoading &&
      !hasOnboarded &&
      (!userName || userName === 'Kullanıcı') &&
      !isSettingsModalVisible
    ) {
      const timer = setTimeout(() => {
        setIsNameModalVisible(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasOnboarded, userName, isSettingsModalVisible]);

  // Trigger modal depending on current active tab
  const handleOpenActiveTabModal = () => {
    triggerAddHaptic();

    switch (activeTab) {
      case 'goals':
        if (!isPro && goals.length >= 2) {
          openPaywall('goal_limit');
          return;
        }
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
        handleOpenDebtModal();
        break;
      default:
        setIsAddTxModalVisible(true);
        break;
    }
  };

  const triggerAddHaptic = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handleOpenSplitExpense = () => {
    triggerAddHaptic();
    if (!isPro) {
      openPaywall('split_expense');
      return;
    }
    setIsSplitModalVisible(true);
  };

  return (
    <View style={styles.appWrap}>
      {activeTab === 'timeline' && (
        <HomeScreen
          onOpenAddModal={() => {
            triggerAddHaptic();
            setIsAddTxModalVisible(true);
          }}
          onOpenNameModal={() => setIsNameModalVisible(true)}
          onOpenSettingsModal={() => setIsSettingsModalVisible(true)}
          onOpenSplitModal={handleOpenSplitExpense}
        />
      )}

      {activeTab === 'goals' && (
        <GoalsScreen
          onOpenGoalModal={(goal) => {
            triggerAddHaptic();
            if (!goal && !isPro && goals.length >= 2) {
              openPaywall('goal_limit');
              return;
            }
            setEditingGoal(goal || null);
            setIsAddGoalModalVisible(true);
          }}
        />
      )}

      {activeTab === 'subscriptions' && (
        <SubscriptionsScreen
          onOpenAddModal={(sub) => {
            triggerAddHaptic();
            setEditingSub(sub || null);
            setIsAddSubModalVisible(true);
          }}
        />
      )}

      {activeTab === 'budget' && (
        <BudgetScreen
          onOpenAddModal={() => {
            triggerAddHaptic();
            setIsAddBudgetModalVisible(true);
          }}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsScreen
          onOpenAddModal={() => {
            triggerAddHaptic();
            setIsAddTxModalVisible(true);
          }}
        />
      )}

      {activeTab === 'debts' && (
        <DebtsScreen
          onOpenAddModal={() => {
            triggerAddHaptic();
            handleOpenDebtModal();
          }}
          onOpenSplitModal={handleOpenSplitExpense}
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
        onSave={(name, type, amount, description) => {
          if (!isPro) {
            openPaywall('debt_tracking');
            return;
          }
          void handleAddDebt(name, type, amount, description);
        }}
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

      <SettingsModal
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
      />

      {/* Global Penny Pro Paywall */}
      <ProUpgradeModal />
    </View>
  );
};

const AppContent = () => {
  const { isDark, colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <MainNavigator />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocaleProvider>
        <HeroUINativeProvider>
          <SafeAreaProvider>
            <ThemeProvider>
              <PremiumProvider>
                <AppDialogProvider>
                  <DataProvider>
                    <AppContent />
                  </DataProvider>
                </AppDialogProvider>
              </PremiumProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </HeroUINativeProvider>
      </LocaleProvider>
    </GestureHandlerRootView>
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
