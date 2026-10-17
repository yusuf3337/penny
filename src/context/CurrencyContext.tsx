import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CURRENCY_OPTIONS = [
  { code: 'TRY', symbol: '₺' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'KRW', symbol: '₩' },
  { code: 'CNY', symbol: '¥' },
  { code: 'JPY', symbol: '¥' },
  { code: 'RUB', symbol: '₽' },
] as const;
export type AppCurrency = typeof CURRENCY_OPTIONS[number]['code'];
export type CurrencyPreference = AppCurrency | 'system';

const STORAGE_KEY = '@penny_currency_preference_v1';
const regionCurrencies: Record<string, AppCurrency> = {
  TR: 'TRY', US: 'USD', GB: 'GBP', CH: 'CHF', KR: 'KRW', CN: 'CNY', JP: 'JPY', RU: 'RUB',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR',
  PT: 'EUR', FI: 'EUR', GR: 'EUR', CY: 'EUR', MT: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR',
  SK: 'EUR', SI: 'EUR', LU: 'EUR', HR: 'EUR', AD: 'EUR', MC: 'EUR', SM: 'EUR', VA: 'EUR',
};

const deviceCurrency = (): AppCurrency => {
  const settings = Platform.OS === 'ios' ? NativeModules.SettingsManager?.settings : undefined;
  const locale = settings?.AppleLocale ?? Intl.DateTimeFormat().resolvedOptions().locale;
  const region = typeof locale === 'string' ? locale.replace('_', '-').split('-')[1]?.toUpperCase() : undefined;
  return (region && regionCurrencies[region]) || 'USD';
};

let activeCurrency: AppCurrency = deviceCurrency();
export const getActiveCurrency = (): AppCurrency => activeCurrency;
export const getCurrencySymbol = (): string => CURRENCY_OPTIONS.find((item) => item.code === activeCurrency)?.symbol ?? activeCurrency;

interface CurrencyContextValue {
  currency: AppCurrency;
  preference: CurrencyPreference;
  setPreference: (value: CurrencyPreference) => Promise<void>;
}
const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, updatePreference] = useState<CurrencyPreference>('system');
  const [systemCurrency, updateSystemCurrency] = useState<AppCurrency>(deviceCurrency);
  const currency = preference === 'system' ? systemCurrency : preference;
  activeCurrency = currency;

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then(async (stored) => {
      if (stored === 'system' || CURRENCY_OPTIONS.some((item) => item.code === stored)) {
        updatePreference(stored as CurrencyPreference);
      } else {
        // Older releases stored all balances in TRY. Preserve their meaning.
        const existing = await AsyncStorage.multiGet([
          '@penny_transactions_v2', '@penny_savings_goals_v2', '@penny_subscriptions_v2',
          '@penny_budgets_v2', '@penny_debts_v1',
        ]);
        if (existing.some(([, value]) => value && value !== '[]')) {
          await AsyncStorage.setItem(STORAGE_KEY, 'TRY');
          updatePreference('TRY');
        }
      }
    }).catch(() => {});
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') updateSystemCurrency(deviceCurrency());
    });
    return () => listener.remove();
  }, []);

  const setPreference = async (value: CurrencyPreference) => {
    await AsyncStorage.setItem(STORAGE_KEY, value);
    updatePreference(value);
    if (value === 'system') updateSystemCurrency(deviceCurrency());
  };

  return <CurrencyContext.Provider value={{ currency, preference, setPreference }}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
