import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { SpendingCategory } from '../../types';

interface SpendingAnalysisCardProps {
  categories: SpendingCategory[];
  onViewReport?: () => void;
}

export const SpendingAnalysisCard: React.FC<SpendingAnalysisCardProps> = ({
  categories,
  onViewReport,
}) => {
  const [period, setPeriod] = useState('Bu ay');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subLabel}>HARCAMA ANALİZİ</Text>
          <Text style={styles.title}>Bu ay nereye gidiyor?</Text>
        </View>

        <TouchableOpacity style={styles.periodPill} activeOpacity={0.7}>
          <Text style={styles.periodText}>{period}</Text>
          <Ionicons name="chevron-down" size={12} color={COLORS.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        {categories.map((category, index) => (
          <View key={category.name} style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryValue}>{category.value}</Text>
            </View>

            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${category.widthPercentage}%`,
                    backgroundColor: index === 1 ? COLORS.accent : COLORS.primary,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.reportBtn} activeOpacity={0.7} onPress={onViewReport}>
        <Text style={styles.reportBtnText}>Tüm raporu görüntüle</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
      </TouchableOpacity>
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
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 4,
  },
  periodText: {
    fontSize: 12,
    color: COLORS.foreground,
    fontWeight: '500',
  },
  categoriesContainer: {
    marginTop: 20,
    gap: 16,
  },
  categoryItem: {},
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 14,
    color: COLORS.foreground,
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  track: {
    height: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  reportBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
