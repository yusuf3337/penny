import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

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
  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {rightActionIcon && onRightActionPress ? (
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={onRightActionPress}
        >
          <Ionicons name={rightActionIcon} size={20} color={COLORS.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.foreground,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
