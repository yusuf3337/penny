import React from 'react';
import { TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { Text } from './LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'flat'
  | 'bordered'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface HeroUIButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const HeroUIButton: React.FC<HeroUIButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  fullWidth = true,
  className = '',
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  // Variant Tailwind Classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return {
          container: 'bg-brand active:bg-brand',
          text: 'text-white',
          iconColor: '#FFFFFF',
          spinnerColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          container: 'bg-[#EEF2EF] dark:bg-[#22332D] active:bg-[#E1E9E5]',
          text: 'text-zinc-900 dark:text-[#EAF2EE]',
          iconColor: colors.foreground,
          spinnerColor: colors.foreground,
        };
      case 'success':
        return {
          container: 'bg-emerald-600 active:bg-emerald-700 shadow-sm shadow-emerald-500/20',
          text: 'text-white',
          iconColor: '#FFFFFF',
          spinnerColor: '#FFFFFF',
        };
      case 'danger':
        return {
          container: 'bg-rose-600 active:bg-rose-700 shadow-sm shadow-rose-500/20',
          text: 'text-white',
          iconColor: '#FFFFFF',
          spinnerColor: '#FFFFFF',
        };
      case 'flat':
        return {
          container: 'bg-brand-soft dark:bg-brand-soft active:bg-[#D1E9DE]',
          text: 'text-brand dark:text-brand',
          iconColor: colors.primary,
          spinnerColor: colors.primary,
        };
      case 'bordered':
        return {
          container: 'bg-transparent border border-zinc-200 dark:border-[#2C4039] active:bg-zinc-50',
          text: 'text-zinc-800 dark:text-[#D8E7DC]',
          iconColor: colors.foreground,
          spinnerColor: colors.foreground,
        };
      case 'ghost':
        return {
          container: 'bg-transparent active:bg-zinc-100',
          text: 'text-brand dark:text-brand',
          iconColor: colors.primary,
          spinnerColor: colors.primary,
        };
      default:
        return {
          container: 'bg-brand active:bg-brand',
          text: 'text-white',
          iconColor: '#FFFFFF',
          spinnerColor: '#FFFFFF',
        };
    }
  };

  // Size Tailwind Classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-9 px-3.5 rounded-xl gap-1.5',
          text: 'text-xs',
          iconSize: 15,
        };
      case 'lg':
        return {
          container: 'h-13 px-6 rounded-2xl gap-2.5',
          text: 'text-base',
          iconSize: 20,
        };
      case 'md':
      default:
        return {
          container: 'h-11 px-4 rounded-[14px] gap-2',
          text: 'text-sm',
          iconSize: 18,
        };
    }
  };

  const v = getVariantClasses();
  const s = getSizeClasses();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      className={`flex-row items-center justify-center ${s.container} ${v.container} ${
        fullWidth ? 'w-full' : 'self-start'
      } ${disabled ? 'opacity-40' : ''} ${className}`}
      style={style}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={v.spinnerColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={s.iconSize} color={v.iconColor} />
          )}

          <Text
            className={`font-semibold tracking-tight text-center ${v.text} ${s.text}`}
            style={textStyle}
          >
            {children}
          </Text>

          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={s.iconSize} color={v.iconColor} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};
