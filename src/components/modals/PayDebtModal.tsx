import React, { useState } from 'react';
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
import { Debt } from '../../types';
import { parseAmountSafely, formatCurrency, formatNumberInput } from '../../utils/formatters';

interface PayDebtModalProps {
  visible: boolean;
  debt: Debt | null;
  onClose: () => void;
  onSave: (debtId: string, paidAmount: number) => void;
}

export const PayDebtModal: React.FC<PayDebtModalProps> = ({
  visible,
  debt,
  onClose,
  onSave,
}) => {
  const [payAmountInput, setPayAmountInput] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (debt) {
      const safeRem = Math.round((debt.remainingAmount || 0) * 100) / 100;
      const formattedRem = safeRem.toFixed(2).replace('.', ',');
      setPayAmountInput(formatNumberInput(formattedRem));
      setError('');
    }
  }, [debt]);

  if (!debt) return null;

  const handleSave = () => {
    const parsed = parseAmountSafely(payAmountInput);
    if (parsed <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }
    const safeRem = Math.round((debt.remainingAmount || 0) * 100) / 100;
    if (parsed > safeRem + 0.01) {
      setError(`En fazla ${formatCurrency(safeRem)} girebilirsiniz.`);
      return;
    }

    onSave(debt.id, parsed);
    setPayAmountInput('');
    setError('');
    onClose();
  };

  const isGiven = debt.type === 'given'; // Alacak

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isGiven ? 'Tahsilat Yap' : 'Ödeme Yap'}
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.personText}>{debt.personName}</Text>
            <Text style={styles.remText}>
              Kalan {isGiven ? 'Alacak' : 'Borç'}: {formatCurrency(debt.remainingAmount)}
            </Text>
          </View>

          <Text style={styles.label}>
            {isGiven ? 'Tahsil Edilen Tutar (₺)' : 'Ödenen Tutar (₺)'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={formatCurrency(debt.remainingAmount)}
            placeholderTextColor={COLORS.mutedText}
            keyboardType="numeric"
            value={payAmountInput}
            onChangeText={(text) => {
              setPayAmountInput(formatNumberInput(text));
              if (error) setError('');
            }}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave}>
            <Text style={styles.saveBtnText}>
              {isGiven ? 'Tahsilatı Kaydet' : 'Ödemeyi Kaydet'}
            </Text>
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
  infoBox: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  personText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  remText: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 4,
  },
  label: {
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
