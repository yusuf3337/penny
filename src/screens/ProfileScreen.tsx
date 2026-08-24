import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from '../components/common/Header';
import { COLORS } from '../constants/colors';

export const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Header title="Profil & Ayarlar" subtitle="Uygulama Tercihleriniz" />
      <View style={styles.content}>
        <Text style={styles.placeholderText}>Profil ve genel ayarlarınızı burada yapılandırabilirsiniz.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
