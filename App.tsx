import './global.css';
import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { HeroUINativeProvider } from 'heroui-native/provider';
import Animated, { Easing, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
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
import { SplashIntro } from './src/components/common/SplashIntro';
import { MoreScreen } from './src/screens/MoreScreen';
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
import { AppTransaction, CategoryBudget } from './src/types';
import { CurrencyProvider, useCurrency } from './src/context/CurrencyContext';
import { isValidNickname } from './src/utils/nickname';

import { SplitExpenseModal } from './src/components/modals/SplitExpenseModal';

const enterFromRight = FadeInRight.duration(260).easing(Easing.out(Easing.cubic));
const enterFromLeft = FadeInLeft.duration(260).easing(Easing.out(Easing.cubic));
const fadePreviousScreen = FadeOut.duration(170).easing(Easing.out(Easing.quad));
const tabOrder = ['timeline', 'goals', 'budget', 'more'] as const;
const navTab = (tab: string) => ['subscriptions', 'reports', 'debts'].includes(tab) ? 'more' : tab;

const MainNavigator = () => {
  useLocale(); // Re-render date and currency labels when the language changes.
  useCurrency(); // Re-render amounts when the selected currency changes.
  const {
    activeTab,
    setActiveTab,
    handleAddTransaction,
    handleUpdateTransaction,
    handleSaveGoal,
    handleAddSubscription,
    handleSaveBudget,
    handleAddDebt,
    goals,
  } = useData();

  const { isPro, openPaywall } = usePremium();
  const previousTab = useRef(activeTab);
  const currentIndex = tabOrder.indexOf(navTab(activeTab) as typeof tabOrder[number]);
  const previousIndex = tabOrder.indexOf(navTab(previousTab.current) as typeof tabOrder[number]);
  const enterAnimation = currentIndex >= previousIndex ? enterFromRight : enterFromLeft;

  useEffect(() => { previousTab.current = activeTab; }, [activeTab]);

  // Modals state per active tab
  const [isAddTxModalVisible, setIsAddTxModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<AppTransaction | null>(null);
  const [isAddGoalModalVisible, setIsAddGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isAddSubModalVisible, setIsAddSubModalVisible] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [isAddBudgetModalVisible, setIsAddBudgetModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);
  const [isAddDebtModalVisible, setIsAddDebtModalVisible] = useState(false);
  const [isSplitModalVisible, setIsSplitModalVisible] = useState(false);
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
        setEditingBudget(null);
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
      <View style={styles.screenViewport} collapsable={false}>
      <Animated.View
        key={activeTab}
        style={styles.screenPane}
        entering={previousTab.current === activeTab ? undefined : enterAnimation}
        exiting={fadePreviousScreen}
      >
      {activeTab === 'timeline' && (
        <HomeScreen
          onOpenAddModal={() => {
            triggerAddHaptic();
            setEditingTransaction(null);
            setIsAddTxModalVisible(true);
          }}
          onEditTransaction={(tx) => {
            triggerAddHaptic();
            setEditingTransaction(tx);
            setIsAddTxModalVisible(true);
          }}
          onOpenSettingsModal={() => setIsSettingsModalVisible(true)}
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
            setEditingBudget(null);
            setIsAddBudgetModalVisible(true);
          }}
          onEditBudget={(budget) => {
            triggerAddHaptic();
            setEditingBudget(budget);
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

      {activeTab === 'more' && <MoreScreen onNavigate={setActiveTab} />}
      </Animated.View>
      </View>

      {/* Dynamic Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddPress={handleOpenActiveTabModal}
      />

      {/* Screen Specific Modals */}
      <AddTransactionModal
        visible={isAddTxModalVisible}
        initialTransaction={editingTransaction}
        onClose={() => { setIsAddTxModalVisible(false); setEditingTransaction(null); }}
        onSave={(tx) => editingTransaction ? handleUpdateTransaction(editingTransaction.id, tx) : handleAddTransaction(tx)}
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
        initialBudget={editingBudget}
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

const AppBody = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const { isLoading, hasOnboarded, userName, updateUserName, markOnboarded } = useData();
  const { colors, isDark } = useTheme();
  if (!introComplete) return <SplashIntro onComplete={() => setIntroComplete(true)} />;
  if (isLoading && !hasOnboarded) {
    return <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
      <ActivityIndicator color={colors.primary} />
    </View>;
  }
  if (!hasOnboarded || !isValidNickname(userName)) {
    return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <UserNameModal visible onSave={async (name) => {
        await updateUserName(name);
        await markOnboarded();
      }} />
    </SafeAreaView>;
  }
  return <AppContent />;
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocaleProvider>
        <CurrencyProvider>
        <HeroUINativeProvider>
          <SafeAreaProvider>
            <ThemeProvider>
              <PremiumProvider>
                <AppDialogProvider>
                  <DataProvider>
                    <AppBody />
                  </DataProvider>
                </AppDialogProvider>
              </PremiumProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </HeroUINativeProvider>
        </CurrencyProvider>
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
  screenViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  screenPane: {
    ...StyleSheet.absoluteFill,
  },
});
