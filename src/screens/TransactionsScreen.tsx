import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/common/Header';
import { COLORS } from '../constants/colors';
import { useData } from '../context/DataContext';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const TransactionsScreen = () => {
  const { transactions, handleDeleteTransaction } = useData();
  const [accountFilter, setAccountFilter] = useState<'all' | 'bank' | 'cash'>('all');

  const filteredTransactions = transactions.filter((tx) => {
    if (accountFilter === 'bank') {
      return tx.accountType === 'bank' || (!tx.accountType && !tx.accountName?.includes('Nakit'));
    }
    if (accountFilter === 'cash') {
      return tx.accountType === 'cash' || tx.accountName?.includes('Nakit');
    }
    return true;
  });

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'İşlemi Sil',
      `"${title}" işlemini silmek istediğinizden emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => handleDeleteTransaction(id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="İşlemler" subtitle="Tüm Gelir ve Giderleriniz" />

      {/* Account Filter Chips */}
      <View style={styles.filterChipRow}>
        {(['all', 'bank', 'cash'] as const).map((filterKey) => {
          const labels = { all: 'Tümü', bank: '💳 Banka', cash: '💵 Nakit' };
          const isActive = accountFilter === filterKey;
          return (
            <TouchableOpacity
              key={filterKey}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setAccountFilter(filterKey)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {labels[filterKey]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.mutedText} />
            <Text style={styles.emptyText}>Henüz kaydedilmiş bir işlem bulunmuyor.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCash = item.accountType === 'cash' || item.accountName?.includes('Nakit');
          const accountBadgeText = isCash ? 'Nakit' : 'Banka';
          const accountIconName = isCash ? 'wallet-outline' : 'card-outline';

          return (
            <View style={styles.itemCard}>
              <View style={styles.itemMain}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <View style={styles.accountBadgeChip}>
                    <Ionicons name={accountIconName} size={10} color={COLORS.mutedText} />
                    <Text style={styles.accountBadgeText}>{accountBadgeText}</Text>
                  </View>
                </View>
                <Text style={styles.itemDate}>
                  {item.category} · {formatDateTime(item.date)}
                </Text>
              </View>

              <View style={styles.rightWrap}>
                <Text
                  style={[
                    styles.itemAmount,
                    { color: item.type === 'income' ? COLORS.emeraldText : COLORS.foreground },
                  ]}
                >
                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.rawAmount)}
                </Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  activeOpacity={0.6}
                  onPress={() => handleDelete(item.id, item.title)}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
                </TouchableOpacity>
              </View>
            </View>
          );
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
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterChipActive: {
    backgroundColor: COLORS.foreground,
    borderColor: COLORS.foreground,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  filterTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 120,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.mutedText,
    fontSize: 14,
    marginTop: 10,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  itemMain: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  accountBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  accountBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  itemDate: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 4,
  },
  rightWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 4,
  },
});
