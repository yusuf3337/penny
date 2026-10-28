import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/common/LocalizedPrimitives';
import { TabType } from '../context/DataContext';
import { AppLanguage, useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';

const COPY: Record<AppLanguage, { title: string; subtitle: string; subscriptions: string; reports: string; debts: string; installments: string }> = {
  tr: { title: 'Diğer araçlar', subtitle: 'İhtiyacın olan bölümü seç.', subscriptions: 'Abonelikler', reports: 'Raporlar', debts: 'Borç ve alacak', installments: 'Taksitler' },
  en: { title: 'More tools', subtitle: 'Choose where you want to go.', subscriptions: 'Subscriptions', reports: 'Reports', debts: 'Debts and receivables', installments: 'Installments' },
  de: { title: 'Weitere Funktionen', subtitle: 'Wähle einen Bereich.', subscriptions: 'Abonnements', reports: 'Berichte', debts: 'Schulden und Forderungen', installments: 'Raten' },
  fr: { title: 'Autres outils', subtitle: 'Choisissez une rubrique.', subscriptions: 'Abonnements', reports: 'Rapports', debts: 'Dettes et créances', installments: 'Paiements échelonnés' },
  ko: { title: '더 많은 기능', subtitle: '원하는 메뉴를 선택하세요.', subscriptions: '구독', reports: '보고서', debts: '채무와 채권', installments: '할부' },
  zh: { title: '更多功能', subtitle: '选择需要的功能。', subscriptions: '订阅', reports: '报告', debts: '债务与应收款', installments: '分期付款' },
  ja: { title: 'その他の機能', subtitle: '項目を選択してください。', subscriptions: 'サブスクリプション', reports: 'レポート', debts: '債務と債権', installments: '分割払い' },
  ru: { title: 'Другие функции', subtitle: 'Выберите нужный раздел.', subscriptions: 'Подписки', reports: 'Отчёты', debts: 'Долги и задолженности', installments: 'Рассрочка' },
  it: { title: 'Altri strumenti', subtitle: 'Scegli una sezione.', subscriptions: 'Abbonamenti', reports: 'Report', debts: 'Debiti e crediti', installments: 'Rate' },
};

export const MoreScreen: React.FC<{ onNavigate: (tab: TabType) => void }> = ({ onNavigate }) => {
  const { language } = useLocale();
  const { colors } = useTheme();
  const copy = COPY[language];
  const items: { tab: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { tab: 'subscriptions', label: copy.subscriptions, icon: 'repeat-outline' },
    { tab: 'reports', label: copy.reports, icon: 'bar-chart-outline' },
    { tab: 'debts', label: copy.debts, icon: 'people-outline' },
    { tab: 'installments', label: copy.installments, icon: 'card-outline' },
  ];
  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 140 }}>
    <Text localize={false} style={{ color: colors.foreground, fontSize: 28, fontWeight: '800' }}>{copy.title}</Text>
    <Text localize={false} style={{ color: colors.mutedText, fontSize: 14, marginTop: 6, marginBottom: 24 }}>{copy.subtitle}</Text>
    {items.map(({ tab, label, icon }) => <TouchableOpacity key={tab} accessibilityRole="button" accessibilityLabel={label} onPress={() => onNavigate(tab)} style={{ backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ backgroundColor: colors.primaryLight, width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} color={colors.primary} size={21} /></View>
      <Text localize={false} style={{ flex: 1, color: colors.foreground, fontSize: 16, fontWeight: '700' }}>{label}</Text>
      <Ionicons name="chevron-forward" color={colors.mutedText} size={18} />
    </TouchableOpacity>)}
  </ScrollView>;
};
