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
import { SubscriptionItem } from '../../types';
import { parseAmountSafely, calculateNextDueDate, formatNumberInput } from '../../utils/formatters';

interface AddSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (sub: Omit<SubscriptionItem, 'id'>) => void;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentDay, setPaymentDay] = useState<number>(new Date().getDate());
  const [category, setCategory] = useState('Eğlence');
  const [selectedIcon, setSelectedIcon] = useState('repeat-outline');
  const [selectedColor, setSelectedColor] = useState(COLORS.primary);
  const [error, setError] = useState('');

  // Popular Brand Presets matching user request
  const presets = [
    { name: 'Spotify', icon: 'musical-notes-outline', color: '#1DB954', category: 'Eğlence' },
    { name: 'YouTube Premium', icon: 'logo-youtube', color: '#FF0000', category: 'Eğlence' },
    { name: 'Netflix', icon: 'tv-outline', color: '#E50914', category: 'Eğlence' },
    { name: 'PlayStation Plus', icon: 'logo-playstation', color: '#003791', category: 'Eğlence' },
    { name: 'Steam', icon: 'game-controller-outline', color: '#171A21', category: 'Teknoloji' },
    { name: 'Twitch', icon: 'logo-twitch', color: '#9146FF', category: 'Eğlence' },
    { name: 'iCloud / Apple', icon: 'cloud-outline', color: '#007AFF', category: 'Teknoloji' },
    { name: 'S Sport Plus', icon: 'trophy-outline', color: '#E11D48', category: 'Eğlence' },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setTitle(p.name);
    setSelectedIcon(p.icon);
    setSelectedColor(p.color);
    setCategory(p.category);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError('Lütfen abonelik adını girin.');
      return;
    }
    const amount = parseAmountSafely(amountInput);
    if (amount <= 0) {
      setError('Lütfen geçerli bir abonelik tutarı girin.');
      return;
    }

    const safeDay = Math.min(Math.max(paymentDay || 1, 1), 31);
    const nextDueDate = calculateNextDueDate(safeDay, cycle);

    onSave({
      title: title.trim(),
      amount,
      cycle,
      paymentDay: safeDay,
      category,
      nextDueDate,
      isActive: true,
      iconName: selectedIcon,
      color: selectedColor,
    });

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
            <Text style={styles.headerTitle}>Yeni Abonelik Ekle</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Popüler Marka Kısayolları */}
            <Text style={styles.inputLabel}>Hazır Abonelik Seçin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {presets.map((p) => (
                <TouchableOpacity
                  key={p.name}
                  style={[styles.presetChip, { borderColor: p.color }]}
                  onPress={() => applyPreset(p)}
                >
                  <Ionicons name={p.icon as any} size={16} color={p.color} />
                  <Text style={styles.presetText}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Title */}
            <Text style={styles.inputLabel}>Abonelik Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Spotify, YouTube Premium..."
              placeholderTextColor={COLORS.mutedText}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError('');
              }}
            />

            {/* Cycle Selector */}
            <Text style={styles.inputLabel}>Ödeme Periyodu</Text>
            <View style={styles.cycleRow}>
              <TouchableOpacity
                style={[
                  styles.cycleTab,
                  cycle === 'monthly' && styles.cycleTabActive,
                ]}
                onPress={() => setCycle('monthly')}
              >
                <Text style={[styles.cycleText, cycle === 'monthly' && styles.cycleTextActive]}>
                  Aylık
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cycleTab,
                  cycle === 'yearly' && styles.cycleTabActive,
                ]}
                onPress={() => setCycle('yearly')}
              >
                <Text style={[styles.cycleText, cycle === 'yearly' && styles.cycleTextActive]}>
                  Yıllık
                </Text>
              </TouchableOpacity>
            </View>

            {/* Payment Day of Month */}
            <Text style={styles.inputLabel}>Her Ay Hangi Gün Ödeniyor? (1 - 31)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 15"
              placeholderTextColor={COLORS.mutedText}
              keyboardType="numeric"
              value={paymentDay ? paymentDay.toString() : ''}
              onChangeText={(text) => {
                const dayNum = parseInt(text, 10);
                setPaymentDay(isNaN(dayNum) ? 0 : dayNum);
              }}
            />

            {/* Amount */}
            <Text style={styles.inputLabel}>Tutar (₺)</Text>
            <TextInput
              style={styles.input}
              placeholder="79,99"
              placeholderTextColor={COLORS.mutedText}
              keyboardType="numeric"
              value={amountInput}
              onChangeText={(text) => {
                setAmountInput(text);
                if (error) setError('');
              }}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Aboneliği Kaydet</Text>
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mutedText,
    marginBottom: 6,
    marginTop: 10,
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    marginRight: 8,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.foreground,
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
  cycleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 3,
    marginBottom: 4,
  },
  cycleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  cycleTabActive: {
    backgroundColor: COLORS.primary,
  },
  cycleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  cycleTextActive: {
    color: '#FFF',
    fontWeight: '700',
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
