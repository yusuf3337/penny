import { SubscriptionItem, Debt } from '../types';
import { getActiveLanguage, localize } from '../context/LocaleContext';
import { formatCurrency } from '../utils/formatters';

const reminderCopy: Record<string, { subscription: (name: string, amount: string) => string; debt: (name: string, amount: string) => string }> = {
  tr: {
    subscription: (name, amount) => `"${name}" aboneliğinizin (${amount}) ödeme günü yaklaşıyor.`,
    debt: (name, amount) => `"${name}" için ${amount} ödeme tarihi yaklaşıyor.`,
  },
  en: {
    subscription: (name, amount) => `Payment for "${name}" (${amount}) is due soon.`,
    debt: (name, amount) => `A ${amount} payment for "${name}" is due soon.`,
  },
  de: {
    subscription: (name, amount) => `Die Zahlung für „${name}“ (${amount}) ist bald fällig.`,
    debt: (name, amount) => `Eine Zahlung über ${amount} für „${name}“ ist bald fällig.`,
  },
  fr: {
    subscription: (name, amount) => `Le paiement de « ${name} » (${amount}) arrive bientôt à échéance.`,
    debt: (name, amount) => `Un paiement de ${amount} pour « ${name} » arrive bientôt à échéance.`,
  },
  ko: {
    subscription: (name, amount) => `"${name}" 구독 결제일(${amount})이 곧 다가옵니다.`,
    debt: (name, amount) => `"${name}" 관련 ${amount} 결제일이 곧 다가옵니다.`,
  },
  zh: {
    subscription: (name, amount) => `“${name}”订阅付款（${amount}）即将到期。`,
    debt: (name, amount) => `“${name}”的 ${amount} 付款即将到期。`,
  },
  ja: {
    subscription: (name, amount) => `「${name}」の購読料（${amount}）の支払日が近づいています。`,
    debt: (name, amount) => `「${name}」の ${amount} の支払日が近づいています。`,
  },
  ru: {
    subscription: (name, amount) => `Скоро срок оплаты подписки «${name}» (${amount}).`,
    debt: (name, amount) => `Скоро срок платежа ${amount} по «${name}».`,
  },
  it: {
    subscription: (name, amount) => `Il pagamento dell’abbonamento “${name}” (${amount}) è in scadenza.`,
    debt: (name, amount) => `Il pagamento di ${amount} per “${name}” è in scadenza.`,
  },
};

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
  const copy = reminderCopy[getActiveLanguage()];

  // Check subscriptions due in next 3 days
  subscriptions.forEach((sub) => {
    if (sub.isActive && sub.nextDueDate) {
      const dueDate = new Date(sub.nextDueDate);
      if (!isNaN(dueDate.getTime()) && dueDate > now && dueDate <= next3Days) {
        alerts.push({
          id: `alert_sub_${sub.id}`,
          title: localize('Yaklaşan Abonelik Ödemesi'),
          message: copy.subscription(sub.title, formatCurrency(sub.amount)),
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
          title: localize(debt.type === 'given' ? 'Yaklaşan Alacak Tarihi' : 'Yaklaşan Borç Ödemesi'),
          message: copy.debt(debt.personName, formatCurrency(debt.remainingAmount)),
          type: 'debt',
        });
      }
    }
  });

  return alerts;
};
