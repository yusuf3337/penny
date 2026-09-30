import { SubscriptionItem, Debt } from '../types';

/**
 * Local Notification & Reminder Service for Penny
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    // Graceful permission check
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Checks upcoming due items (Subscriptions & Debts) and returns notification alerts
 */
export const checkUpcomingDueAlerts = (
  subscriptions: SubscriptionItem[],
  debts: Debt[]
): { id: string; title: string; message: string; type: 'sub' | 'debt' }[] => {
  const alerts: { id: string; title: string; message: string; type: 'sub' | 'debt' }[] = [];
  const now = new Date();
  const next3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Check subscriptions due in next 3 days
  subscriptions.forEach((sub) => {
    if (sub.isActive && sub.nextDueDate) {
      const dueDate = new Date(sub.nextDueDate);
      if (!isNaN(dueDate.getTime()) && dueDate > now && dueDate <= next3Days) {
        alerts.push({
          id: `alert_sub_${sub.id}`,
          title: 'Yaklaşan Abonelik Ödemesi',
          message: `"${sub.title}" aboneliğinizin (${sub.amount} ₺) ödeme günü yaklaşıyor.`,
          type: 'sub',
        });
      }
    }
  });

  // Check debts due in next 3 days
  debts.forEach((debt) => {
    if (!debt.isCompleted && debt.dueDate) {
      const dueDate = new Date(debt.dueDate);
      if (!isNaN(dueDate.getTime()) && dueDate > now && dueDate <= next3Days) {
        alerts.push({
          id: `alert_debt_${debt.id}`,
          title: debt.type === 'given' ? 'Yaklaşan Alacak Tarihi' : 'Yaklaşan Borç Ödemesi',
          message: `"${debt.personName}" ile ilgili ${debt.remainingAmount} ₺ ödeme tarihi yaklaşıyor.`,
          type: 'debt',
        });
      }
    }
  });

  return alerts;
};
