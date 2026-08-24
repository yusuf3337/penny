import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { AppTransaction } from '../../types';

interface RecentTransactionsCardProps {
  transactions: AppTransaction[];
  onAddPress: () => void;
  onDeleteTransaction?: (id: string) => void;
}

export const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
  transactions,
  onAddPress,
  onDeleteTransaction,
}) => {
  const [showAll, setShowAll] = useState(false);

  const visibleTransactions = showAll ? transactions : transactions.slice(0, 3);

  const renderIcon = (iconName: string, type: string) => {
    if (iconName === 'arrow-down-left' || type === 'income') {
      return <Ionicons name="arrow-down-outline" size={20} color={COLORS.primary} />;
    } else if (iconName === 'cart-outline') {
      return <Ionicons name="cart-outline" size={20} color={COLORS.primary} />;
    } else if (iconName === 'cafe-outline') {
      return <Ionicons name="cafe-outline" size={20} color={COLORS.primary} />;
    } else if (iconName === 'home-outline') {
      return <Ionicons name="home-outline" size={20} color={COLORS.primary} />;
    }
    return <Ionicons name="arrow-up-outline" size={20} color={COLORS.primary} />;
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'İşlemi Sil',
      `"${title}" işlemini silmek istediğinizden emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            if (onDeleteTransaction) onDeleteTransaction(id);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subLabel}>AKTİVİTE</Text>
          <Text style={styles.title}>Son işlemler</Text>
        </View>

        {transactions.length > 3 ? (
          <TouchableOpacity onPress={() => setShowAll(!showAll)} activeOpacity={0.7}>
            <Text style={styles.toggleBtnText}>{showAll ? 'Daha az göster' : 'Tümünü gör'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={36} color={COLORS.mutedText} />
          <Text style={styles.emptyTitle}>Henüz işlem eklenmedi</Text>
          <Text style={styles.emptySubtitle}>
            Gelir veya giderlerinizi eklemek için aşağıdaki buton ile hemen ilk kaydınızı oluşturun.
          </Text>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={onAddPress}>
            <Ionicons name="add" size={16} color={COLORS.primaryForeground} />
            <Text style={styles.addBtnText}>İlk İşlemi Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {visibleTransactions.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                index !== visibleTransactions.length - 1 && styles.borderBottom,
              ]}
            >
              <View style={styles.iconContainer}>{renderIcon(item.iconName, item.type)}</View>

              <View style={styles.itemMain}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>
                  {item.category} · {item.date}
                </Text>
              </View>

              <View style={styles.rightWrap}>
                <Text
                  style={[
                    styles.itemAmount,
                    { color: item.type === 'income' ? COLORS.primary : COLORS.foreground },
                  ]}
                >
                  {item.amount}
                </Text>

                {onDeleteTransaction ? (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    activeOpacity={0.6}
                    onPress={() => handleDelete(item.id, item.title)}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </View>
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
    marginBottom: 100,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    gap: 4,
  },
  addBtnText: {
    color: COLORS.primaryForeground,
    fontSize: 13,
    fontWeight: 'bold',
  },
  list: {},
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemMain: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  itemSubtitle: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  rightWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 4,
  },
});
