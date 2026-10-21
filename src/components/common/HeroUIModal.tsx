import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Animated, Easing } from 'react-native';
import { Text } from './LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface HeroUIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    color?: string;
    bg?: string;
  };
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
}

export const HeroUIModal: React.FC<HeroUIModalProps> = ({
  isOpen,
  onClose,
  onDismiss,
  dismissible = true,
  title,
  subtitle,
  badge,
  children,
  footer,
  scrollable = true,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(isOpen);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      // Soft fade-in for backdrop (NO SLIDING FROM BOTTOM)
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Smooth slide-up for sheet card
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      handleCloseAnimation();
    }
  }, [isOpen]);

  const handleCloseAnimation = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: 400,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
    });
  };

  const handleDismiss = () => {
    if (!dismissible) return;
    handleCloseAnimation();
    setTimeout(onClose, 200);
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      onDismiss={onDismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        {/* Soft static backdrop fade - doesn't slide from bottom */}
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <Animated.View
            className="absolute inset-0 bg-[#102923]/60"
            style={{ opacity: backdropAnim }}
          />
        </TouchableWithoutFeedback>

        {/* HeroUI Bottom Sheet Card - slides smoothly */}
        <Animated.View
          className="bg-[#FAFBF9] dark:bg-[#182521] rounded-t-[28px] max-h-[88%] pb-6 border-t border-white dark:border-[#2C4039] shadow-2xl"
          style={{ transform: [{ translateY: sheetAnim }] }}
        >
          {/* HeroUI Drag Handle Indicator */}
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-[#B8C9C0] dark:bg-[#4C665B]" />
          </View>

          {/* HeroUI Header */}
          <View className="flex-row items-start justify-between px-6 pt-1 pb-3.5">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center gap-2 flex-wrap">
                <Text className="text-[22px] font-bold text-[#182B29] dark:text-[#EAF2EE] tracking-tight">
                  {title}
                </Text>
                {badge && (
                  <View
                    className="px-2 py-0.5 rounded-[10px]"
                    style={{ backgroundColor: colors.primaryLight }}
                  >
                    <Text
                      className="text-[11px] font-bold"
                      style={{ color: colors.primary }}
                    >
                      {badge.text}
                    </Text>
                  </View>
                )}
              </View>
              {subtitle && (
                <Text className="text-[13px] text-[#667A73] dark:text-[#A9BDB2] mt-1 leading-snug">
                  {subtitle}
                </Text>
              )}
            </View>

            {/* Circular HeroUI Close Button */}
            {dismissible && <TouchableOpacity
              className="w-9 h-9 rounded-xl bg-[#EEF2EF] dark:bg-[#22332D] items-center justify-center active:bg-[#E1E9E5]"
              onPress={handleDismiss}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color="#667A73" />
            </TouchableOpacity>}
          </View>

          {/* HeroUI Divider */}
          <View className="h-[1px] bg-[#E1E9E5] dark:bg-[#2C4039]" />

          {/* Body Content */}
          {scrollable ? (
            <ScrollView
              className="shrink"
              contentContainerClassName="px-6 pt-4 pb-3"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View className="px-6 pt-4 pb-3">{children}</View>
          )}

          {/* Optional Footer */}
          {footer && (
            <View className="bg-white dark:bg-[#182521]">
              <View className="h-[1px] bg-[#E1E9E5] dark:bg-[#2C4039]" />
              <View className="px-6 pt-3.5 pb-2">{footer}</View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
