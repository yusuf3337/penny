import React from 'react';
import { ActivityIndicator, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'heroui-native/button';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'flat' | 'bordered' | 'ghost';
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

const nativeVariant: Record<ButtonVariant, React.ComponentProps<typeof Button>['variant']> = {
  primary: 'primary', secondary: 'secondary', success: 'primary', danger: 'danger',
  flat: 'tertiary', bordered: 'outline', ghost: 'ghost',
};

export const HeroUIButton: React.FC<HeroUIButtonProps> = ({
  onPress, children, variant = 'primary', size = 'md', icon, iconPosition = 'left',
  isLoading = false, disabled = false, fullWidth = true, className = '', style, textStyle,
}) => {
  const { colors } = useTheme();
  const { t } = useLocale();
  const label = typeof children === 'string' ? t(children) : children;
  const iconColor = variant === 'primary' ? colors.primaryForeground
    : variant === 'success' || variant === 'danger' ? '#FFFFFF'
    : variant === 'flat' || variant === 'ghost' ? colors.primary : colors.foreground;
  const tone = variant === 'success' ? 'bg-emerald-600'
    : variant === 'primary' ? 'bg-brand'
    : variant === 'flat' ? 'bg-brand-soft'
    : variant === 'bordered' ? 'border border-[#DAE3F4] dark:border-[#3E5280]'
    : '';

  return <Button
    variant={nativeVariant[variant]}
    feedbackVariant="scale"
    size={size}
    onPress={onPress}
    isDisabled={disabled || isLoading}
    className={`${fullWidth ? 'w-full' : 'self-start'} rounded-2xl ${tone} ${className}`}
    style={style}
    accessibilityLabel={typeof label === 'string' ? label : undefined}
  >
    {isLoading ? <ActivityIndicator size="small" color={iconColor} /> : <>
      {icon && iconPosition === 'left' && <Ionicons name={icon} size={size === 'lg' ? 20 : size === 'sm' ? 15 : 18} color={iconColor} />}
      <Button.Label className="font-semibold tracking-tight" style={[variant === 'primary' && { color: colors.primaryForeground }, textStyle]}>{label}</Button.Label>
      {icon && iconPosition === 'right' && <Ionicons name={icon} size={size === 'lg' ? 20 : size === 'sm' ? 15 : 18} color={iconColor} />}
    </>}
  </Button>;
};
