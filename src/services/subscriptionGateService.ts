import AsyncStorage from '@react-native-async-storage/async-storage';

export const FREE_LIMITS = {
  maxBudgets: 3,
  maxGoals: 2,
  canSplitExpense: false,
  canTrackDebts: false,
  canExportCsv: false,
  canUseAdvancedReports: false,
};

export const PRO_LIMITS = {
  maxBudgets: Infinity,
  maxGoals: Infinity,
  canSplitExpense: true,
  canTrackDebts: true,
  canExportCsv: true,
  canUseAdvancedReports: true,
};

export interface SubscriptionInfo {
  isPro: boolean;
  plan: 'free' | 'monthly' | 'yearly';
  purchaseDate?: string;
  expiryDate?: string;
}

const STORAGE_KEYS = {
  IS_PRO: '@penny_is_pro_v1',
  PRO_PLAN: '@penny_pro_plan_v1',
  PRO_EXPIRY: '@penny_pro_expiry_v1',
};

/**
 * Get current pro status from storage
 */
export const getStoredProStatus = async (): Promise<boolean> => {
  try {
    return (await getStoredSubscriptionInfo()).isPro;
  } catch (err) {
    console.error('Error reading pro status:', err);
    return false;
  }
};

/**
 * Get subscription details
 */
export const getStoredSubscriptionInfo = async (): Promise<SubscriptionInfo> => {
  try {
    const isProVal = await AsyncStorage.getItem(STORAGE_KEYS.IS_PRO);
    const planVal = await AsyncStorage.getItem(STORAGE_KEYS.PRO_PLAN);
    const expiryVal = await AsyncStorage.getItem(STORAGE_KEYS.PRO_EXPIRY);

    const isPro = isProVal === 'true' && (!expiryVal || new Date(expiryVal).getTime() > Date.now());
    return {
      isPro,
      plan: isPro ? (planVal === 'yearly' ? 'yearly' : 'monthly') : 'free',
      expiryDate: expiryVal || undefined,
    };
  } catch (err) {
    console.error('Error reading subscription info:', err);
    return { isPro: false, plan: 'free' };
  }
};

/**
 * Save pro status to storage
 */
export const saveProStatus = async (
  isPro: boolean,
  plan: 'monthly' | 'yearly' = 'yearly'
): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.IS_PRO, isPro ? 'true' : 'false');
    if (isPro) {
      await AsyncStorage.setItem(STORAGE_KEYS.PRO_PLAN, plan);
      // Mock expiry: 1 year or 1 month from now
      const expiry = new Date();
      if (plan === 'yearly') {
        expiry.setFullYear(expiry.getFullYear() + 1);
      } else {
        expiry.setMonth(expiry.getMonth() + 1);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.PRO_EXPIRY, expiry.toISOString());
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.PRO_PLAN);
      await AsyncStorage.removeItem(STORAGE_KEYS.PRO_EXPIRY);
    }
  } catch (err) {
    console.error('Error saving pro status:', err);
    throw err;
  }
};

/**
 * Clear/reset pro status completely back to free
 */
export const clearProStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.IS_PRO,
      STORAGE_KEYS.PRO_PLAN,
      STORAGE_KEYS.PRO_EXPIRY,
    ]);
  } catch (err) {
    console.error('Error clearing pro status:', err);
    throw err;
  }
};

/**
 * Limit checks
 */
export const checkCanAddBudget = (
  currentCount: number,
  isPro: boolean
): { allowed: boolean; maxAllowed: number; currentCount: number } => {
  if (isPro) return { allowed: true, maxAllowed: Infinity, currentCount };
  return {
    allowed: currentCount < FREE_LIMITS.maxBudgets,
    maxAllowed: FREE_LIMITS.maxBudgets,
    currentCount,
  };
};

export const checkCanAddGoal = (
  currentCount: number,
  isPro: boolean
): { allowed: boolean; maxAllowed: number; currentCount: number } => {
  if (isPro) return { allowed: true, maxAllowed: Infinity, currentCount };
  return {
    allowed: currentCount < FREE_LIMITS.maxGoals,
    maxAllowed: FREE_LIMITS.maxGoals,
    currentCount,
  };
};

export const checkCanSplitExpense = (
  isPro: boolean
): { allowed: boolean; reason: string } => {
  return {
    allowed: isPro,
    reason: isPro
      ? 'Yetki var'
      : 'Harcama bölüştürme özelliği Penny Pro abonelerine özeldir.',
  };
};

export const checkCanExportCsv = (
  isPro: boolean
): { allowed: boolean; reason: string } => {
  return {
    allowed: isPro,
    reason: isPro
      ? 'Yetki var'
      : 'Excel / CSV dışa aktarımı Penny Pro abonelerine özeldir.',
  };
};

export const checkCanUseAdvancedReports = (
  isPro: boolean
): { allowed: boolean; reason: string } => {
  return {
    allowed: isPro,
    reason: isPro
      ? 'Yetki var'
      : 'Derinlemesine içgörüler ve trend tahminleri Penny Pro abonelerine özeldir.',
  };
};
