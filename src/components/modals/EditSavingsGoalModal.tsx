import { getCurrencySymbol } from '../../context/CurrencyContext';
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { SavingsGoal } from '../../types';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { localizeFormat } from '../../context/LocaleContext';
import { formatNumberInput, parseAmountSafely } from '../../utils/formatters';

interface EditSavingsGoalModalProps {
  visible: boolean;
  currentGoal: SavingsGoal;
  onClose: () => void;
  onSave: (updatedGoal: SavingsGoal) => void;
}

export const EditSavingsGoalModal: React.FC<EditSavingsGoalModalProps> = ({
  visible,
  currentGoal,
  onClose,
  onSave,
}) => {
  const [targetInput, setTargetInput] = useState('');
  const [savedInput, setSavedInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setTargetInput(currentGoal.targetAmount ? formatNumberInput(currentGoal.targetAmount.toString()) : '');
      setSavedInput(currentGoal.savedAmount ? formatNumberInput(currentGoal.savedAmount.toString()) : '');
      setError('');
    }
  }, [visible, currentGoal]);

  const handleSave = () => {
    const targetVal = parseAmountSafely(targetInput);
    const savedVal = parseAmountSafely(savedInput);

    if (targetVal <= 0) {
      setError('Lütfen geçerli bir hedef tutar girin.');
      return;
    }

    const percentage = Math.min(Math.round((savedVal / targetVal) * 100), 100);
    const remainingAmount = Math.max(targetVal - savedVal, 0);

    onSave({
      id: currentGoal.id || `goal_${Date.now()}`,
      title: currentGoal.title || 'Tasarruf hedefi',
      category: currentGoal.category || 'Genel',
      savedAmount: savedVal,
      targetAmount: targetVal,
      percentage,
      remainingAmount,
      isCompleted: savedVal >= targetVal,
    });

    onClose();
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title="Hedefi Düzenle"
      subtitle={localizeFormat('{0} hedefinin tutarlarını güncelleyin.', [currentGoal.title])}
      badge={{ text: 'GÜNCELLEME', color: '#0D9488', bg: '#CCFBF1' }}
      footer={
        <HeroUIButton
          variant="primary"
          size="lg"
          onPress={handleSave}
          icon="checkmark-circle-outline"
        >
          Değişiklikleri Kaydet
        </HeroUIButton>
      }
    >
      <HeroUIInput
        label="Hedef Tutar"
        prefix={getCurrencySymbol()}
        placeholder="Örn: 10.000"
        keyboardType="numeric"
        value={targetInput}
        onChangeText={(text) => {
          setTargetInput(formatNumberInput(text));
          if (error) setError('');
        }}
        errorMessage={error}
      />

      <HeroUIInput
        label="Şu Ana Kadar Biriken Tutar"
        prefix={getCurrencySymbol()}
        placeholder="Örn: 6.800"
        keyboardType="numeric"
        value={savedInput}
        onChangeText={(text) => {
          setSavedInput(formatNumberInput(text));
          if (error) setError('');
        }}
        description="Mevcut birikim durumunuzu buradan elle düzeltebilirsiniz."
      />
    </HeroUIModal>
  );
};
