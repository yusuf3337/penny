import { Card } from 'heroui-native/card';
import { useThemedStyles } from '../context/ThemeContext';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/common/Header';
import { useData } from '../context/DataContext';
import { COLORS, LIGHT_COLORS } from '../constants/colors';
import {
  formatCurrency,
  formatMonthYear,
  changeMonth,
  isSameMonthAndYear,
} from '../utils/formatters';

import { CategoryBudget } from '../types';
import { useLocale } from '../context/LocaleContext';

interface BudgetScreenProps {
  onOpenAddModal: () => void;
  onEditBudget: (budget: CategoryBudget) => void;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ onOpenAddModal, onEditBudget }) => {
  const styles = useThemedStyles(lightStyles);
  const { t } = useLocale();
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
        subtitle="Aylık harcama sınırlarını takip edin"
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
      <Card style={[styles.summaryCard, { borderTopColor: COLORS.primary, borderTopWidth: 4 }]}>
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
                width: `${overallPercentage}%`,
                backgroundColor:
                  overallPercentage > 90 ? COLORS.rose : COLORS.emerald,
              },
            ]}
          />
        </View>
      </Card>

      {/* Category Budgets / Sanal Zarf Yöntemi */}
      <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Kategori bütçeleri</Text>
      </View>

      {/* Category Budget Items */}
      {budgets.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="mail-outline" size={36} color={COLORS.subtleText} />
          <Text style={styles.emptyText}>Henüz sanal zarf bütçesi eklenmedi.</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={onOpenAddModal}>
            <Ionicons name="add" size={16} color={COLORS.primaryForeground} />
            <Text style={[styles.emptyAddBtnText, { color: COLORS.primaryForeground }]}>İlk Zarf Bütçeni Oluştur</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        budgets.map((b) => {
          const usedAmt = getCategoryUsed(b.categoryName);
          const catPct =
            b.allocatedAmount > 0
              ? Math.min(Math.round((usedAmt / b.allocatedAmount) * 100), 100)
              : 0;

          const isOverLimit = usedAmt > b.allocatedAmount;
          const remaining = Math.max(b.allocatedAmount - usedAmt, 0);

          const accent = b.color || COLORS.primary;
          return (
            <Card key={b.id} style={[styles.budgetCard, { borderLeftWidth: 4, borderLeftColor: accent }]}>
              <View style={styles.cardTopRow}>
                <View style={styles.catWrap}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${accent}22` },
                    ]}
                  >
                    <Ionicons
                      name={(b.iconName as any) || 'mail-outline'}
                      size={18}
                      color={accent}
                    />
                  </View>
                  <View style={styles.catTextWrap}>
                    <Text localize={false} style={styles.catName}>{t(b.categoryName)} · {t('Zarfı')}</Text>
                    <Text style={styles.badgeText}>
                      Kalan: <Text style={{ fontWeight: '700', color: isOverLimit ? COLORS.rose : COLORS.emeraldText }}>{formatCurrency(remaining)}</Text>
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: `${accent}22` }]}
                  onPress={() => onEditBudget(b)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('Zarfı Düzenle')}: ${t(b.categoryName)}`}
                  activeOpacity={0.72}
                >
                  <Ionicons name="create-outline" size={18} color={accent} />
                </TouchableOpacity>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amountsText}>{formatCurrency(usedAmt)}</Text>
                <Text style={styles.allocatedText}>/ {formatCurrency(b.allocatedAmount)}</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.catProgressTrack}>
                <View
                  style={[
                    styles.catProgressBar,
                    {
                      width: `${catPct}%`,
                      backgroundColor: isOverLimit
                        ? COLORS.rose
                        : catPct > 80
                        ? COLORS.amber
                        : b.color || COLORS.emerald,
                    },
                  ]}
                />
              </View>
            </Card>
          );
        })
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
    backgroundColor: LIGHT_COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  monthTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },
  currentMonthBadge: {
    backgroundColor: LIGHT_COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  currentMonthBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: LIGHT_COLORS.primary,
  },

  summaryCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    marginBottom: 20,
    shadowColor: LIGHT_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  monthLabel: {
    fontSize: 12,
    color: LIGHT_COLORS.mutedText,
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
    color: LIGHT_COLORS.mutedText,
  },
  usedAmountText: {
    fontSize: 26,
    fontWeight: '800',
    color: LIGHT_COLORS.foreground,
    marginTop: 4,
  },
  allocatedSubText: {
    fontSize: 14,
    color: LIGHT_COLORS.mutedText,
    fontWeight: '600',
  },

  percentCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: LIGHT_COLORS.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.emeraldBg,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '800',
    color: LIGHT_COLORS.emeraldText,
  },

  progressTrack: {
    height: 8,
    backgroundColor: LIGHT_COLORS.secondary,
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
    color: LIGHT_COLORS.foreground,
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

  budgetCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
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
    flex: 1,
  },
  catTextWrap: { flex: 1 },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
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
    color: LIGHT_COLORS.foreground,
  },
  badgeChip: {
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: LIGHT_COLORS.mutedText,
  },

  amountsText: {
    fontSize: 13,
    fontWeight: '800',
    color: LIGHT_COLORS.foreground,
  },
  allocatedText: {
    fontSize: 12,
    color: LIGHT_COLORS.mutedText,
    fontWeight: '400',
  },

  ruleCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
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
    color: LIGHT_COLORS.foreground,
  },
  ruleDesc: {
    fontSize: 11,
    color: LIGHT_COLORS.mutedText,
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
    color: LIGHT_COLORS.foreground,
  },
  ruleValText: {
    fontSize: 11,
    fontWeight: '600',
    color: LIGHT_COLORS.mutedText,
  },
  ruleTrack: {
    height: 6,
    backgroundColor: LIGHT_COLORS.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  ruleBar: {
    height: '100%',
    borderRadius: 3,
  },
  catProgressTrack: {
    height: 6,
    backgroundColor: LIGHT_COLORS.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catProgressBar: {
    height: '100%',
    borderRadius: 3,
  },

});
