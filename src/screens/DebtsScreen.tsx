import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/common/Header';
import { AddDebtModal } from '../components/modals/AddDebtModal';
import { PayDebtModal } from '../components/modals/PayDebtModal';
import { COLORS } from '../constants/colors';
import { useData } from '../context/DataContext';
import { Debt } from '../types';
import { formatCurrency } from '../utils/formatters';

interface DebtsScreenProps {
  onOpenAddModal?: () => void;
}

export const DebtsScreen: React.FC<DebtsScreenProps> = ({ onOpenAddModal }) => {
  const { debts, handleAddDebt, handlePayDebt, handleDeleteDebt } = useData();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedDebtForPay, setSelectedDebtForPay] = useState<Debt | null>(null);

  const confirmDelete = (debtId: string, personName: string) => {
    Alert.alert(
      'Kaydı Sil',
      `"${personName}" borç/alacak kaydını silmek istediğinizden emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => handleDeleteDebt(debtId),
        },
      ]
    );
  };

  const totalReceivables = debts
    .filter((d) => d.type === 'given' && !d.isCompleted)
    .reduce((sum, d) => sum + (d.remainingAmount || 0), 0);

  const totalPayables = debts
    .filter((d) => d.type === 'taken' && !d.isCompleted)
    .reduce((sum, d) => sum + (d.remainingAmount || 0), 0);

  return (
    <View style={styles.container}>
      <Header
        title="Borç & Alacak"
        subtitle="Kişiler ve Borç Takibi"
        rightActionIcon="add"
        onRightActionPress={() => (onOpenAddModal ? onOpenAddModal() : setIsAddModalVisible(true))}
      />

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={[styles.iconDot, { backgroundColor: COLORS.emerald }]} />
          <Text style={styles.summaryLabel}>Toplam Alacak</Text>
          <Text style={styles.receivableAmount}>{formatCurrency(totalReceivables)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.iconDot, { backgroundColor: COLORS.rose }]} />
          <Text style={styles.summaryLabel}>Toplam Borç</Text>
          <Text style={styles.payableAmount}>{formatCurrency(totalPayables)}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.sectionTitle}>Kişiler Listesi ({debts.length})</Text>
      </View>

      {/* Debts List */}
      <FlatList
        data={debts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={36} color={COLORS.subtleText} />
            <Text style={styles.emptyTitle}>Henüz borç/alacak kaydı yok</Text>
            <Text style={styles.emptySubtitle}>
              Kişilere verdiğiniz veya aldığınız borçları eklemek için yukarıdaki + butonuna tıklayın.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isGiven = item.type === 'given';
          return (
            <View style={styles.debtCard}>
              <View style={styles.cardHeader}>
                <View style={styles.personWrap}>
                  <View
                    style={[
                      styles.avatarCircle,
                      { backgroundColor: isGiven ? COLORS.emeraldBg : COLORS.roseBg },
                    ]}
                  >
                    <Ionicons
                      name={isGiven ? 'arrow-down-outline' : 'arrow-up-outline'}
                      size={18}
                      color={isGiven ? COLORS.emeraldText : COLORS.roseText}
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
                    { backgroundColor: isGiven ? COLORS.emeraldBg : COLORS.roseBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      { color: isGiven ? COLORS.emeraldText : COLORS.roseText },
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
                    onPress={() => confirmDelete(item.id, item.personName)}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.subtleText} />
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
        onSave={(name, type, amt, desc) => {
          handleAddDebt(name, type, amt, desc);
          setIsAddModalVisible(false);
        }}
      />

      <PayDebtModal
        visible={!!selectedDebtForPay}
        debt={selectedDebtForPay}
        onClose={() => setSelectedDebtForPay(null)}
        onSave={(id, paidAmt) => {
          handlePayDebt(id, paidAmt);
          setSelectedDebtForPay(null);
        }}
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
    marginTop: 4,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
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
    fontWeight: '800',
    color: COLORS.emeraldText,
    marginTop: 4,
  },
  payableAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.roseText,
    marginTop: 4,
  },
  actionRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.foreground,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  emptyContainer: {
    backgroundColor: COLORS.card,
    padding: 32,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.foreground,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginTop: 6,
  },
  debtCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
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
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
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
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
    fontWeight: '800',
    color: COLORS.foreground,
    marginTop: 2,
  },
  completedText: {
    color: COLORS.emeraldText,
    fontSize: 13,
  },
  cardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  payBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 6,
  },
});
