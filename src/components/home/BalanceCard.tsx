import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface BalanceCardProps {
  totalBalance: string;
  fraction: string;
  changePercentage: string;
  isHidden: boolean;
  onToggleHide: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalance,
  fraction,
  changePercentage,
  isHidden,
  onToggleHide,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label}>TOPLAM BAKİYE</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onToggleHide} style={styles.eyeBtn}>
          <Ionicons
            name={isHidden ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="rgba(255,255,255,0.85)"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceContainer}>
        {isHidden ? (
          <Text style={styles.hiddenBalance}>••••••••</Text>
        ) : (
          <Text style={styles.mainBalance}>
            {totalBalance}
            <Text style={styles.fractionText}>{fraction}</Text>
          </Text>
        )}
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Ionicons name="arrow-up-outline" size={14} color="#FFFFFF" />
          <Text style={styles.badgeText}>{isHidden ? '•••' : changePercentage}</Text>
        </View>
        <Text style={styles.compareText}>geçen aya göre</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.2,
  },
  eyeBtn: {
    padding: 4,
  },
  balanceContainer: {
    marginTop: 20,
    marginBottom: 20,
    height: 48,
    justifyContent: 'center',
  },
  mainBalance: {
    fontSize: 38,
    fontWeight: 'bold',
    color: COLORS.primaryForeground,
  },
  fractionText: {
    fontSize: 24,
    fontWeight: '500',
    opacity: 0.6,
  },
  hiddenBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primaryForeground,
    letterSpacing: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  compareText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
});
