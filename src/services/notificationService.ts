import { SubscriptionItem, Debt } from '../types';
import { getActiveLanguage, localize } from '../context/LocaleContext';
import { formatCurrency } from '../utils/formatters';
import { advanceSubscriptionDueDate } from '../utils/formatters';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'subscription-reminders';
const PREFIX = 'penny-subscription-';
const MAX_REMINDERS = 60; // iOS keeps at most 64 pending local notifications.
const TEST_ID = 'penny-notification-test';

const paymentCopy: Record<string, {
  tomorrow: (name: string, amount: string) => string;
  today: (name: string, amount: string) => string;
  recorded: (name: string, amount: string) => string;
  title: string;
}> = {
  tr: { title: 'Abonelik hatırlatması', tomorrow: (n, a) => `Yarın ${n} için ${a} ödeme günü.`, today: (n, a) => `Bugün ${n} için ${a} ödeme günü.`, recorded: (n, a) => `${n} için ${a} ödeme kaydı oluşturuldu.` },
  en: { title: 'Subscription reminder', tomorrow: (n, a) => `${n} payment of ${a} is due tomorrow.`, today: (n, a) => `${n} payment of ${a} is due today.`, recorded: (n, a) => `A ${a} payment entry was recorded for ${n}.` },
  de: { title: 'Abo-Erinnerung', tomorrow: (n, a) => `Morgen ist die Zahlung für ${n} (${a}) fällig.`, today: (n, a) => `Heute ist die Zahlung für ${n} (${a}) fällig.`, recorded: (n, a) => `Für ${n} wurde eine Zahlung über ${a} erfasst.` },
  fr: { title: "Rappel d’abonnement", tomorrow: (n, a) => `Le paiement de ${n} (${a}) est prévu demain.`, today: (n, a) => `Le paiement de ${n} (${a}) est prévu aujourd’hui.`, recorded: (n, a) => `Un paiement de ${a} a été enregistré pour ${n}.` },
  ko: { title: '구독 알림', tomorrow: (n, a) => `내일 ${n} 결제 예정 금액은 ${a}입니다.`, today: (n, a) => `오늘 ${n} 결제 예정 금액은 ${a}입니다.`, recorded: (n, a) => `${n}의 ${a} 결제 내역이 기록되었습니다.` },
  zh: { title: '订阅提醒', tomorrow: (n, a) => `${n} 的 ${a} 付款将于明天到期。`, today: (n, a) => `${n} 的 ${a} 付款今天到期。`, recorded: (n, a) => `已记录 ${n} 的 ${a} 付款。` },
  ja: { title: '購読のお知らせ', tomorrow: (n, a) => `${n} の ${a} の支払日は明日です。`, today: (n, a) => `${n} の ${a} の支払日は今日です。`, recorded: (n, a) => `${n} の ${a} の支払いを記録しました。` },
  ru: { title: 'Напоминание о подписке', tomorrow: (n, a) => `Завтра срок платежа за ${n}: ${a}.`, today: (n, a) => `Сегодня срок платежа за ${n}: ${a}.`, recorded: (n, a) => `Платёж ${a} за ${n} записан.` },
  it: { title: 'Promemoria abbonamento', tomorrow: (n, a) => `Domani scade il pagamento di ${n}: ${a}.`, today: (n, a) => `Oggi scade il pagamento di ${n}: ${a}.`, recorded: (n, a) => `Registrato un pagamento di ${a} per ${n}.` },
};

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

const isAllowed = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
};

export const getReminderStatus = async (): Promise<{ status: 'allowed' | 'quiet' | 'blocked'; scheduled: number }> => {
  if (Platform.OS === 'web') return { status: 'blocked', scheduled: 0 };
  const [permissions, pending] = await Promise.all([
    Notifications.getPermissionsAsync(),
    Notifications.getAllScheduledNotificationsAsync(),
  ]);
  const quiet = Platform.OS === 'ios' && (
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permissions.ios?.allowsAlert === false ||
    permissions.ios?.allowsDisplayOnLockScreen === false
  );
  return {
    status: quiet ? 'quiet' : permissions.granted ? 'allowed' : 'blocked',
    scheduled: pending.filter((item) => item.identifier.startsWith(PREFIX)).length,
  };
};

const setupChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Subscription reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
};

let syncQueue: Promise<void> = Promise.resolve();
export const syncSubscriptionReminders = (subscriptions: SubscriptionItem[]): Promise<void> => {
  syncQueue = syncQueue.catch(() => {}).then(async () => {
    if (Platform.OS === 'web') return;
    await Notifications.cancelScheduledNotificationAsync(TEST_ID).catch(() => {});
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    if (!await isAllowed()) return;
    await setupChannel();

    const now = Date.now();
    const copy = paymentCopy[getActiveLanguage()] ?? paymentCopy.en;
    const reminders: { id: string; date: Date; body: string; subId: string }[] = [];
    for (const sub of subscriptions) {
      if (!sub.isActive || !sub.nextDueDate) continue;
      let due = new Date(sub.nextDueDate);
      if (Number.isNaN(due.getTime())) continue;
      for (let cycle = 0; cycle < 6; cycle++) {
        const today = new Date(due.getFullYear(), due.getMonth(), due.getDate(), 9);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() - 1);
        const amount = formatCurrency(sub.amount);
        if (tomorrow.getTime() > now + 30_000) reminders.push({ id: `${PREFIX}${sub.id}-${tomorrow.getTime()}-tomorrow`, date: tomorrow, body: copy.tomorrow(sub.title, amount), subId: sub.id });
        if (today.getTime() > now + 30_000) reminders.push({ id: `${PREFIX}${sub.id}-${today.getTime()}-today`, date: today, body: copy.today(sub.title, amount), subId: sub.id });
        due = new Date(advanceSubscriptionDueDate(due.toISOString(), sub.paymentDay, sub.cycle));
      }
    }
    reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
    const selected = reminders.slice(0, MAX_REMINDERS);
    const selectedById = new Map(selected.map((item) => [item.id, item]));
    const current = existing.filter((item) => item.identifier.startsWith(PREFIX));
    await Promise.all(current.filter((item) => !selectedById.has(item.identifier) || item.content.title !== copy.title || item.content.body !== selectedById.get(item.identifier)?.body)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
    const retainedIds = new Set(current.filter((item) => selectedById.has(item.identifier) && item.content.title === copy.title && item.content.body === selectedById.get(item.identifier)?.body).map((item) => item.identifier));
    for (const reminder of selected) {
      if (retainedIds.has(reminder.id)) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: reminder.id,
        content: { title: copy.title, body: reminder.body, sound: 'default', data: { pennySubscriptionId: reminder.subId } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.date, ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}) },
      });
    }
  });
  return syncQueue;
};

export const notifySubscriptionRecorded = async (sub: SubscriptionItem): Promise<void> => {
  try {
    if (!await isAllowed()) return;
    await setupChannel();
    const copy = paymentCopy[getActiveLanguage()] ?? paymentCopy.en;
    await Notifications.scheduleNotificationAsync({
      content: { title: copy.title, body: copy.recorded(sub.title, formatCurrency(sub.amount)), sound: 'default', data: { pennySubscriptionId: sub.id } },
      trigger: null,
    });
  } catch (error) {
    console.warn('Could not show subscription record notification:', error);
  }
};

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
    if (Platform.OS === 'web') return false;
    if (await isAllowed()) return true;
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'denied') return false;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
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
