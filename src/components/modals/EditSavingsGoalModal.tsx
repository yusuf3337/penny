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

interface EditSavingsGoalModalProps {
  visible: boolean;
  currentGoal: SavingsGoal;
  onClose: () => void;
  onSave: (updatedGoal: SavingsGoal) => void;
}

export const EditSavingsGoalModal: React.FC<EditSavingsGoalModalProps> = ({
  visible,
  currentGoal,
  onClose,
  onSave,
}) => {
  const [targetInput, setTargetInput] = useState('');
  const [savedInput, setSavedInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setTargetInput(currentGoal.targetAmount ? currentGoal.targetAmount.toString() : '');
      setSavedInput(currentGoal.savedAmount ? currentGoal.savedAmount.toString() : '');
      setError('');
    }
  }, [visible, currentGoal]);

  const handleSave = () => {
    const targetVal = parseFloat(targetInput.replace(',', '.'));
    const savedVal = parseFloat(savedInput.replace(',', '.')) || 0;

    if (isNaN(targetVal) || targetVal <= 0) {
      setError('Lütfen geçerli bir hedef tutar girin.');
      return;
    }

    const percentage = Math.min(Math.round((savedVal / targetVal) * 100), 100);
    const remainingAmount = Math.max(targetVal - savedVal, 0);

    onSave({
      id: currentGoal.id || `goal_${Date.now()}`,
      title: currentGoal.title || 'Tasarruf hedefi',
      category: currentGoal.category || 'Genel',
      savedAmount: savedVal,
      targetAmount: targetVal,
      percentage,
      remainingAmount,
      isCompleted: savedVal >= targetVal,
    });

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
            <Text style={styles.headerTitle}>Tasarruf Hedefini Düzenle</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Hedef Tutar (₺)</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 10000"
            placeholderTextColor={COLORS.mutedText}
            keyboardType="numeric"
            value={targetInput}
            onChangeText={(text) => {
              setTargetInput(text);
              if (error) setError('');
            }}
          />

          <Text style={styles.label}>Şu Ana Kadar Biriken Tutar (₺)</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 6800"
            placeholderTextColor={COLORS.mutedText}
            keyboardType="numeric"
            value={savedInput}
            onChangeText={(text) => {
              setSavedInput(text);
              if (error) setError('');
            }}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Kaydet</Text>
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
    borderRadius: 28,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mutedText,
    marginTop: 12,
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
    color: COLORS.expense,
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
