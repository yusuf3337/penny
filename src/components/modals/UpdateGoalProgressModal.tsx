import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { SavingsGoal } from '../../types';
import { parseAmountSafely, formatCurrency, formatNumberInput } from '../../utils/formatters';

interface UpdateGoalProgressModalProps {
  visible: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onSave: (goal: Partial<SavingsGoal>) => void;
}

export const UpdateGoalProgressModal: React.FC<UpdateGoalProgressModalProps> = ({
  visible,
  goal,
  onClose,
  onSave,
}) => {
  const [addAmountInput, setAddAmountInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setAddAmountInput('');
    setError('');
  }, [visible, goal]);

  if (!goal) return null;

  const handleAddSavings = () => {
    const added = parseAmountSafely(addAmountInput);
    if (added <= 0) {
      setError('Lütfen birimim tutarı girin.');
      return;
    }

    const newSaved = goal.savedAmount + added;
    const percentage = Math.min(Math.round((newSaved / goal.targetAmount) * 100), 100);

    onSave({
      id: goal.id,
      savedAmount: newSaved,
      targetAmount: goal.targetAmount,
      percentage,
      remainingAmount: Math.max(goal.targetAmount - newSaved, 0),
      isCompleted: newSaved >= goal.targetAmount,
    });

    setAddAmountInput('');
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
            <View>
              <Text style={styles.headerTitle}>Birikim Ekle / Güncelle</Text>
              <Text style={styles.goalSubTitle}>{goal.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          {/* Current Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Biriken</Text>
              <Text style={styles.infoValue}>{formatCurrency(goal.savedAmount)}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Hedef Tutar</Text>
              <Text style={styles.infoValue}>{formatCurrency(goal.targetAmount)}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Kalan</Text>
              <Text style={styles.infoValue}>{formatCurrency(goal.remainingAmount)}</Text>
            </View>
          </View>

          {/* Add Amount Input */}
          <Text style={styles.inputLabel}>Eklenecek Birikim Tutarı (₺)</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 1.000 veya 1.000.000"
            placeholderTextColor={COLORS.mutedText}
            keyboardType="numeric"
            value={addAmountInput}
            onChangeText={(text) => {
              setAddAmountInput(formatNumberInput(text));
              if (error) setError('');
            }}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleAddSavings}>
            <Text style={styles.saveBtnText}>+ Birikime Ekle</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  goalSubTitle: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  infoCol: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.foreground,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mutedText,
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
  errorText: {
    color: COLORS.roseText,
    fontSize: 12,
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: COLORS.primaryForeground,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
