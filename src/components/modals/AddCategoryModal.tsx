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

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, type: 'income' | 'expense', iconName?: string, color?: string) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedIcon, setSelectedIcon] = useState('pricetag-outline');
  const [error, setError] = useState('');

  const icons = [
    'pricetag-outline',
    'medical-outline',
    'fast-food-outline',
    'laptop-outline',
    'bus-outline',
    'home-outline',
    'receipt-outline',
    'cart-outline',
    'game-controller-outline',
    'fitness-outline',
    'briefcase-outline',
    'cash-outline',
    'heart-outline',
    'car-outline',
  ];

  const handleSave = () => {
    if (!name.trim()) {
      setError('Lütfen bir kategori adı girin.');
      return;
    }

    const catColor = type === 'income' ? COLORS.emerald : COLORS.primary;

    onSave(name.trim(), type, selectedIcon, catColor);
    setName('');
    setSelectedIcon('pricetag-outline');
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

          <ScrollView showsVerticalScrollIndicator={false}>
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
              placeholder="Örn: Sağlık, Spor, Hobiler..."
              placeholderTextColor={COLORS.mutedText}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
            />

            {/* Icon selection */}
            <Text style={styles.label}>Kategori İkonu</Text>
            <View style={styles.iconGrid}>
              {icons.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconBox,
                    selectedIcon === ic && styles.iconBoxActive,
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

            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Kategoriyi Oluştur</Text>
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
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  iconBoxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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
    marginBottom: 20,
  },
  saveBtnText: {
    color: COLORS.primaryForeground,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
