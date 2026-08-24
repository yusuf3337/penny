import React, { useState } from 'react';
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
    const parsedAmount = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }

    onSave(title.trim(), parsedAmount, type, frequency, category);

    // Reset
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
            <Text style={styles.headerTitle}>Tekrarlayan İşlem Ekle</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type Selector */}
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeTab, type === 'expense' && styles.activeExpenseTab]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeTabText, type === 'expense' && styles.activeTypeTabText]}>
                  Düzenli Gider
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeTab, type === 'income' && styles.activeIncomeTab]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeTabText, type === 'income' && styles.activeTypeTabText]}>
                  Düzenli Gelir
                </Text>
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <Text style={styles.label}>İşlem Başlığı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Ev Kirası, İnternet Faturası, Yevmiye..."
              placeholderTextColor={COLORS.mutedText}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError('');
              }}
            />

            {/* Amount Input */}
            <Text style={styles.label}>Tutar (₺)</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              placeholderTextColor={COLORS.mutedText}
              keyboardType="numeric"
              value={amountInput}
              onChangeText={(text) => {
                setAmountInput(text);
                if (error) setError('');
              }}
            />

            {/* Frequency Selector */}
            <Text style={styles.label}>Tekrarlanma Periyodu</Text>
            <View style={styles.chipWrap}>
              <TouchableOpacity
                style={[styles.chip, frequency === 'daily' && styles.activeChip]}
                onPress={() => setFrequency('daily')}
              >
                <Text style={[styles.chipText, frequency === 'daily' && styles.activeChipText]}>
                  Her Gün
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chip, frequency === 'weekly' && styles.activeChip]}
                onPress={() => setFrequency('weekly')}
              >
                <Text style={[styles.chipText, frequency === 'weekly' && styles.activeChipText]}>
                  Her Hafta
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chip, frequency === 'monthly' && styles.activeChip]}
                onPress={() => setFrequency('monthly')}
              >
                <Text style={[styles.chipText, frequency === 'monthly' && styles.activeChipText]}>
                  Her Ay
                </Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Kaydet</Text>
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
    marginBottom: 16,
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
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeExpenseTab: {
    backgroundColor: COLORS.expense,
  },
  activeIncomeTab: {
    backgroundColor: COLORS.primary,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  activeTypeTabText: {
    color: COLORS.primaryForeground,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mutedText,
    marginTop: 10,
    marginBottom: 6,
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
  chipWrap: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.foreground,
  },
  activeChipText: {
    color: COLORS.primaryForeground,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.expense,
    fontSize: 12,
    marginTop: 12,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  saveBtnText: {
    color: COLORS.primaryForeground,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
