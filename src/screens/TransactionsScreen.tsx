import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/common/Header';
import { COLORS } from '../constants/colors';
import { getStoredTransactions, deleteTransaction } from '../services/storageService';
import { AppTransaction } from '../types';

export const TransactionsScreen = () => {
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);

  useEffect(() => {
    getStoredTransactions().then(setTransactions);
  }, []);

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'İşlemi Sil',
      `"${title}" işlemini silmek istediğinizden emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteTransaction(id);
            setTransactions(updated);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="İşlemler" subtitle="Tüm Gelir ve Giderleriniz" />
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.mutedText} />
            <Text style={styles.emptyText}>Henüz kaydedilmiş bir işlem bulunmuyor.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemMain}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDate}>{item.category} · {item.date}</Text>
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
              <TouchableOpacity
                style={styles.deleteBtn}
                activeOpacity={0.6}
                onPress={() => handleDelete(item.id, item.title)}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
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
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemMain: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  rightWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 4,
  },
});
