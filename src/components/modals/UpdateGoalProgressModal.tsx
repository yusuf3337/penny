import { getCurrencySymbol } from '../../context/CurrencyContext';
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { SavingsGoal } from '../../types';
import { parseAmountSafely, formatCurrency, formatNumberInput } from '../../utils/formatters';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { localizeFormat } from '../../context/LocaleContext';

interface UpdateGoalProgressModalProps {
  visible: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onSave: (goal: Partial<SavingsGoal>) => void;
}

export const UpdateGoalProgressModal: React.FC<UpdateGoalProgressModalProps> = ({
  visible,
  goal,
  onClose,
  onSave,
}) => {
  const [addAmountInput, setAddAmountInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setAddAmountInput('');
    setError('');
  }, [visible, goal]);

  if (!goal) return null;

  const handleAddSavings = () => {
    const added = parseAmountSafely(addAmountInput);
    if (added <= 0) {
      setError('Lütfen bir birikim tutarı girin.');
      return;
    }

    const newSaved = goal.savedAmount + added;
    const percentage = Math.min(Math.round((newSaved / goal.targetAmount) * 100), 100);

    onSave({
      id: goal.id,
      savedAmount: newSaved,
      targetAmount: goal.targetAmount,
      percentage,
      remainingAmount: Math.max(goal.targetAmount - newSaved, 0),
      isCompleted: newSaved >= goal.targetAmount,
    });

    setAddAmountInput('');
    onClose();
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title="Birikim Ekle"
      subtitle={localizeFormat('{0} hedefinize yeni birikim aktarın.', [goal.title])}
      badge={{ text: 'KİLOMETRE TAŞI', color: '#0D9488', bg: '#CCFBF1' }}
      footer={
        <HeroUIButton
          variant="primary"
          size="lg"
          onPress={handleAddSavings}
          icon="add-circle-outline"
        >
          Birikime Ekle
        </HeroUIButton>
      }
    >
      {/* Current Progress HeroUI Card */}
      <View className="bg-zinc-100 dark:bg-[#22332D] rounded-[20px] p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 items-center">
            <Text className="text-[11px] font-semibold text-zinc-500 dark:text-[#A9BDB2] mb-0.5">Şu An Biriken</Text>
            <Text className="text-sm font-extrabold text-brand dark:text-brand">{formatCurrency(goal.savedAmount)}</Text>
          </View>
          <View className="w-[1px] h-7 bg-zinc-200 dark:bg-[#2C4039]" />
          <View className="flex-1 items-center">
            <Text className="text-[11px] font-semibold text-zinc-500 dark:text-[#A9BDB2] mb-0.5">Hedef Tutar</Text>
            <Text className="text-[13px] font-bold text-zinc-900 dark:text-[#EAF2EE]">{formatCurrency(goal.targetAmount)}</Text>
          </View>
          <View className="w-[1px] h-7 bg-zinc-200 dark:bg-[#2C4039]" />
          <View className="flex-1 items-center">
            <Text className="text-[11px] font-semibold text-zinc-500 dark:text-[#A9BDB2] mb-0.5">Kalan</Text>
            <Text className="text-[13px] font-bold text-zinc-900 dark:text-[#EAF2EE]">{formatCurrency(goal.remainingAmount)}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View className="h-1.5 bg-zinc-200 dark:bg-[#2C4039] rounded-full overflow-hidden">
          <View
            className="h-full bg-brand rounded-full"
            style={{ width: `${Math.max(goal.percentage || 0, 4)}%` }}
          />
        </View>
      </View>

      <HeroUIInput
        label="Eklenecek Birikim Tutarı"
        prefix={getCurrencySymbol()}
        placeholder="Örn: 1.000 veya 10.000"
        keyboardType="numeric"
        value={addAmountInput}
        onChangeText={(text) => {
          setAddAmountInput(formatNumberInput(text));
          if (error) setError('');
        }}
        errorMessage={error}
        description="Bu tutar mevcut birikiminizin üzerine eklenecektir."
      />
    </HeroUIModal>
  );
};
