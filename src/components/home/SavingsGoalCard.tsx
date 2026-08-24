import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SavingsGoal } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onEditPress: () => void;
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal, onEditPress }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.subLabel}>TASARRUF HEDEFİ</Text>
      <Text style={styles.title}>Biriktirmeye devam et.</Text>

      <Text style={styles.amountText}>
        {formatCurrency(goal.savedAmount)}
        <Text style={styles.targetText}> / {formatCurrency(goal.targetAmount)}</Text>
      </Text>

      <View style={styles.track}>
        <View style={[styles.bar, { width: `${goal.percentage}%` }]} />
      </View>

      <Text style={styles.infoText}>
        Hedefine ulaşmak için {formatCurrency(goal.remainingAmount)} kaldı.
      </Text>

      <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={onEditPress}>
        <Text style={styles.buttonText}>Hedefi düzenle</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.accent,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.accentForeground,
    letterSpacing: 1.2,
    opacity: 0.7,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accentForeground,
    marginTop: 4,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.accentForeground,
    marginTop: 20,
  },
  targetText: {
    fontSize: 16,
    fontWeight: 'normal',
    opacity: 0.7,
  },
  track: {
    height: 8,
    backgroundColor: 'rgba(120, 53, 15, 0.15)',
    borderRadius: 4,
    marginTop: 14,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: COLORS.accentForeground,
    borderRadius: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.accentForeground,
    opacity: 0.8,
    marginTop: 12,
  },
  button: {
    backgroundColor: COLORS.accentForeground,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  buttonText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
