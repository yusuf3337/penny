import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';

interface SummaryCardProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  totalBalance,
  totalIncome,
  totalExpense,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Toplam Varlık</Text>
      <Text style={styles.balance}>{formatCurrency(totalBalance)}</Text>
      
      <View style={styles.divider} />
      
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.subLabel}>Gelir</Text>
          <Text style={styles.incomeText}>+{formatCurrency(totalIncome)}</Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.item}>
          <Text style={styles.subLabel}>Gider</Text>
          <Text style={styles.expenseText}>-{formatCurrency(totalExpense)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '500',
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
  },
  subLabel: {
    color: '#E0E7FF',
    fontSize: 12,
    marginBottom: 4,
  },
  incomeText: {
    color: '#34D399',
    fontSize: 16,
    fontWeight: '600',
  },
  expenseText: {
    color: '#F87171',
    fontSize: 16,
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
});
