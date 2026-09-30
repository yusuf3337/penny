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
import { SavingsGoal } from '../../types';
import { parseAmountSafely, formatNumberInput } from '../../utils/formatters';

interface AddGoalModalProps {
  visible: boolean;
  initialGoal?: SavingsGoal | null;
  onClose: () => void;
  onSave: (goal: Partial<SavingsGoal>) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  initialGoal,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Birikim');
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [savedAmountInput, setSavedAmountInput] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('flag-outline');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialGoal) {
        setTitle(initialGoal.title || '');
        setCategory(initialGoal.category || 'Birikim');
        setTargetAmountInput(
          initialGoal.targetAmount ? formatNumberInput(initialGoal.targetAmount.toString()) : ''
        );
        setSavedAmountInput(
          initialGoal.savedAmount ? formatNumberInput(initialGoal.savedAmount.toString()) : ''
        );
        setSelectedIcon(initialGoal.iconName || 'flag-outline');
      } else {
        setTitle('');
        setCategory('Birikim');
        setTargetAmountInput('');
        setSavedAmountInput('');
        setSelectedIcon('flag-outline');
      }
      setError('');
    }
  }, [visible, initialGoal]);

  const icons = [
    'flag-outline',
    'shield-checkmark-outline',
    'airplane-outline',
    'laptop-outline',
    'car-outline',
    'home-outline',
    'cart-outline',
    'heart-outline',
  ];

  const handleSave = () => {
    if (!title.trim()) {
      setError('Lütfen bir hedef başlığı girin.');
      return;
    }
    const target = parseAmountSafely(targetAmountInput);
    if (target <= 0) {
      setError('Lütfen geçerli bir hedef tutar girin.');
      return;
    }
    const saved = parseAmountSafely(savedAmountInput);

    onSave({
      ...(initialGoal ? { id: initialGoal.id } : {}),
      title: title.trim(),
      category: category.trim() || 'Birikim',
      targetAmount: target,
      savedAmount: saved,
      iconName: selectedIcon,
    });

    // Reset
    setTitle('');
    setCategory('Birikim');
    setTargetAmountInput('');
    setSavedAmountInput('');
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
            <Text style={styles.headerTitle}>
              {initialGoal ? 'Hedefi Düzenle' : 'Yeni Hedef Ekle'}
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <Text style={styles.inputLabel}>Hedef Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Ev Peşinatı, Yeni Araba..."
              placeholderTextColor={COLORS.mutedText}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError('');
              }}
            />

            {/* Category Input */}
            <Text style={styles.inputLabel}>Kategori / Etiket</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Birikim, Seyahat, Elektronik"
              placeholderTextColor={COLORS.mutedText}
              value={category}
              onChangeText={setCategory}
            />

            {/* Target Amount */}
            <Text style={styles.inputLabel}>Hedef Tutar (₺)</Text>
            <TextInput
              style={styles.input}
              placeholder="50.000 veya 1.000.000"
              placeholderTextColor={COLORS.mutedText}
              keyboardType="numeric"
              value={targetAmountInput}
              onChangeText={(text) => {
                setTargetAmountInput(formatNumberInput(text));
                if (error) setError('');
              }}
            />

            {/* Initial Saved Amount */}
            <Text style={styles.inputLabel}>Mevcut Birikim (₺) - Opsiyonel</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={COLORS.mutedText}
              keyboardType="numeric"
              value={savedAmountInput}
              onChangeText={(text) => setSavedAmountInput(formatNumberInput(text))}
            />

            {/* Icon Picker */}
            <Text style={styles.inputLabel}>İkon Seçin</Text>
            <View style={styles.iconRow}>
              {icons.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconBox,
                    selectedIcon === ic && styles.iconBoxSelected,
                  ]}
                  onPress={() => setSelectedIcon(ic)}
                >
                  <Ionicons
                    name={ic as any}
                    size={20}
                    color={selectedIcon === ic ? COLORS.primaryForeground : COLORS.foreground}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {initialGoal ? 'Hedefi Güncelle' : 'Hedef Oluştur'}
              </Text>
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
    marginBottom: 6,
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
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  iconBoxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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
