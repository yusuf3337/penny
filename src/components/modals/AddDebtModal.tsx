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

interface AddDebtModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (personName: string, type: 'given' | 'taken', amount: number, description?: string) => void;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({ visible, onClose, onSave }) => {
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState<'given' | 'taken'>('given'); // given = Alacak, taken = Borç
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!personName.trim()) {
      setError('Lütfen bir kişi ismi girin.');
      return;
    }
    const parsedAmount = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }

    onSave(personName.trim(), type, parsedAmount, description.trim());

    // Reset fields
    setPersonName('');
    setAmountInput('');
    setDescription('');
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
            <Text style={styles.headerTitle}>Yeni Borç / Alacak Kaydı</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type Selector (Alacaklıyım vs Borçluyum) */}
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeTab,
                  type === 'given' && styles.activeGivenTab,
                ]}
                onPress={() => setType('given')}
              >
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={20}
                  color={type === 'given' ? COLORS.primaryForeground : COLORS.mutedText}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    type === 'given' && styles.activeTypeTabText,
                  ]}
                >
                  Alacaklıyım (Bana borçlu)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeTab,
                  type === 'taken' && styles.activeTakenTab,
                ]}
                onPress={() => setType('taken')}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={20}
                  color={type === 'taken' ? COLORS.primaryForeground : COLORS.mutedText}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    type === 'taken' && styles.activeTypeTabText,
                  ]}
                >
                  Borçluyum (Ben borçluyum)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Person Name Input */}
            <Text style={styles.inputLabel}>Kişi İsmi</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Ahmet Yılmaz"
              placeholderTextColor={COLORS.mutedText}
              value={personName}
              onChangeText={(text) => {
                setPersonName(text);
                if (error) setError('');
              }}
            />

            {/* Amount Input */}
            <Text style={styles.inputLabel}>Tutar (₺)</Text>
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

            {/* Description Input */}
            <Text style={styles.inputLabel}>Açıklama / Not (Opsiyonel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Borç olarak verdim, borç aldım..."
              placeholderTextColor={COLORS.mutedText}
              value={description}
              onChangeText={setDescription}
            />

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
    marginBottom: 20,
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
  activeGivenTab: {
    backgroundColor: COLORS.primary,
  },
  activeTakenTab: {
    backgroundColor: COLORS.expense,
  },
  typeTabText: {
    fontSize: 12,
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
