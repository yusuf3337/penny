import { getCurrencySymbol } from '../../context/CurrencyContext';
import React, { useState } from 'react';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { formatNumberInput, parseAmountSafely } from '../../utils/formatters';

interface AddPendingCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, amount: number, category: string) => void;
}

export const AddPendingCollectionModal: React.FC<AddPendingCollectionModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState('Gelir / Maaş / Hakediş');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!title.trim()) {
      setError('Lütfen bir hakediş / tahsilat başlığı girin.');
      return;
    }
    const parsedAmount = parseAmountSafely(amountInput);
    if (parsedAmount <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }

    onSave(title.trim(), parsedAmount, category);
    setTitle('');
    setAmountInput('');
    setError('');
    onClose();
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title="Hakediş Tanımla"
      subtitle="Beklenen tahsilat veya alacaklarınızı önceden planlayın."
      badge={{ text: 'BEKLENEN GELİR', color: '#047857', bg: '#ECFDF5' }}
      footer={
        <HeroUIButton
          variant="success"
          size="lg"
          onPress={handleSave}
          icon="cash-outline"
        >
          Hakedişi Kaydet
        </HeroUIButton>
      }
    >
      <HeroUIInput
        label="Hakediş / Ödeme Başlığı"
        placeholder="Örn: Daire 3 Kirası, Müşteri Hakedişi..."
        startIcon="briefcase-outline"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (error) setError('');
        }}
        errorMessage={!title.trim() && error ? error : undefined}
      />

      <HeroUIInput
        label="Beklenen Tutar"
        prefix={getCurrencySymbol()}
        placeholder="0,00"
        keyboardType="numeric"
        value={amountInput}
        onChangeText={(text) => {
          setAmountInput(formatNumberInput(text));
          if (error) setError('');
        }}
        errorMessage={
          title.trim() && parseAmountSafely(amountInput) <= 0 && error ? error : undefined
        }
      />

      <HeroUIInput
        label="Kategori / Etiket"
        placeholder="Gelir / Maaş / Hakediş"
        startIcon="pricetag-outline"
        value={category}
        onChangeText={setCategory}
      />
    </HeroUIModal>
  );
};
