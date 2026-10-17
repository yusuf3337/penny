import { getCurrencySymbol } from '../../context/CurrencyContext';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { AppTransaction, Account } from '../../types';
import { getAccounts, DEFAULT_CATEGORIES } from '../../services/storageService';
import { formatNumberInput, parseAmountSafely, formatCurrency } from '../../utils/formatters';
import { getFormattingLocale } from '../../context/LocaleContext';
import { useData } from '../../context/DataContext';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { usePremium } from '../../context/PremiumContext';

interface AddTransactionModalProps {
  visible: boolean;
  initialTransaction?: AppTransaction | null;
  onClose: () => void;
  onSave: (tx: Omit<AppTransaction, 'id' | 'date'> & { date?: string }) => Promise<void> | void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  initialTransaction,
  onClose,
  onSave,
}) => {
  const { categories: contextCategories, budgets, handleAddCategory } = useData();
  const { isPro, openPaywall } = usePremium();
  const categoriesList = contextCategories && contextCategories.length > 0
    ? contextCategories
    : DEFAULT_CATEGORIES;

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [txDate, setTxDate] = useState<Date>(new Date());
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const pendingCategoryPaywall = useRef(false);

  const filteredCategories = useMemo(() => {
    const matching = categoriesList.filter((category) => category.type === type);
    if (type !== 'expense') return matching;
    const budgetNames = new Set(budgets.map((budget) => budget.categoryName.trim().toLocaleLowerCase('tr-TR')));
    return [...matching].sort((a, b) =>
      Number(budgetNames.has(b.name.trim().toLocaleLowerCase('tr-TR'))) -
      Number(budgetNames.has(a.name.trim().toLocaleLowerCase('tr-TR')))
    );
  }, [categoriesList, budgets, type]);
  const budgetNames = useMemo(
    () => new Set(budgets.map((budget) => budget.categoryName.trim().toLocaleLowerCase('tr-TR'))),
    [budgets]
  );

  useEffect(() => {
    if (visible) {
      setType(initialTransaction?.type === 'income' ? 'income' : 'expense');
      setTitle(initialTransaction?.title ?? '');
      setAmountInput(initialTransaction ? formatNumberInput(String(initialTransaction.rawAmount)) : '');
      setSelectedCategory(initialTransaction?.category ?? '');
      const existingDate = initialTransaction?.date ? new Date(initialTransaction.date) : new Date();
      setTxDate(Number.isNaN(existingDate.getTime()) ? new Date() : existingDate);
      setError('');
      setSelectionError('');
      setShowDetails(false);
      getAccounts().then((accs) => {
        setAccounts(accs);
        const matching = accs.find((acc) => acc.id === initialTransaction?.accountId)
          ?? accs.find((acc) => acc.type === initialTransaction?.accountType);
        setSelectedAccountId(matching?.id ?? accs[0]?.id ?? '');
      });
    }
  }, [visible, initialTransaction]);

  const createCategory = async () => {
    if (!isPro) return;
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError('Lütfen bir kategori adı girin.');
      return;
    }
    const existing = filteredCategories.find((category) => category.name.trim().toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'));
    if (existing) {
      setSelectedCategory(existing.name);
      setSelectionError('');
      setShowCategoryInput(false);
      setNewCategoryName('');
      setCategoryError('');
      return;
    }
    if (creatingCategory) return;
    setCreatingCategory(true);
    try {
      await handleAddCategory(name, type, type === 'expense' ? 'pricetag-outline' : 'arrow-down-circle-outline');
      setSelectedCategory(name);
      setSelectionError('');
      setNewCategoryName('');
      setCategoryError('');
      setShowCategoryInput(false);
    } catch {
      setCategoryError('Kategori oluşturulamadı. Tekrar deneyin.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const setToday = () => setTxDate(new Date());
  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setTxDate(d);
  };
  const stepDay = (delta: number) => {
    const d = new Date(txDate.getTime());
    d.setDate(d.getDate() + delta);
    setTxDate(d);
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isYesterday = (d: Date) => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    return d.toDateString() === yest.toDateString();
  };

  const handleSave = async () => {
    if (creatingCategory || saving) return;
    if (!title.trim()) {
      setError('Lütfen bir başlık veya açıklama girin.');
      return;
    }
    const parsedAmount = parseAmountSafely(amountInput);
    if (parsedAmount <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }

    const categoryToUse = filteredCategories.find((category) => category.name === selectedCategory)?.name;
    if (!categoryToUse) {
      setSelectionError('Kategori Seçin');
      return;
    }

    const formattedAmount = `${type === 'income' ? '+' : '-'}${formatCurrency(parsedAmount)}`;

    let iconName = 'pricetag-outline';
    const foundCat = categoriesList.find((c) => c.name === categoryToUse);
    if (foundCat) iconName = foundCat.icon;
    else if (type === 'income') iconName = 'arrow-down-left';

    const selectedAcc = accounts.find((a) => a.id === selectedAccountId);
    const accountType: 'bank' | 'cash' = selectedAcc ? (selectedAcc.type === 'cash' ? 'cash' : 'bank') : 'bank';

    setSaving(true);
    try {
    await onSave({
      title: title.trim(),
      category: categoryToUse,
      amount: formattedAmount,
      rawAmount: parsedAmount,
      type,
      iconName,
      accountId: selectedAccountId,
      accountName: selectedAcc ? selectedAcc.name : 'Banka Hesabı',
      accountType,
      date: txDate.toISOString(),
    });

    // Reset inputs
    setTitle('');
    setAmountInput('');
    setError('');
    setSelectedCategory('');
    setSelectionError('');
    setTxDate(new Date());
    setShowDetails(false);
    setShowCategoryInput(false);
    onClose();
    } catch {
      setError('İşlem kaydedilemedi. Tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      onDismiss={() => {
        if (pendingCategoryPaywall.current) {
          pendingCategoryPaywall.current = false;
          openPaywall('custom_category');
        }
      }}
      title={initialTransaction ? 'İşlemi Düzenle' : 'Yeni İşlem Ekle'}
      subtitle={initialTransaction ? 'İşlem bilgilerini güncelleyin.' : 'Gelir veya gider hareketlerinizi anında kaydedin.'}
      badge={{
        text: type === 'expense' ? 'GİDER' : 'GELİR',
        color: type === 'expense' ? '#BE123C' : '#047857',
        bg: type === 'expense' ? '#FFF1F2' : '#ECFDF5',
      }}
      footer={
        <HeroUIButton
          variant={type === 'expense' ? 'danger' : 'success'}
          size="lg"
          onPress={handleSave}
          disabled={creatingCategory || saving}
          icon={type === 'expense' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
        >
          {initialTransaction ? 'Değişiklikleri Kaydet' : type === 'expense' ? 'Gideri Kaydet' : 'Geliri Kaydet'}
        </HeroUIButton>
      }
    >
      {/* HeroUI Segmented Tabs for Transaction Type */}
      <View className="flex-row bg-zinc-100 dark:bg-[#22332D] rounded-[18px] p-1 mb-4 gap-1.5">
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-[14px] ${
            type === 'expense' ? 'bg-white dark:bg-[#182521] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => { setType('expense'); setSelectedCategory(''); setSelectionError(''); }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-up-circle"
            size={18}
            color={type === 'expense' ? '#F43F5E' : '#71717A'}
          />
          <Text
            className={`text-sm font-bold ${
              type === 'expense' ? 'text-rose-500' : 'text-zinc-500 dark:text-[#A9BDB2]'
            }`}
          >
            Gider
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-[14px] ${
            type === 'income' ? 'bg-white dark:bg-[#182521] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => { setType('income'); setSelectedCategory(''); setSelectionError(''); }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-down-circle"
            size={18}
            color={type === 'income' ? '#10B981' : '#71717A'}
          />
          <Text
            className={`text-sm font-bold ${
              type === 'income' ? 'text-emerald-500' : 'text-zinc-500 dark:text-[#A9BDB2]'
            }`}
          >
            Gelir
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title Input */}
      <HeroUIInput
        label="İşlem Başlığı"
        placeholder="Örn: Market Alışverişi, Maaş, Kahve..."
        startIcon="create-outline"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (error) setError('');
        }}
        errorMessage={!title.trim() && error ? error : undefined}
      />

      {/* Amount Input */}
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
      {!!error && !!title.trim() && parseAmountSafely(amountInput) > 0 && (
        <Text className="text-xs text-rose-500 font-semibold mb-3">{error}</Text>
      )}

      {/* Category selection stays visible so envelope spending is attributed correctly. */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[13px] font-bold text-zinc-700 dark:text-[#C2D4C8]">Kategori</Text>
        <TouchableOpacity
          onPress={() => {
            if (!isPro) {
              pendingCategoryPaywall.current = true;
              onClose();
              return;
            }
            setShowCategoryInput((current) => !current);
            setCategoryError('');
          }}
          activeOpacity={0.7}
          className="flex-row items-center gap-1"
        >
          <Ionicons name={isPro ? 'add' : 'lock-closed-outline'} size={15} color="#0D9488" />
          <Text className="text-xs font-bold text-[#0D9488] dark:text-[#66C9AE]">Yeni Kategori</Text>
          {!isPro && <Text className="text-[10px] font-bold text-[#0D9488] dark:text-[#66C9AE]">PRO</Text>}
        </TouchableOpacity>
      </View>

      {showCategoryInput && (
        <View className="mb-3 rounded-2xl bg-zinc-50 dark:bg-[#22332D] p-3">
          <HeroUIInput
            label="Kategori Adı"
            placeholder="Örn: Sağlık, Spor, Hobiler..."
            value={newCategoryName}
            onChangeText={(value) => {
              setNewCategoryName(value);
              if (categoryError) setCategoryError('');
            }}
            errorMessage={categoryError || undefined}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={createCategory}
          />
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-xl bg-zinc-200 dark:bg-[#2C4039] py-2.5"
              onPress={() => { setShowCategoryInput(false); setCategoryError(''); }}
            >
              <Text className="text-sm font-semibold text-zinc-700 dark:text-[#CCDCD2]">Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-xl bg-[#0D9488] py-2.5"
              onPress={createCategory}
              disabled={creatingCategory}
            >
              <Text className="text-sm font-semibold text-white">Kategoriyi Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className="flex-row flex-wrap gap-2 mb-3">
        {filteredCategories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const hasBudget = type === 'expense' && budgetNames.has(cat.name.trim().toLocaleLowerCase('tr-TR'));
          return (
            <TouchableOpacity
              key={cat.id}
              className={`flex-row items-center gap-1.5 py-2 px-3 rounded-[14px] border-[1.5px] ${
                isSelected
                  ? type === 'income'
                    ? 'bg-emerald-50 dark:bg-[#183C2D] border-emerald-500'
                    : 'bg-rose-50 dark:bg-[#44252E] border-rose-500'
                  : 'bg-zinc-100 dark:bg-[#22332D] border-transparent'
              }`}
              onPress={() => { setSelectedCategory(cat.name); setSelectionError(''); }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={cat.icon as any}
                size={15}
                color={isSelected ? (type === 'income' ? '#047857' : '#BE123C') : '#71717A'}
              />
              <Text className={`text-[13px] ${isSelected ? (type === 'income' ? 'text-emerald-700 dark:text-[#70E0B0] font-bold' : 'text-rose-700 dark:text-[#FDA4AF] font-bold') : 'text-zinc-500 dark:text-[#A9BDB2] font-semibold'}`}>
                {cat.name}
              </Text>
              {hasBudget && <Text className="text-[11px] font-bold text-[#0D9488] dark:text-[#66C9AE]">Zarf</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
      {!!selectionError && <Text className="text-xs text-rose-500 font-semibold mb-3">{selectionError}</Text>}

      <TouchableOpacity
        className="flex-row items-center justify-between rounded-xl bg-zinc-100 dark:bg-[#22332D] px-3 py-2.5 mb-3"
        onPress={() => setShowDetails((current) => !current)}
      >
        <Text className="text-[13px] font-semibold text-zinc-600 dark:text-[#A9BDB2]">Hesap ve tarih</Text>
        <Ionicons name={showDetails ? 'chevron-up' : 'chevron-down'} size={16} color="#71717A" />
      </TouchableOpacity>

      {showDetails && accounts.length > 0 && (
        <View className="mb-4">
          <Text className="text-[13px] font-bold text-zinc-700 dark:text-[#C2D4C8] mb-2">Hesap / Kasa</Text>
          <View className="flex-row flex-wrap gap-2">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <TouchableOpacity
                  key={acc.id}
                  className={`flex-row items-center gap-1.5 py-2 px-3 rounded-[14px] border-[1.5px] ${
                    isSelected
                      ? 'bg-teal-50 border-[#0D9488]'
                      : 'bg-zinc-100 dark:bg-[#22332D] border-transparent'
                  }`}
                  onPress={() => setSelectedAccountId(acc.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={acc.type === 'cash' ? 'wallet-outline' : 'card-outline'}
                    size={15}
                    color={isSelected ? '#0D9488' : '#71717A'}
                  />
                  <Text
                    className={`text-[13px] ${
                      isSelected ? 'font-bold text-teal-800' : 'font-semibold text-zinc-500 dark:text-[#A9BDB2]'
                    }`}
                  >
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Date Selector */}
      {showDetails && <>
      <Text className="text-[13px] font-bold text-zinc-700 dark:text-[#C2D4C8] mb-2">İşlem Tarihi</Text>
      <View className="flex-row items-center justify-between mb-4 gap-2.5">
        <View className="flex-row gap-1.5">
          <TouchableOpacity
            className={`py-2 px-3 rounded-xl border ${
              isToday(txDate)
                ? 'bg-teal-50 border-[#0D9488]'
                : 'bg-zinc-100 dark:bg-[#22332D] border-transparent'
            }`}
            onPress={setToday}
            activeOpacity={0.75}
          >
            <Text
              className={`text-xs ${
                isToday(txDate) ? 'font-bold text-teal-800' : 'font-semibold text-zinc-500 dark:text-[#A9BDB2]'
              }`}
            >
              Bugün
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-2 px-3 rounded-xl border ${
              isYesterday(txDate)
                ? 'bg-teal-50 border-[#0D9488]'
                : 'bg-zinc-100 dark:bg-[#22332D] border-transparent'
            }`}
            onPress={setYesterday}
            activeOpacity={0.75}
          >
            <Text
              className={`text-xs ${
                isYesterday(txDate) ? 'font-bold text-teal-800' : 'font-semibold text-zinc-500 dark:text-[#A9BDB2]'
              }`}
            >
              Dün
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-zinc-100 dark:bg-[#22332D] rounded-xl px-1 py-0.5">
          <TouchableOpacity
            className="w-7 h-7 rounded-full items-center justify-center"
            onPress={() => stepDay(-1)}
          >
            <Ionicons name="chevron-back" size={16} color="#18181B" />
          </TouchableOpacity>
          <Text className="text-xs font-bold text-zinc-900 dark:text-[#EAF2EE] px-2">
            {txDate.toLocaleDateString(getFormattingLocale(), { day: 'numeric', month: 'short' })}
          </Text>
          <TouchableOpacity
            className="w-7 h-7 rounded-full items-center justify-center"
            onPress={() => stepDay(1)}
          >
            <Ionicons name="chevron-forward" size={16} color="#18181B" />
          </TouchableOpacity>
        </View>
      </View>
      </>}
    </HeroUIModal>
  );
};
