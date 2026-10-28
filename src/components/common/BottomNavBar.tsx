import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from './LocalizedPrimitives';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { TabType } from '../../context/DataContext';
import { AppLanguage, useLocale } from '../../context/LocaleContext';
import { Tabs } from 'heroui-native/tabs';

const NAV_LABELS: Record<AppLanguage, Record<TabType | 'add', string>> = {
  tr: { timeline: 'Akış', goals: 'Hedef', subscriptions: 'Abone', budget: 'Bütçe', reports: 'Rapor', debts: 'Borç', installments: 'Taksit', more: 'Diğer', add: 'Ekle' },
  en: { timeline: 'Feed', goals: 'Goals', subscriptions: 'Plans', budget: 'Budget', reports: 'Reports', debts: 'Debts', installments: 'Payments', more: 'More', add: 'Add' },
  de: { timeline: 'Verlauf', goals: 'Ziele', subscriptions: 'Abos', budget: 'Budget', reports: 'Berichte', debts: 'Schulden', installments: 'Raten', more: 'Mehr', add: 'Neu' },
  fr: { timeline: 'Flux', goals: 'Objectifs', subscriptions: 'Abos', budget: 'Budget', reports: 'Rapports', debts: 'Dettes', installments: 'Échéances', more: 'Plus', add: 'Ajout' },
  ko: { timeline: '내역', goals: '목표', subscriptions: '구독', budget: '예산', reports: '보고서', debts: '빚', installments: '할부', more: '더보기', add: '추가' },
  zh: { timeline: '记录', goals: '目标', subscriptions: '订阅', budget: '预算', reports: '报告', debts: '债务', installments: '分期', more: '更多', add: '添加' },
  ja: { timeline: '履歴', goals: '目標', subscriptions: '定期購入', budget: '予算', reports: 'レポート', debts: '借入', installments: '分割', more: 'その他', add: '追加' },
  ru: { timeline: 'Лента', goals: 'Цели', subscriptions: 'Подписки', budget: 'Бюджет', reports: 'Отчёты', debts: 'Долги', installments: 'Рассрочка', more: 'Ещё', add: 'Новое' },
  it: { timeline: 'Flusso', goals: 'Obiettivi', subscriptions: 'Abbon.', budget: 'Budget', reports: 'Report', debts: 'Debiti', installments: 'Rate', more: 'Altro', add: 'Nuovo' },
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
    { id: 'budget', label: 'Bütçe', icon: 'pie-chart-outline', activeIcon: 'pie-chart' },
    { id: 'more', label: 'Diğer', icon: 'grid-outline', activeIcon: 'grid' },
  ];

  const handleTabPress = (tabId: string) => {
    if (tabId === activeTab) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onTabChange(tabId as TabType);
  };
  const selectedTab = ['subscriptions', 'reports', 'debts', 'installments'].includes(activeTab) ? 'more' : activeTab;

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-[#F6F8FF] dark:bg-[#0B1020] border-t border-[#DAE3F4] dark:border-[#2B3A5D]"
      style={{ paddingBottom: bottomInset + 4 }}
    >
      <View className="flex-row items-center px-2 pt-2.5">
        <Tabs value={selectedTab} onValueChange={handleTabPress} variant="primary" className="min-w-0 flex-1 gap-0">
          <Tabs.List background={null} className="w-full gap-0 bg-transparent p-0">
            <Tabs.Indicator
              className="rounded-2xl bg-brand-soft shadow-none dark:bg-brand-soft"
              animation={{
                width: { type: 'spring', config: { stiffness: 260, damping: 28 } },
                height: { type: 'spring', config: { stiffness: 260, damping: 28 } },
                translateX: { type: 'spring', config: { stiffness: 260, damping: 28 } },
              }}
            />
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className="h-[58px] min-w-0 flex-1 flex-col gap-0 rounded-2xl px-0.5 py-1"
                accessibilityLabel={t(tab.label)}
              >
                {({ isSelected }) => <>
                  <View className="h-9 items-center justify-center">
                    <Ionicons name={isSelected ? tab.activeIcon : tab.icon} size={19} color={isSelected ? colors.primary : colors.mutedText} />
                  </View>
                  <Tabs.Label
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    className={`w-full text-center text-[10px] leading-4 tracking-tight ${isSelected ? 'font-semibold text-brand' : 'font-medium text-[#667895] dark:text-[#BAC8E6]'}`}
                  >
                    {NAV_LABELS[language][tab.id]}
                  </Tabs.Label>
                </>}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs>

        {/* Separator Line */}
        <View className="w-[1px] h-7 bg-[#DAE3F4] dark:bg-[#2B3A5D] mx-0.5" />

        {/* Far-Right Action Button: "İşlem Ekle" (Circular Action Button) */}
        <TouchableOpacity
          className="items-center justify-center px-0.5"
          style={{ flex: 0.25, minWidth: 64 }}
          onPress={onAddPress}
          activeOpacity={0.8}
          accessibilityLabel={t('Ekle')}
        >
          <View className="w-10 h-9 rounded-xl bg-brand items-center justify-center active:bg-brand">
            <Ionicons name="add" size={22} color={colors.primaryForeground} />
          </View>
          <Text localize={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ width: '100%', textAlign: 'center' }} className="text-[10px] font-semibold text-brand dark:text-brand mt-1 tracking-tight">
            {NAV_LABELS[language].add}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
