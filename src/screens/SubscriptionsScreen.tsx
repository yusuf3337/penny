import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/common/Header';
import { useData } from '../context/DataContext';
import { COLORS } from '../constants/colors';
import { formatCurrency, getDaysRemainingText } from '../utils/formatters';

interface SubscriptionsScreenProps {
  onOpenAddModal: () => void;
}

export const SubscriptionsScreen: React.FC<SubscriptionsScreenProps> = ({ onOpenAddModal }) => {
  const {
    subscriptions,
    totalMonthlySubscriptions,
    totalYearlySubscriptions,
    handleDeleteSubscription,
  } = useData();

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('Aboneliği Sil', `"${title}" aboneliğini silmek istediğinizden emin misiniz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => handleDeleteSubscription(id) },
    ]);
  };

  const reviewItem = subscriptions.find((s) => s.reviewNote);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header
        title="Abonelikler"
        subtitle="Yaklaşan yenilemeler tek ekranda"
        rightActionIcon="add"
        onRightActionPress={onOpenAddModal}
      />

      {/* Summary Header Card (Matching Image 3) */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Aylık Toplam</Text>
            <Text style={styles.monthlyText}>
              {formatCurrency(totalMonthlySubscriptions)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Yıllık Tahmini</Text>
            <Text style={styles.yearlyText}>
              {formatCurrency(totalYearlySubscriptions)}
            </Text>
          </View>
        </View>
      </View>

      {/* Yaklaşan Yenilemeler Box */}
      <View style={styles.upcomingBox}>
        <View style={styles.boxHeader}>
          <Ionicons name="time-outline" size={16} color={COLORS.emeraldText} />
          <Text style={styles.boxTitle}>Yaklaşan Yenilemeler</Text>
        </View>

        {subscriptions.length === 0 ? (
          <Text style={styles.emptySubText}>Yaklaşan abonelik ödemeniz yok.</Text>
        ) : (
          subscriptions.slice(0, 2).map((sub) => (
            <View key={sub.id} style={styles.upcomingRow}>
              <View style={styles.upcomingLeft}>
                <View style={[styles.subIcon, { backgroundColor: COLORS.secondary }]}>
                  <Ionicons
                    name={(sub.iconName as any) || 'repeat-outline'}
                    size={16}
                    color={COLORS.primary}
                  />
                </View>
                <View>
                  <Text style={styles.subTitle}>{sub.title}</Text>
                  <Text style={styles.dueTag}>{getDaysRemainingText(sub.nextDueDate)}</Text>
                </View>
              </View>
              <Text style={styles.subAmount}>{formatCurrency(sub.amount)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Gözden Geçir (Smart Review Highlight Card) */}
      {reviewItem ? (
        <View style={styles.reviewBox}>
          <View style={styles.reviewHeader}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.amberText} />
            <Text style={styles.reviewTitle}>Gözden Geçir</Text>
          </View>
          <Text style={styles.reviewItemName}>{reviewItem.title}</Text>
          <Text style={styles.reviewBody}>{reviewItem.reviewNote}</Text>
        </View>
      ) : null}

      {/* Active Subscriptions List */}
      <Text style={styles.sectionTitle}>Aktif Abonelikler ({subscriptions.length})</Text>

      {subscriptions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="repeat-outline" size={36} color={COLORS.subtleText} />
          <Text style={styles.emptyText}>Henüz kaydedilmiş abonelik bulunmuyor.</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={onOpenAddModal}>
            <Text style={styles.emptyAddBtnText}>+ İlk Aboneliğini Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        subscriptions.map((sub) => (
          <View key={sub.id} style={styles.subCard}>
            <View style={styles.subLeft}>
              <View
                style={[
                  styles.cardIconWrap,
                  { backgroundColor: sub.color ? `${sub.color}15` : COLORS.primaryLight },
                ]}
              >
                <Ionicons
                  name={(sub.iconName as any) || 'repeat-outline'}
                  size={20}
                  color={sub.color || COLORS.primary}
                />
              </View>
              <View>
                <Text style={styles.cardSubTitle}>{sub.title}</Text>
                <Text style={styles.cardSubDetails}>
                  {sub.cycle === 'monthly' ? 'Aylık' : 'Yıllık'} · {getDaysRemainingText(sub.nextDueDate)}
                </Text>
              </View>
            </View>

            <View style={styles.subRight}>
              <Text style={styles.cardSubAmount}>{formatCurrency(sub.amount)}</Text>
              <TouchableOpacity onPress={() => confirmDelete(sub.id, sub.title)}>
                <Ionicons name="trash-outline" size={14} color={COLORS.subtleText} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },

  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '600',
    marginBottom: 4,
  },
  monthlyText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.foreground,
  },
  yearlyText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.cardBorder,
  },

  upcomingBox: {
    backgroundColor: COLORS.emeraldBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  boxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.emeraldText,
  },
  emptySubText: {
    fontSize: 12,
    color: COLORS.emeraldText,
  },
  upcomingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upcomingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  dueTag: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  subAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.foreground,
  },

  reviewBox: {
    backgroundColor: COLORS.amberBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.amberText,
  },
  reviewItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
    marginBottom: 4,
  },
  reviewBody: {
    fontSize: 12,
    color: COLORS.amberText,
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.foreground,
    marginBottom: 12,
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 8,
  },
  emptyAddBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  subCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  cardSubDetails: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  subRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  cardSubAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.foreground,
  },
});
