import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { RecurringTransaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface RecurringSectionProps {
  recurringItems: RecurringTransaction[];
  onAddPress: () => void;
  onExecute: (item: RecurringTransaction) => void;
  onDelete: (id: string) => void;
}

export const RecurringSection: React.FC<RecurringSectionProps> = ({
  recurringItems,
  onAddPress,
  onExecute,
  onDelete,
}) => {
  const getFreqLabel = (freq: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    if (freq === 'daily') return 'Her Gün';
    if (freq === 'weekly') return 'Her Hafta';
    if (freq === 'yearly') return 'Her Yıl';
    return 'Her Ay';
  };

  const handleExecutePress = (item: RecurringTransaction) => {
    Alert.alert(
      'İşlemi Gerçekleştir',
      `"${item.title}" (${formatCurrency(item.amount)}) işlemini ana finans kaydınıza eklemek istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İşleme Dönüştür',
          onPress: () => onExecute(item),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subLabel}>DÜZENLİ FİNANS HAREKETLERİ</Text>
          <Text style={styles.title}>Tekrarlayan İşlemler</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} activeOpacity={0.7} onPress={onAddPress}>
          <Ionicons name="add" size={18} color={COLORS.primary} />
          <Text style={styles.addBtnText}>Tanımla</Text>
        </TouchableOpacity>
      </View>

      {recurringItems.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Henüz tanımlanmış tekrarlayan işlem (kira, abonelik, maaş, hakediş vb.) yok.
          </Text>
        </View>
      ) : (
        recurringItems.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.iconBox}>
              <Ionicons
                name={item.iconName as any || 'repeat-outline'}
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.itemMain}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub}>
                {item.cycle === 'yearly' ? 'Her Yıl' : 'Her Ay'} · {formatCurrency(item.amount)}
              </Text>
            </View>

            <View style={styles.btnGroup}>
              <TouchableOpacity
                style={styles.executeBtn}
                activeOpacity={0.8}
                onPress={() => handleExecutePress(item)}
              >
                <Ionicons name="flash-outline" size={14} color={COLORS.primaryForeground} />
                <Text style={styles.executeBtnText}>Öde/Ekle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                activeOpacity={0.6}
                onPress={() => onDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.mutedText,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyBox: {
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.mutedText,
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemMain: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  itemSub: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  executeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 3,
  },
  executeBtnText: {
    color: COLORS.primaryForeground,
    fontSize: 11,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 4,
  },
});
