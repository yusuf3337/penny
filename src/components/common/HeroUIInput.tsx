import React, { useState } from 'react';
import { View, TextInputProps, ViewStyle } from 'react-native';
import { Text, TextInput } from './LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

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
  label,
  description,
  errorMessage,
  startIcon,
  endIcon,
  prefix,
  wrapperClassName = '',
  inputContainerClassName = '',
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useTheme();

  return (
    <View className={`mb-4 ${wrapperClassName}`} style={containerStyle}>
      {label && (
        <Text className="text-[13px] font-semibold text-[#3B514C] dark:text-[#CCDCD2] mb-2 tracking-tight">
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center bg-white dark:bg-[#182521] rounded-[14px] px-3.5 h-[52px] border ${
          errorMessage
            ? 'border-rose-500 bg-rose-50 dark:bg-[#44252E]/50'
            : isFocused
            ? 'border-brand bg-white dark:bg-[#182521]'
            : 'border-[#E1E9E5] dark:border-[#2C4039]'
        } ${inputContainerClassName}`}
      >
        {startIcon && (
          <Ionicons
            name={startIcon}
            size={18}
            color={isFocused ? colors.primary : colors.subtleText}
            className="mr-2"
          />
        )}

        {prefix && (
          <Text className="text-base font-bold text-zinc-500 dark:text-[#A9BDB2] mr-1.5">
            {prefix}
          </Text>
        )}

        <TextInput
          placeholderTextColor={colors.subtleText}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className="flex-1 h-full text-[15px] font-medium text-[#182B29] dark:text-[#EAF2EE]"
          style={style}
          {...props}
        />

        {endIcon && (
          <Ionicons
            name={endIcon}
            size={18}
            color={isFocused ? colors.primary : colors.subtleText}
            className="ml-2"
          />
        )}
      </View>

      {errorMessage ? (
        <Text className="text-xs text-rose-500 font-semibold mt-1">
          {errorMessage}
        </Text>
      ) : description ? (
        <Text className="text-[11px] text-zinc-400 dark:text-[#82978B] mt-1">{description}</Text>
      ) : null}
    </View>
  );
};
