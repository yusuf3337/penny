import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from './LocalizedPrimitives';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { TabType } from '../../context/DataContext';
import { AppLanguage, useLocale } from '../../context/LocaleContext';

const NAV_LABELS: Record<AppLanguage, Record<TabType | 'add', string>> = {
  tr: { timeline: 'Akış', goals: 'Hedef', subscriptions: 'Abone', budget: 'Bütçe', reports: 'Rapor', debts: 'Borç', add: 'Ekle' },
  en: { timeline: 'Feed', goals: 'Goals', subscriptions: 'Plans', budget: 'Budget', reports: 'Reports', debts: 'Debts', add: 'Add' },
  de: { timeline: 'Verlauf', goals: 'Ziele', subscriptions: 'Abos', budget: 'Budget', reports: 'Berichte', debts: 'Schulden', add: 'Neu' },
  fr: { timeline: 'Flux', goals: 'Objectifs', subscriptions: 'Abos', budget: 'Budget', reports: 'Rapports', debts: 'Dettes', add: 'Ajout' },
  ko: { timeline: '내역', goals: '목표', subscriptions: '구독', budget: '예산', reports: '보고서', debts: '빚', add: '추가' },
  zh: { timeline: '记录', goals: '目标', subscriptions: '订阅', budget: '预算', reports: '报告', debts: '债务', add: '添加' },
  ja: { timeline: '履歴', goals: '目標', subscriptions: '定期購入', budget: '予算', reports: 'レポート', debts: '借入', add: '追加' },
  ru: { timeline: 'Лента', goals: 'Цели', subscriptions: 'Подписки', budget: 'Бюджет', reports: 'Отчёты', debts: 'Долги', add: 'Новое' },
  it: { timeline: 'Flusso', goals: 'Obiettivi', subscriptions: 'Abbon.', budget: 'Budget', reports: 'Report', debts: 'Debiti', add: 'Nuovo' },
};

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
  const { colors } = useTheme();
  const { language, t } = useLocale();
  const bottomInset = Math.max(insets.bottom, 8);

  const tabs: { id: TabType; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'timeline', label: 'Zaman Tüneli', icon: 'time-outline', activeIcon: 'time' },
    { id: 'goals', label: 'Hedefler', icon: 'flag-outline', activeIcon: 'flag' },
    { id: 'subscriptions', label: 'Abonelikler', icon: 'repeat-outline', activeIcon: 'repeat' },
    { id: 'budget', label: 'Bütçe', icon: 'pie-chart-outline', activeIcon: 'pie-chart' },
    { id: 'reports', label: 'Rapor', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
    { id: 'debts', label: 'Borç & Alacak', icon: 'people-outline', activeIcon: 'people' },
  ];

  const handleTabPress = (tabId: TabType) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onTabChange(tabId);
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-[#FBFCFA] dark:bg-[#0F1816] border-t border-[#E1E9E5] dark:border-[#2C4039]"
      style={{ paddingBottom: bottomInset + 4 }}
    >
      <View className="flex-row items-center justify-around px-2 pt-2.5">
        {/* Navigation Tabs (Circular Icon Buttons) */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              className="items-center justify-center px-0.5"
              style={{ flex: 1, minWidth: 0 }}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
              accessibilityLabel={t(tab.label)}
            >
              <View
                className={`w-10 h-9 rounded-xl items-center justify-center ${
                  isActive
                    ? 'bg-[#E3F2EC] dark:bg-[#203E35]'
                    : 'bg-transparent'
                }`}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={19}
                  color={isActive ? colors.primary : colors.mutedText}
                />
              </View>
              <Text
                localize={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{ width: '100%', textAlign: 'center' }}
                className={`text-[10px] mt-1 tracking-tight ${
                  isActive ? 'font-semibold text-[#137C70] dark:text-[#66C9AE]' : 'font-medium text-[#778A83] dark:text-[#A9BDB2]'
                }`}
              >
                {NAV_LABELS[language][tab.id]}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Separator Line */}
        <View className="w-[1px] h-7 bg-[#E1E9E5] dark:bg-[#2C4039] mx-0.5" />

        {/* Far-Right Action Button: "İşlem Ekle" (Circular Action Button) */}
        <TouchableOpacity
          className="items-center justify-center px-0.5"
          style={{ flex: 1, minWidth: 0 }}
          onPress={onAddPress}
          activeOpacity={0.8}
          accessibilityLabel={t('Ekle')}
        >
          <View className="w-10 h-9 rounded-xl bg-[#137C70] items-center justify-center active:bg-[#0D635A]">
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </View>
          <Text localize={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ width: '100%', textAlign: 'center' }} className="text-[10px] font-semibold text-[#137C70] dark:text-[#66C9AE] mt-1 tracking-tight">
            {NAV_LABELS[language].add}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
