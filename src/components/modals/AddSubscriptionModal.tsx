import { getCurrencySymbol } from '../../context/CurrencyContext';
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { SubscriptionItem } from '../../types';
import { parseAmountSafely, calculateNextDueDate, formatNumberInput } from '../../utils/formatters';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';

interface AddSubscriptionModalProps {
  visible: boolean;
  initialSub?: SubscriptionItem | null;
  onClose: () => void;
  onSave: (sub: Partial<SubscriptionItem> & Omit<SubscriptionItem, 'id'> & { id?: string }) => void;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  visible,
  initialSub,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentDay, setPaymentDay] = useState<number>(new Date().getDate());
  const [category, setCategory] = useState('Eğlence');
  const [accountType, setAccountType] = useState<'bank' | 'cash'>('bank');
  const [selectedIcon, setSelectedIcon] = useState('repeat-outline');
  const [selectedColor, setSelectedColor] = useState(COLORS.primary);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialSub) {
        setTitle(initialSub.title || '');
        setAmountInput(initialSub.amount ? formatNumberInput(initialSub.amount.toString()) : '');
        setCycle(initialSub.cycle || 'monthly');
        setPaymentDay(initialSub.paymentDay || new Date().getDate());
        setCategory(initialSub.category || 'Eğlence');
        setAccountType(initialSub.accountType || 'bank');
        setSelectedIcon(initialSub.iconName || 'repeat-outline');
        setSelectedColor(initialSub.color || COLORS.primary);
      } else {
        setTitle('');
        setAmountInput('');
        setCycle('monthly');
        setPaymentDay(new Date().getDate());
        setCategory('Eğlence');
        setAccountType('bank');
        setSelectedIcon('repeat-outline');
        setSelectedColor(COLORS.primary);
      }
      setError('');
    }
  }, [visible, initialSub]);

  // Popular Brand Presets
  const presets = [
    { name: 'Spotify', icon: 'musical-notes-outline', color: '#1DB954', category: 'Eğlence' },
    { name: 'YouTube Premium', icon: 'logo-youtube', color: '#FF0000', category: 'Eğlence' },
    { name: 'Netflix', icon: 'tv-outline', color: '#E50914', category: 'Eğlence' },
    { name: 'PlayStation Plus', icon: 'logo-playstation', color: '#003791', category: 'Eğlence' },
    { name: 'Steam', icon: 'game-controller-outline', color: '#171A21', category: 'Teknoloji' },
    { name: 'Twitch', icon: 'logo-twitch', color: '#9146FF', category: 'Eğlence' },
    { name: 'iCloud / Apple', icon: 'cloud-outline', color: '#007AFF', category: 'Teknoloji' },
    { name: 'S Sport Plus', icon: 'trophy-outline', color: '#E11D48', category: 'Eğlence' },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setTitle(p.name);
    setSelectedIcon(p.icon);
    setSelectedColor(p.color);
    setCategory(p.category);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError('Lütfen abonelik adını girin.');
      return;
    }
    const amount = parseAmountSafely(amountInput);
    if (amount <= 0) {
      setError('Lütfen geçerli bir abonelik tutarı girin.');
      return;
    }

    const safeDay = Math.min(Math.max(paymentDay || 1, 1), 31);
    const nextDueDate =
      initialSub?.nextDueDate &&
      initialSub.paymentDay === safeDay &&
      initialSub.cycle === cycle
        ? initialSub.nextDueDate
        : calculateNextDueDate(safeDay, cycle);

    onSave({
      ...(initialSub ? { id: initialSub.id, lastProcessedDate: initialSub.lastProcessedDate } : {}),
      title: title.trim(),
      amount,
      cycle,
      paymentDay: safeDay,
      category,
      accountType,
      nextDueDate,
      isActive: true,
      iconName: selectedIcon,
      color: selectedColor,
    });

    setTitle('');
    setAmountInput('');
    setError('');
    onClose();
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title={initialSub ? 'Aboneliği Düzenle' : 'Yeni Abonelik Ekle'}
      subtitle="Tekrarlayan aylık veya yıllık sabit giderlerinizi takip edin."
      badge={{
        text: initialSub ? 'DÜZENLEME' : 'ABONELİK',
        color: '#6366F1',
        bg: '#EEF2FF',
      }}
      footer={
        <HeroUIButton
          variant="primary"
          size="lg"
          onPress={handleSave}
          icon="calendar-outline"
        >
          {initialSub ? 'Değişiklikleri Kaydet' : 'Aboneliği Kaydet'}
        </HeroUIButton>
      }
    >
      {/* Popüler Marka Kısayolları */}
      <Text className="text-[13px] font-bold text-zinc-700 dark:text-[#C2D4C8] mb-2">Hazır Servis Seçin</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row mb-4"
        contentContainerClassName="pr-2.5"
      >
        {presets.map((p) => {
          const isSelected = title === p.name;
          return (
            <TouchableOpacity
              key={p.name}
              className={`flex-row items-center gap-1.5 px-3 py-2 rounded-2xl border-[1.5px] mr-2 ${
                isSelected
                  ? 'bg-zinc-100 dark:bg-[#22332D]'
                  : 'bg-zinc-100 dark:bg-[#22332D] border-transparent'
              }`}
              style={isSelected ? { borderColor: p.color, backgroundColor: `${p.color}15` } : {}}
              onPress={() => applyPreset(p)}
              activeOpacity={0.75}
            >
              <Ionicons name={p.icon as any} size={16} color={p.color} />
              <Text
                className={`text-xs ${
                  isSelected ? 'font-bold' : 'font-semibold text-zinc-900 dark:text-[#EAF2EE]'
                }`}
                style={isSelected ? { color: p.color } : {}}
              >
                {p.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <HeroUIInput
        label="Abonelik Adı"
        placeholder="Örn: Spotify, YouTube Premium..."
        startIcon="repeat-outline"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (error) setError('');
        }}
        errorMessage={!title.trim() && error ? error : undefined}
      />

      {/* HeroUI Segmented Tabs for Cycle */}
      <Text className="text-[13px] font-bold text-zinc-700 dark:text-[#C2D4C8] mb-2">Ödeme Periyodu</Text>
      <View className="flex-row bg-zinc-100 dark:bg-[#22332D] rounded-2xl p-1 mb-4">
        <TouchableOpacity
          className={`flex-1 py-2.5 items-center rounded-[13px] ${
            cycle === 'monthly' ? 'bg-white dark:bg-[#182521] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => setCycle('monthly')}
          activeOpacity={0.8}
        >
          <Text
            className={`text-[13px] ${
              cycle === 'monthly' ? 'font-bold text-[#0D9488] dark:text-[#66C9AE]' : 'font-semibold text-zinc-500 dark:text-[#A9BDB2]'
            }`}
          >
            Aylık Ödeme
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2.5 items-center rounded-[13px] ${
            cycle === 'yearly' ? 'bg-white dark:bg-[#182521] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => setCycle('yearly')}
          activeOpacity={0.8}
        >
          <Text
            className={`text-[13px] ${
              cycle === 'yearly' ? 'font-bold text-[#0D9488] dark:text-[#66C9AE]' : 'font-semibold text-zinc-500 dark:text-[#A9BDB2]'
            }`}
          >
            Yıllık Ödeme
          </Text>
        </TouchableOpacity>
      </View>

      <HeroUIInput
        label="Aylık Ödeme Günü (1 - 31)"
        placeholder="Örn: 15"
        keyboardType="numeric"
        value={paymentDay ? paymentDay.toString() : ''}
        onChangeText={(text) => {
          const dayNum = parseInt(text, 10);
          setPaymentDay(isNaN(dayNum) ? 0 : dayNum);
        }}
        startIcon="calendar-outline"
        description="Abonelik ücretinin hesabınızdan çekildiği gün."
      />

      {/* HeroUI Segmented Tabs for Account */}
      <Text className="text-[13px] font-bold text-zinc-700 dark:text-[#C2D4C8] mb-2">Ödeme Hesabı</Text>
      <View className="flex-row bg-zinc-100 dark:bg-[#22332D] rounded-2xl p-1 mb-4">
        <TouchableOpacity
          className={`flex-1 py-2.5 items-center rounded-[13px] ${
            accountType === 'bank' ? 'bg-white dark:bg-[#182521] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => setAccountType('bank')}
          activeOpacity={0.8}
        >
          <Text
            className={`text-[13px] ${
              accountType === 'bank' ? 'font-bold text-[#0D9488] dark:text-[#66C9AE]' : 'font-semibold text-zinc-500 dark:text-[#A9BDB2]'
            }`}
          >
            Banka Hesabı
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2.5 items-center rounded-[13px] ${
            accountType === 'cash' ? 'bg-white dark:bg-[#182521] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => setAccountType('cash')}
          activeOpacity={0.8}
        >
          <Text
            className={`text-[13px] ${
              accountType === 'cash' ? 'font-bold text-[#0D9488] dark:text-[#66C9AE]' : 'font-semibold text-zinc-500 dark:text-[#A9BDB2]'
            }`}
          >
            Nakit Cüzdan
          </Text>
        </TouchableOpacity>
      </View>

      <HeroUIInput
        label="Tutar"
        prefix={getCurrencySymbol()}
        placeholder="Örn: 79,99"
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
    </HeroUIModal>
  );
};
