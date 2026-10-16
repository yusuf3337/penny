import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { COLORS } from '../../constants/colors';

interface UserNameModalProps {
  visible: boolean;
  onSave: (name: string) => void;
}

export const UserNameModal: React.FC<UserNameModalProps> = ({ visible, onSave }) => {
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!nameInput.trim()) {
      setError('Lütfen bir isim giriniz.');
      return;
    }
    setError('');
    onSave(nameInput.trim());
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={() => {}}
      title="Penny'ye Hoş Geldin"
      subtitle="Kişisel finans asistanını senin için hazırlayalım."
      badge={{ text: 'BAŞLANGIÇ', color: COLORS.primary }}
      footer={
        <HeroUIButton
          variant="primary"
          size="lg"
          onPress={handleSubmit}
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
          setNameInput(text);
          if (error) setError('');
        }}
        errorMessage={error}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
    </HeroUIModal>
  );
};
