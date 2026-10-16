import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { SavingsGoal } from '../../types';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { localizeFormat } from '../../context/LocaleContext';

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
      setTargetInput(currentGoal.targetAmount ? currentGoal.targetAmount.toString() : '');
      setSavedInput(currentGoal.savedAmount ? currentGoal.savedAmount.toString() : '');
      setError('');
    }
  }, [visible, currentGoal]);

  const handleSave = () => {
    const targetVal = parseFloat(targetInput.replace(',', '.'));
    const savedVal = parseFloat(savedInput.replace(',', '.')) || 0;

    if (isNaN(targetVal) || targetVal <= 0) {
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
        prefix="₺"
        placeholder="Örn: 10.000"
        keyboardType="numeric"
        value={targetInput}
        onChangeText={(text) => {
          setTargetInput(text);
          if (error) setError('');
        }}
        errorMessage={error}
      />

      <HeroUIInput
        label="Şu Ana Kadar Biriken Tutar"
        prefix="₺"
        placeholder="Örn: 6.800"
        keyboardType="numeric"
        value={savedInput}
        onChangeText={(text) => {
          setSavedInput(text);
          if (error) setError('');
        }}
        description="Mevcut birikim durumunuzu buradan elle düzeltebilirsiniz."
      />
    </HeroUIModal>
  );
};
