import { useTheme, useThemedStyles } from '../context/ThemeContext';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { AppTransaction } from '../types';
import { useData } from '../context/DataContext';
import { useAppDialog } from '../context/AppDialogContext';
import { localizeFormat } from '../context/LocaleContext';
import { ACCENT_PALETTES, AccentPreference, COLORS, LIGHT_COLORS } from '../constants/colors';
import {
  formatCurrency,
  formatShortDate,
  formatDateTime,
  formatMonthYear,
  changeMonth,
  isSameMonthAndYear,
} from '../utils/formatters';

const BALANCE_CARD_WIDTH = 248;
const HERO_PALETTES: Record<AccentPreference, { background: string; border: string; balance: string; balanceBorder: string }> = {
  teal: { background: '#0F2C23', border: '#1E4D3E', balance: '#174235', balanceBorder: '#265C4B' },
  blue: { background: '#14283E', border: '#284563', balance: '#203B58', balanceBorder: '#345775' },
  violet: { background: '#281F3D', border: '#46365E', balance: '#382B53', balanceBorder: '#574471' },
  coral: { background: '#3A2426', border: '#633B3C', balance: '#4B3032', balanceBorder: '#71494A' },
};

interface HomeScreenProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: AppTransaction) => void;
  onOpenSettingsModal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenAddModal,
  onEditTransaction,
  onOpenSettingsModal,
}) => {
  const styles = useThemedStyles(lightStyles);
  const { isDark, colors, accent } = useTheme();
  const heroPalette = HERO_PALETTES[accent];
  const heroAccent = ACCENT_PALETTES[accent].dark;
  const { alert } = useAppDialog();
  const {
    userName,
    isBalanceHidden,
    toggleBalanceHidden,
    totalBalance,
    bankBalance,
    cashBalance,
    totalIncome,
    totalExpense,
    transactions,
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
  const heroIncome = activeFilter === 'monthly' ? selectedMonthIncome : totalIncome;
  const heroExpense = activeFilter === 'monthly' ? selectedMonthExpense : totalExpense;

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

      {/* Hero Timeline Card (Zaman Tüneli / Yıllık Özet) */}
      <View style={[styles.heroCard, { backgroundColor: heroPalette.background, borderColor: heroPalette.border, shadowColor: heroPalette.background }]}>
        <View style={styles.heroHeader}>
          <View style={[styles.pillBadge, { backgroundColor: `${heroAccent}26` }]}>
            <Ionicons name="time" size={12} color={heroAccent} />
            <Text style={[styles.pillBadgeText, { color: heroAccent }]}>Zaman Tüneli</Text>
          </View>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                activeFilter === 'yearly' && [styles.toggleBtnActive, { backgroundColor: heroPalette.border }],
              ]}
              onPress={() => setActiveFilter('yearly')}
            >
              <Text
                style={[
                  styles.toggleText,
                  activeFilter === 'yearly' && styles.toggleTextActive,
                ]}
              >
                Yıllık özet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                activeFilter === 'monthly' && [styles.toggleBtnActive, { backgroundColor: heroPalette.border }],
              ]}
              onPress={() => setActiveFilter('monthly')}
            >
              <Text
                style={[
                  styles.toggleText,
                  activeFilter === 'monthly' && styles.toggleTextActive,
                ]}
              >
                Ay ay akış
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Swipeable balance cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.balanceCardsContent}
          style={styles.balanceCardsScroll}
          snapToInterval={BALANCE_CARD_WIDTH + 12}
          decelerationRate="fast"
        >
          <View style={[styles.balanceCard, styles.totalBalanceCard, { backgroundColor: heroPalette.balance, borderColor: heroPalette.balanceBorder }]}>
            <View style={styles.balanceCardTopRow}>
              <View style={styles.balanceIconWrap}>
                <Ionicons name="wallet" size={18} color="#34D399" />
              </View>
              <Text style={styles.balanceCardHint}>Genel durum</Text>
            </View>
            <Text style={[styles.balanceCardLabel, { color: heroAccent }]}>Toplam Bakiye</Text>
            <Text style={styles.balanceCardAmount}>{balanceStr}</Text>
          </View>

          <View style={[styles.balanceCard, styles.cashBalanceCard, { backgroundColor: heroPalette.balance, borderColor: heroPalette.balanceBorder }]}>
            <View style={styles.balanceCardTopRow}>
              <View style={styles.balanceIconWrap}>
                <Ionicons name="cash-outline" size={18} color="#34D399" />
              </View>
              <Text style={styles.balanceCardHint}>Cüzdan</Text>
            </View>
            <Text style={[styles.balanceCardLabel, { color: heroAccent }]}>Nakit Bakiye</Text>
            <Text style={styles.balanceCardAmount}>{cashStr}</Text>
          </View>

          <View style={[styles.balanceCard, styles.bankBalanceCard, { backgroundColor: heroPalette.balance, borderColor: heroPalette.balanceBorder }]}>
            <View style={styles.balanceCardTopRow}>
              <View style={styles.balanceIconWrap}>
                <Ionicons name="card-outline" size={18} color="#60A5FA" />
              </View>
              <Text style={styles.balanceCardHint}>Hesap</Text>
            </View>
            <Text style={[styles.balanceCardLabel, { color: heroAccent }]}>Banka Bakiyesi</Text>
            <Text style={styles.balanceCardAmount}>{bankStr}</Text>
          </View>
        </ScrollView>

        {/* Income & Expense Breakdown Row */}
        <View style={styles.heroStatsRow}>
          <View style={styles.statCol}>
            <View style={styles.statLabelRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.emerald }]} />
              <Text style={styles.statLabel}>
                Gelir {activeFilter === 'monthly' ? `(${currentMonthDisplay.split(' ')[0]})` : '(Toplam)'}
              </Text>
            </View>
            <Text style={styles.incomeAmount}>
              {isBalanceHidden ? '••••' : formatCurrency(heroIncome)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statCol}>
            <View style={styles.statLabelRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.rose }]} />
              <Text style={styles.statLabel}>
                Gider {activeFilter === 'monthly' ? `(${currentMonthDisplay.split(' ')[0]})` : '(Toplam)'}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              {isBalanceHidden ? '••••' : formatCurrency(heroExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* Timeline Stream Section (Ay ay akış / Yıllık özet) */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>
            {activeFilter === 'yearly' ? 'Yıllık Ay Ay Özet' : 'İşlem Akışı'}
          </Text>
        </View>

        <View style={styles.sectionHeaderRight}>
          <TouchableOpacity
            style={styles.trashHeaderBtn}
            activeOpacity={0.7}
            onPress={handleOpenDeleteMenu}
          >
            <Ionicons name="trash-outline" size={15} color={COLORS.roseText} />
            <Text style={styles.trashHeaderBtnText}>Temizle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtnHeader}
            onPress={onOpenAddModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={COLORS.primary} />
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
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={36} color={COLORS.subtleText} />
            <Text style={styles.emptyText}>Henüz kaydedilmiş işlem bulunmuyor.</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={onOpenAddModal}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.emptyAddBtnText}>İlk İşlemini Ekle</Text>
            </TouchableOpacity>
          </View>
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
              <View key={monthName} style={styles.monthCard}>
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
              </View>
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
                Net: {selectedMonthNet >= 0 ? '+' : ''}{formatCurrency(selectedMonthNet)}
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
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={38} color={COLORS.subtleText} />
              <Text style={styles.emptyText}>{localizeFormat('{0} döneminde kayıtlı işlem yok.', [currentMonthDisplay])}</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={onOpenAddModal}>
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.emptyAddBtnText}>Bu Aya İşlem Ekle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.monthTransactionsCard}>
              {selectedMonthTransactions.map((tx) => {
                const isCash = tx.accountType === 'cash' || tx.accountName?.includes('Nakit');
                const accountBadgeText = isCash ? 'Nakit' : 'Banka';
                const accountIconName = isCash ? 'wallet-outline' : 'card-outline';

                return (
                  <View key={tx.id} style={styles.txRow}>
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
                            {tx.title}
                          </Text>
                          <View style={styles.accountBadgeChip}>
                            <Ionicons name={accountIconName} size={9} color={COLORS.mutedText} />
                            <Text style={styles.accountBadgeText}>{accountBadgeText}</Text>
                          </View>
                        </View>
                        <Text style={styles.txSub}>
                          {`${tx.category} · ${formatDateTime(tx.date)}`}
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
                      {tx.type !== 'transfer' && (
                        <TouchableOpacity
                          onPress={() => onEditTransaction(tx)}
                          accessibilityLabel="İşlemi Düzenle"
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="create-outline" size={15} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => handleDeleteTransaction(tx.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={14} color={COLORS.subtleText} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
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
    marginBottom: 16,
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
    backgroundColor: '#0F2C23',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E4D3E',
    marginBottom: 16,
    shadowColor: '#0F2C23',
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
    backgroundColor: '#1E4D3E',
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
    width: BALANCE_CARD_WIDTH,
    minHeight: 136,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  totalBalanceCard: {
    backgroundColor: '#174235',
    borderColor: '#265C4B',
  },
  cashBalanceCard: {
    backgroundColor: '#174235',
    borderColor: '#265C4B',
  },
  bankBalanceCard: {
    backgroundColor: '#174235',
    borderColor: '#265C4B',
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
    color: '#A7F3D0',
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
    color: '#A9C5BA',
  },
  incomeAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F4FBF7',
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F4FBF7',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#2C5A4E',
    marginHorizontal: 14,
  },

  // Stream section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  trashHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  addBtnHeader: {
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sectionTitle: {
    fontSize: 17,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  streamStatsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    shadowColor: LIGHT_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
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
    paddingVertical: 8,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  catIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
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
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 10,
    color: LIGHT_COLORS.mutedText,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  txAmount: {
    fontSize: 13,
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
