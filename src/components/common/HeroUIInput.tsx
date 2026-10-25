import React, { useState } from 'react';
import { View, TextInputProps, ViewStyle } from 'react-native';
import { Input } from 'heroui-native/input';
import { Text } from './LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LocaleContext';

interface HeroUIInputProps extends TextInputProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  startIcon?: keyof typeof Ionicons.glyphMap;
  endIcon?: keyof typeof Ionicons.glyphMap;
  prefix?: string;
  wrapperClassName?: string;
  inputContainerClassName?: string;
  containerStyle?: ViewStyle;
}

export const HeroUIInput: React.FC<HeroUIInputProps> = ({
  label, description, errorMessage, startIcon, endIcon, prefix,
  wrapperClassName = '', inputContainerClassName = '', containerStyle, style,
  onFocus, onBlur, placeholder, accessibilityLabel, ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useTheme();
  const { t } = useLocale();
  const leading = !!startIcon || !!prefix;

  return <View className={`mb-4 ${wrapperClassName}`} style={containerStyle}>
    {label && <Text className="mb-2 text-[13px] font-semibold text-[#405578] dark:text-[#D5E0F8]">{label}</Text>}
    <View className="relative justify-center">
      <Input
        {...props}
        variant="secondary"
        isInvalid={!!errorMessage}
        placeholder={placeholder ? t(placeholder) : undefined}
        accessibilityLabel={accessibilityLabel ? t(accessibilityLabel) : label ? t(label) : undefined}
        placeholderTextColor={colors.subtleText}
        onFocus={(event) => { setIsFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setIsFocused(false); onBlur?.(event); }}
        className={`h-[52px] rounded-2xl border bg-white dark:bg-[#17213A] text-[#14203A] dark:text-[#F5F7FF] ${
          errorMessage ? 'border-rose-500' : isFocused ? 'border-brand' : 'border-[#DAE3F4] dark:border-[#3E5280]'
        } ${leading ? 'pl-11' : 'pl-4'} ${endIcon ? 'pr-11' : 'pr-4'} ${inputContainerClassName}`}
        style={style}
      />
      {startIcon && <Ionicons className="absolute left-4" name={startIcon} size={18} color={isFocused ? colors.primary : colors.subtleText} pointerEvents="none" />}
      {prefix && <Text className="absolute left-4 text-base font-bold text-zinc-500 dark:text-[#BAC8E6]" pointerEvents="none">{prefix}</Text>}
      {endIcon && <Ionicons className="absolute right-4" name={endIcon} size={18} color={isFocused ? colors.primary : colors.subtleText} pointerEvents="none" />}
    </View>
    {errorMessage ? <Text className="mt-1 text-xs font-semibold text-rose-500">{errorMessage}</Text>
      : description ? <Text className="mt-1 text-[11px] text-zinc-500 dark:text-[#BAC8E6]">{description}</Text> : null}
  </View>;
};
