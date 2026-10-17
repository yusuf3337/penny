import { getCurrencySymbol } from '../../context/CurrencyContext';
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { SavingsGoal } from '../../types';
import { parseAmountSafely, formatNumberInput } from '../../utils/formatters';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';

interface AddGoalModalProps {
  visible: boolean;
  initialGoal?: SavingsGoal | null;
  onClose: () => void;
  onSave: (goal: Partial<SavingsGoal>) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  initialGoal,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Birikim');
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [savedAmountInput, setSavedAmountInput] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('flag-outline');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialGoal) {
        setTitle(initialGoal.title || '');
        setCategory(initialGoal.category || 'Birikim');
        setTargetAmountInput(
          initialGoal.targetAmount ? formatNumberInput(initialGoal.targetAmount.toString()) : ''
        );
        setSavedAmountInput(
          initialGoal.savedAmount ? formatNumberInput(initialGoal.savedAmount.toString()) : ''
        );
        setSelectedIcon(initialGoal.iconName || 'flag-outline');
      } else {
        setTitle('');
        setCategory('Birikim');
        setTargetAmountInput('');
        setSavedAmountInput('');
        setSelectedIcon('flag-outline');
      }
      setError('');
    }
  }, [visible, initialGoal]);

  const icons = [
    'flag-outline',
    'shield-checkmark-outline',
    'airplane-outline',
    'laptop-outline',
    'car-outline',
    'home-outline',
    'cart-outline',
    'heart-outline',
  ];

  const handleSave = () => {
    if (!title.trim()) {
      setError('Lütfen bir hedef başlığı girin.');
      return;
    }
    const target = parseAmountSafely(targetAmountInput);
    if (target <= 0) {
      setError('Lütfen geçerli bir hedef tutar girin.');
      return;
    }
    const saved = parseAmountSafely(savedAmountInput);

    onSave({
      ...(initialGoal ? { id: initialGoal.id } : {}),
      title: title.trim(),
      category: category.trim() || 'Birikim',
      targetAmount: target,
      savedAmount: saved,
      iconName: selectedIcon,
    });

    setTitle('');
    setCategory('Birikim');
    setTargetAmountInput('');
    setSavedAmountInput('');
    setError('');
    onClose();
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title={initialGoal ? 'Hedefi Düzenle' : 'Yeni Hedef Ekle'}
      subtitle="Hayallerinizi kilometre taşlarıyla takip edin."
      badge={{
        text: initialGoal ? 'DÜZENLEME' : 'HEDEF',
        color: '#0D9488',
        bg: '#CCFBF1',
      }}
      footer={
        <HeroUIButton
          variant="primary"
          size="lg"
          onPress={handleSave}
          icon={initialGoal ? 'checkmark-circle-outline' : 'add-circle-outline'}
        >
          {initialGoal ? 'Değişiklikleri Kaydet' : 'Hedefi Oluştur'}
        </HeroUIButton>
      }
    >
      <HeroUIInput
        label="Hedef Adı"
        placeholder="Örn: Ev Peşinatı, Yeni Telefon, Tatil..."
        startIcon="flag-outline"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (error) setError('');
        }}
        errorMessage={!title.trim() && error ? error : undefined}
      />

      <HeroUIInput
        label="Kategori / Etiket"
        placeholder="Örn: Birikim, Seyahat, Elektronik"
        startIcon="pricetag-outline"
        value={category}
        onChangeText={setCategory}
      />

      <HeroUIInput
        label="Hedef Tutar"
        prefix={getCurrencySymbol()}
        placeholder="Örn: 50.000 veya 1.000.000"
        keyboardType="numeric"
        value={targetAmountInput}
        onChangeText={(text) => {
          setTargetAmountInput(formatNumberInput(text));
          if (error) setError('');
        }}
        errorMessage={
          title.trim() && parseAmountSafely(targetAmountInput) <= 0 && error
            ? error
            : undefined
        }
      />

      <HeroUIInput
        label="Mevcut Birikim (Opsiyonel)"
        prefix={getCurrencySymbol()}
        placeholder="0"
        keyboardType="numeric"
        value={savedAmountInput}
        onChangeText={(text) => setSavedAmountInput(formatNumberInput(text))}
        description="Varsa bu hedefe önceden ayırdığınız tutarı girin."
      />

      {/* HeroUI Icon Selector */}
      <Text className="text-[13px] font-bold text-zinc-700 dark:text-[#C2D4C8] mb-2">Hedef İkonu</Text>
      <View className="flex-row flex-wrap gap-2.5 mb-2.5">
        {icons.map((ic) => {
          const isSelected = selectedIcon === ic;
          return (
            <TouchableOpacity
              key={ic}
              className={`w-11 h-11 rounded-[14px] items-center justify-center border-[1.5px] ${
                isSelected
                  ? 'bg-teal-50 border-[#0D9488]'
                  : 'bg-zinc-100 dark:bg-[#22332D] border-transparent'
              }`}
              onPress={() => setSelectedIcon(ic)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={ic as any}
                size={20}
                color={isSelected ? '#0D9488' : '#71717A'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </HeroUIModal>
  );
};
