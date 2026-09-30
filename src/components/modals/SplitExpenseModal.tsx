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
import { parseAmountSafely, formatNumberInput, formatCurrency } from '../../utils/formatters';

interface SplitExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAddDebt: (personName: string, type: 'given' | 'taken', amount: number, desc?: string) => Promise<void>;
  onAddTransaction: (tx: any) => Promise<void>;
}

export const SplitExpenseModal: React.FC<SplitExpenseModalProps> = ({
  visible,
  onClose,
  onAddDebt,
  onAddTransaction,
}) => {
  const [title, setTitle] = useState('');
  const [totalAmountInput, setTotalAmountInput] = useState('');
  const [participantsText, setParticipantsText] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const parsedTotal = parseAmountSafely(totalAmountInput);

  // Parse comma or space separated names
  const names = participantsText
    .split(/[,;\n]/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  // Total people including "Ben" (user)
  const totalPeople = names.length + 1;
  const rawShare = parsedTotal > 0 ? parsedTotal / totalPeople : 0;
  const perPersonShare = Math.round(rawShare * 100) / 100;

  const handleApplySplit = async () => {
    if (!title.trim()) {
      setError('Lütfen bir harcama açıklaması girin.');
      return;
    }
    if (parsedTotal <= 0) {
      setError('Lütfen geçerli bir toplam tutar girin.');
      return;
    }
    if (names.length === 0) {
      setError('Lütfen en az 1 kişi ismi girin.');
      return;
    }

    try {
      // 1. Record user's own share as expense transaction
      await onAddTransaction({
        title: `${title.trim()} (Benim Payım)`,
        category: 'Yemek',
        amount: `-₺${perPersonShare.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
        rawAmount: perPersonShare,
        type: 'expense',
        iconName: 'people-outline',
        accountType: 'bank',
        accountName: 'Banka Hesabı',
      });

      // 2. Add each participant's share to Debts as "given" (Alacaklıyım)
      for (const name of names) {
        await onAddDebt(
          name,
          'given',
          perPersonShare,
          `${title.trim()} Ortak Harcama Payı`
        );
      }

      setSuccessMessage(`${names.length} kişinin payı Alacaklıyım listenize eklendi!`);
      setTimeout(() => {
        setTitle('');
        setTotalAmountInput('');
        setParticipantsText('');
        setError('');
        setSuccessMessage('');
        onClose();
      }, 1500);
    } catch (err) {
      setError('Hesap bölüştürülürken bir hata oluştu.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="people-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.headerTitle}>Ortak Harcama Bölüş</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Hesabı siz ödediyseniz, toplam tutarı ve katılan kişileri girin. Katılımcıların payı otomatik olarak <Text style={{ fontWeight: 'bold', color: COLORS.emeraldText }}>Alacaklıyım</Text> listenize eklenecektir.
            </Text>

            {/* Title */}
            <Text style={styles.inputLabel}>Harcama Açıklaması</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Akşam Yemeği, Tatil Oteli, Tatlı..."
              placeholderTextColor={COLORS.mutedText}
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (error) setError('');
              }}
            />

            {/* Total Amount */}
            <Text style={styles.inputLabel}>Toplam Hesap Tutarı (₺)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 1.200"
              placeholderTextColor={COLORS.mutedText}
              keyboardType="numeric"
              value={totalAmountInput}
              onChangeText={(t) => {
                setTotalAmountInput(formatNumberInput(t));
                if (error) setError('');
              }}
            />

            {/* Participants */}
            <Text style={styles.inputLabel}>Diğer Katılan Kişiler (Virgülle Ayırın)</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Örn: Ahmet, Mehmet, Zeynep"
              placeholderTextColor={COLORS.mutedText}
              multiline
              value={participantsText}
              onChangeText={(t) => {
                setParticipantsText(t);
                if (error) setError('');
              }}
            />

            {/* Calculation Preview */}
            {parsedTotal > 0 && totalPeople > 1 ? (
              <View style={styles.previewBox}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Kişi Sayısı:</Text>
                  <Text style={styles.previewVal}>{totalPeople} Kişi (Siz dahil)</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Kişi Başına Düşen Pay:</Text>
                  <Text style={styles.previewValHighlight}>
                    {formatCurrency(perPersonShare)}
                  </Text>
                </View>
                <Text style={styles.previewSub}>
                  Sizin payınız ({formatCurrency(perPersonShare)}) Gider olarak yazılacak, kalan {names.length} kişi için Alacak kaydı açılacak.
                </Text>
              </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.85}
              onPress={handleApplySplit}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>Hesabı Böl ve Alacaklara Ekle</Text>
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
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  description: {
    fontSize: 12,
    color: COLORS.mutedText,
    lineHeight: 18,
    marginBottom: 14,
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
  previewBox: {
    backgroundColor: COLORS.emeraldBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 16,
    gap: 6,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: COLORS.emeraldText,
    fontWeight: '600',
  },
  previewVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  previewValHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.emeraldText,
  },
  previewSub: {
    fontSize: 11,
    color: COLORS.emeraldText,
    marginTop: 4,
  },
  errorText: {
    color: COLORS.expense,
    fontSize: 12,
    marginTop: 12,
  },
  successText: {
    color: COLORS.emeraldText,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
