import { Card } from 'heroui-native/card';
import { useThemedStyles } from '../context/ThemeContext';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text } from '../components/common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/common/Header';
import { AddDebtModal } from '../components/modals/AddDebtModal';
import { PayDebtModal } from '../components/modals/PayDebtModal';
import { COLORS, LIGHT_COLORS } from '../constants/colors';
import { useData } from '../context/DataContext';
import { useAppDialog } from '../context/AppDialogContext';
import { usePremium } from '../context/PremiumContext';
import { Debt } from '../types';
import { formatCurrency } from '../utils/formatters';
import { localizeFormat } from '../context/LocaleContext';

interface DebtsScreenProps {
  onOpenAddModal?: () => void;
  onOpenSplitModal?: () => void;
}

export const DebtsScreen: React.FC<DebtsScreenProps> = ({ onOpenAddModal, onOpenSplitModal }) => {
  const styles = useThemedStyles(lightStyles);
  const { alert } = useAppDialog();
  const { isPro, openPaywall } = usePremium();
  const { debts, handleAddDebt, handlePayDebt, handleDeleteDebt } = useData();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedDebtForPay, setSelectedDebtForPay] = useState<Debt | null>(null);

  useEffect(() => {
    if (!isPro) setIsAddModalVisible(false);
  }, [isPro]);

  const requestNewDebt = () => {
    if (!isPro) {
      openPaywall('debt_tracking');
      return;
    }
    if (onOpenAddModal) onOpenAddModal();
    else setIsAddModalVisible(true);
  };

  const confirmDelete = (debtId: string, personName: string) => {
    alert(
      'Kaydı Sil',
      localizeFormat('"{0}" borç/alacak kaydını silmek istediğinizden emin misiniz?', [personName]),
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
        onRightActionPress={requestNewDebt}
      />

      {!isPro && (
        <TouchableOpacity style={styles.splitBanner} onPress={requestNewDebt} activeOpacity={0.85}>
          <View style={styles.splitBannerLeft}>
            <View style={styles.splitIconWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.splitBannerTitle}>Yeni borç ve alacak kaydı · Pro</Text>
              <Text style={styles.splitBannerSub}>Mevcut kayıtlarınızı yönetmeye devam edebilirsiniz.</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.mutedText} />
        </TouchableOpacity>
      )}

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <View style={[styles.iconDot, { backgroundColor: COLORS.emerald }]} />
          <Text style={styles.summaryLabel}>Toplam Alacak</Text>
          <Text style={styles.receivableAmount}>{formatCurrency(totalReceivables)}</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={[styles.iconDot, { backgroundColor: COLORS.rose }]} />
          <Text style={styles.summaryLabel}>Toplam Borç</Text>
          <Text style={styles.payableAmount}>{formatCurrency(totalPayables)}</Text>
        </Card>
      </View>

      {/* Hesap Bölüş Quick Card */}
      {onOpenSplitModal ? (
        <TouchableOpacity
          style={styles.splitBanner}
          activeOpacity={0.85}
          onPress={onOpenSplitModal}
        >
          <View style={styles.splitBannerLeft}>
            <View style={styles.splitIconWrap}>
              <Ionicons name="people" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.splitBannerTitle}>Ortak Harcama / Hesap Bölüş</Text>
              <Text style={styles.splitBannerSub}>
                Yemek veya tatil hesabını kişi başı bölüp alacaklara aktarın
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.mutedText} />
        </TouchableOpacity>
      ) : null}

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
              {isPro
                ? 'Kişilere verdiğiniz veya aldığınız borçları eklemek için yukarıdaki + butonuna dokunun.'
                : 'Borç ve alacak kaydı oluşturmak için Penny Pro erişimini açın.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isGiven = item.type === 'given';
          return (
            <Card style={styles.debtCard}>
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
            </Card>
          );
        }}
      />

      <AddDebtModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSave={(name, type, amt, desc) => {
          if (!isPro) {
            openPaywall('debt_tracking');
            return;
          }
          void handleAddDebt(name, type, amt, desc);
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

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.background,
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
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: LIGHT_COLORS.mutedText,
  },
  receivableAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: LIGHT_COLORS.emeraldText,
    marginTop: 4,
  },
  payableAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: LIGHT_COLORS.roseText,
    marginTop: 4,
  },
  actionRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: LIGHT_COLORS.foreground,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  emptyContainer: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: LIGHT_COLORS.mutedText,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  debtCard: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_COLORS.cardBorder,
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
    color: LIGHT_COLORS.foreground,
  },
  descriptionText: {
    fontSize: 12,
    color: LIGHT_COLORS.mutedText,
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
    color: LIGHT_COLORS.mutedText,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: LIGHT_COLORS.foreground,
    marginTop: 2,
  },
  completedText: {
    color: LIGHT_COLORS.emeraldText,
    fontSize: 13,
  },
  cardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtn: {
    backgroundColor: LIGHT_COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  payBtnText: {
    color: LIGHT_COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 6,
  },
  splitBanner: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  splitIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: LIGHT_COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: LIGHT_COLORS.foreground,
  },
  splitBannerSub: {
    fontSize: 11,
    color: LIGHT_COLORS.mutedText,
    marginTop: 2,
  },
});
