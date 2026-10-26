import React, { createContext, useContext, useState } from 'react';
import { View } from 'react-native';
import { Alert } from 'heroui-native/alert';
import { Dialog } from 'heroui-native/dialog';
import { Button } from 'heroui-native/button';
import { useTheme } from './ThemeContext';
import { AppLanguage, getActiveLanguage, localize } from './LocaleContext';

const okLabels: Record<AppLanguage, string> = {
  tr: 'Tamam', en: 'OK', de: 'OK', fr: 'OK', ko: '확인',
  zh: '确定', ja: 'OK', ru: 'ОК', it: 'OK',
};

type DialogAction = {
  text: string;
  style?: 'cancel' | 'destructive' | 'default';
  onPress?: () => void | Promise<void>;
};

type AppDialog = { title: string; message: string; actions: DialogAction[] };
type DialogContextValue = { alert: (title: string, message: string, actions?: DialogAction[]) => void };
const AppDialogContext = createContext<DialogContextValue | null>(null);

export const AppDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useTheme();
  const [dialog, setDialog] = useState<AppDialog | null>(null);
  const alert: DialogContextValue['alert'] = (title, message, actions = [{ text: okLabels[getActiveLanguage()] }]) => {
    setDialog({ title, message, actions });
  };
  const close = () => setDialog(null);
  const destructive = dialog?.actions.some((action) => action.style === 'destructive') ?? false;
  const error = dialog?.title === 'Hata' || dialog?.title === 'Error';
  const success = dialog?.title === 'Başarılı' || dialog?.title === 'Geri Yüklendi' || dialog?.title?.includes('Aktif');
  const status = destructive || error ? 'danger' : success ? 'success' : 'accent';

  return (
    <AppDialogContext.Provider value={{ alert }}>
      {children}
      <Dialog isOpen={!!dialog} onOpenChange={(open) => { if (!open) close(); }}>
        <Dialog.Portal unstable_accessibilityContainerViewIsModal>
          <Dialog.Overlay />
          <Dialog.Content className="w-[88%] rounded-[28px] p-5" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Alert status={status} className="mb-5 rounded-2xl p-4" style={{ backgroundColor: destructive || error ? colors.roseBg : success ? colors.emeraldBg : colors.primaryLight }}>
              <Alert.Indicator />
              <Alert.Content>
                <Dialog.Title className="text-[19px] font-bold" style={{ color: colors.foreground }}>{localize(dialog?.title || '')}</Dialog.Title>
                <Alert.Description className="mt-1 text-[14px] leading-[21px]" style={{ color: colors.mutedText }}>
                  {localize(dialog?.message || '')}
                </Alert.Description>
              </Alert.Content>
            </Alert>
            <View className="gap-2">
              {dialog?.actions.filter((action) => action.style !== 'cancel').map((action, index) => (
                <Button
                  feedbackVariant="scale"
                  key={`${action.text}-${index}`}
                  variant={action.style === 'destructive' ? 'danger' : 'primary'}
                  className="w-full rounded-2xl"
                  onPress={() => { close(); void action.onPress?.(); }}
                ><Button.Label>{localize(action.text)}</Button.Label></Button>
              ))}
              {dialog?.actions.filter((action) => action.style === 'cancel').map((action, index) => (
                <Button key={`${action.text}-${index}`} feedbackVariant="scale" variant="ghost" className="w-full rounded-2xl" onPress={close}>
                  <Button.Label>{localize(action.text)}</Button.Label>
                </Button>
              ))}
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </AppDialogContext.Provider>
  );
};

export const useAppDialog = () => {
  const context = useContext(AppDialogContext);
  if (!context) throw new Error('useAppDialog must be used inside AppDialogProvider');
  return context;
};
