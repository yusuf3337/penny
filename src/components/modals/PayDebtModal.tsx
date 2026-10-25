import { getCurrencySymbol } from '../../context/CurrencyContext';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { Debt } from '../../types';
import { parseAmountSafely, formatCurrency, formatNumberInput } from '../../utils/formatters';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { localizeFormat } from '../../context/LocaleContext';

interface PayDebtModalProps {
  visible: boolean;
  debt: Debt | null;
  onClose: () => void;
  onSave: (debtId: string, paidAmount: number) => void;
}

export const PayDebtModal: React.FC<PayDebtModalProps> = ({
  visible,
  debt,
  onClose,
  onSave,
}) => {
  const [payAmountInput, setPayAmountInput] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (debt) {
      const safeRem = Math.round((debt.remainingAmount || 0) * 100) / 100;
      const formattedRem = safeRem.toFixed(2).replace('.', ',');
      setPayAmountInput(formatNumberInput(formattedRem));
      setError('');
    }
  }, [debt]);

  if (!debt) return null;

  const handleSave = () => {
    const parsed = parseAmountSafely(payAmountInput);
    if (parsed <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }
    const safeRem = Math.round((debt.remainingAmount || 0) * 100) / 100;
    if (parsed > safeRem + 0.01) {
      setError(`En fazla ${formatCurrency(safeRem)} girebilirsiniz.`);
      return;
    }

    onSave(debt.id, parsed);
    setPayAmountInput('');
    setError('');
    onClose();
  };

  const isGiven = debt.type === 'given'; // Alacak

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title={isGiven ? 'Tahsilat Al' : 'Borç Öde'}
      subtitle={localizeFormat('{0} ile olan bakiye hareketini kaydedin.', [debt.personName])}
      badge={{
        text: isGiven ? 'TAHSİLAT' : 'ÖDEME',
        color: isGiven ? '#047857' : '#BE123C',
        bg: isGiven ? '#ECFDF5' : '#FFF1F2',
      }}
      footer={
        <HeroUIButton
          variant={isGiven ? 'success' : 'primary'}
          size="lg"
          onPress={handleSave}
          icon={isGiven ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
        >
          {isGiven ? 'Tahsilatı Kaydet' : 'Ödemeyi Kaydet'}
        </HeroUIButton>
      }
    >
      {/* Balance Summary Card */}
      <View className="flex-row items-center gap-3 bg-zinc-100 dark:bg-[#1E2A48] p-3.5 rounded-[18px] mb-4">
        <View className="w-10.5 h-10.5 rounded-[14px] bg-white dark:bg-[#17213A] items-center justify-center shadow-xs">
          <Ionicons
            name={isGiven ? 'wallet-outline' : 'card-outline'}
            size={22}
            color={isGiven ? '#059669' : '#0D9488'}
          />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-extrabold text-zinc-900 dark:text-[#F5F7FF]">{debt.personName}</Text>
          <Text className="text-xs text-zinc-500 dark:text-[#BAC8E6] mt-0.5">
            Kalan {isGiven ? 'Alacak' : 'Borç'}:{' '}
            <Text className="font-extrabold text-zinc-900 dark:text-[#F5F7FF]">
              {formatCurrency(debt.remainingAmount)}
            </Text>
          </Text>
        </View>
      </View>

      <HeroUIInput
        label={isGiven ? 'Tahsil Edilen Tutar' : 'Ödenen Tutar'}
        prefix={getCurrencySymbol()}
        placeholder={formatCurrency(debt.remainingAmount)}
        keyboardType="numeric"
        value={payAmountInput}
        onChangeText={(text) => {
          setPayAmountInput(formatNumberInput(text));
          if (error) setError('');
        }}
        errorMessage={error}
        description="Kısmi veya tam ödeme tutarını girebilirsiniz."
      />
    </HeroUIModal>
  );
};
