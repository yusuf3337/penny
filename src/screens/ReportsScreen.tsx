import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Header } from '../components/common/Header';
import { COLORS } from '../constants/colors';
import { getStoredTransactions, getDebts } from '../services/storageService';
import { AppTransaction, Debt } from '../types';
import { formatCurrency } from '../utils/formatters';

export const ReportsScreen = () => {
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    Promise.all([getStoredTransactions(), getDebts()]).then(([txs, debtList]) => {
      setTransactions(txs);
      setDebts(debtList);
    });
  }, []);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.rawAmount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.rawAmount, 0);

  const totalBalance = totalIncome - totalExpense;

  const totalReceivables = debts
    .filter((d) => d.type === 'given' && !d.isCompleted)
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const totalPayables = debts
    .filter((d) => d.type === 'taken' && !d.isCompleted)
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  // Net Financial Worth = Cash Balance + Receivables - Payables
  const netWorth = totalBalance + totalReceivables - totalPayables;

  // Category Breakdown
  const categoryMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.rawAmount;
    });

  const categories = Object.keys(categoryMap).map((catName) => ({
    name: catName,
    amount: categoryMap[catName],
    percentage: totalExpense > 0 ? Math.round((categoryMap[catName] / totalExpense) * 100) : 0,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title="Raporlar" subtitle="Detaylı Finansal İstatistikler & Net Varlık" />

      {/* Net Worth Summary Card */}
      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>TOPLAM NET VARLIK (Bakiye + Alacak - Borç)</Text>
        <Text
          style={[
            styles.netAmount,
            { color: netWorth >= 0 ? COLORS.incomeText : COLORS.expenseText },
          ]}
        >
          {formatCurrency(netWorth)}
        </Text>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Mevcut Nakit Bakiye</Text>
            <Text style={styles.incomeText}>{formatCurrency(totalBalance)}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Toplam Alacak</Text>
            <Text style={styles.incomeText}>+{formatCurrency(totalReceivables)}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Toplam Borç</Text>
            <Text style={styles.expenseText}>-{formatCurrency(totalPayables)}</Text>
          </View>
        </View>
      </View>

      {/* Income vs Expense Card */}
      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>GELİR VE GİDER DENGESİ</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Toplam Gelir</Text>
            <Text style={styles.incomeText}>+{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Toplam Gider</Text>
            <Text style={styles.expenseText}>-{formatCurrency(totalExpense)}</Text>
          </View>
        </View>
      </View>

      {/* Category Breakdown Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kategori Bazlı Gider Dağılımı</Text>

        {categories.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Henüz kaydedilmiş gider bulunmuyor.</Text>
          </View>
        ) : (
          categories.map((item) => (
            <View key={item.name} style={styles.catCard}>
              <View style={styles.catHeader}>
                <Text style={styles.catName}>{item.name}</Text>
                <Text style={styles.catAmount}>
                  {formatCurrency(item.amount)} ({item.percentage}%)
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${Math.max(item.percentage, 5)}%` }]} />
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 100,
  },
  overviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mutedText,
    letterSpacing: 1.2,
  },
  netAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 14,
    marginTop: 10,
    gap: 12,
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginBottom: 4,
  },
  incomeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.incomeText,
  },
  expenseText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.expenseText,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyText: {
    color: COLORS.mutedText,
    fontSize: 14,
  },
  catCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  catAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  track: {
    height: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
});
