import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface SummaryCardsRowProps {
  incomeAmount: string;
  incomeChange: string;
  expenseAmount: string;
  expenseChange: string;
}

export const SummaryCardsRow: React.FC<SummaryCardsRowProps> = ({
  incomeAmount,
  incomeChange,
  expenseAmount,
  expenseChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Ionicons name="arrow-down-outline" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.cardTitle}>Bu ay gelir</Text>
        <Text style={styles.cardAmount}>{incomeAmount}</Text>
        <Text style={styles.cardChange}>{incomeChange}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Ionicons name="arrow-up-outline" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.cardTitle}>Bu ay gider</Text>
        <Text style={styles.cardAmount}>{expenseAmount}</Text>
        <Text style={styles.cardChange}>{expenseChange}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginTop: 4,
  },
  cardChange: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 6,
  },
});
