import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/common/Header';
import { useData } from '../context/DataContext';
import { COLORS } from '../constants/colors';
import {
  formatCurrency,
  formatMonthYear,
  changeMonth,
  isSameMonthAndYear,
} from '../utils/formatters';

interface BudgetScreenProps {
  onOpenAddModal: () => void;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ onOpenAddModal }) => {
  const { budgets, transactions, totalBudgetedSpending } = useData();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const handlePrevMonth = () => setSelectedMonth((prev) => changeMonth(prev, -1));
  const handleNextMonth = () => setSelectedMonth((prev) => changeMonth(prev, 1));
  const handleCurrentMonth = () => setSelectedMonth(new Date());
  const isCurrentMonthSelected = isSameMonthAndYear(selectedMonth, new Date());
  const currentMonthName = formatMonthYear(selectedMonth);

  // Calculate actual spending per category dynamically from transactions for the selected month
  const getCategoryUsed = (categoryName: string) => {
    return transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          isSameMonthAndYear(t.date, selectedMonth) &&
          t.category.toLowerCase().trim() === categoryName.toLowerCase().trim()
      )
      .reduce((sum, t) => sum + (t.rawAmount || 0), 0);
  };

  const dynamicTotalUsed = budgets.reduce(
    (sum, b) => sum + getCategoryUsed(b.categoryName),
    0
  );

  const overallPercentage =
    totalBudgetedSpending > 0
      ? Math.min(Math.round((dynamicTotalUsed / totalBudgetedSpending) * 100), 100)
      : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header
        title="Bütçe"
        subtitle="Limiti sen koyarsın · Aylık Takip"
        rightActionIcon="add"
        onRightActionPress={onOpenAddModal}
      />

      {/* Month Selector */}
      <View style={styles.monthSelectorRow}>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={handlePrevMonth}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={COLORS.foreground} />
        </TouchableOpacity>

        <View style={styles.monthCenterWrap}>
          <Text style={styles.monthTitleText}>{currentMonthName}</Text>
          {!isCurrentMonthSelected && (
            <TouchableOpacity
              style={styles.currentMonthBadge}
              onPress={handleCurrentMonth}
              activeOpacity={0.7}
            >
              <Text style={styles.currentMonthBadgeText}>Bu Aya Dön</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={handleNextMonth}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={18} color={COLORS.foreground} />
        </TouchableOpacity>
      </View>

      {/* Top Bütçelenen Harcama Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.monthLabel}>{currentMonthName} · Bütçe Durumu</Text>

        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summarySubTitle}>Bütçelenen Harcama</Text>
            <Text style={styles.usedAmountText}>{formatCurrency(dynamicTotalUsed)}</Text>
            <Text style={styles.allocatedSubText}>
              / {formatCurrency(totalBudgetedSpending)}
            </Text>
          </View>

          <View style={styles.percentCircle}>
            <Text style={styles.percentText}>%{overallPercentage}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.max(overallPercentage, 4)}%`,
                backgroundColor:
                  overallPercentage > 90 ? COLORS.rose : COLORS.emerald,
              },
            ]}
          />
        </View>
      </View>

      {/* Category Budgets / Sanal Zarf Yöntemi */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sanal Zarf Bütçeleri (Envelopes)</Text>
      </View>

      {/* Category Budget Items */}
      {budgets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="mail-outline" size={36} color={COLORS.subtleText} />
          <Text style={styles.emptyText}>Henüz sanal zarf bütçesi eklenmedi.</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={onOpenAddModal}>
            <Text style={styles.emptyAddBtnText}>+ İlk Zarf Bütçeni Oluştur</Text>
          </TouchableOpacity>
        </View>
      ) : (
        budgets.map((b) => {
          const usedAmt = getCategoryUsed(b.categoryName);
          const catPct =
            b.allocatedAmount > 0
              ? Math.min(Math.round((usedAmt / b.allocatedAmount) * 100), 100)
              : 0;

          const isOverLimit = usedAmt > b.allocatedAmount;
          const remaining = Math.max(b.allocatedAmount - usedAmt, 0);

          return (
            <View key={b.id} style={styles.budgetCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.catWrap}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: b.color ? `${b.color}15` : COLORS.primaryLight },
                    ]}
                  >
                    <Ionicons
                      name={(b.iconName as any) || 'mail-outline'}
                      size={18}
                      color={b.color || COLORS.primary}
                    />
                  </View>
                  <View>
                    <Text style={styles.catName}>{b.categoryName} Zarfı</Text>
                    <Text style={styles.badgeText}>
                      Kalan: <Text style={{ fontWeight: '700', color: isOverLimit ? COLORS.rose : COLORS.emeraldText }}>{formatCurrency(remaining)}</Text>
                    </Text>
                  </View>
                </View>

                <Text style={styles.amountsText}>
                  {formatCurrency(usedAmt)}{' '}
                  <Text style={styles.allocatedText}>/ {formatCurrency(b.allocatedAmount)}</Text>
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.catProgressTrack}>
                <View
                  style={[
                    styles.catProgressBar,
                    {
                      width: `${Math.max(catPct, 4)}%`,
                      backgroundColor: isOverLimit
                        ? COLORS.rose
                        : catPct > 80
                        ? COLORS.amber
                        : b.color || COLORS.emerald,
                    },
                  ]}
                />
              </View>
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
    paddingBottom: 150,
  },

  // Month Selector
  monthSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  monthCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  monthTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  currentMonthBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  currentMonthBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },

  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  monthLabel: {
    fontSize: 12,
    color: COLORS.mutedText,
    fontWeight: '600',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summarySubTitle: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  usedAmountText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.foreground,
    marginTop: 4,
  },
  allocatedSubText: {
    fontSize: 14,
    color: COLORS.mutedText,
    fontWeight: '600',
  },

  percentCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: COLORS.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.emeraldBg,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.emeraldText,
  },

  progressTrack: {
    height: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },

  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.foreground,
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

  budgetCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  catWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  badgeChip: {
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.mutedText,
  },

  amountsText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.foreground,
  },
  allocatedText: {
    fontSize: 12,
    color: COLORS.mutedText,
    fontWeight: '400',
  },

  ruleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 20,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.foreground,
  },
  ruleDesc: {
    fontSize: 11,
    color: COLORS.mutedText,
    lineHeight: 16,
    marginBottom: 14,
  },
  ruleRow: {
    marginBottom: 10,
  },
  ruleRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ruleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  ruleValText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  ruleTrack: {
    height: 6,
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  ruleBar: {
    height: '100%',
    borderRadius: 3,
  },
  catProgressTrack: {
    height: 6,
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
