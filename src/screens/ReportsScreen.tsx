import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/common/Header';
import { useData } from '../context/DataContext';
import { COLORS } from '../constants/colors';
import { formatCurrency, formatShortDate } from '../utils/formatters';

interface ReportsScreenProps {
  onOpenAddModal: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onOpenAddModal }) => {
  const {
    transactions,
    totalIncome,
    totalExpense,
    totalBalance,
    subscriptions,
    totalMonthlySubscriptions,
    budgets,
    totalBudgetedSpending,
    totalUsedSpending,
    goals,
    totalSavedGoals,
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'kategori' | 'genel' | 'icgoru' | 'trend' | 'zaman'>('kategori');

  // Category breakdown for Expense
  const categoryMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + (t.rawAmount || 0);
    });

  const categoryColors: { [key: string]: string } = {
    Teknoloji: '#3B82F6',
    Ev: '#F59E0B',
    Yemek: '#EF4444',
    Faturalar: '#6366F1',
    Sağlık: '#10B981',
    Eğitim: '#8B5CF6',
    Ulaşım: '#06B6D4',
    Eğlence: '#EC4899',
  };

  const categories = Object.keys(categoryMap).map((catName) => {
    const rawAmount = categoryMap[catName];
    const percentage = totalExpense > 0 ? Math.round((rawAmount / totalExpense) * 100) : 0;
    return {
      name: catName,
      rawAmount,
      percentage,
      color: categoryColors[catName] || COLORS.primary,
    };
  });

  // Top spending category for insights
  const topExpenseCategory = categories.length > 0
    ? [...categories].sort((a, b) => b.rawAmount - a.rawAmount)[0]
    : null;

  // SVG Donut Chart Calculation
  const size = 180;
  const strokeWidth = 24;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  // Savings Rate %
  const savingsRate = totalIncome > 0
    ? Math.max(Math.round(((totalIncome - totalExpense) / totalIncome) * 100), 0)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header
        title="Rapor"
        subtitle="Hangi kategori seni yiyor?"
        rightActionIcon="add"
        onRightActionPress={onOpenAddModal}
      />

      {/* Sub Navigation Tabs */}
      <View style={styles.subTabRow}>
        {[
          { id: 'genel', label: 'Genel' },
          { id: 'icgoru', label: 'İçgörüler' },
          { id: 'kategori', label: 'Kategori' },
          { id: 'trend', label: 'Trend' },
          { id: 'zaman', label: 'Zaman' },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.subTabChip, isActive && styles.subTabChipActive]}
              onPress={() => setActiveSubTab(tab.id as any)}
            >
              <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelectorRow}>
        <TouchableOpacity style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={16} color={COLORS.foreground} />
        </TouchableOpacity>
        <Text style={styles.monthTitleText}>Ağustos 2026</Text>
        <TouchableOpacity style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={16} color={COLORS.foreground} />
        </TouchableOpacity>
      </View>

      {/* TAB 1: KATEGORİ (Donut Chart & Breakdown) */}
      {activeSubTab === 'kategori' && (
        <>
          <View style={styles.chartCard}>
            <Text style={styles.chartCardTitle}>Ağustos 2026 - Gider Kırılımı</Text>

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
                <Text style={styles.donutLabel}>Toplam</Text>
                <Text style={styles.donutTotalText}>{formatCurrency(totalExpense)}</Text>
              </View>
            </View>

            <View style={styles.categoryList}>
              {categories.length === 0 ? (
                <Text style={styles.emptyText}>Henüz kaydedilmiş gider yok.</Text>
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

          <View style={styles.incomeCard}>
            <Text style={styles.incomeCardTitle}>Ağustos 2026 - Gelir Kırılımı</Text>
            <View style={styles.catRow}>
              <View style={styles.catLeft}>
                <View style={[styles.colorDot, { backgroundColor: COLORS.emerald }]} />
                <Text style={styles.catName}>Maaş / Hakediş</Text>
              </View>
              <View style={styles.catRight}>
                <Text style={styles.catAmount}>{formatCurrency(totalIncome)}</Text>
                <Text style={styles.catPercent}>%100</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* TAB 2: GENEL (Financial Health Overview) */}
      {activeSubTab === 'genel' && (
        <View style={styles.genelWrap}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>NET FİNANSAL BAKİYE</Text>
            <Text
              style={[
                styles.metricBigValue,
                { color: totalBalance >= 0 ? COLORS.emeraldText : COLORS.roseText },
              ]}
            >
              {formatCurrency(totalBalance)}
            </Text>
            <Text style={styles.metricSubText}>
              Gelir: {formatCurrency(totalIncome)} · Gider: {formatCurrency(totalExpense)}
            </Text>
          </View>

          <View style={styles.rowTwo}>
            <View style={styles.halfCard}>
              <Ionicons name="pie-chart-outline" size={24} color={COLORS.primary} />
              <Text style={styles.halfLabel}>Tasarruf Oranı</Text>
              <Text style={styles.halfValue}>%{savingsRate}</Text>
            </View>

            <View style={styles.halfCard}>
              <Ionicons name="repeat-outline" size={24} color={COLORS.indigoText} />
              <Text style={styles.halfLabel}>Aylık Abonelik</Text>
              <Text style={styles.halfValue}>{formatCurrency(totalMonthlySubscriptions)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* TAB 3: İÇGÖRÜLER (Smart Financial Insights) */}
      {activeSubTab === 'icgoru' && (
        <View style={styles.insightWrap}>
          {topExpenseCategory ? (
            <View style={styles.insightAlertCard}>
              <View style={styles.insightAlertHeader}>
                <Ionicons name="warning-outline" size={20} color={COLORS.amberText} />
                <Text style={styles.insightAlertTitle}>En Yüksek Harcama Kategorisi</Text>
              </View>
              <Text style={styles.insightAlertBody}>
                Bu ay harcamalarınızın en büyük kısmını %{topExpenseCategory.percentage} oranıyla{' '}
                <Text style={{ fontWeight: 'bold' }}>{topExpenseCategory.name}</Text> (
                {formatCurrency(topExpenseCategory.rawAmount)}) oluşturuyor.
              </Text>
            </View>
          ) : null}

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
              <Text style={styles.insightTitle}>Abonelik & Sabit Gider Yükü</Text>
            </View>
            <Text style={styles.insightBody}>
              Aktif {subscriptions.length} aboneliğiniz için ayda ortalama{' '}
              <Text style={{ fontWeight: 'bold' }}>{formatCurrency(totalMonthlySubscriptions)}</Text>{' '}
              ödüyorsunuz. Bu yıllık <Text style={{ fontWeight: 'bold' }}>{formatCurrency(totalMonthlySubscriptions * 12)}</Text> yapıyor.
            </Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="flag-outline" size={18} color={COLORS.emeraldText} />
              <Text style={styles.insightTitle}>Tasarruf Hedefleri Durumu</Text>
            </View>
            <Text style={styles.insightBody}>
              Toplam biriken hedef tutarınız:{' '}
              <Text style={{ fontWeight: 'bold' }}>{formatCurrency(totalSavedGoals)}</Text>.
              {goals.length === 0 ? ' Henüz bir hedef tanımlamadınız.' : ` ${goals.length} aktif hedefiniz takip ediliyor.`}
            </Text>
          </View>
        </View>
      )}

      {/* TAB 4: TREND (Income vs Expense Trend) */}
      {activeSubTab === 'trend' && (
        <View style={styles.trendWrap}>
          <View style={styles.chartCard}>
            <Text style={styles.chartCardTitle}>Gelir / Gider Karşılaştırması</Text>
            <View style={styles.barRow}>
              <View style={styles.barCol}>
                <Text style={styles.barLabel}>Gelir</Text>
                <View style={[styles.barFill, { height: totalIncome > 0 ? 120 : 10, backgroundColor: COLORS.emerald }]} />
                <Text style={styles.barValue}>{formatCurrency(totalIncome)}</Text>
              </View>

              <View style={styles.barCol}>
                <Text style={styles.barLabel}>Gider</Text>
                <View style={[styles.barFill, { height: totalExpense > 0 ? Math.min((totalExpense / (totalIncome || 1)) * 120, 140) : 10, backgroundColor: COLORS.rose }]} />
                <Text style={styles.barValue}>{formatCurrency(totalExpense)}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* TAB 5: ZAMAN (Chronological Stream Breakdown) */}
      {activeSubTab === 'zaman' && (
        <View style={styles.zamanWrap}>
          <Text style={styles.sectionTitle}>Son İşlemler Zaman Akışı</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={36} color={COLORS.subtleText} />
              <Text style={styles.emptyText}>Zaman tünelinde kaydedilmiş işlem yok.</Text>
            </View>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.zamanRow}>
                <View style={styles.zamanLeft}>
                  <View style={[styles.zamanDot, { backgroundColor: tx.type === 'income' ? COLORS.emerald : COLORS.rose }]} />
                  <View>
                    <Text style={styles.zamanTitle}>{tx.title}</Text>
                    <Text style={styles.zamanSub}>{tx.category} · {formatShortDate(tx.date)}</Text>
                  </View>
                </View>
                <Text style={[styles.zamanAmount, { color: tx.type === 'income' ? COLORS.emeraldText : COLORS.foreground }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },

  // Sub Tabs
  subTabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  subTabChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  subTabChipActive: {
    backgroundColor: COLORS.primary,
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  subTabTextActive: {
    color: '#FFF',
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
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  monthTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
  },

  // Chart Card
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  chartCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
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
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  donutTotalText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.foreground,
    marginTop: 2,
  },

  categoryList: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 12,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.mutedText,
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
    color: COLORS.foreground,
  },
  catRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  catPercent: {
    fontSize: 11,
    color: COLORS.mutedText,
    width: 32,
    textAlign: 'right',
  },

  incomeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  incomeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.foreground,
    marginBottom: 8,
  },

  // Genel Tab Styles
  genelWrap: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  metricBigValue: {
    fontSize: 30,
    fontWeight: '800',
    marginVertical: 6,
  },
  metricSubText: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  halfLabel: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: 8,
  },
  halfValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.foreground,
    marginTop: 2,
  },

  // Insight Tab Styles
  insightWrap: {
    gap: 12,
  },
  insightAlertCard: {
    backgroundColor: COLORS.amberBg,
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
    color: COLORS.amberText,
  },
  insightAlertBody: {
    fontSize: 13,
    color: COLORS.amberText,
    lineHeight: 18,
  },
  insightCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
    color: COLORS.foreground,
  },
  insightBody: {
    fontSize: 13,
    color: COLORS.mutedText,
    lineHeight: 18,
  },

  // Trend Tab Styles
  trendWrap: {
    gap: 12,
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
    color: COLORS.mutedText,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.foreground,
  },

  // Zaman Tab Styles
  zamanWrap: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.foreground,
    marginBottom: 8,
  },
  zamanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
    color: COLORS.foreground,
  },
  zamanSub: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  zamanAmount: {
    fontSize: 13,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
});
