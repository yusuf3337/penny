import { Card } from 'heroui-native/card';
import { useThemedStyles } from '../../context/ThemeContext';
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LIGHT_COLORS } from '../../constants/colors';
import { useAppDialog } from '../../context/AppDialogContext';
import { PendingCollection } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { localizeFormat } from '../../context/LocaleContext';

interface PendingCollectionsCardProps {
  collections: PendingCollection[];
  onAddPress: () => void;
  onCollect: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}

export const PendingCollectionsCard: React.FC<PendingCollectionsCardProps> = ({
  collections,
  onAddPress,
  onCollect,
  onDelete,
}) => {
  const styles = useThemedStyles(lightStyles);
  const { alert } = useAppDialog();
  const totalExpected = collections.reduce((sum, item) => sum + item.expectedAmount, 0);
  const totalActual = collections.reduce((sum, item) => sum + item.actualAmount, 0);
  const percentage = totalExpected > 0 ? Math.min(Math.round((totalActual / totalExpected) * 100), 100) : 0;

  const handleCollectPress = (item: PendingCollection) => {
    const rem = item.expectedAmount - item.actualAmount;
    alert(
      'Hakediş Tahsilatı',
      localizeFormat('"{0}" ({1}) tahsilatını gelirinize eklemek istiyor musunuz?', [item.title, formatCurrency(rem)]),
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Tahsil Et ve Kaydet',
          onPress: () => onCollect(item.id, rem),
        },
      ]
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subLabel}>BEKLENEN TAHSİLATLAR & HAKEDİŞLER</Text>
          <Text style={styles.title}>Alacaklar & Hakedişler</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} activeOpacity={0.7} onPress={onAddPress}>
          <Ionicons name="add" size={18} color={COLORS.primary} />
          <Text style={styles.addBtnText}>Hakediş Ekle</Text>
        </TouchableOpacity>
      </View>

      {collections.length > 0 ? (
        <View style={styles.progressSection}>
          <View style={styles.rowBetween}>
            <Text style={styles.statLabel}>
              Tahsilat Oranı: <Text style={styles.boldText}>%{percentage}</Text>
            </Text>
            <Text style={styles.statLabel}>
              {formatCurrency(totalActual)} / {formatCurrency(totalExpected)}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${percentage}%` }]} />
          </View>
        </View>
      ) : null}

      {collections.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Henüz tanımlanmış beklenen tahsilat veya hakediş (kira, müşteri faturası, maaş vb.) bulunmuyor.
          </Text>
        </View>
      ) : (
        collections.map((item) => {
          const rem = Math.max(item.expectedAmount - item.actualAmount, 0);
          return (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleWrap}>
                  <Ionicons name="briefcase-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.itemTitle}>{item.title}</Text>
                </View>

                <View style={[styles.badge, item.status === 'completed' && styles.completedBadge]}>
                  <Text
                    style={[
                      styles.badgeText,
                      item.status === 'completed' && styles.completedBadgeText,
                    ]}
                  >
                    {item.status === 'completed' ? 'Tahsil Edildi' : 'Tahsilat Bekliyor'}
                  </Text>
                </View>
              </View>

              <View style={styles.itemFooter}>
                <Text style={styles.amountText}>
                  {formatCurrency(item.actualAmount)} / {formatCurrency(item.expectedAmount)}
                </Text>

                <View style={styles.btnRow}>
                  {item.status !== 'completed' ? (
                    <TouchableOpacity
                      style={styles.collectBtn}
                      activeOpacity={0.8}
                      onPress={() => handleCollectPress(item)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.primaryForeground} />
                      <Text style={[styles.collectBtnText, { color: COLORS.primaryForeground }]}>Tahsil Et ({formatCurrency(rem)})</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    activeOpacity={0.6}
                    onPress={() => onDelete(item.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })
      )}
    </Card>
  );
};

const lightStyles = StyleSheet.create({
  card: {
    backgroundColor: LIGHT_COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: LIGHT_COLORS.mutedText,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LIGHT_COLORS.foreground,
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: LIGHT_COLORS.primary,
  },
  progressSection: {
    marginBottom: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: LIGHT_COLORS.mutedText,
  },
  boldText: {
    fontWeight: 'bold',
    color: LIGHT_COLORS.foreground,
  },
  track: {
    height: 8,
    backgroundColor: LIGHT_COLORS.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: LIGHT_COLORS.income,
    borderRadius: 4,
  },
  emptyBox: {
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 13,
    color: LIGHT_COLORS.mutedText,
    fontStyle: 'italic',
  },
  itemCard: {
    backgroundColor: LIGHT_COLORS.background,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: LIGHT_COLORS.foreground,
  },
  badge: {
    backgroundColor: LIGHT_COLORS.accentBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadge: {
    backgroundColor: LIGHT_COLORS.secondary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: LIGHT_COLORS.accentForeground,
  },
  completedBadgeText: {
    color: LIGHT_COLORS.primary,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  amountText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: LIGHT_COLORS.foreground,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  collectBtnText: {
    color: LIGHT_COLORS.primaryForeground,
    fontSize: 11,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 4,
  },
});
