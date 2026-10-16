import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LIGHT_COLORS } from '../../constants/colors';
import { useThemedStyles } from '../../context/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightActionIcon?: keyof typeof Ionicons.glyphMap;
  onRightActionPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  rightActionIcon,
  onRightActionPress,
}) => {
  const styles = useThemedStyles(lightStyles);
  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>

      {rightActionIcon && onRightActionPress ? (
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={onRightActionPress}
        >
          <Ionicons name={rightActionIcon} size={21} color={COLORS.primaryForeground} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LIGHT_COLORS.background,
  },
  textWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 12,
    color: LIGHT_COLORS.mutedText,
    marginTop: 5,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: LIGHT_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 12,
  },
});
