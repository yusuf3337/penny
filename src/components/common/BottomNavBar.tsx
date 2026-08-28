import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TabType } from '../../context/DataContext';

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
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  const tabs: { id: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'timeline', label: 'Akış', icon: 'time-outline' },
    { id: 'goals', label: 'Hedefler', icon: 'flag-outline' },
    { id: 'subscriptions', label: 'Abonelik', icon: 'repeat-outline' },
    { id: 'budget', label: 'Bütçe', icon: 'pie-chart-outline' },
    { id: 'reports', label: 'Raporlar', icon: 'bar-chart-outline' },
    { id: 'debts', label: 'Borçlar', icon: 'people-outline' },
  ];

  const getFabConfig = (): { label: string; icon: keyof typeof Ionicons.glyphMap } => {
    switch (activeTab) {
      case 'goals':
        return { label: 'Hedef Ekle', icon: 'flag' };
      case 'subscriptions':
        return { label: 'Abonelik Ekle', icon: 'repeat' };
      case 'budget':
        return { label: 'Bütçe Belirle', icon: 'pie-chart' };
      case 'debts':
        return { label: 'Borç/Alacak Ekle', icon: 'people' };
      default:
        return { label: 'İşlem Ekle', icon: 'add' };
    }
  };

  const fabConfig = getFabConfig();

  return (
    <View style={styles.wrapper}>
      {/* Floating Action Button - Dynamic Per Active Tab */}
      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: 50 + bottomInset },
        ]}
        activeOpacity={0.85}
        onPress={onAddPress}
      >
        <Ionicons name={fabConfig.icon} size={16} color={COLORS.primaryForeground} />
        <Text style={styles.fabText}>{fabConfig.label}</Text>
      </TouchableOpacity>

      {/* Bottom Navigation Bar */}
      <View style={[styles.navBar, { paddingBottom: bottomInset + 4 }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  isActive && styles.activeIconWrap,
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={isActive ? COLORS.primary : COLORS.mutedText}
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  { color: isActive ? COLORS.primary : COLORS.mutedText },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    gap: 6,
    zIndex: 10,
  },
  fabText: {
    color: COLORS.primaryForeground,
    fontSize: 13,
    fontWeight: '700',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconWrap: {
    padding: 4,
    borderRadius: 12,
  },
  activeIconWrap: {
    backgroundColor: COLORS.primaryLight,
  },
  navText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
