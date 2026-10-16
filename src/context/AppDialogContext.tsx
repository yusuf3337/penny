import React, { createContext, useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LIGHT_COLORS } from '../constants/colors';
import { useThemedStyles } from './ThemeContext';
import { localize } from './LocaleContext';

type DialogAction = {
  text: string;
  style?: 'cancel' | 'destructive' | 'default';
  onPress?: () => void | Promise<void>;
};

type Dialog = {
  title: string;
  message: string;
  actions: DialogAction[];
};

type DialogContextValue = {
  alert: (title: string, message: string, actions?: DialogAction[]) => void;
};

const AppDialogContext = createContext<DialogContextValue | null>(null);

export const AppDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useThemedStyles(lightStyles);
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const alert: DialogContextValue['alert'] = (title, message, actions = [{ text: 'Tamam' }]) => {
    setDialog({ title, message, actions });
  };

  const close = () => setDialog(null);
  const destructive = dialog?.actions.some((action) => action.style === 'destructive') ?? false;
  const error = dialog?.title === 'Hata';
  const success = dialog?.title === 'Başarılı' || dialog?.title === 'Geri Yüklendi' || dialog?.title?.includes('Aktif');
  const icon = destructive ? 'trash-outline' : error ? 'alert-circle-outline' : success ? 'checkmark-outline' : 'information-outline';
  const accent = destructive || error ? '#BE123C' : COLORS.primary;
  const tint = destructive || error ? '#FFF1F2' : COLORS.primaryLight;

  return (
    <AppDialogContext.Provider value={{ alert }}>
      {children}
      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={close} statusBarTranslucent accessibilityViewIsModal>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={localize('Pencereyi kapat')} />
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: tint }]}>
              <Ionicons name={icon} size={23} color={accent} />
            </View>
            <Text style={styles.title}>{dialog?.title}</Text>
            <Text style={styles.message}>{dialog?.message}</Text>
            <View style={styles.actions}>
              {dialog?.actions.filter((action) => action.style !== 'cancel').map((action, index) => (
                <Pressable
                  key={`${action.text}-${index}`}
                  style={[styles.action, { backgroundColor: action.style === 'destructive' || error ? '#BE123C' : COLORS.primary }]}
                  onPress={() => {
                    close();
                    void action.onPress?.();
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionText}>{action.text}</Text>
                </Pressable>
              ))}
              {dialog?.actions.some((action) => action.style === 'cancel') && (
                <Pressable style={styles.cancelAction} onPress={close} accessibilityRole="button">
                  <Text style={styles.cancelText}>{dialog.actions.find((action) => action.style === 'cancel')?.text}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </AppDialogContext.Provider>
  );
};

export const useAppDialog = () => {
  const context = useContext(AppDialogContext);
  if (!context) throw new Error('useAppDialog must be used inside AppDialogProvider');
  return context;
};

const lightStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 26, backgroundColor: 'rgba(24, 43, 41, 0.48)' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 24, shadowColor: '#182B29', shadowOpacity: 0.12, shadowRadius: 20, elevation: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { color: LIGHT_COLORS.foreground, fontSize: 21, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 },
  message: { color: LIGHT_COLORS.mutedText, fontSize: 14, lineHeight: 21, marginBottom: 22 },
  actions: { gap: 9 },
  action: { minHeight: 48, borderRadius: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  cancelAction: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#71717A', fontSize: 14, fontWeight: '600' },
});
