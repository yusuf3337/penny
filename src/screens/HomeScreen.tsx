import { Card } from 'heroui-native/card';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { Surface } from 'heroui-native/surface';
import { AppTransaction } from '../types';
import { useData } from '../context/DataContext';
import { useAppDialog } from '../context/AppDialogContext';
import { AppLanguage, localizeFormat, localizeTransactionTitle, useLocale } from '../context/LocaleContext';
import { COLORS, LIGHT_COLORS } from '../constants/colors';
import {
  formatCurrency,
  formatShortDate,
  formatDateTime,
  formatMonthYear,
  changeMonth,
  isSameMonthAndYear,
} from '../utils/formatters';

interface HomeScreenProps {
  onOpenAddModal: (type?: 'income' | 'expense') => void;
  onEditTransaction: (tx: AppTransaction) => void;
  onRepeatTransaction: (tx: AppTransaction) => void;
  onOpenSettingsModal: () => void;
}
const repeatLabels: Record<AppLanguage, string> = {
  tr: 'İşlemi Tekrarla', en: 'Repeat transaction', de: 'Buchung wiederholen',
  fr: 'Répéter l’opération', ko: '거래 다시 입력', zh: '重复交易',
  ja: '取引を再入力', ru: 'Повторить операцию', it: 'Ripeti operazione',
};
const outlookCopy: Record<AppLanguage, { title: string; upcoming: string; envelopes: string }> = {
  tr: { title: 'Bu ayın görünümü', upcoming: 'Aboneliklerden sonra', envelopes: 'Zarflarda kalan limit' },
  en: { title: 'This month at a glance', upcoming: 'After subscriptions', envelopes: 'Remaining envelope limits' },
  de: { title: 'Dieser Monat im Blick', upcoming: 'Nach Abonnements', envelopes: 'Verbleibende Umschlaglimits' },
  fr: { title: 'Vue du mois', upcoming: 'Après les abonnements', envelopes: 'Limites des enveloppes restantes' },
  ko: { title: '이번 달 한눈에 보기', upcoming: '구독 결제 후', envelopes: '남은 봉투 예산' },
  zh: { title: '本月概览', upcoming: '扣除订阅后', envelopes: '信封剩余额度' },
  ja: { title: '今月の見通し', upcoming: '定期購入の支払い後', envelopes: '封筒予算の残額' },
  ru: { title: 'Обзор месяца', upcoming: 'После подписок', envelopes: 'Остаток лимитов конвертов' },
  it: { title: 'Questo mese in breve', upcoming: 'Dopo gli abbonamenti', envelopes: 'Limiti residui delle buste' },
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenAddModal,
  onEditTransaction,
  onRepeatTransaction,
  onOpenSettingsModal,
}) => {
  const styles = useThemedStyles(lightStyles);
  const { isDark, colors } = useTheme();
  const { t, language } = useLocale();
  const { alert } = useAppDialog();
  const {
    userName,
    isBalanceHidden,
    toggleBalanceHidden,
    totalBalance,
    bankBalance,
    cashBalance,
    transactions,
    subscriptions,
    budgets,
    handleDeleteTransaction,
    handleDeleteTransactionsForMonth,
    handleClearAllTransactions,
  } = useData();

  const [activeFilter, setActiveFilter] = useState<'yearly' | 'monthly'>('monthly');
  const [accountFilter, setAccountFilter] = useState<'all' | 'bank' | 'cash'>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [quickToastMessage, setQuickToastMessage] = useState('');

  const handlePrevMonth = () => setSelectedMonth((prev) => changeMonth(prev, -1));
  const handleNextMonth = () => setSelectedMonth((prev) => changeMonth(prev, 1));
  const handleCurrentMonth = () => setSelectedMonth(new Date());
  const isCurrentMonthSelected = isSameMonthAndYear(selectedMonth, new Date());
  const currentMonthDisplay = formatMonthYear(selectedMonth);
  const now = new Date();
  const upcomingSubscriptions = subscriptions.filter((subscription) => {
    const due = new Date(subscription.nextDueDate);
    return subscription.isActive && !Number.isNaN(due.getTime()) &&
      due.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() &&
      due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth();
  });
  const upcomingTotal = upcomingSubscriptions.reduce((sum, subscription) => sum + subscription.amount, 0);
  const envelopeRemaining = budgets.reduce((sum, budget) => sum + Math.max(budget.allocatedAmount - budget.usedAmount, 0), 0);

  // Split balance for hero display
  const balanceStr = isBalanceHidden ? '••••••' : formatCurrency(totalBalance);
  const bankStr = isBalanceHidden ? '••••' : formatCurrency(bankBalance);
  const cashStr = isBalanceHidden ? '••••' : formatCurrency(cashBalance);

  // Filter transactions by account type and sort by date descending
  const filteredTransactions = transactions
    .filter((tx) => {
      if (accountFilter === 'bank') {
        return tx.accountType === 'bank' || (!tx.accountType && !tx.accountName?.includes('Nakit'));
      }
      if (accountFilter === 'cash') {
        return tx.accountType === 'cash' || tx.accountName?.includes('Nakit');
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter transactions for the selected month in monthly stream view
  const selectedMonthTransactions = filteredTransactions.filter((tx) =>
    isSameMonthAndYear(tx.date, selectedMonth)
  );

  const selectedMonthIncome = selectedMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (t.rawAmount || 0), 0);

  const selectedMonthExpense = selectedMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (t.rawAmount || 0), 0);

  const selectedMonthNet = selectedMonthIncome - selectedMonthExpense;

  // Selected month stats for hero card when in monthly mode

  // Group all transactions by month for "Yıllık özet" view
  const monthGroups: { [month: string]: typeof transactions } = {};
  filteredTransactions.forEach((tx) => {
    const key = formatMonthYear(tx.date);
    if (!monthGroups[key]) monthGroups[key] = [];
    monthGroups[key].push(tx);
  });

  // Batch delete handlers
  const handleConfirmDeleteCurrentMonth = () => {
    if (selectedMonthTransactions.length === 0) {
      alert('Bilgi', localizeFormat('{0} döneminde silinecek kayıtlı bir işlem bulunmuyor.', [currentMonthDisplay]));
      return;
    }

    alert(
      'Bu Ayın İşlemlerini Sil',
      localizeFormat('"{0}" dönemine ait tüm {1} işlem kalıcı olarak silinecektir. Diğer aylara ait işlemler korunur. Emin misiniz?', [currentMonthDisplay, selectedMonthTransactions.length]),
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Bu Ayı Sil',
          style: 'destructive',
          onPress: async () => {
            await handleDeleteTransactionsForMonth(selectedMonth);
            setQuickToastMessage(localizeFormat('{0} işlemleri silindi', [currentMonthDisplay]));
            setTimeout(() => setQuickToastMessage(''), 2500);
          },
        },
      ]
    );
  };

  const handleConfirmClearAll = () => {
    if (transactions.length === 0) {
      alert('Bilgi', 'Silinecek herhangi bir işlem kaydı bulunmuyor.');
      return;
    }

    alert(
      'Tüm İşlemleri Sil (Geçmiş Dahil)',
      localizeFormat('Tüm aylardaki toplam {0} işlem kalıcı olarak silinecektir. Bu işlem geri alınamaz. Emin misiniz?', [transactions.length]),
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Tümünü Sil',
          style: 'destructive',
          onPress: async () => {
            await handleClearAllTransactions();
            setQuickToastMessage('Tüm işlemler silindi');
            setTimeout(() => setQuickToastMessage(''), 2500);
          },
        },
      ]
    );
  };

  const handleOpenDeleteMenu = () => {
    alert(
      'İşlemleri Temizle',
      'Nasıl bir temizleme işlemi yapmak istiyorsunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: localizeFormat('Bu Ayı Sil ({0} - {1} işlem)', [currentMonthDisplay, selectedMonthTransactions.length]),
          style: 'destructive',
          onPress: handleConfirmDeleteCurrentMonth,
        },
        {
          text: localizeFormat('Bütün Ayları Sil ({0} işlem)', [transactions.length]),
          style: 'destructive',
          onPress: handleConfirmClearAll,
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.profileBtn}
          activeOpacity={0.8}
          onPress={onOpenSettingsModal}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userName ? userName.charAt(0).toUpperCase() : 'K'}</Text>
          </View>
          <View>
            <Text style={styles.greetingText}>Merhaba,</Text>
            <Text style={styles.userNameText}>{userName || 'Kullanıcı'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.rightHeaderActions}>
          <TouchableOpacity
            style={styles.eyeBtn}
            activeOpacity={0.7}
            onPress={toggleBalanceHidden}
          >
            <Ionicons
              name={isBalanceHidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.mutedText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsHeaderBtn}
            activeOpacity={0.7}
            onPress={onOpenSettingsModal}
          >
            <Ionicons name="settings-outline" size={20} color={COLORS.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-4 overflow-hidden rounded-[28px] bg-[#061E57] p-5" style={{ shadowColor: '#061E57', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 }}>
        <View className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#265196] opacity-40" />
        <View className="absolute -right-6 bottom-0 h-32 w-32 rounded-full bg-[#427BCA] opacity-20" />
        <View className="flex-row items-center justify-between">
          <Text className="text-[13px] font-medium text-[#B8C9E8]">Toplam Bakiye</Text>
          <View className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
            <Text localize={false} className="text-[11px] font-semibold text-[#DDE9FF]">{formatMonthYear(new Date())}</Text>
          </View>
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62} className="mt-2 text-[38px] font-bold tracking-tight text-white">{balanceStr}</Text>

        <View className="mt-5 flex-row border-t border-white/15 pt-3.5">
          <View className="min-w-0 flex-1 pr-2">
            <Text localize={false} className="text-[11px] font-medium text-[#B8C9E8]">{t('Banka')}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className="mt-1 text-[15px] font-bold text-white">{bankStr}</Text>
          </View>
          <View className="min-w-0 flex-1 border-l border-white/15 pl-3">
            <Text localize={false} className="text-[11px] font-medium text-[#B8C9E8]">{t('Nakit')}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className="mt-1 text-[15px] font-bold text-white">{cashStr}</Text>
          </View>
        </View>
      </View>

      <View className="mb-5 flex-row gap-2.5">
        <TouchableOpacity accessibilityRole="button" className="min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-[#E6EDFB] py-3 dark:bg-[#213457]" onPress={() => onOpenAddModal('income')}>
          <Ionicons name="arrow-down-outline" size={17} color={colors.primary} />
          <Text localize={false} className="text-[13px] font-bold text-[#123B86] dark:text-[#DDE9FF]">{t('Gelir Ekle')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" className="min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-[#E6EDFB] py-3 dark:bg-[#213457]" onPress={() => onOpenAddModal('expense')}>
          <Ionicons name="arrow-up-outline" size={17} color={colors.primary} />
          <Text localize={false} className="text-[13px] font-bold text-[#123B86] dark:text-[#DDE9FF]">{t('Gider Ekle')}</Text>
        </TouchableOpacity>
      </View>

      {(upcomingSubscriptions.length > 0 || budgets.length > 0) && <Surface variant="secondary" className="mb-5 rounded-[20px] border border-[#DAE3F4] bg-[#F2F6FF] px-4 py-3.5 dark:border-[#3E5280] dark:bg-[#1E2A48]">
        <Text localize={false} className="mb-2 text-[12px] font-bold text-[#14203A] dark:text-[#F5F7FF]">{outlookCopy[language].title}</Text>
        {upcomingSubscriptions.length > 0 && <View className="flex-row items-center justify-between gap-3 py-1">
          <Text localize={false} className="min-w-0 flex-1 text-[12px] text-zinc-600 dark:text-[#BAC8E6]">{outlookCopy[language].upcoming}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} className="text-[13px] font-bold text-[#14203A] dark:text-[#F5F7FF]">{isBalanceHidden ? '••••' : formatCurrency(totalBalance - upcomingTotal)}</Text>
        </View>}
        {budgets.length > 0 && <View className="flex-row items-center justify-between gap-3 py-1">
          <Text localize={false} className="min-w-0 flex-1 text-[12px] text-zinc-600 dark:text-[#BAC8E6]">{outlookCopy[language].envelopes}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} className="text-[13px] font-bold text-[#14203A] dark:text-[#F5F7FF]">{isBalanceHidden ? '••••' : formatCurrency(envelopeRemaining)}</Text>
        </View>}
      </Surface>}

      <View className="mb-4 flex-row rounded-2xl bg-[#E6EBF4] p-1 dark:bg-[#1E2A48]">
        {(['monthly', 'yearly'] as const).map((filter) => <TouchableOpacity
          key={filter}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeFilter === filter }}
          onPress={() => setActiveFilter(filter)}
          className={`min-w-0 flex-1 rounded-[13px] px-2 py-2.5 ${activeFilter === filter ? 'bg-white dark:bg-[#30466D]' : ''}`}
        >
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} className={`text-center text-[12px] font-semibold ${activeFilter === filter ? 'text-[#102B61] dark:text-white' : 'text-[#61708A] dark:text-[#AFC0DF]'}`}>
            {filter === 'monthly' ? 'Ay ay akış' : 'Yıllık özet'}
          </Text>
        </TouchableOpacity>)}
      </View>

      {/* Timeline Stream Section (Ay ay akış / Yıllık özet) */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>
            {activeFilter === 'yearly' ? 'Yıllık Ay Ay Özet' : 'Son İşlemler'}
          </Text>
        </View>

        <View style={styles.sectionHeaderRight}>
          <TouchableOpacity
            style={styles.trashHeaderBtn}
            activeOpacity={0.7}
            onPress={handleOpenDeleteMenu}
            accessibilityLabel={t('Temizle')}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtnHeader}
            onPress={() => onOpenAddModal()}
            activeOpacity={0.8}
            accessibilityLabel={t('Yeni İşlem')}
          >
            <Ionicons name="add" size={17} color={colors.primary} />
            <Text style={styles.addText}>Yeni İşlem</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Filter Chips (Tümü / Banka / Nakit) */}
      <View style={styles.filterChipRow}>
        {(['all', 'bank', 'cash'] as const).map((filterKey) => {
          const labels = { all: 'Tümü', bank: 'Banka', cash: 'Nakit' };
          const isActive = accountFilter === filterKey;
          return (
            <TouchableOpacity
              key={filterKey}
              style={[styles.accountFilterChip, isActive && styles.accountFilterChipActive, isActive && isDark && { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight }]}
              onPress={() => setAccountFilter(filterKey)}
            >
              <Text style={[styles.accountFilterText, isActive && styles.accountFilterTextActive, isActive && isDark && { color: colors.primary }]}>
                {labels[filterKey]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeFilter === 'yearly' ? (
        /* YILLIK MOD: Tüm ayların kartlar halinde konsolide özeti */
        Object.keys(monthGroups).length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={36} color={COLORS.subtleText} />
            <Text style={styles.emptyText}>Henüz kaydedilmiş işlem bulunmuyor.</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => onOpenAddModal()}>
              <Ionicons name="add" size={16} color={COLORS.primaryForeground} />
              <Text style={[styles.emptyAddBtnText, { color: COLORS.primaryForeground }]}>İlk İşlemini Ekle</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          Object.keys(monthGroups).map((monthName) => {
            const monthTxs = monthGroups[monthName];
            const monthIncome = monthTxs
              .filter((t) => t.type === 'income')
              .reduce((sum, t) => sum + t.rawAmount, 0);
            const monthExpense = monthTxs
              .filter((t) => t.type === 'expense')
              .reduce((sum, t) => sum + t.rawAmount, 0);
            const monthNet = monthIncome - monthExpense;

            return (
              <Card key={monthName} style={styles.monthCard}>
                <View style={styles.monthCardHeader}>
                  <Text style={styles.monthTitle}>{monthName}</Text>
                  <Text
                    style={[
                      styles.monthNetText,
                      { color: monthNet >= 0 ? COLORS.emeraldText : COLORS.roseText },
                    ]}
                  >
                    {`${monthNet >= 0 ? '+' : ''}${formatCurrency(monthNet)}`}
                  </Text>
                </View>

                <View style={styles.yearlyMonthCardBody}>
                  <View style={styles.yearlyStatsRow}>
                    <View style={styles.yearlyStatItem}>
                      <Text style={styles.yearlyStatLabel}>Gelir</Text>
                      <Text style={[styles.yearlyStatVal, { color: COLORS.emeraldText }]}>
                        {formatCurrency(monthIncome)}
                      </Text>
                    </View>
                    <View style={styles.yearlyStatDivider} />
                    <View style={styles.yearlyStatItem}>
                      <Text style={styles.yearlyStatLabel}>Gider</Text>
                      <Text style={[styles.yearlyStatVal, { color: COLORS.roseText }]}>
                        {formatCurrency(monthExpense)}
                      </Text>
                    </View>
                    <View style={styles.yearlyStatDivider} />
                    <View style={styles.yearlyStatItem}>
                      <Text style={styles.yearlyStatLabel}>İşlem</Text>
                      <Text style={styles.yearlyStatVal}>{monthTxs.length}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        )
      ) : (
        /* AYLIK MOD: Oklarla ay ay gezme ve o ayın işlemlerini listeleme */
        <View style={styles.streamContainer}>
          {/* Month Navigator Header with Arrows */}
          <View style={styles.streamNavigatorRow}>
            <TouchableOpacity
              style={styles.streamArrowBtn}
              onPress={handlePrevMonth}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={COLORS.foreground} />
            </TouchableOpacity>

            <View style={styles.streamMonthCenter}>
              <Text style={styles.streamMonthTitle}>{currentMonthDisplay}</Text>
              {!isCurrentMonthSelected && (
                <TouchableOpacity
                  style={styles.streamTodayBadge}
                  onPress={handleCurrentMonth}
                  activeOpacity={0.7}
                >
                  <Text style={styles.streamTodayBadgeText}>Bu Aya Dön</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.streamArrowBtn}
              onPress={handleNextMonth}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          {/* Month Stats and Single Month Delete Button */}
          <View style={styles.streamStatsRow}>
            <View style={styles.streamStatsLeft}>
              <Text style={styles.streamTxCountText}>
                {localizeFormat('Kayıtlı işlem: {0}', [selectedMonthTransactions.length])}
              </Text>
              <Text
                style={[
                  styles.streamNetText,
                  { color: selectedMonthNet >= 0 ? COLORS.emeraldText : COLORS.roseText },
                ]}
              >
                Net: {selectedMonthNet >= 0 ? '+' : ''}{isBalanceHidden ? '••••' : formatCurrency(selectedMonthNet)}
              </Text>
            </View>

            {selectedMonthTransactions.length > 0 && (
              <TouchableOpacity
                style={styles.deleteCurrentMonthBtn}
                onPress={handleConfirmDeleteCurrentMonth}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={13} color={COLORS.roseText} />
                <Text style={styles.deleteCurrentMonthBtnText}>Bu Ayı Sil</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Transactions for Current Selected Month */}
          {selectedMonthTransactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={38} color={COLORS.subtleText} />
              <Text style={styles.emptyText}>{localizeFormat('{0} döneminde kayıtlı işlem yok.', [currentMonthDisplay])}</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => onOpenAddModal()}>
                <Ionicons name="add" size={16} color={COLORS.primaryForeground} />
                <Text style={[styles.emptyAddBtnText, { color: COLORS.primaryForeground }]}>Bu Aya İşlem Ekle</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <Card style={styles.monthTransactionsCard}>
              {selectedMonthTransactions.map((tx, index) => {
                const isCash = tx.accountType === 'cash' || tx.accountName?.includes('Nakit');
                const accountBadgeText = isCash ? 'Nakit' : 'Banka';
                const accountIconName = isCash ? 'wallet-outline' : 'card-outline';

                return (
                  <View key={tx.id} style={[styles.txRow, index < selectedMonthTransactions.length - 1 && styles.txRowDivider]}>
                    <View style={styles.txLeft}>
                      <View
                        style={[
                          styles.catIconWrap,
                          {
                            backgroundColor:
                              tx.type === 'income' ? COLORS.emeraldBg : tx.type === 'transfer' ? COLORS.primaryLight : COLORS.secondary,
                          },
                        ]}
                      >
                        <Ionicons
                          name={(tx.iconName as any) || 'pricetag-outline'}
                          size={16}
                          color={tx.type === 'income' ? COLORS.emeraldText : tx.type === 'transfer' ? COLORS.primary : COLORS.mutedText}
                        />
                      </View>
                      <View style={styles.txTextWrap}>
                        <View style={styles.txTitleRow}>
                          <Text style={styles.txTitle} numberOfLines={1}>
                            {localizeTransactionTitle(tx.title, language)}
                          </Text>
                          <View style={styles.accountBadgeChip}>
                            <Ionicons name={accountIconName} size={9} color={COLORS.mutedText} />
                            <Text style={styles.accountBadgeText}>{accountBadgeText}</Text>
                          </View>
                        </View>
                        <Text localize={false} style={styles.txSub}>
                          {t(tx.category)} · {formatDateTime(tx.date)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.txRight}>
                      <Text
                        style={[
                          styles.txAmount,
                          {
                            color:
                              tx.type === 'income' ? COLORS.emeraldText : tx.type === 'transfer' ? COLORS.primary : COLORS.foreground,
                          },
                        ]}
                      >
                        {`${tx.type === 'income' || (tx.type === 'transfer' && tx.transferDirection === 'in') ? '+' : '-'}${formatCurrency(tx.rawAmount)}`}
                      </Text>
                      <View className="mt-1 flex-row items-center gap-3">
                      {tx.type !== 'transfer' && (
                        <TouchableOpacity
                          onPress={() => onRepeatTransaction(tx)}
                          accessibilityLabel={repeatLabels[language]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="copy-outline" size={15} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                      {tx.type !== 'transfer' && (
                        <TouchableOpacity
                          onPress={() => onEditTransaction(tx)}
                          accessibilityLabel={t('İşlemi Düzenle')}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="create-outline" size={15} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => handleDeleteTransaction(tx.id)}
                        accessibilityLabel={t('İşlemi Sil')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={14} color={COLORS.subtleText} />
                      </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 150,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: LIGHT_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  greetingText: {
    fontSize: 12,
    color: LIGHT_COLORS.mutedText,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },
  rightHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LIGHT_COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  settingsHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LIGHT_COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4D6BD0',
    marginBottom: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  heroHeader: {
    alignItems: 'stretch',
    gap: 12,
  },
  pillBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
  },
  toggleRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 13,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#3453A9',
  },
  toggleText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  balanceCardsScroll: {
    marginHorizontal: -20,
    marginTop: 18,
    marginBottom: 16,
  },
  balanceCardsContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  balanceCard: {
    width: 248,
    minHeight: 136,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  totalBalanceCard: {
    backgroundColor: '#243B8B',
    borderColor: '#4D6BD0',
  },
  cashBalanceCard: {
    backgroundColor: '#663784',
    borderColor: '#9554BB',
  },
  bankBalanceCard: {
    backgroundColor: '#174E86',
    borderColor: '#2C80C8',
  },
  balanceCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCardHint: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  balanceCardLabel: {
    fontSize: 12,
    color: '#D3DEFF',
    fontWeight: '600',
    marginTop: 12,
  },
  balanceCardAmount: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 3,
  },
  balanceWrap: {
    marginVertical: 16,
  },
  heroYearLabel: {
    fontSize: 13,
    color: LIGHT_COLORS.mutedText,
    fontWeight: '600',
  },
  heroBalanceText: {
    fontSize: 32,
    fontWeight: '800',
    color: LIGHT_COLORS.emeraldText,
    letterSpacing: -0.6,
    marginTop: 4,
  },

  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: LIGHT_COLORS.cardBorder,
    paddingTop: 16,
    marginTop: 4,
  },
  statCol: {
    flex: 1,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#C4D0F3',
  },
  incomeAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F5F7FF',
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F5F7FF',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#4D6BD0',
    marginHorizontal: 14,
  },

  // Stream section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleWrap: {
    flex: 1,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trashHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  trashHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  addBtnHeader: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIGHT_COLORS.secondary,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: LIGHT_COLORS.foreground,
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
    color: LIGHT_COLORS.primary,
  },

  // Monthly Stream Navigator Styles
  streamContainer: {
    marginTop: 4,
  },
  streamNavigatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    marginBottom: 10,
  },
  streamArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: LIGHT_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  streamMonthCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamMonthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: LIGHT_COLORS.foreground,
  },
  streamTodayBadge: {
    backgroundColor: LIGHT_COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  streamTodayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: LIGHT_COLORS.primary,
  },

  streamStatsRow: {
    alignItems: 'stretch',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  streamStatsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  streamTxCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: LIGHT_COLORS.mutedText,
  },
  streamNetText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteCurrentMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deleteCurrentMonthBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  monthTransactionsCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    shadowColor: LIGHT_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 1,
  },

  emptyCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  emptyText: {
    fontSize: 13,
    color: LIGHT_COLORS.mutedText,
    marginTop: 8,
  },
  emptyAddBtn: {
    marginTop: 14,
    backgroundColor: LIGHT_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  emptyAddBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  monthCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    marginBottom: 12,
    shadowColor: LIGHT_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
    elevation: 1,
  },
  monthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_COLORS.cardBorder,
    paddingBottom: 10,
    marginBottom: 10,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },
  monthNetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  yearlyMonthCardBody: {
    paddingVertical: 4,
  },
  yearlyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.background,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  yearlyStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  yearlyStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: LIGHT_COLORS.mutedText,
    marginBottom: 4,
  },
  yearlyStatVal: {
    fontSize: 13,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },
  yearlyStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: LIGHT_COLORS.cardBorder,
  },

  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  txRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_COLORS.cardBorder,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  catIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txTextWrap: {
    flex: 1,
  },
  txTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
    flexShrink: 1,
  },
  accountBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: LIGHT_COLORS.secondary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  accountBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: LIGHT_COLORS.mutedText,
  },
  txSub: {
    fontSize: 11,
    color: LIGHT_COLORS.mutedText,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  accountSplitRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  accountSubCard: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.background,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  accountTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  accountSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: LIGHT_COLORS.mutedText,
  },
  accountSubAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  accountFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: LIGHT_COLORS.card,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  accountFilterChipActive: {
    backgroundColor: LIGHT_COLORS.foreground,
    borderColor: LIGHT_COLORS.foreground,
  },
  accountFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: LIGHT_COLORS.mutedText,
  },
  accountFilterTextActive: {
    color: '#FFF',
  },
  quickExpenseWrap: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    marginBottom: 20,
  },
  quickHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },
  toastBox: {
    backgroundColor: LIGHT_COLORS.emeraldBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 8,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: LIGHT_COLORS.emeraldText,
  },
  quickScroll: {
    flexDirection: 'row',
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: LIGHT_COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    marginRight: 8,
  },
  quickChipText: {
    fontSize: 12,
    color: LIGHT_COLORS.foreground,
  },
});
