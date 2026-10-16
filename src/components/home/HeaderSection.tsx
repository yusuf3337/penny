import { useThemedStyles } from '../../context/ThemeContext';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LIGHT_COLORS } from '../../constants/colors';
import { getFormattingLocale } from '../../context/LocaleContext';

interface HeaderSectionProps {
  userName?: string;
  onAvatarPress?: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  userName = 'Kullanıcı',
  onAvatarPress,
}) => {
  const styles = useThemedStyles(lightStyles);
  const formattedDate = new Date().toLocaleDateString(getFormattingLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).toLocaleUpperCase(getFormattingLocale());

  // Initials (e.g. "Deniz" -> "DE" or "D", "Ahmet Yılmaz" -> "AY")
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.greetingTitle}>Günaydın, {userName}.</Text>
        <Text style={styles.subtitle}>Finansal durumun bugün oldukça iyi görünüyor.</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color={COLORS.mutedText} />
          <View style={styles.badgeDot} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.avatar} activeOpacity={0.7} onPress={onAvatarPress}>
          <Text style={styles.avatarText}>{initials || 'P'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: LIGHT_COLORS.mutedText,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: LIGHT_COLORS.foreground,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: LIGHT_COLORS.mutedText,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: LIGHT_COLORS.card,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: LIGHT_COLORS.accent,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: LIGHT_COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: LIGHT_COLORS.secondaryForeground,
  },
});
