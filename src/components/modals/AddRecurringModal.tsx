import { getCurrencySymbol } from '../../context/CurrencyContext';
import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { formatNumberInput, parseAmountSafely } from '../../utils/formatters';

interface AddRecurringModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    title: string,
    amount: number,
    type: 'income' | 'expense',
    frequency: 'daily' | 'weekly' | 'monthly',
    category: string
  ) => void;
}

export const AddRecurringModal: React.FC<AddRecurringModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [category, setCategory] = useState('Ev & Yaşam');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!title.trim()) {
      setError('Lütfen bir başlık girin.');
      return;
    }
    const parsedAmount = parseAmountSafely(amountInput);
    if (parsedAmount <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }

    onSave(title.trim(), parsedAmount, type, frequency, category);

    setTitle('');
    setAmountInput('');
    setError('');
    onClose();
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title="Tekrarlayan İşlem"
      subtitle="Periyodik gelir veya gider hareketinizi tanımlayın."
      badge={{
        text: type === 'expense' ? 'DÜZENLİ GİDER' : 'DÜZENLİ GELİR',
        color: type === 'expense' ? '#BE123C' : '#047857',
        bg: type === 'expense' ? '#FFF1F2' : '#ECFDF5',
      }}
      footer={
        <HeroUIButton
          variant={type === 'expense' ? 'danger' : 'success'}
          size="lg"
          onPress={handleSave}
          icon="repeat-outline"
        >
          Tekrarlayan İşlemi Kaydet
        </HeroUIButton>
      }
    >
      {/* Type Selector Tabs */}
      <View className="flex-row bg-zinc-100 dark:bg-[#22332D] rounded-2xl p-1 mb-4">
        <TouchableOpacity
          className={`flex-1 py-2.5 items-center rounded-[13px] ${
            type === 'expense' ? 'bg-white dark:bg-[#182521] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => setType('expense')}
          activeOpacity={0.8}
        >
          <Text
            className={`text-[13px] ${
              type === 'expense' ? 'text-rose-700 dark:text-[#FDA4AF] font-bold' : 'text-zinc-500 dark:text-[#A9BDB2] font-semibold'
            }`}
          >
            Düzenli Gider
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2.5 items-center rounded-[13px] ${
            type === 'income' ? 'bg-white dark:bg-[#182521] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => setType('income')}
          activeOpacity={0.8}
        >
          <Text
            className={`text-[13px] ${
              type === 'income' ? 'text-emerald-700 dark:text-[#70E0B0] font-bold' : 'text-zinc-500 dark:text-[#A9BDB2] font-semibold'
            }`}
          >
            Düzenli Gelir
          </Text>
        </TouchableOpacity>
      </View>

      <HeroUIInput
        label="İşlem Başlığı"
        placeholder="Örn: Ev Kirası, İnternet Faturası, Yevmiye..."
        startIcon="create-outline"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (error) setError('');
        }}
        errorMessage={!title.trim() && error ? error : undefined}
      />

      <HeroUIInput
        label="Tutar"
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

      {/* Frequency Selector Chips */}
      <Text className="text-[13px] font-bold text-zinc-700 dark:text-[#C2D4C8] mb-2">Tekrarlanma Periyodu</Text>
      <View className="flex-row gap-2 mb-4">
        {[
          { id: 'daily', label: 'Her Gün' },
          { id: 'weekly', label: 'Her Hafta' },
          { id: 'monthly', label: 'Her Ay' },
        ].map((item) => {
          const isSelected = frequency === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              className={`flex-1 py-2.5 items-center rounded-2xl border-[1.5px] ${
                isSelected
                  ? 'bg-teal-50 border-[#0D9488]'
                  : 'bg-zinc-100 dark:bg-[#22332D] border-transparent'
              }`}
              onPress={() => setFrequency(item.id as any)}
              activeOpacity={0.75}
            >
              <Text
                className={`text-[13px] ${
                  isSelected ? 'text-[#0D9488] dark:text-[#66C9AE] font-bold' : 'text-zinc-500 dark:text-[#A9BDB2] font-semibold'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <HeroUIInput
        label="Kategori / Etiket"
        placeholder="Ev & Yaşam"
        startIcon="pricetag-outline"
        value={category}
        onChangeText={setCategory}
      />
    </HeroUIModal>
  );
};
