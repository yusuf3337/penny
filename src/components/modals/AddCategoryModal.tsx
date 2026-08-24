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

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, type: 'income' | 'expense') => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Lütfen bir kategori adı girin.');
      return;
    }

    onSave(name.trim(), type);
    setName('');
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
            <Text style={styles.headerTitle}>Özel Kategori Ekle</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          {/* Type Selector */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeTab, type === 'expense' && styles.activeExpenseTab]}
              onPress={() => setType('expense')}
            >
              <Text
                style={[styles.typeTabText, type === 'expense' && styles.activeTypeTabText]}
              >
                Gider Kategorisi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeTab, type === 'income' && styles.activeIncomeTab]}
              onPress={() => setType('income')}
            >
              <Text
                style={[styles.typeTabText, type === 'income' && styles.activeTypeTabText]}
              >
                Gelir Kategorisi
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Kategori Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Kedim, Hobi, Yazılım..."
            placeholderTextColor={COLORS.mutedText}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError('');
            }}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Kategoriyi Oluştur</Text>
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
