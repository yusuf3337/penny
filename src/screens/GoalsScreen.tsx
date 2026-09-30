import React, { useState } from 'react';
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
import { UpdateGoalProgressModal } from '../components/modals/UpdateGoalProgressModal';
import { useData } from '../context/DataContext';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/formatters';
import { SavingsGoal } from '../types';

interface GoalsScreenProps {
  onOpenGoalModal: (goal?: SavingsGoal) => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ onOpenGoalModal }) => {
  const { goals, totalSavedGoals, totalTargetGoals, handleSaveGoal, handleDeleteGoal } = useData();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedGoalForUpdate, setSelectedGoalForUpdate] = useState<SavingsGoal | null>(null);

  const overallPercentage =
    totalTargetGoals > 0
      ? Math.min(Math.round((totalSavedGoals / totalTargetGoals) * 100), 100)
      : 0;

  const activeCount = goals.filter((g) => !g.isCompleted).length;
  const completedCount = goals.filter((g) => g.isCompleted).length;

  const filteredGoals = goals.filter((g) => {
    if (activeTab === 'active') return !g.isCompleted;
    if (activeTab === 'completed') return g.isCompleted;
    return true;
  });

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('Hedefi Sil', `"${title}" hedefini silmek istediğinize emin misiniz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => handleDeleteGoal(id) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header
        title="Hedefler"
        subtitle="Kilometre taşları ve katkı geçmişi"
        rightActionIcon="add"
        onRightActionPress={() => onOpenGoalModal()}
      />

      {/* Top Biriken Summary Card (Matching Image 2) */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View>
            <Text style={styles.summaryLabel}>Biriken</Text>
            <Text style={styles.savedTotalText}>{formatCurrency(totalSavedGoals)}</Text>
            <Text style={styles.targetSubText}>
              {activeCount} Aktif · {completedCount} Tamamlanan
            </Text>
          </View>

          <View style={styles.percentRing}>
            <Text style={styles.percentRingText}>%{overallPercentage}</Text>
          </View>
        </View>

        {/* Global Progress Bar */}
        <View style={styles.globalProgressTrack}>
          <View
            style={[
              styles.globalProgressBar,
              { width: `${Math.max(overallPercentage, 4)}%` },
            ]}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'completed'] as const).map((tabKey) => {
          const labels = { all: 'Tümü', active: 'Aktif', completed: 'Tamamlanan' };
          const isActive = activeTab === tabKey;
          return (
            <TouchableOpacity
              key={tabKey}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveTab(tabKey)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {labels[tabKey]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="flag-outline" size={36} color={COLORS.subtleText} />
          <Text style={styles.emptyText}>Henüz kaydedilmiş hedef bulunmuyor.</Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => onOpenGoalModal()}
          >
            <Text style={styles.emptyAddBtnText}>+ İlk Hedefini Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        filteredGoals.map((goal) => {
          const pct = goal.percentage;
          return (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalCard}
              activeOpacity={0.9}
              onPress={() => onOpenGoalModal(goal)}
            >
              <View style={styles.goalHeader}>
                <View style={styles.goalTitleWrap}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name={(goal.iconName as any) || 'flag-outline'}
                      size={18}
                      color={COLORS.emeraldText}
                    />
                  </View>
                  <View>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalCategory}>{goal.category}</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.badge,
                    goal.isCompleted ? styles.badgeSuccess : styles.badgeNormal,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      goal.isCompleted ? styles.badgeTextSuccess : styles.badgeTextNormal,
                    ]}
                  >
                    %{pct}
                  </Text>
                </View>
              </View>

              {/* Milestones Track (%25, %50, %75, %100) */}
              <View style={styles.milestoneRow}>
                {['%25', '%50', '%75', '%100'].map((mLabel, idx) => {
                  const threshold = (idx + 1) * 25;
                  const isReached = pct >= threshold;
                  return (
                    <View
                      key={mLabel}
                      style={[
                        styles.milestoneChip,
                        isReached && styles.milestoneChipReached,
                      ]}
                    >
                      <Text
                        style={[
                          styles.milestoneText,
                          isReached && styles.milestoneTextReached,
                        ]}
                      >
                        {mLabel}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.max(pct, 4)}%`,
                      backgroundColor: goal.isCompleted ? COLORS.emerald : COLORS.primary,
                    },
                  ]}
                />
              </View>

              {/* Amounts Footer */}
              <View style={styles.goalFooter}>
                <Text style={styles.savedAmount}>{formatCurrency(goal.savedAmount)}</Text>
                <Text style={styles.targetAmount}>/ {formatCurrency(goal.targetAmount)}</Text>

                <TouchableOpacity
                  style={styles.addProgressBtn}
                  onPress={() => setSelectedGoalForUpdate(goal)}
                >
                  <Ionicons name="add-circle" size={14} color={COLORS.primaryForeground} />
                  <Text style={styles.addProgressBtnText}>+ Birikim Ekle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteIconBtn}
                  onPress={() => onOpenGoalModal(goal)}
                >
                  <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteIconBtn}
                  onPress={() => confirmDelete(goal.id, goal.title)}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.subtleText} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <UpdateGoalProgressModal
        visible={!!selectedGoalForUpdate}
        goal={selectedGoalForUpdate}
        onClose={() => setSelectedGoalForUpdate(null)}
        onSave={(updated) => {
          handleSaveGoal(updated);
          setSelectedGoalForUpdate(null);
        }}
      />
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

  // Summary Card
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
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  savedTotalText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.foreground,
    marginVertical: 4,
  },
  targetSubText: {
    fontSize: 12,
    color: COLORS.mutedText,
  },

  percentRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: COLORS.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.emeraldBg,
  },
  percentRingText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldText,
  },

  globalProgressTrack: {
    height: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  globalProgressBar: {
    height: '100%',
    backgroundColor: COLORS.emerald,
    borderRadius: 4,
  },

  // Filter Chips
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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

  // Goal Items
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

  goalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.emeraldBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  goalCategory: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeNormal: {
    backgroundColor: COLORS.primaryLight,
  },
  badgeSuccess: {
    backgroundColor: COLORS.emeraldBg,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeTextNormal: {
    color: COLORS.primary,
  },
  badgeTextSuccess: {
    color: COLORS.emeraldText,
  },

  milestoneRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    marginBottom: 8,
  },
  milestoneChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.secondary,
  },
  milestoneChipReached: {
    backgroundColor: COLORS.emeraldBg,
  },
  milestoneText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  milestoneTextReached: {
    color: COLORS.emeraldText,
    fontWeight: '700',
  },

  progressTrack: {
    height: 6,
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },

  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.foreground,
  },
  targetAmount: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginLeft: 4,
    flex: 1,
  },
  addProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    marginRight: 8,
  },
  addProgressBtnText: {
    color: COLORS.primaryForeground,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteIconBtn: {
    padding: 4,
  },
});
