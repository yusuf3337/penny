import { getCurrencySymbol } from '../../context/CurrencyContext';
import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { formatNumberInput, parseAmountSafely } from '../../utils/formatters';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';

interface AddDebtModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (personName: string, type: 'given' | 'taken', amount: number, description?: string) => void;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({ visible, onClose, onSave }) => {
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState<'given' | 'taken'>('given'); // given = Alacak, taken = Borç
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!personName.trim()) {
      setError('Lütfen bir kişi ismi girin.');
      return;
    }
    const parsedAmount = parseAmountSafely(amountInput);
    if (parsedAmount <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }

    onSave(personName.trim(), type, parsedAmount, description.trim());

    setPersonName('');
    setAmountInput('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title="Yeni Borç / Alacak"
      subtitle="Kişisel borç ve alacaklarınızı düzenli takip edin."
      badge={{
        text: type === 'given' ? 'ALACAK' : 'BORÇ',
        color: type === 'given' ? '#047857' : '#BE123C',
        bg: type === 'given' ? '#ECFDF5' : '#FFF1F2',
      }}
      footer={
        <HeroUIButton
          variant={type === 'given' ? 'success' : 'danger'}
          size="lg"
          onPress={handleSave}
          icon="save-outline"
        >
          Kaydı Oluştur
        </HeroUIButton>
      }
    >
      {/* HeroUI Segmented Tabs for Debt Type */}
      <View className="flex-row bg-zinc-100 dark:bg-[#22332D] rounded-[18px] p-1 mb-4 gap-1.5">
        <TouchableOpacity
          className={`flex-1 flex-row items-center gap-2 py-2.5 px-3 rounded-[14px] ${
            type === 'given' ? 'bg-white dark:bg-[#182521] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => setType('given')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-down-circle"
            size={18}
            color={type === 'given' ? '#10B981' : '#71717A'}
          />
          <View>
            <Text
              className={`text-[13px] font-bold ${
                type === 'given' ? 'text-emerald-700 dark:text-[#70E0B0]' : 'text-zinc-500 dark:text-[#A9BDB2]'
              }`}
            >
              Alacaklıyım
            </Text>
            <Text className="text-[10px] text-zinc-400 dark:text-[#82978B] mt-0.5">Bana Borçlu</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 flex-row items-center gap-2 py-2.5 px-3 rounded-[14px] ${
            type === 'taken' ? 'bg-white dark:bg-[#182521] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => setType('taken')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-up-circle"
            size={18}
            color={type === 'taken' ? '#F43F5E' : '#71717A'}
          />
          <View>
            <Text
              className={`text-[13px] font-bold ${
                type === 'taken' ? 'text-rose-700 dark:text-[#FDA4AF]' : 'text-zinc-500 dark:text-[#A9BDB2]'
              }`}
            >
              Borçluyum
            </Text>
            <Text className="text-[10px] text-zinc-400 dark:text-[#82978B] mt-0.5">Ben Borçluyum</Text>
          </View>
        </TouchableOpacity>
      </View>

      <HeroUIInput
        label="Kişi İsmi"
        placeholder="Örn: Ahmet Yılmaz, Ayşe Kaya..."
        startIcon="person-outline"
        value={personName}
        onChangeText={(text) => {
          setPersonName(text);
          if (error) setError('');
        }}
        errorMessage={!personName.trim() && error ? error : undefined}
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
          personName.trim() && parseAmountSafely(amountInput) <= 0 && error
            ? error
            : undefined
        }
      />

      <HeroUIInput
        label="Açıklama (Opsiyonel)"
        placeholder="Örn: Borç olarak verdim, laptop taksiti..."
        startIcon="document-text-outline"
        value={description}
        onChangeText={setDescription}
      />
    </HeroUIModal>
  );
};
