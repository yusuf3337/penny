import { useThemedStyles } from '../context/ThemeContext';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/common/LocalizedPrimitives';
import Svg, { G, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/common/Header';
import { useData } from '../context/DataContext';
import { COLORS, LIGHT_COLORS } from '../constants/colors';
import {
  formatCurrency,
  formatShortDate,
  formatMonthYear,
  changeMonth,
  isSameMonthAndYear,
} from '../utils/formatters';
import { usePremium } from '../context/PremiumContext';
import { getActiveLanguage, getFormattingLocale, localize, localizeFormat } from '../context/LocaleContext';

const topSpendingMessage = (month: string, category: string, percentage: number, amount: string): string => {
  switch (getActiveLanguage()) {
    case 'en': return `In ${month}, ${category} was your top spending category at ${percentage}% (${amount}).`;
    case 'de': return `Im ${month} entfielen ${percentage}% Ihrer Ausgaben (${amount}) auf ${category}.`;
    case 'fr': return `En ${month}, ${category} représentait ${percentage} % de vos dépenses (${amount}).`;
    case 'ko': return `${month}에는 ${category} 지출이 ${percentage}%(${amount})로 가장 많았습니다.`;
    case 'zh': return `${month}，${category}占支出的 ${percentage}%（${amount}），为最高支出类别。`;
    case 'ja': return `${month}の最大支出は${category}で、全体の${percentage}%（${amount}）でした。`;
    case 'ru': return `В ${month} категория «${category}» составила ${percentage} % расходов (${amount}) и была самой крупной.`;
    case 'it': return `Nel ${month}, ${category} è stata la categoria di spesa maggiore: ${percentage}% (${amount}).`;
    default: return `${month} döneminde en yüksek harcama ${category} kategorisinde: %${percentage} (${amount}).`;
  }
};

interface ReportsScreenProps {
  onOpenAddModal: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onOpenAddModal }) => {
  const styles = useThemedStyles(lightStyles);
  const {
    transactions,
    totalBalance,
    subscriptions,
    totalMonthlySubscriptions,
    goals,
    totalSavedGoals,
  } = useData();

  const { isPro, openPaywall } = usePremium();

  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [activeSubTab, setActiveSubTab] = useState<'kategori' | 'genel' | 'icgoru' | 'trend' | 'zaman'>('kategori');

  const handlePrevMonth = () => setSelectedMonth((prev) => changeMonth(prev, -1));
  const handleNextMonth = () => setSelectedMonth((prev) => changeMonth(prev, 1));
  const handleCurrentMonth = () => setSelectedMonth(new Date());
  const isCurrentMonthSelected = isSameMonthAndYear(selectedMonth, new Date());

  // Filter transactions for the selected month
  const monthlyTransactions = transactions.filter((t) =>
    isSameMonthAndYear(t.date, selectedMonth)
  );

  const monthIncome = monthlyTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.rawAmount || 0), 0);

  const monthExpense = monthlyTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.rawAmount || 0), 0);

  const monthNet = monthIncome - monthExpense;

  const categoryColors: { [key: string]: string } = {
    Teknoloji: '#3B82F6',
    Ev: '#F59E0B',
    Yemek: '#EF4444',
    Faturalar: '#6366F1',
    Sağlık: '#10B981',
    Eğitim: '#8B5CF6',
    Ulaşım: '#06B6D4',
    Eğlence: '#EC4899',
    'Maaş / Hakediş': '#0D9488',
    Maaş: '#0D9488',
    Yatırım: '#10B981',
    Freelance: '#6366F1',
    Diğer: '#64748B',
  };

  // Category breakdown for Expense
  const categoryMap: { [key: string]: number } = {};
  monthlyTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + (t.rawAmount || 0);
    });

  const categories = Object.keys(categoryMap)
    .map((catName) => {
      const rawAmount = categoryMap[catName];
      const percentage = monthExpense > 0 ? Math.round((rawAmount / monthExpense) * 100) : 0;
      return {
        name: catName,
        rawAmount,
        percentage,
        color: categoryColors[catName] || COLORS.primary,
      };
    })
    .sort((a, b) => b.rawAmount - a.rawAmount);

  // Category breakdown for Income
  const incomeCategoryMap: { [key: string]: number } = {};
  monthlyTransactions
    .filter((t) => t.type === 'income')
    .forEach((t) => {
      incomeCategoryMap[t.category] = (incomeCategoryMap[t.category] || 0) + (t.rawAmount || 0);
    });

  const incomeCategories = Object.keys(incomeCategoryMap)
    .map((catName) => {
      const rawAmount = incomeCategoryMap[catName];
      const percentage = monthIncome > 0 ? Math.round((rawAmount / monthIncome) * 100) : 0;
      return {
        name: catName,
        rawAmount,
        percentage,
        color: categoryColors[catName] || COLORS.emerald,
      };
    })
    .sort((a, b) => b.rawAmount - a.rawAmount);

  // Top spending category for insights
  const topExpenseCategory = categories.length > 0 ? categories[0] : null;

  // SVG Donut Chart Calculation
  const size = 180;
  const strokeWidth = 24;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  // Savings Rate %
  const savingsRate = monthIncome > 0
    ? Math.max(Math.round(((monthIncome - monthExpense) / monthIncome) * 100), 0)
    : 0;

  const currentMonthName = formatMonthYear(selectedMonth);
  const previousMonth = changeMonth(selectedMonth, -1);
  const previousMonthExpense = transactions
    .filter((t) => t.type === 'expense' && isSameMonthAndYear(t.date, previousMonth))
    .reduce((sum, t) => sum + (t.rawAmount || 0), 0);
  const expenseChange = previousMonthExpense > 0
    ? Math.round(((monthExpense - previousMonthExpense) / previousMonthExpense) * 100)
    : null;
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const elapsedDays = isCurrentMonthSelected ? Math.min(new Date().getDate(), daysInMonth) : daysInMonth;
  const projectedExpense = isCurrentMonthSelected && elapsedDays > 0
    ? (monthExpense / elapsedDays) * daysInMonth
    : null;
  const subscriptionBurden = isCurrentMonthSelected && monthIncome > 0
    ? Math.round((totalMonthlySubscriptions / monthIncome) * 100)
    : null;
  const trendMonths = Array.from({ length: 6 }, (_, index) => {
    const date = changeMonth(selectedMonth, index - 5);
    const items = transactions.filter((t) => isSameMonthAndYear(t.date, date));
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString(getFormattingLocale(), { month: 'short', year: '2-digit' }),
      income: items.filter((t) => t.type === 'income').reduce((sum, t) => sum + (t.rawAmount || 0), 0),
      expense: items.filter((t) => t.type === 'expense').reduce((sum, t) => sum + (t.rawAmount || 0), 0),
    };
  });
  const trendMax = Math.max(1, ...trendMonths.flatMap((month) => [month.income, month.expense]));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header
        title="Rapor"
        subtitle="Gelir, gider ve zaman içindeki değişim"
        rightActionIcon="add"
        onRightActionPress={onOpenAddModal}
      />

      {/* Sub Navigation Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabRow} contentContainerStyle={styles.subTabContent}>
        {[
          { id: 'genel', label: 'Genel', isProTab: false },
          { id: 'kategori', label: 'Kategori', isProTab: false },
          { id: 'icgoru', label: 'İçgörüler', isProTab: true },
          { id: 'trend', label: 'Trend', isProTab: true },
          { id: 'zaman', label: 'Zaman', isProTab: true },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.subTabChip, isActive && styles.subTabChipActive]}
              onPress={() => setActiveSubTab(tab.id as any)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                  {tab.label}
                </Text>
                {tab.isProTab && !isPro && (
                  <Ionicons name="lock-closed-outline" size={11} color={COLORS.mutedText} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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

      {/* TAB 1: KATEGORİ (Donut Chart & Breakdown) */}
      {activeSubTab === 'kategori' && (
        <>
          <View style={styles.chartCard}>
            <Text style={styles.chartCardTitle}>{localizeFormat('{0} - Gider Kırılımı', [currentMonthName])}</Text>

            {monthExpense > 0 ? (
              <View style={styles.donutContainer}>
                <Svg width={size} height={size}>
                  <G rotation="-90" origin={`${center}, ${center}`}>
                    <Circle
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke={COLORS.secondary}
                      strokeWidth={strokeWidth}
                      fill="none"
                    />

                    {categories.length > 0 &&
                      categories.map((cat, index) => {
                        const strokeDashoffset =
                          circumference - (circumference * cat.percentage) / 100;
                        const rotation = (cumulativeAngle / 100) * 360;
                        cumulativeAngle += cat.percentage;

                        return (
                          <Circle
                            key={index}
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke={cat.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform={`rotate(${rotation}, ${center}, ${center})`}
                            fill="none"
                          />
                        );
                      })}
                  </G>
                </Svg>

                <View style={styles.donutCenter}>
                  <Text style={styles.donutLabel}>Toplam Gider</Text>
                  <Text style={styles.donutTotalText}>{formatCurrency(monthExpense)}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.categoryList}>
              {categories.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Ionicons name="pie-chart-outline" size={32} color={COLORS.subtleText} />
                  <Text style={styles.emptyText}>{localizeFormat('{0} için henüz kayıtlı gider yok.', [currentMonthName])}</Text>
                </View>
              ) : (
                categories.map((cat) => (
                  <View key={cat.name} style={styles.catRow}>
                    <View style={styles.catLeft}>
                      <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.catName}>{cat.name}</Text>
                    </View>

                    <View style={styles.catRight}>
                      <Text style={styles.catAmount}>{formatCurrency(cat.rawAmount)}</Text>
                      <Text style={styles.catPercent}>%{cat.percentage}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Income Breakdown Card */}
          <View style={styles.incomeCard}>
            <Text style={styles.incomeCardTitle}>{localizeFormat('{0} - Gelir Kırılımı', [currentMonthName])}</Text>
            {incomeCategories.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Ionicons name="cash-outline" size={32} color={COLORS.subtleText} />
                <Text style={styles.emptyText}>{localizeFormat('{0} için henüz kayıtlı gelir yok.', [currentMonthName])}</Text>
              </View>
            ) : (
              incomeCategories.map((cat) => (
                <View key={cat.name} style={styles.catRow}>
                  <View style={styles.catLeft}>
                    <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.catName}>{cat.name}</Text>
                  </View>
                  <View style={styles.catRight}>
                    <Text style={styles.catAmount}>{formatCurrency(cat.rawAmount)}</Text>
                    <Text style={styles.catPercent}>%{cat.percentage}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}

      {/* TAB 2: GENEL (Financial Health Overview) */}
      {activeSubTab === 'genel' && (
        <View style={styles.genelWrap}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{currentMonthName.toUpperCase()} NET DURUM</Text>
            <Text
              style={[
                styles.metricBigValue,
                { color: monthNet >= 0 ? COLORS.emeraldText : COLORS.roseText },
              ]}
            >
              {monthNet >= 0 ? '+' : ''}{formatCurrency(monthNet)}
            </Text>
            <Text style={styles.metricSubText}>
              Gelir: {formatCurrency(monthIncome)} · Gider: {formatCurrency(monthExpense)}
            </Text>
          </View>

          <View style={styles.rowTwo}>
            <View style={styles.halfCard}>
              <Ionicons name="pie-chart-outline" size={24} color={COLORS.primary} />
              <Text style={styles.halfLabel}>Aylık Tasarruf Oranı</Text>
              <Text style={styles.halfValue}>%{savingsRate}</Text>
            </View>

            <View style={styles.halfCard}>
              <Ionicons name="wallet-outline" size={24} color={COLORS.emeraldText} />
              <Text style={styles.halfLabel}>Kümülatif Toplam Bakiye</Text>
              <Text style={styles.halfValue}>{formatCurrency(totalBalance)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ADVANCED PRO TABS GATE */}
      {!isPro && (activeSubTab === 'icgoru' || activeSubTab === 'trend' || activeSubTab === 'zaman') && (
        <View style={styles.proLockedCard}>
          <View style={styles.proLockedCrownWrap}>
            <Ionicons name="analytics-outline" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.proLockedTitle}>
            {activeSubTab === 'icgoru'
              ? 'Akıllı Finansal İçgörüler'
              : activeSubTab === 'trend'
              ? 'Gelir & Gider Trend Analizi'
              : 'Detaylı Zaman Akışı'}
          </Text>
          <View style={styles.proLockedBadgePill}>
            <Text style={styles.proLockedBadgeText}>PENNY PRO ANALİTİK</Text>
          </View>
          <Text style={styles.proLockedDesc}>
            Altı aylık karşılaştırma, harcama değişimi, ay sonu tahmini ve abonelik yükünü tek yerde görün.
          </Text>

          <TouchableOpacity
            style={styles.proLockedBtn}
            onPress={() => openPaywall('reports_advanced')}
            activeOpacity={0.85}
          >
            <Ionicons name="analytics-outline" size={16} color="#0F172A" style={{ marginRight: 6 }} />
            <Text style={styles.proLockedBtnText}>Analizleri Aç</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* TAB 3: İÇGÖRÜLER (Smart Financial Insights) */}
      {isPro && activeSubTab === 'icgoru' && (
        <View style={styles.insightWrap}>
          {topExpenseCategory ? (
            <View style={styles.insightAlertCard}>
              <View style={styles.insightAlertHeader}>
                <Ionicons name="warning-outline" size={20} color={COLORS.amberText} />
                <Text style={styles.insightAlertTitle}>En Yüksek Harcama Kategorisi</Text>
              </View>
              <Text style={styles.insightAlertBody}>
                {topSpendingMessage(currentMonthName, topExpenseCategory.name, topExpenseCategory.percentage, formatCurrency(topExpenseCategory.rawAmount))}
              </Text>
            </View>
          ) : null}

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="trending-up-outline" size={18} color={COLORS.primary} />
              <Text style={styles.insightTitle}>Harcama Değişimi</Text>
            </View>
            <Text style={styles.insightBody}>
              {expenseChange === null
                ? 'Önceki ayda harcama kaydı olmadığı için karşılaştırma yapılamıyor.'
                : expenseChange === 0
                ? 'Harcamalarınız önceki ayla aynı seviyede.'
                : localizeFormat(expenseChange > 0 ? 'Harcamalarınız önceki aya göre %{0} arttı.' : 'Harcamalarınız önceki aya göre %{0} azaldı.', [Math.abs(expenseChange)])}
            </Text>
          </View>

          {projectedExpense !== null && monthExpense > 0 && (
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                <Text style={styles.insightTitle}>Ay Sonu Harcama Tahmini</Text>
              </View>
              <Text style={styles.insightBody}>
                {localizeFormat('Günlük ortalama korunursa ay sonu harcamanız yaklaşık {0} olur. Tahmin {1} günlük kayda dayanır.', [formatCurrency(projectedExpense), elapsedDays])}
              </Text>
            </View>
          )}

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="repeat-outline" size={18} color={COLORS.primary} />
              <Text style={styles.insightTitle}>Abonelik & Sabit Gider Yükü</Text>
            </View>
            <Text style={styles.insightBody}>
              {localizeFormat('{0} aktif abonelik için ayda ortalama {1} ödüyorsunuz. Yıllık toplam {2}.', [subscriptions.length, formatCurrency(totalMonthlySubscriptions), formatCurrency(totalMonthlySubscriptions * 12)])}
              {subscriptionBurden !== null ? ` ${localizeFormat('Bu, seçili ay gelirinizin yaklaşık %{0} kadarı.', [subscriptionBurden])}` : ''}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="flag-outline" size={18} color={COLORS.emeraldText} />
              <Text style={styles.insightTitle}>Tasarruf Hedefleri Durumu</Text>
            </View>
            <Text style={styles.insightBody}>
              {localizeFormat('Toplam birikiminiz: {0}.', [formatCurrency(totalSavedGoals)])}
              {goals.length === 0 ? ` ${localize('Henüz bir hedef tanımlamadınız.')}` : ` ${localizeFormat('{0} aktif hedefiniz takip ediliyor.', [goals.length])}`}
            </Text>
          </View>
        </View>
      )}

      {/* TAB 4: TREND (Income vs Expense Trend) */}
      {isPro && activeSubTab === 'trend' && (
        <View style={styles.trendWrap}>
          <View style={styles.chartCard}>
            <Text style={styles.chartCardTitle}>Son 6 Ay · Gelir ve Gider</Text>
            {trendMonths.every((month) => month.income === 0 && month.expense === 0) ? (
              <View style={styles.emptyStateBox}>
                <Ionicons name="bar-chart-outline" size={32} color={COLORS.subtleText} />
                <Text style={styles.emptyText}>Bu dönemde karşılaştırılacak işlem kaydı bulunmuyor.</Text>
              </View>
            ) : (
              <View style={styles.trendList}>
                <View style={styles.trendLegend}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.emerald }]} />
                  <Text style={styles.legendText}>Gelir</Text>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.rose }]} />
                  <Text style={styles.legendText}>Gider</Text>
                </View>
                {trendMonths.map((month) => (
                  <View key={month.key} style={styles.trendMonthRow}>
                    <Text style={styles.trendMonthLabel}>{month.label}</Text>
                    <View style={styles.trendBars}>
                      <View style={[styles.trendBar, { width: `${(month.income / trendMax) * 100}%`, backgroundColor: COLORS.emerald }]} />
                      <View style={[styles.trendBar, { width: `${(month.expense / trendMax) * 100}%`, backgroundColor: COLORS.rose }]} />
                    </View>
                    <Text style={styles.trendNet}>{formatCurrency(month.income - month.expense)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* TAB 5: ZAMAN (Chronological Stream Breakdown) */}
      {isPro && activeSubTab === 'zaman' && (
        <View style={styles.zamanWrap}>
          <Text style={styles.sectionTitle}>{currentMonthName} İşlem Akışı</Text>
          {monthlyTransactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={36} color={COLORS.subtleText} />
              <Text style={styles.emptyText}>{localizeFormat('{0} döneminde kaydedilmiş işlem yok.', [currentMonthName])}</Text>
            </View>
          ) : (
            monthlyTransactions.map((tx) => (
              <View key={tx.id} style={styles.zamanRow}>
                <View style={styles.zamanLeft}>
                  <View style={[styles.zamanDot, { backgroundColor: tx.type === 'income' ? COLORS.emerald : tx.type === 'transfer' ? COLORS.primary : COLORS.rose }]} />
                  <View>
                    <Text style={styles.zamanTitle}>{tx.title}</Text>
                    <Text style={styles.zamanSub}>{tx.category} · {formatShortDate(tx.date)}</Text>
                  </View>
                </View>
                <Text style={[styles.zamanAmount, { color: tx.type === 'income' ? COLORS.emeraldText : tx.type === 'transfer' ? COLORS.primary : COLORS.foreground }]}>
                  {tx.amount}
                </Text>
              </View>
            ))
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
    paddingHorizontal: 20,
    paddingBottom: 150,
  },

  // Sub Tabs
  subTabRow: {
    flexGrow: 0,
    marginBottom: 16,
  },
  subTabContent: {
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 2,
  },
  subTabChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: LIGHT_COLORS.card,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  subTabChipActive: {
    backgroundColor: LIGHT_COLORS.primaryLight,
    borderColor: LIGHT_COLORS.primary,
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: LIGHT_COLORS.mutedText,
  },
  subTabTextActive: {
    color: LIGHT_COLORS.primary,
    fontWeight: '700',
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
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },

  // Chart Card
  chartCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: LIGHT_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  chartCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
    textAlign: 'center',
    marginBottom: 16,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutLabel: {
    fontSize: 10,
    color: LIGHT_COLORS.mutedText,
    fontWeight: '600',
  },
  donutTotalText: {
    fontSize: 16,
    fontWeight: '800',
    color: LIGHT_COLORS.foreground,
    marginTop: 2,
  },

  categoryList: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: LIGHT_COLORS.cardBorder,
    paddingTop: 12,
  },
  emptyText: {
    fontSize: 12,
    color: LIGHT_COLORS.mutedText,
    textAlign: 'center',
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: LIGHT_COLORS.foreground,
  },
  catRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },
  catPercent: {
    fontSize: 11,
    color: LIGHT_COLORS.mutedText,
    width: 32,
    textAlign: 'right',
  },

  incomeCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  incomeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
    marginBottom: 8,
  },

  // Genel Tab Styles
  genelWrap: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  metricLabel: {
    fontSize: 11,
    color: LIGHT_COLORS.mutedText,
    fontWeight: '600',
  },
  metricBigValue: {
    fontSize: 30,
    fontWeight: '800',
    marginVertical: 6,
  },
  metricSubText: {
    fontSize: 12,
    color: LIGHT_COLORS.mutedText,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  halfLabel: {
    fontSize: 12,
    color: LIGHT_COLORS.mutedText,
    marginTop: 8,
  },
  halfValue: {
    fontSize: 18,
    fontWeight: '800',
    color: LIGHT_COLORS.foreground,
    marginTop: 2,
  },

  // Insight Tab Styles
  insightWrap: {
    gap: 12,
  },
  insightAlertCard: {
    backgroundColor: LIGHT_COLORS.amberBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  insightAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  insightAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: LIGHT_COLORS.amberText,
  },
  insightAlertBody: {
    fontSize: 13,
    color: LIGHT_COLORS.amberText,
    lineHeight: 18,
  },
  insightCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },
  insightBody: {
    fontSize: 13,
    color: LIGHT_COLORS.mutedText,
    lineHeight: 18,
  },

  // Trend Tab Styles
  trendWrap: {
    gap: 12,
  },
  trendList: {
    gap: 15,
  },
  trendLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 3,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 8,
  },
  legendText: {
    fontSize: 11,
    color: LIGHT_COLORS.mutedText,
    fontWeight: '600',
  },
  trendMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendMonthLabel: {
    width: 48,
    fontSize: 11,
    fontWeight: '700',
    color: LIGHT_COLORS.mutedText,
  },
  trendBars: {
    flex: 1,
    gap: 4,
  },
  trendBar: {
    height: 8,
    borderRadius: 4,
  },
  trendNet: {
    width: 90,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    marginTop: 16,
  },
  barCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 90,
  },
  barFill: {
    width: 44,
    borderRadius: 10,
    marginVertical: 8,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: LIGHT_COLORS.mutedText,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },

  // Zaman Tab Styles
  zamanWrap: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
    marginBottom: 8,
  },
  zamanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  zamanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zamanDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  zamanTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },
  zamanSub: {
    fontSize: 11,
    color: LIGHT_COLORS.mutedText,
    marginTop: 2,
  },
  zamanAmount: {
    fontSize: 13,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },

  // Pro Lock Gate Card
  proLockedCard: {
    backgroundColor: '#183B35',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#31584F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  proLockedCrownWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#285148',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#42695E',
  },
  proLockedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  proLockedBadgePill: {
    backgroundColor: '#285148',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 12,
  },
  proLockedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B9DED0',
    letterSpacing: 0.8,
  },
  proLockedDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  proLockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9F0E5',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    shadowColor: '#102923',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  proLockedBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
});
