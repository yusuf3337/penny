import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { AppTransaction, TransactionType, Account } from '../../types';
import { getAccounts, DEFAULT_CATEGORIES } from '../../services/storageService';
import { formatNumberInput, parseAmountSafely } from '../../utils/formatters';
import { useData } from '../../context/DataContext';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (tx: Omit<AppTransaction, 'id' | 'date'>) => void;
  onOpenAddCategory?: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  onSave,
  onOpenAddCategory,
}) => {
  const { categories: contextCategories } = useData();
  const categoriesList = contextCategories && contextCategories.length > 0
    ? contextCategories
    : DEFAULT_CATEGORIES;

  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [error, setError] = useState('');

  const filteredCategories = categoriesList.filter((c) => c.type === type);

  useEffect(() => {
    if (visible) {
      getAccounts().then((accs) => {
        setAccounts(accs);
        if (accs.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accs[0].id);
        }
      });
    }
  }, [visible]);

  // Update selectedCategory whenever type or filteredCategories changes
  useEffect(() => {
    if (filteredCategories.length > 0) {
      // Keep existing selection if valid for new type, otherwise default to first matching category
      const isValid = filteredCategories.some((c) => c.name === selectedCategory);
      if (!isValid) {
        setSelectedCategory(filteredCategories[0].name);
      }
    }
  }, [type, filteredCategories]);

  const handleSave = () => {
    if (!title.trim()) {
      setError('Lütfen bir başlık veya açıklama girin.');
      return;
    }
    const parsedAmount = parseAmountSafely(amountInput);
    if (parsedAmount <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }

    const categoryToUse = selectedCategory || (filteredCategories.length > 0 ? filteredCategories[0].name : 'Genel');

    const formattedAmount = `${type === 'income' ? '+' : '-'}₺${parsedAmount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
    })}`;

    let iconName = 'pricetag-outline';
    const foundCat = categoriesList.find((c) => c.name === categoryToUse);
    if (foundCat) iconName = foundCat.icon;
    else if (type === 'income') iconName = 'arrow-down-left';

    const selectedAcc = accounts.find((a) => a.id === selectedAccountId);

    onSave({
      title: title.trim(),
      category: categoryToUse,
      amount: formattedAmount,
      rawAmount: parsedAmount,
      type,
      iconName,
      accountId: selectedAccountId,
      accountName: selectedAcc ? selectedAcc.name : undefined,
    });

    // Reset inputs
    setTitle('');
    setAmountInput('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Yeni İşlem Ekle</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type Selector (Gider / Gelir) */}
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeTab,
                  type === 'expense' && styles.activeExpenseTab,
                ]}
                onPress={() => setType('expense')}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={20}
                  color={type === 'expense' ? COLORS.primaryForeground : COLORS.mutedText}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    type === 'expense' && styles.activeTypeTabText,
                  ]}
                >
                  Gider
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeTab,
                  type === 'income' && styles.activeIncomeTab,
                ]}
                onPress={() => setType('income')}
              >
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={20}
                  color={type === 'income' ? COLORS.primaryForeground : COLORS.mutedText}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    type === 'income' && styles.activeTypeTabText,
                  ]}
                >
                  Gelir
                </Text>
              </TouchableOpacity>
            </View>

            {/* Account Selector Chips */}
            {accounts.length > 0 ? (
              <>
                <Text style={styles.inputLabel}>Kasa / Hesap</Text>
                <View style={styles.categoryWrap}>
                  {accounts.map((acc) => (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        styles.chip,
                        selectedAccountId === acc.id && styles.activeChip,
                      ]}
                      onPress={() => setSelectedAccountId(acc.id)}
                    >
                      <Ionicons
                        name={acc.type === 'cash' ? 'wallet-outline' : 'card-outline'}
                        size={14}
                        color={
                          selectedAccountId === acc.id
                            ? COLORS.primaryForeground
                            : COLORS.foreground
                        }
                      />
                      <Text
                        style={[
                          styles.chipText,
                          selectedAccountId === acc.id && styles.activeChipText,
                        ]}
                      >
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}

            {/* Title Input */}
            <Text style={styles.inputLabel}>İşlem Başlığı / Açıklama</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Market Alışverişi, Maaş, Hastane..."
              placeholderTextColor={COLORS.mutedText}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError('');
              }}
            />

            {/* Amount Input */}
            <Text style={styles.inputLabel}>Tutar (₺)</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00 veya 1.000.000"
              placeholderTextColor={COLORS.mutedText}
              keyboardType="numeric"
              value={amountInput}
              onChangeText={(text) => {
                setAmountInput(formatNumberInput(text));
                if (error) setError('');
              }}
            />

            {/* Category Chips */}
            <View style={styles.categoryHeader}>
              <Text style={styles.inputLabel}>Kategori</Text>
              {onOpenAddCategory ? (
                <TouchableOpacity onPress={onOpenAddCategory} activeOpacity={0.7}>
                  <Text style={styles.addCategoryLink}>+ Özel Kategori Ekle</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.categoryWrap}>
              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    selectedCategory === cat.name && styles.activeChip,
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={
                      selectedCategory === cat.name
                        ? COLORS.primaryForeground
                        : COLORS.foreground
                    }
                  />
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === cat.name && styles.activeChipText,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  activeExpenseTab: {
    backgroundColor: COLORS.expense,
  },
  activeIncomeTab: {
    backgroundColor: COLORS.primary,
  },
  typeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  activeTypeTabText: {
    color: COLORS.primaryForeground,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mutedText,
    marginBottom: 6,
    marginTop: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  addCategoryLink: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.foreground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 4,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.foreground,
    fontWeight: '500',
  },
  activeChipText: {
    color: COLORS.primaryForeground,
  },
  errorText: {
    color: COLORS.expense,
    fontSize: 12,
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  saveButtonText: {
    color: COLORS.primaryForeground,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
