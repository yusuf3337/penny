import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Text } from './LocalizedPrimitives';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';

/** A short, quiet bridge between the native launch screen and the loaded app. */
export function SplashIntro({ onComplete }: { onComplete: () => void }) {
  const { isLoading } = useData();
  const { isDark, colors } = useTheme();
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const minimum = setTimeout(() => setReady(true), 450);
    const maximum = setTimeout(() => setTimedOut(true), 4000);
    return () => { clearTimeout(minimum); clearTimeout(maximum); };
  }, []);

  useEffect(() => {
    if (ready && (!isLoading || timedOut)) onComplete();
  }, [ready, isLoading, timedOut, onComplete]);

  return <View style={[styles.container, { backgroundColor: colors.background }]}>
    <StatusBar style={isDark ? 'light' : 'dark'} />
    <View style={styles.brand}>
      <View style={[styles.mark, { backgroundColor: colors.primary }]} />
      <Text localize={false} style={[styles.wordmark, { color: colors.foreground }]}>{'penny'}</Text>
    </View>
    <ActivityIndicator style={styles.activity} size="small" color={colors.primary} />
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: { width: 14, height: 14, borderRadius: 5, transform: [{ rotate: '-20deg' }] },
  wordmark: { fontSize: 38, fontWeight: '800', letterSpacing: -1.8 },
  activity: { position: 'absolute', bottom: 72 },
});
