import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/common/Header';
import { AddDebtModal } from '../components/modals/AddDebtModal';
import { PayDebtModal } from '../components/modals/PayDebtModal';
import { COLORS } from '../constants/colors';
import { getDebts, addDebt, payDebt, deleteDebt } from '../services/storageService';
import { Debt } from '../types';
import { formatCurrency } from '../utils/formatters';

export const DebtsScreen = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedDebtForPay, setSelectedDebtForPay] = useState<Debt | null>(null);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    const data = await getDebts();
    setDebts(data);
  };

  const handleAddDebt = async (
    personName: string,
    type: 'given' | 'taken',
    amount: number,
    description?: string
  ) => {
    const updated = await addDebt(personName, type, amount, description);
    setDebts(updated);
  };

  const handlePayDebt = async (debtId: string, paidAmount: number) => {
    const updated = await payDebt(debtId, paidAmount);
    setDebts(updated);
  };

  const handleDeleteDebt = (debtId: string, personName: string) => {
    Alert.alert(
      'Kaydı Sil',
      `"${personName}" borç/alacak kaydını silmek istediğinizden emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteDebt(debtId);
            setDebts(updated);
          },
        },
      ]
    );
  };

  // Dynamic calculations
  const totalReceivables = debts
    .filter((d) => d.type === 'given' && !d.isCompleted)
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const totalPayables = debts
    .filter((d) => d.type === 'taken' && !d.isCompleted)
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  return (
    <View style={styles.container}>
      <Header title="Borç & Alacak" subtitle="Kişiler ve Borç Takibi" />

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={[styles.iconDot, { backgroundColor: COLORS.income }]} />
          <Text style={styles.summaryLabel}>Toplam Alacak</Text>
          <Text style={styles.receivableAmount}>{formatCurrency(totalReceivables)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.iconDot, { backgroundColor: COLORS.expense }]} />
          <Text style={styles.summaryLabel}>Toplam Borç</Text>
          <Text style={styles.payableAmount}>{formatCurrency(totalPayables)}</Text>
        </View>
      </View>

      {/* Add New Debt / Receivable Button */}
      <View style={styles.actionRow}>
        <Text style={styles.sectionTitle}>Kişiler Listesi</Text>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.8}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Ionicons name="add" size={16} color={COLORS.primaryForeground} />
          <Text style={styles.addBtnText}>Borç/Alacak Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Debts List */}
      <FlatList
        data={debts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={40} color={COLORS.mutedText} />
            <Text style={styles.emptyTitle}>Henüz borç/alacak kaydı yok</Text>
            <Text style={styles.emptySubtitle}>
              Kişilere verdiğiniz veya aldığınız borçları kaydetmek için yukarıdaki butona tıklayın.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isGiven = item.type === 'given'; // Alacak
          return (
            <View style={styles.debtCard}>
              <View style={styles.cardHeader}>
                <View style={styles.personWrap}>
                  <View
                    style={[
                      styles.avatarCircle,
                      { backgroundColor: isGiven ? COLORS.secondary : '#FEE2E2' },
                    ]}
                  >
                    <Ionicons
                      name={isGiven ? 'arrow-down-outline' : 'arrow-up-outline'}
                      size={18}
                      color={isGiven ? COLORS.primary : COLORS.expense}
                    />
                  </View>
                  <View>
                    <Text style={styles.personName}>{item.personName}</Text>
                    {item.description ? (
                      <Text style={styles.descriptionText}>{item.description}</Text>
                    ) : null}
                  </View>
                </View>

                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: isGiven ? COLORS.secondary : '#FEE2E2' },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      { color: isGiven ? COLORS.primary : COLORS.expense },
                    ]}
                  >
                    {isGiven ? 'Alacaklıyım' : 'Borçluyum'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.amountLabel}>Kalan Tutar</Text>
                  <Text
                    style={[
                      styles.amountText,
                      item.isCompleted && styles.completedText,
                    ]}
                  >
                    {item.isCompleted ? 'Tamamlandı' : formatCurrency(item.remainingAmount)}
                  </Text>
                </View>

                <View style={styles.cardBtnRow}>
                  {!item.isCompleted ? (
                    <TouchableOpacity
                      style={styles.payBtn}
                      activeOpacity={0.8}
                      onPress={() => setSelectedDebtForPay(item)}
                    >
                      <Text style={styles.payBtnText}>
                        {isGiven ? 'Tahsil Et' : 'Öde'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    activeOpacity={0.6}
                    onPress={() => handleDeleteDebt(item.id, item.personName)}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      <AddDebtModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSave={handleAddDebt}
      />

      <PayDebtModal
        visible={!!selectedDebtForPay}
        debt={selectedDebtForPay}
        onClose={() => setSelectedDebtForPay(null)}
        onSave={handlePayDebt}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  receivableAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.income,
    marginTop: 4,
  },
  payableAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.expense,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  addBtnText: {
    color: COLORS.primaryForeground,
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    backgroundColor: COLORS.card,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  debtCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingBottom: 12,
  },
  personWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  descriptionText: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  amountLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginTop: 2,
  },
  completedText: {
    color: COLORS.income,
    fontSize: 14,
  },
  cardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  payBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 6,
  },
});
