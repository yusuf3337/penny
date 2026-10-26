import { getCurrencySymbol } from '../../context/CurrencyContext';
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { parseAmountSafely, formatNumberInput } from '../../utils/formatters';
import { useData } from '../../context/DataContext';
import { DEFAULT_CATEGORIES } from '../../services/storageService';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { CategoryBudget } from '../../types';
import { COLORS } from '../../constants/colors';

interface AddBudgetModalProps {
  visible: boolean;
  initialBudget?: CategoryBudget | null;
  onClose: () => void;
  onSave: (categoryName: string, allocatedAmount: number, iconName?: string, color?: string, budgetId?: string) => Promise<void> | void;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ visible, initialBudget, onClose, onSave }) => {
  const { categories: contextCategories, budgets, handleAddCategory } = useData();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSelectedCategory(initialBudget?.categoryName ?? '');
    setAmountInput(initialBudget ? formatNumberInput(String(initialBudget.allocatedAmount)) : '');
    setError('');
    setCategoryError('');
    setNewCategoryName('');
    setShowCategoryInput(false);
  }, [visible, initialBudget?.id]);

  const expenseCategories = contextCategories && contextCategories.length > 0
    ? contextCategories.filter((c) => c.type === 'expense')
    : DEFAULT_CATEGORIES.filter((c) => c.type === 'expense');

  const openCategoryCreation = () => {
    setShowCategoryInput((current) => !current);
    setCategoryError('');
  };

  const createCategory = async () => {
    if (isSaving) return;
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError('Lütfen bir kategori adı girin.');
      return;
    }
    const existing = expenseCategories.find((category) => category.name.trim().toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'));
    if (existing) {
      setSelectedCategory(existing.name);
      setCategoryError('');
      setNewCategoryName('');
      setShowCategoryInput(false);
      return;
    }
    setIsSaving(true);
    try {
      await handleAddCategory(name, 'expense');
      setSelectedCategory(name);
      setNewCategoryName('');
      setCategoryError('');
      setShowCategoryInput(false);
    } catch {
      setCategoryError('Kategori oluşturulamadı. Tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    const catObj = expenseCategories.find((category) => category.name === selectedCategory);
    if (!catObj) {
      setCategoryError('Kategori Seçin');
      return;
    }
    const allocated = parseAmountSafely(amountInput);
    if (allocated <= 0) {
      setError('Lütfen geçerli bir bütçe limiti girin.');
      return;
    }

    if (budgets.some((budget) => budget.id !== initialBudget?.id && budget.categoryName.trim().toLocaleLowerCase('tr-TR') === selectedCategory.trim().toLocaleLowerCase('tr-TR'))) {
      setCategoryError('Bu kategori için zaten bir zarf var.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(selectedCategory, allocated, catObj.icon, catObj.color, initialBudget?.id);
      setAmountInput('');
      setSelectedCategory('');
      setError('');
      setCategoryError('');
      onClose();
    } catch {
      setError('Bütçe kaydedilemedi. Tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title={initialBudget ? 'Zarfı Düzenle' : 'Bütçe Limiti Belirle'}
      subtitle="Kategoriye harcama sınırı koyun, bütçenizi aşmayın."
      badge={{ text: 'ZARF BÜTÇESİ', color: '#0D9488', bg: '#CCFBF1' }}
      footer={
        <HeroUIButton
          variant="primary"
          size="lg"
          onPress={handleSave}
          icon="checkmark-circle-outline"
          disabled={isSaving}
          isLoading={isSaving}
        >
          {initialBudget ? 'Değişiklikleri Kaydet' : 'Bütçeyi Kaydet'}
        </HeroUIButton>
      }
    >
      {/* Category selection */}
      <View className="flex-row items-center justify-between mb-2.5">
        <Text className="text-[13px] font-bold text-zinc-700 dark:text-[#D5E0F8]">Kategori Seçin</Text>
        <TouchableOpacity onPress={openCategoryCreation} className="flex-row items-center gap-1" activeOpacity={0.7}>
          <Ionicons name="add" size={15} color={COLORS.primary} />
          <Text className="text-xs font-bold text-brand dark:text-brand">Yeni Kategori</Text>
        </TouchableOpacity>
      </View>
      {showCategoryInput && (
        <View className="mb-3 rounded-2xl bg-zinc-50 dark:bg-[#1E2A48] p-3">
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
            <TouchableOpacity className="flex-1 items-center justify-center rounded-xl bg-zinc-200 dark:bg-[#2B3A5D] py-2.5" onPress={() => { setShowCategoryInput(false); setCategoryError(''); }}>
              <Text className="text-sm font-semibold text-zinc-700 dark:text-[#D5E0F8]">Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 items-center justify-center rounded-xl bg-brand py-2.5" onPress={createCategory} disabled={isSaving}>
              <Text className="text-sm font-semibold text-brand-foreground">Kategoriyi Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View className="flex-row flex-wrap gap-2 mb-5">
        {expenseCategories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <TouchableOpacity
              key={cat.name}
              className={`flex-row items-center gap-1.5 py-2 px-3 rounded-[14px] border-[1.5px] ${
                isSelected
                  ? 'border-brand bg-brand-soft dark:bg-brand-soft shadow-sm'
                  : 'border-transparent bg-zinc-100 dark:bg-[#1E2A48]'
              }`}
              onPress={() => { setSelectedCategory(cat.name); setCategoryError(''); }}
              activeOpacity={0.75}
            >
              <View
                className={`w-6 h-6 rounded-full items-center justify-center ${
                  isSelected ? 'bg-white dark:bg-[#17213A]' : 'bg-zinc-200 dark:bg-[#2B3A5D]/60'
                }`}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={15}
                  color={isSelected ? COLORS.primary : COLORS.mutedText}
                />
              </View>
              <Text
                className={`text-[13px] ${
                  isSelected ? 'font-bold text-brand dark:text-brand' : 'font-semibold text-zinc-700 dark:text-[#D5E0F8]'
                }`}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!!categoryError && !showCategoryInput && <Text className="text-xs text-rose-500 font-semibold mb-3">{categoryError}</Text>}

      {/* Allocated Amount */}
      <HeroUIInput
        label="Aylık Bütçe Limiti"
        prefix={getCurrencySymbol()}
        placeholder="Örn: 2.500 veya 10.000"
        keyboardType="numeric"
        value={amountInput}
        onChangeText={(text) => {
          setAmountInput(formatNumberInput(text));
          if (error) setError('');
        }}
        errorMessage={error}
        description={initialBudget
          ? 'Kategori değişirse harcamalar yeni kategoriye göre hesaplanır.'
          : 'Bu kategorideki harcamalar zarfınızdan otomatik düşer.'}
      />
    </HeroUIModal>
  );
};
