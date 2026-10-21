import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { COLORS } from '../../constants/colors';
import { isValidNickname, sanitizeNickname } from '../../utils/nickname';
import { AppLanguage, useLocale } from '../../context/LocaleContext';

const saveError: Record<AppLanguage, string> = {
  tr: 'İsim kaydedilemedi. Tekrar deneyin.',
  en: 'Could not save your name. Try again.',
  de: 'Name konnte nicht gespeichert werden. Erneut versuchen.',
  fr: 'Impossible d’enregistrer votre nom. Réessayez.',
  ko: '이름을 저장할 수 없습니다. 다시 시도하세요.',
  zh: '无法保存姓名，请重试。',
  ja: '名前を保存できませんでした。もう一度お試しください。',
  ru: 'Не удалось сохранить имя. Попробуйте ещё раз.',
  it: 'Impossibile salvare il nome. Riprova.',
};

interface UserNameModalProps {
  visible: boolean;
  onSave: (name: string) => Promise<void> | void;
}

export const UserNameModal: React.FC<UserNameModalProps> = ({ visible, onSave }) => {
  const { language } = useLocale();
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const name = nameInput.trim();
    if (!isValidNickname(name)) {
      setError('Lütfen bir isim giriniz.');
      return;
    }
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      await onSave(name);
    } catch {
      setError(saveError[language]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={() => {}}
      dismissible={false}
      title="Penny'ye Hoş Geldin"
      subtitle="Kişisel finans asistanını senin için hazırlayalım."
      badge={{ text: 'BAŞLANGIÇ', color: COLORS.primary }}
      footer={
        <HeroUIButton
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          disabled={saving || !isValidNickname(nameInput.trim())}
          icon="arrow-forward"
          iconPosition="right"
        >
          Hadi Başlayalım
        </HeroUIButton>
      }
    >
      <View className="items-center mb-5 mt-2">
        <View className="w-15 h-15 rounded-full bg-teal-500/10 items-center justify-center mb-3">
          <Ionicons name="person-outline" size={28} color="#0D9488" />
        </View>
        <Text className="text-sm text-zinc-500 dark:text-[#A9BDB2] font-medium text-center">
          Sana nasıl hitap etmemizi istersin?
        </Text>
      </View>

      <HeroUIInput
        label="İsminiz"
        placeholder="Örn: Yusuf, Deniz, Can..."
        startIcon="person-outline"
        value={nameInput}
        onChangeText={(text) => {
          setNameInput(sanitizeNickname(text));
          if (error) setError('');
        }}
        errorMessage={error}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={40}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
    </HeroUIModal>
  );
};
