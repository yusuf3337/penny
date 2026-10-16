import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { parseAmountSafely, formatNumberInput, formatCurrency } from '../../utils/formatters';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { useData } from '../../context/DataContext';
import { localizeFormat } from '../../context/LocaleContext';

interface SplitExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAddDebt: (personName: string, type: 'given' | 'taken', amount: number, desc?: string, options?: { source?: 'split_expense'; accountType?: 'bank' | 'cash' }) => Promise<void>;
  onAddTransaction: (tx: any) => Promise<void>;
}

export const SplitExpenseModal: React.FC<SplitExpenseModalProps> = ({
  visible,
  onClose,
  onAddDebt,
  onAddTransaction,
}) => {
  const { categories } = useData();
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Yemek');
  const [accountType, setAccountType] = useState<'bank' | 'cash'>('bank');
  const [totalAmountInput, setTotalAmountInput] = useState('');
  const [participantsText, setParticipantsText] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const parsedTotal = parseAmountSafely(totalAmountInput);
  const categoryNames = categories.filter((category) => category.type === 'expense').map((category) => category.name);
  const availableCategories = categoryNames.length > 0 ? categoryNames : ['Yemek', 'Ev', 'Ulaşım', 'Eğlence', 'Diğer'];
  const effectiveCategory = availableCategories.includes(selectedCategory) ? selectedCategory : availableCategories[0];
  const accountName = accountType === 'cash' ? 'Nakit Cüzdan' : 'Banka Hesabı';

  // Parse comma or space separated names
  const names = participantsText
    .split(/[,;\n]/)
    .map((n) => n.trim())
    .filter((n, index, all) => n.length > 0 && all.findIndex((other) => other.toLocaleLowerCase('tr-TR') === n.toLocaleLowerCase('tr-TR')) === index);

  // Total people including "Ben" (user)
  const totalPeople = names.length + 1;
  const totalCents = Math.round(parsedTotal * 100);
  const shareCents = totalPeople > 0 ? Math.floor(totalCents / totalPeople) : 0;
  const participantShare = shareCents / 100;
  const myShare = (shareCents + (totalCents % totalPeople)) / 100;

  const handleApplySplit = async () => {
    if (!title.trim()) {
      setError('Lütfen bir harcama açıklaması girin.');
      return;
    }
    if (parsedTotal <= 0) {
      setError('Lütfen geçerli bir toplam tutar girin.');
      return;
    }
    if (names.length === 0) {
      setError('Lütfen en az 1 kişi ismi girin.');
      return;
    }
    if (totalCents < totalPeople) {
      setError('Tutar, kişi başına en az 0,01 ₺ düşecek kadar büyük olmalı.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Record user's own share as expense transaction
      await onAddTransaction({
        title: `${title.trim()} (Benim Payım)`,
        category: effectiveCategory,
        amount: `-${formatCurrency(myShare)}`,
        rawAmount: myShare,
        type: 'expense',
        iconName: 'people-outline',
        accountType,
        accountName,
      });

      await onAddTransaction({
        title: `${title.trim()} (Diğer Paylar)`,
        category: 'Ortak Harcama',
        amount: '',
        rawAmount: participantShare * names.length,
        type: 'transfer',
        transferDirection: 'out',
        iconName: 'arrow-up-outline',
        accountType,
        accountName,
      });

      // 2. Add each participant's share to Debts as "given" (Alacaklıyım)
      for (const name of names) {
        await onAddDebt(
          name,
          'given',
          participantShare,
          `${title.trim()} Ortak Harcama Payı`,
          { source: 'split_expense', accountType }
        );
      }

      setSuccessMessage(localizeFormat('{0} kişi için alacak kaydı açıldı.', [names.length]));
      setTimeout(() => {
        setTitle('');
        setTotalAmountInput('');
        setParticipantsText('');
        setError('');
        setSuccessMessage('');
        setIsLoading(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError('Hesap bölüştürülürken bir hata oluştu.');
      setIsLoading(false);
    }
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title="Ortak Harcama Bölüş"
      subtitle="Hesabı eşit bölüştürün, alacaklarınızı anında kaydedin."
      badge={{ text: 'ORTAK HARCAMA', color: '#137C70', bg: '#E3F2EC' }}
      footer={
        <HeroUIButton
          variant="primary"
          size="lg"
          onPress={handleApplySplit}
          isLoading={isLoading}
          icon="people-outline"
        >
          Hesabı Böl ve Alacaklara Ekle
        </HeroUIButton>
      }
    >
      <HeroUIInput
        label="Harcama Açıklaması"
        placeholder="Örn: Akşam Yemeği, Yazlık Kira, Market..."
        startIcon="receipt-outline"
        value={title}
        onChangeText={(t) => {
          setTitle(t);
          if (error) setError('');
        }}
      />

      <Text className="text-[13px] font-semibold text-[#3B514C] dark:text-[#CCDCD2] mb-2">Kategori</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {availableCategories.map((category) => (
          <TouchableOpacity
            key={category}
            className={`px-3 py-2 rounded-xl border ${effectiveCategory === category ? 'bg-[#E3F2EC] dark:bg-[#203E35] border-[#137C70]' : 'bg-white dark:bg-[#182521] border-[#E1E9E5] dark:border-[#2C4039]'}`}
            onPress={() => setSelectedCategory(category)}
          >
            <Text className={`text-xs font-semibold ${effectiveCategory === category ? 'text-[#137C70] dark:text-[#66C9AE]' : 'text-[#667A73] dark:text-[#A9BDB2]'}`}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-[13px] font-semibold text-[#3B514C] dark:text-[#CCDCD2] mb-2">Ödenen hesap</Text>
      <View className="flex-row gap-2 mb-4">
        {(['bank', 'cash'] as const).map((account) => (
          <TouchableOpacity
            key={account}
            className={`flex-1 px-3 py-2.5 rounded-xl border ${accountType === account ? 'bg-[#E3F2EC] dark:bg-[#203E35] border-[#137C70]' : 'bg-white dark:bg-[#182521] border-[#E1E9E5] dark:border-[#2C4039]'}`}
            onPress={() => setAccountType(account)}
          >
            <Text className={`text-xs text-center font-semibold ${accountType === account ? 'text-[#137C70] dark:text-[#66C9AE]' : 'text-[#667A73] dark:text-[#A9BDB2]'}`}>{account === 'bank' ? 'Banka' : 'Nakit'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <HeroUIInput
        label="Toplam Hesap Tutarı"
        prefix="₺"
        placeholder="Örn: 1.200"
        keyboardType="numeric"
        value={totalAmountInput}
        onChangeText={(t) => {
          setTotalAmountInput(formatNumberInput(t));
          if (error) setError('');
        }}
      />

      <HeroUIInput
        label="Diğer Katılan Kişiler"
        placeholder="Ahmet, Mehmet, Zeynep (virgülle ayırın)"
        startIcon="person-add-outline"
        value={participantsText}
        onChangeText={(t) => {
          setParticipantsText(t);
          if (error) setError('');
        }}
        description="Siz otomatik olarak hesaplamaya dahilsiniz."
      />

      {/* Calculation Preview HeroUI Card */}
      {parsedTotal > 0 && totalPeople > 1 && (
        <View className="bg-emerald-50 dark:bg-[#183C2D] rounded-2xl p-4 border-[1.5px] border-emerald-200 dark:border-[#2B624A] mb-4">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-[#20503B] items-center justify-center">
              <Ionicons name="calculator-outline" size={18} color="#0D9488" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-bold text-emerald-900 dark:text-[#A6E8C7]">Kişi Başına Düşen Pay</Text>
              <Text className="text-[11px] text-emerald-700 dark:text-[#70E0B0] mt-0.5">{localizeFormat('{0} kişi arasında eşit paylaşıldı.', [totalPeople])}</Text>
            </View>
              <Text className="text-lg font-bold text-emerald-900 dark:text-[#A6E8C7]">{formatCurrency(participantShare)}</Text>
          </View>
          <View className="h-[1px] bg-emerald-200 dark:bg-[#2B624A] my-2.5" />
          <Text className="text-[11px] text-emerald-700 dark:text-[#70E0B0] leading-snug">
            {localizeFormat('Sizin payınız ({0}) gider olarak kaydedilecek; kalan {1} kişi için alacak oluşturulacak.', [formatCurrency(myShare), names.length])}
          </Text>
        </View>
      )}

      {error ? <Text className="text-rose-500 text-xs font-semibold mb-2.5">{error}</Text> : null}
      {successMessage ? <Text className="text-emerald-600 text-[13px] font-bold mb-2.5">{successMessage}</Text> : null}
    </HeroUIModal>
  );
};
