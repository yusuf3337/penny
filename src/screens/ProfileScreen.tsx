import { useThemedStyles } from '../context/ThemeContext';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../components/common/LocalizedPrimitives';
import { Header } from '../components/common/Header';
import { COLORS, LIGHT_COLORS } from '../constants/colors';

export const ProfileScreen = () => {
  const styles = useThemedStyles(lightStyles);
  return (
    <View style={styles.container}>
      <Header title="Profil & Ayarlar" subtitle="Uygulama Tercihleriniz" />
      <View style={styles.content}>
        <Text style={styles.placeholderText}>Profil ve genel ayarlarınızı burada yapılandırabilirsiniz.</Text>
      </View>
    </View>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: LIGHT_COLORS.textSecondary,
    fontSize: 14,
  },
});
