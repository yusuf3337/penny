import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { Card } from 'heroui-native/card';
import { CloseButton } from 'heroui-native/close-button';
import { useTheme } from '../../context/ThemeContext';
import { localize } from '../../context/LocaleContext';
import { Text } from './LocalizedPrimitives';

interface HeroUIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
  title: string;
  subtitle?: string;
  badge?: { text: string; color?: string; bg?: string };
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
}

export const HeroUIModal: React.FC<HeroUIModalProps> = ({
  isOpen, onClose, onDismiss, dismissible = true, title, subtitle, badge,
  children, footer, scrollable = true,
}) => {
  const { colors } = useTheme();
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={() => { if (dismissible) onClose(); }}
      onDismiss={onDismiss}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-[#080F23]/65" onPress={() => { if (dismissible) onClose(); }} accessibilityLabel={localize('Pencereyi kapat')} />
        <Card
          className="max-h-[90%] rounded-t-[30px] rounded-b-none p-0 overflow-hidden"
          style={{ backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.cardBorder }}
        >
          <View className="items-center pt-3 pb-1"><View className="h-1 w-10 rounded-full" style={{ backgroundColor: colors.cardBorderHover }} /></View>
          <Card.Header className="flex-row items-start justify-between px-6 pt-3 pb-4">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center flex-wrap gap-2">
                <Text className="text-[22px] font-bold tracking-tight" style={{ color: colors.foreground }}>{title}</Text>
                {badge && <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: badge.bg || colors.primaryLight }}>
                  <Text className="text-[10px] font-bold tracking-wide" style={{ color: badge.color || colors.primary }}>{badge.text}</Text>
                </View>}
              </View>
              {subtitle && <Text className="text-[13px] leading-[19px] mt-1" style={{ color: colors.mutedText }}>{subtitle}</Text>}
            </View>
            {dismissible && <CloseButton onPress={onClose} accessibilityLabel={localize('Pencereyi kapat')} className="rounded-xl" />}
          </Card.Header>
          <View className="h-px" style={{ backgroundColor: colors.cardBorder }} />
          {scrollable ? <ScrollView
            className="shrink"
            contentContainerClassName="px-6 pt-4 pb-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >{children}</ScrollView> : <View className="px-6 pt-4 pb-5">{children}</View>}
          {footer && <Card.Footer className="px-6 pt-4 pb-6" style={{ borderTopWidth: 1, borderTopColor: colors.cardBorder, backgroundColor: colors.card }}>
            {footer}
          </Card.Footer>}
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
};
