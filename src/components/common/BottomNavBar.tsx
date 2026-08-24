import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export type TabType = 'overview' | 'transactions' | 'debts' | 'reports';

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAddPress: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onAddPress,
}) => {
  return (
    <View style={styles.wrapper}>
      {/* Floating Add Transaction Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={onAddPress}>
        <Ionicons name="add" size={20} color={COLORS.primaryForeground} />
        <Text style={styles.fabText}>Yeni işlem</Text>
      </TouchableOpacity>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange('overview')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="grid-outline"
            size={20}
            color={activeTab === 'overview' ? COLORS.primary : COLORS.mutedText}
          />
          <Text
            style={[
              styles.navText,
              { color: activeTab === 'overview' ? COLORS.primary : COLORS.mutedText },
            ]}
          >
            Genel bakış
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange('transactions')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="wallet-outline"
            size={20}
            color={activeTab === 'transactions' ? COLORS.primary : COLORS.mutedText}
          />
          <Text
            style={[
              styles.navText,
              { color: activeTab === 'transactions' ? COLORS.primary : COLORS.mutedText },
            ]}
          >
            İşlemler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange('debts')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={activeTab === 'debts' ? COLORS.primary : COLORS.mutedText}
          />
          <Text
            style={[
              styles.navText,
              { color: activeTab === 'debts' ? COLORS.primary : COLORS.mutedText },
            ]}
          >
            Borç/Alacak
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange('reports')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeTab === 'reports' ? COLORS.primary : COLORS.mutedText}
          />
          <Text
            style={[
              styles.navText,
              { color: activeTab === 'reports' ? COLORS.primary : COLORS.mutedText },
            ]}
          >
            Raporlar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  fab: {
    position: 'absolute',
    bottom: 74,
    right: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    gap: 6,
  },
  fabText: {
    color: COLORS.primaryForeground,
    fontSize: 14,
    fontWeight: 'bold',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 10,
    paddingBottom: 24,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
  },
  navText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
