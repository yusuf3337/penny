import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { COLORS } from '../constants/colors';
import { formatCurrency, formatShortDate } from '../utils/formatters';

interface HomeScreenProps {
  onOpenAddModal: () => void;
  onOpenNameModal: () => void;
  onOpenSettingsModal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenAddModal,
  onOpenNameModal,
  onOpenSettingsModal,
}) => {
  const {
    userName,
    isBalanceHidden,
    toggleBalanceHidden,
    totalBalance,
    totalIncome,
    totalExpense,
    transactions,
    handleDeleteTransaction,
    setActiveTab,
  } = useData();

  const [activeFilter, setActiveFilter] = useState<'yearly' | 'monthly'>('yearly');

  // Split balance for hero display
  const balanceStr = isBalanceHidden ? '••••••' : formatCurrency(totalBalance);

  // Group transactions by month for "Ay ay akış"
  const monthGroups: { [month: string]: typeof transactions } = {};
  transactions.forEach((tx) => {
    const monthKey = new Date(tx.date).toLocaleDateString('tr-TR', {
      month: 'long',
      year: 'numeric',
    });
    const key = monthKey !== 'Invalid Date' ? monthKey : 'Ağustos 2026';
    if (!monthGroups[key]) monthGroups[key] = [];
    monthGroups[key].push(tx);
  });

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
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.pillBadge}>
            <Ionicons name="time" size={12} color={COLORS.emeraldText} />
            <Text style={styles.pillBadgeText}>Zaman Tüneli</Text>
          </View>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                activeFilter === 'yearly' && styles.toggleBtnActive,
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
                activeFilter === 'monthly' && styles.toggleBtnActive,
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

        {/* Big Balance Banner */}
        <View style={styles.balanceWrap}>
          <Text style={styles.heroYearLabel}>2026 Net Bakiye</Text>
          <Text style={styles.heroBalanceText}>{balanceStr}</Text>
        </View>

        {/* Income & Expense Breakdown Row */}
        <View style={styles.heroStatsRow}>
          <View style={styles.statCol}>
            <View style={styles.statLabelRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.emerald }]} />
              <Text style={styles.statLabel}>Gelir</Text>
            </View>
            <Text style={styles.incomeAmount}>
              {isBalanceHidden ? '••••' : formatCurrency(totalIncome)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statCol}>
            <View style={styles.statLabelRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.rose }]} />
              <Text style={styles.statLabel}>Gider</Text>
            </View>
            <Text style={styles.expenseAmount}>
              {isBalanceHidden ? '••••' : formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Navigation Cards */}
      <View style={styles.quickNavRow}>
        <TouchableOpacity
          style={styles.quickNavCard}
          activeOpacity={0.8}
          onPress={() => setActiveTab('goals')}
        >
          <View style={[styles.quickNavIcon, { backgroundColor: COLORS.emeraldBg }]}>
            <Ionicons name="flag" size={18} color={COLORS.emeraldText} />
          </View>
          <Text style={styles.quickNavTitle}>Hedefler</Text>
          <Text style={styles.quickNavSub}>Tasarruf Takibi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickNavCard}
          activeOpacity={0.8}
          onPress={() => setActiveTab('subscriptions')}
        >
          <View style={[styles.quickNavIcon, { backgroundColor: COLORS.blueBg }]}>
            <Ionicons name="repeat" size={18} color={COLORS.blueText} />
          </View>
          <Text style={styles.quickNavTitle}>Abonelikler</Text>
          <Text style={styles.quickNavSub}>Yenilemeler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickNavCard}
          activeOpacity={0.8}
          onPress={() => setActiveTab('budget')}
        >
          <View style={[styles.quickNavIcon, { backgroundColor: COLORS.purpleBg }]}>
            <Ionicons name="pie-chart" size={18} color={COLORS.purpleText} />
          </View>
          <Text style={styles.quickNavTitle}>Bütçe</Text>
          <Text style={styles.quickNavSub}>Kategori Limiti</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline Stream Section (Ay ay akış) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ay Ay İşlem Akışı</Text>
        <TouchableOpacity onPress={onOpenAddModal}>
          <Text style={styles.addText}>+ Yeni İşlem</Text>
        </TouchableOpacity>
      </View>

      {Object.keys(monthGroups).length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={36} color={COLORS.subtleText} />
          <Text style={styles.emptyText}>Henüz kaydedilmiş işlem bulunmuyor.</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={onOpenAddModal}>
            <Text style={styles.emptyAddBtnText}>+ İlk İşlemini Ekle</Text>
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
                  {monthNet >= 0 ? '+' : ''}
                  {formatCurrency(monthNet)}
                </Text>
              </View>

              {monthTxs.map((tx) => (
                <View key={tx.id} style={styles.txRow}>
                  <View style={styles.txLeft}>
                    <View
                      style={[
                        styles.catIconWrap,
                        {
                          backgroundColor:
                            tx.type === 'income' ? COLORS.emeraldBg : COLORS.secondary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={(tx.iconName as any) || 'pricetag-outline'}
                        size={16}
                        color={tx.type === 'income' ? COLORS.emeraldText : COLORS.mutedText}
                      />
                    </View>
                    <View>
                      <Text style={styles.txTitle}>{tx.title}</Text>
                      <Text style={styles.txSub}>
                        {tx.category} · {formatShortDate(tx.date)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color:
                            tx.type === 'income' ? COLORS.emeraldText : COLORS.foreground,
                        },
                      ]}
                    >
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.rawAmount)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteTransaction(tx.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={14} color={COLORS.subtleText} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
    backgroundColor: COLORS.primary,
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
    color: COLORS.mutedText,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.foreground,
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
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  settingsHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.emeraldBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.emeraldText,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.card,
  },
  toggleText: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.foreground,
    fontWeight: '700',
  },

  balanceWrap: {
    marginVertical: 16,
  },
  heroYearLabel: {
    fontSize: 13,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  heroBalanceText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.emeraldText,
    letterSpacing: -0.6,
    marginTop: 4,
  },

  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 14,
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
    color: COLORS.mutedText,
  },
  incomeAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 12,
  },

  // Quick Navigation
  quickNavRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickNavCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickNavIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickNavTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  quickNavSub: {
    fontSize: 10,
    color: COLORS.mutedText,
    marginTop: 2,
  },

  // Stream section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.foreground,
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 8,
  },
  emptyAddBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  monthCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
  },
  monthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingBottom: 10,
    marginBottom: 10,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  monthNetText: {
    fontSize: 14,
    fontWeight: '700',
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
    gap: 10,
  },
  catIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  txSub: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
});
