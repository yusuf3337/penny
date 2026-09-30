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
import { parseAmountSafely, formatNumberInput } from '../../utils/formatters';
import { useData } from '../../context/DataContext';

interface AddBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (categoryName: string, allocatedAmount: number, iconName?: string, color?: string) => void;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ visible, onClose, onSave }) => {
  const { categories: contextCategories } = useData();
  const [selectedCategory, setSelectedCategory] = useState('Yemek');
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState('');

  const fallbackCategories = [
    { name: 'Sağlık', icon: 'medical-outline', color: '#10B981' },
    { name: 'Faturalar', icon: 'receipt-outline', color: '#6366F1' },
    { name: 'Yemek', icon: 'fast-food-outline', color: '#EF4444' },
    { name: 'Ulaşım', icon: 'bus-outline', color: '#8B5CF6' },
    { name: 'Eğlence', icon: 'game-controller-outline', color: '#EC4899' },
    { name: 'Teknoloji', icon: 'laptop-outline', color: '#3B82F6' },
    { name: 'Ev', icon: 'home-outline', color: '#F59E0B' },
  ];

  const expenseCategories = contextCategories && contextCategories.length > 0
    ? contextCategories.filter((c) => c.type === 'expense').map((c) => ({
        name: c.name,
        icon: c.icon,
        color: c.color,
      }))
    : fallbackCategories;

  const handleSave = () => {
    const allocated = parseAmountSafely(amountInput);
    if (allocated <= 0) {
      setError('Lütfen geçerli bir bütçe limiti girin.');
      return;
    }

    const catObj = expenseCategories.find((c) => c.name === selectedCategory);

    onSave(
      selectedCategory,
      allocated,
      catObj ? catObj.icon : 'pricetag-outline',
      catObj ? catObj.color : '#0D9488'
    );

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
            <Text style={styles.headerTitle}>Bütçe Limiti Belirle</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Category selection */}
            <Text style={styles.inputLabel}>Kategori Seçin</Text>
            <View style={styles.catGrid}>
              {expenseCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.catChip,
                    selectedCategory === cat.name && styles.catChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={
                      selectedCategory === cat.name
                        ? COLORS.primaryForeground
                        : COLORS.foreground
                    }
                  />
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategory === cat.name && styles.catChipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Allocated Amount */}
            <Text style={styles.inputLabel}>Aylık Bütçe Limiti (₺)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 2.500 veya 1.000.000"
              placeholderTextColor={COLORS.mutedText}
              keyboardType="numeric"
              value={amountInput}
              onChangeText={(text) => {
                setAmountInput(formatNumberInput(text));
                if (error) setError('');
              }}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Bütçeyi Kaydet</Text>
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mutedText,
    marginBottom: 8,
    marginTop: 10,
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
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 6,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  catChipTextActive: {
    color: '#FFF',
  },
  errorText: {
    color: COLORS.roseText,
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
