import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { ProductSubscription, Purchase } from 'expo-iap';
import {
  getStoredSubscriptionInfo, saveProStatus, clearProStatus, SubscriptionInfo,
  FREE_LIMITS, checkCanAddBudget, checkCanAddGoal,
} from '../services/subscriptionGateService';

export type PaywallReason =
  | 'budget_limit' | 'custom_category' | 'goal_limit' | 'split_expense' | 'reports_advanced'
  | 'csv_export' | 'debt_tracking' | 'settings_upgrade' | 'general';

const PRODUCT_IDS = [
  process.env.EXPO_PUBLIC_IOS_PRO_MONTHLY_ID || 'com.yusufcepni.penny.pro.monthly',
  process.env.EXPO_PUBLIC_IOS_PRO_YEARLY_ID || 'com.yusufcepni.penny.pro.yearly',
];
const STORE_AVAILABLE = Platform.OS === 'ios' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

interface PremiumContextType {
  isPro: boolean;
  isLoading: boolean;
  subscriptionInfo: SubscriptionInfo;
  isBillingConfigured: boolean;
  billingError: string | null;
  products: ProductSubscription[];
  isPaywallVisible: boolean;
  paywallReason: PaywallReason;
  openPaywall: (reason?: PaywallReason) => void;
  closePaywall: () => void;
  purchaseProduct: (item: ProductSubscription) => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  manageSubscription: () => Promise<void>;
  resetPremiumStatus: () => Promise<void>;
  toggleDevPro: () => Promise<void>;
  checkBudgetAllowed: (currentCount: number) => boolean;
  checkGoalAllowed: (currentCount: number) => boolean;
  canSplitExpense: boolean;
  canTrackDebts: boolean;
  canExportCsv: boolean;
  canUseAdvancedReports: boolean;
  freeLimits: typeof FREE_LIMITS;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({ isPro: false, plan: 'free' });
  const [products, setProducts] = useState<ProductSubscription[]>([]);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>('general');
  const isPro = subscriptionInfo.isPro;

  const refreshStoreEntitlement = useCallback(async (): Promise<boolean> => {
    if (!STORE_AVAILABLE) return false;
    const iap = await import('expo-iap');
    let storeQueryFailed = false;
    for (const sku of PRODUCT_IDS) {
      try {
        const entitlement = await iap.currentEntitlementIOS(sku);
        if (!entitlement || entitlement.revocationDateIOS || entitlement.isUpgradedIOS) continue;
        if (!(await iap.isTransactionVerifiedIOS(sku))) continue;
        const expiration = entitlement.expirationDateIOS;
        if (expiration && expiration <= Date.now()) continue;
        setSubscriptionInfo({
          isPro: true,
          plan: sku === PRODUCT_IDS[1] ? 'yearly' : 'monthly',
          purchaseDate: new Date(entitlement.transactionDate).toISOString(),
          expiryDate: expiration ? new Date(expiration).toISOString() : undefined,
        });
        setBillingError(null);
        return true;
      } catch {
        storeQueryFailed = true;
      }
    }
    if (storeQueryFailed) throw new Error('App Store abonelik durumu okunamadı.');
    setSubscriptionInfo({ isPro: false, plan: 'free' });
    return false;
  }, []);

  useEffect(() => {
    let active = true;
    let purchaseListener: { remove: () => void } | undefined;
    let errorListener: { remove: () => void } | undefined;
    let appStateListener: { remove: () => void } | undefined;

    if (!STORE_AVAILABLE) {
      void getStoredSubscriptionInfo().then((info) => {
        if (active) setSubscriptionInfo(__DEV__ ? info : { isPro: false, plan: 'free' });
      }).finally(() => { if (active) setIsLoading(false); });
      return () => { active = false; };
    }

    void (async () => {
      try {
        const iap = await import('expo-iap');
        await iap.initConnection();
        if (!active) return;
        purchaseListener = iap.purchaseUpdatedListener((purchase: Purchase) => {
          if (!PRODUCT_IDS.includes(purchase.productId)) return;
          void (async () => {
            try {
              if (await refreshStoreEntitlement()) {
                await iap.finishTransaction({ purchase, isConsumable: false });
              }
            } catch {
              if (active) setBillingError('Satın alma doğrulanamadı. Satın alımları geri yüklemeyi deneyin.');
            }
          })();
        });
        errorListener = iap.purchaseErrorListener((error) => {
          if (active && error.code !== 'user-cancelled') {
            setBillingError('App Store işlemi tamamlanamadı. Planların mağazada etkin olduğunu kontrol edip tekrar deneyin.');
          }
        });
        const [entitlement, productResult] = await Promise.allSettled([
          refreshStoreEntitlement(),
          iap.fetchProducts({ skus: PRODUCT_IDS, type: 'subs' }),
        ]);
        if (!active) return;
        if (productResult.status === 'fulfilled') {
          setProducts((productResult.value || []).filter((product): product is ProductSubscription => product.type === 'subs'));
        }
        if (entitlement.status === 'rejected') setBillingError('App Store abonelik durumu okunamadı.');
        else if (productResult.status === 'rejected') setBillingError('App Store planları yüklenemedi.');
        appStateListener = AppState.addEventListener('change', (state) => {
          if (state === 'active') void refreshStoreEntitlement().catch(() => setBillingError('Abonelik durumu yenilenemedi.'));
        });
      } catch {
        if (active) setBillingError('App Store bağlantısı başlatılamadı.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
      purchaseListener?.remove();
      errorListener?.remove();
      appStateListener?.remove();
      void import('expo-iap').then((iap) => iap.endConnection()).catch(() => {});
    };
  }, [refreshStoreEntitlement]);

  const purchaseProduct = async (item: ProductSubscription) => {
    if (!STORE_AVAILABLE) throw new Error('App Store satın alımı bu ortamda kullanılamıyor.');
    const iap = await import('expo-iap');
    setBillingError(null);
    await iap.requestPurchase({ request: { apple: { sku: item.id } }, type: 'subs' });
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (!STORE_AVAILABLE) {
      if (!__DEV__) return false;
      const info = await getStoredSubscriptionInfo();
      setSubscriptionInfo(info);
      return info.isPro;
    }
    const iap = await import('expo-iap');
    await iap.restorePurchases();
    return refreshStoreEntitlement();
  };

  const manageSubscription = async () => {
    if (!STORE_AVAILABLE) throw new Error('App Store bu ortamda kullanılamıyor.');
    const iap = await import('expo-iap');
    await iap.showManageSubscriptionsIOS();
  };

  const resetPremiumStatus = async () => {
    await clearProStatus();
    if (!STORE_AVAILABLE) setSubscriptionInfo({ isPro: false, plan: 'free' });
  };

  const toggleDevPro = async () => {
    if (!__DEV__ || STORE_AVAILABLE) throw new Error('Test erişimi bu sürümde kullanılamaz.');
    await saveProStatus(!isPro, 'yearly');
    setSubscriptionInfo(await getStoredSubscriptionInfo());
  };

  return <PremiumContext.Provider value={{
    isPro, isLoading, subscriptionInfo, isBillingConfigured: STORE_AVAILABLE,
    billingError, products, isPaywallVisible, paywallReason,
    openPaywall: (reason = 'general') => { setPaywallReason(reason); setIsPaywallVisible(true); },
    closePaywall: () => setIsPaywallVisible(false),
    purchaseProduct, restorePurchases, manageSubscription, resetPremiumStatus, toggleDevPro,
    checkBudgetAllowed: (count) => checkCanAddBudget(count, isPro).allowed,
    checkGoalAllowed: (count) => checkCanAddGoal(count, isPro).allowed,
    canSplitExpense: isPro, canTrackDebts: isPro, canExportCsv: isPro, canUseAdvancedReports: isPro,
    freeLimits: FREE_LIMITS,
  }}>{children}</PremiumContext.Provider>;
};

export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  if (!context) throw new Error('usePremium must be used within a PremiumProvider');
  return context;
};
