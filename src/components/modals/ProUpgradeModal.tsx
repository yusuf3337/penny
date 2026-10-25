import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePremium, PaywallReason } from '../../context/PremiumContext';
import { useAppDialog } from '../../context/AppDialogContext';
import { COLORS, LIGHT_COLORS } from '../../constants/colors';
import type { ProductSubscription } from 'expo-iap';
import { useThemedStyles } from '../../context/ThemeContext';
import { APPLE_STANDARD_EULA_URL, PRIVACY_POLICY } from '../../constants/legal';
import { localize, useLocale } from '../../context/LocaleContext';
import { Alert } from 'heroui-native/alert';
import { Card } from 'heroui-native/card';

const PERIOD_SUFFIX: Record<string, { year: string; month: string }> = {
  tr: { year: ' / yıl', month: ' / ay' },
  en: { year: ' / year', month: ' / month' },
  de: { year: ' / Jahr', month: ' / Monat' },
  fr: { year: ' / an', month: ' / mois' },
  ko: { year: ' / 년', month: ' / 월' },
  zh: { year: ' / 年', month: ' / 月' },
  ja: { year: ' / 年', month: ' / 月' },
  ru: { year: ' / год', month: ' / месяц' },
  it: { year: ' / anno', month: ' / mese' },
};

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'pie-chart-outline', title: 'Sınırsız bütçe', body: 'Her harcama kategorisi için ayrı sınır belirleyin.' },
  { icon: 'flag-outline', title: 'Sınırsız hedef', body: 'Birikimlerinizi aynı anda takip edin.' },
  { icon: 'swap-horizontal-outline', title: 'Borç ve alacak takibi', body: 'Kişilere verdiğiniz veya aldığınız tutarları takip edin.' },
  { icon: 'people-outline', title: 'Ortak harcama', body: 'Hesabı bölün, kişi paylarını alacak olarak kaydedin.' },
  { icon: 'analytics-outline', title: 'Derin raporlar', body: 'Altı aylık eğilimleri ve ay sonu tahminini görün.' },
  { icon: 'document-text-outline', title: 'Excel dışa aktarımı', body: 'İşlem geçmişinizi hesap bilgisiyle CSV olarak alın.' },
];

const REASON_TEXT: Partial<Record<PaywallReason, string>> = {
  budget_limit: 'Ücretsiz planda üç bütçe kategorisi oluşturabilirsiniz.',
  custom_category: 'Özel kategoriler Penny Pro ile kullanılabilir.',
  goal_limit: 'Ücretsiz planda iki birikim hedefi oluşturabilirsiniz.',
  split_expense: 'Ortak harcama bölüştürme Pro kapsamındadır.',
  debt_tracking: 'Yeni borç ve alacak kaydı oluşturma Pro kapsamındadır. Mevcut kayıtlarınızı yönetebilirsiniz.',
  reports_advanced: 'Eğilim ve içgörü raporları Pro kapsamındadır.',
  csv_export: 'Excel dışa aktarımı Pro kapsamındadır.',
};

const DEFAULT_PRODUCTS: any[] = [
  {
    id: process.env.EXPO_PUBLIC_IOS_PRO_YEARLY_ID || 'com.yusufcepni.penny.pro.yearly',
    title: 'Penny Pro Yıllık',
    displayPrice: '',
    platform: 'ios',
    subscriptionPeriodUnitIOS: 'year',
    type: 'subs',
  },
  {
    id: process.env.EXPO_PUBLIC_IOS_PRO_MONTHLY_ID || 'com.yusufcepni.penny.pro.monthly',
    title: 'Penny Pro Aylık',
    displayPrice: '',
    platform: 'ios',
    subscriptionPeriodUnitIOS: 'month',
    type: 'subs',
  },
];

export const ProUpgradeModal: React.FC = () => {
  const styles = useThemedStyles(lightStyles);
  const insets = useSafeAreaInsets();
  const { alert } = useAppDialog();
  const { language } = useLocale();
  const {
    isPaywallVisible, closePaywall, paywallReason, isPro, isLoading,
    isBillingConfigured, billingError, products, purchaseProduct,
    restorePurchases, manageSubscription, toggleDevPro,
  } = usePremium();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const purchaseStarted = useRef(false);

  const displayProducts = products.length > 0 ? products : DEFAULT_PRODUCTS;
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const selectedProduct = displayProducts.find((item) => item.id === selectedProductId)
    || displayProducts.find((item) => item.id.includes('year'))
    || displayProducts[0];

  useEffect(() => {
    if (isPro && purchaseStarted.current) {
      purchaseStarted.current = false;
      closePaywall();
      alert('Penny Pro aktif', 'App Store aboneliğiniz doğrulandı. Pro araçları kullanıma hazır.');
    }
  }, [isPro]);

  useEffect(() => {
    if (billingError) purchaseStarted.current = false;
  }, [billingError]);

  const handlePurchase = async (item: any) => {
    if (products.length === 0 || !isBillingConfigured) {
      await handleTestAccess();
      return;
    }
    setIsProcessing(true);
    try {
      purchaseStarted.current = true;
      await purchaseProduct(item);
    } catch (error) {
      purchaseStarted.current = false;
      if ((error as { code?: string }).code !== 'user-cancelled') {
        alert('Hata', 'Satın alma tamamlanamadı. Lütfen mağaza bağlantınızı kontrol edip yeniden deneyin.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    purchaseStarted.current = false;
    setIsProcessing(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        closePaywall();
        alert('Geri Yüklendi', 'Penny Pro aboneliğiniz doğrulandı.');
      } else {
        alert('Bilgi', 'Bu mağaza hesabında etkin Pro aboneliği bulunamadı.');
      }
    } catch {
      alert('Hata', 'Satın alımlar geri yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManage = async () => {
    try {
      await manageSubscription();
    } catch {
      alert('Hata', 'Abonelik yönetimi açılamadı. Lütfen mağaza hesabınızı kontrol edin.');
    }
  };

  const handleTestAccess = async () => {
    setIsProcessing(true);
    try {
      await toggleDevPro();
      closePaywall();
      alert('Test erişimi', isPro ? 'Pro test erişimi kapatıldı.' : 'Pro özellikleri test için açıldı.');
    } catch {
      alert('Hata', 'Test erişimi değiştirilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openPrivacy = () => {
    const url = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
    if (url) void Linking.openURL(url).catch(() => setShowPrivacy(true));
    else setShowPrivacy(true);
  };

  return (
    <Modal visible={isPaywallVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closePaywall}>
      <Card className="flex-1 rounded-none p-0 shadow-none" style={styles.screen}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>PENNY / PRO</Text>
          <TouchableOpacity onPress={closePaywall} style={styles.closeButton} accessibilityLabel={localize('Pro ekranını kapat')}>
            <Ionicons name="close" size={19} color={COLORS.foreground} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
          <Card style={styles.hero}>
            <Card style={styles.heroMark}><Ionicons name="wallet-outline" size={24} color="#D8E5FF" /></Card>
            <Text style={styles.heroTitle}>{isPro ? 'Pro erişiminiz açık' : 'Paranızı daha net görün'}</Text>
            <Text style={styles.heroBody}>
              {isPro
                ? 'Tüm planlama ve analiz araçlarını kullanabilirsiniz.'
                : 'Bütçelerinizi, hedeflerinizi ve harcamalarınızı tek yerde ayrıntılı yönetin.'}
            </Text>
          </Card>

          {!isPro && REASON_TEXT[paywallReason] && (
            <Alert status="accent" className="mt-3.5 rounded-2xl">
              <Alert.Indicator />
              <Alert.Content><Alert.Description>{REASON_TEXT[paywallReason]}</Alert.Description></Alert.Content>
            </Alert>
          )}

          <Text style={styles.sectionTitle}>Pro ile yapabilecekleriniz</Text>
          <Card style={styles.featureList}>
            {FEATURES.map((feature, index) => (
              <View key={feature.title} style={[styles.featureRow, index !== FEATURES.length - 1 && styles.featureBorder]}>
                <View style={styles.featureIcon}><Ionicons name={feature.icon} size={19} color={COLORS.primary} /></View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureBody}>{feature.body}</Text>
                </View>
              </View>
            ))}
          </Card>

          {isBillingConfigured && !isPro && products.length > 0 && (
            <View style={styles.plansSection}>
              <Text style={styles.sectionTitle}>Plan seçin</Text>
              {products.map((item) => {
                const selected = selectedProduct?.id === item.id;
                const unit = item.platform === 'ios' ? item.subscriptionPeriodUnitIOS : undefined;
                const period = unit === 'year' || item.id.includes('year') ? 'Yıllık' : unit === 'month' || item.id.includes('month') ? 'Aylık' : item.title;
                const pricePeriod = period === 'Yıllık' ? PERIOD_SUFFIX[language].year : period === 'Aylık' ? PERIOD_SUFFIX[language].month : '';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.planCard, selected && styles.planCardSelected]}
                    onPress={() => setSelectedProductId(item.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.planName}>{period}</Text>
                    <Text style={styles.planPrice}>{item.displayPrice}{pricePeriod}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.devButton} onPress={() => selectedProduct && void handlePurchase(selectedProduct)} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color={COLORS.primaryForeground} /> : <Text style={[styles.devButtonText, { color: COLORS.primaryForeground }]}>App Store ile abone ol</Text>}
              </TouchableOpacity>
              <Text style={styles.storeNote}>Seçtiğiniz plan belirtilen tutarla otomatik yenilenir. İptali App Store aboneliklerinden yapabilirsiniz.</Text>
            </View>
          )}

          {billingError && products.length > 0 && !isPro && (
            <Alert status="danger" className="mt-4 rounded-2xl">
              <Alert.Indicator />
              <Alert.Content><Alert.Description>{billingError}</Alert.Description></Alert.Content>
            </Alert>
          )}

          {isBillingConfigured && !isPro && (
            <TouchableOpacity style={styles.restoreButton} onPress={() => void handleRestore()} disabled={isProcessing}>
              <Text style={styles.restoreText}>Satın alımları geri yükle</Text>
            </TouchableOpacity>
          )}

          {isBillingConfigured && isPro && (
            <TouchableOpacity style={[styles.devButton, styles.manageButton]} onPress={() => void handleManage()}>
              <Text style={[styles.devButtonText, { color: COLORS.primaryForeground }]}>Aboneliği mağazada yönet</Text>
            </TouchableOpacity>
          )}

          {!isPro && (!isBillingConfigured || (isBillingConfigured && products.length === 0)) && (
            <Alert status="warning" className="mt-4 rounded-2xl">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{isLoading ? 'Planlar yükleniyor' : 'Satın alma şu anda kullanılamıyor'}</Alert.Title>
                <Alert.Description>{billingError || 'App Store ürünleri hazır olduğunda gerçek planlar burada görünecek. Expo Go satın alımı desteklemez.'}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          {__DEV__ && !isBillingConfigured && (
            <View style={styles.devSection}>
              <Text style={styles.devLabel}>GELİŞTİRME SÜRÜMÜ</Text>
              <Text style={styles.devBody}>Bu düğme ödeme yapmaz. Pro araçlarını cihazda denemenizi sağlar.</Text>
              <TouchableOpacity style={styles.devButton} onPress={handleTestAccess} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color={COLORS.primaryForeground} /> : <Text style={[styles.devButtonText, { color: COLORS.primaryForeground }]}>{isPro ? 'Test erişimini kapat' : 'Pro özelliklerini test et'}</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.legalRow}>
            <TouchableOpacity onPress={openPrivacy} accessibilityRole="link"><Text style={styles.legalLink}>Gizlilik Politikası</Text></TouchableOpacity>
            <Text style={styles.legalDivider}>·</Text>
            <TouchableOpacity onPress={() => void Linking.openURL(APPLE_STANDARD_EULA_URL)} accessibilityRole="link"><Text style={styles.legalLink}>Kullanım Koşulları</Text></TouchableOpacity>
          </View>
        </ScrollView>
        <Modal visible={showPrivacy} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPrivacy(false)}>
          <ScrollView style={styles.screen} contentContainerStyle={styles.privacyContent}>
            <TouchableOpacity onPress={() => setShowPrivacy(false)} style={styles.privacyClose}><Ionicons name="close" size={20} color={COLORS.foreground} /></TouchableOpacity>
            <Text style={styles.sectionTitle}>Gizlilik Politikası</Text>
            {PRIVACY_POLICY.map((paragraph) => <Text key={paragraph} style={styles.privacyParagraph}>{paragraph}</Text>)}
          </ScrollView>
        </Modal>
      </Card>
    </Modal>
  );
};

const lightStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LIGHT_COLORS.background },
  topBar: { minHeight: 60, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: LIGHT_COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  closeButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: LIGHT_COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LIGHT_COLORS.cardBorder },
  content: { paddingHorizontal: 20 },
  hero: { backgroundColor: '#1E3A8A', borderRadius: 24, padding: 24, minHeight: 185, justifyContent: 'center' },
  heroMark: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#3E5AB5', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  heroTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  heroBody: { color: '#D4E0FF', fontSize: 13, lineHeight: 20, marginTop: 7 },
  reasonCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: LIGHT_COLORS.primaryLight, marginTop: 14 },
  reasonText: { flex: 1, color: LIGHT_COLORS.primaryHover, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  sectionTitle: { color: LIGHT_COLORS.foreground, fontSize: 18, fontWeight: '700', marginTop: 26, marginBottom: 13 },
  featureList: { backgroundColor: LIGHT_COLORS.card, borderWidth: 1, borderColor: LIGHT_COLORS.cardBorder, borderRadius: 19, paddingHorizontal: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15 },
  featureBorder: { borderBottomWidth: 1, borderBottomColor: LIGHT_COLORS.cardBorder },
  featureIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: LIGHT_COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1 },
  featureTitle: { color: LIGHT_COLORS.foreground, fontSize: 14, fontWeight: '700' },
  featureBody: { color: LIGHT_COLORS.mutedText, fontSize: 12, lineHeight: 17, marginTop: 3 },
  availabilityCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#EAF0FC', padding: 16, borderRadius: 16, marginTop: 17 },
  availabilityText: { flex: 1 },
  availabilityTitle: { color: LIGHT_COLORS.foreground, fontSize: 13, fontWeight: '700' },
  availabilityBody: { color: LIGHT_COLORS.mutedText, fontSize: 12, lineHeight: 18, marginTop: 4 },
  devSection: { marginTop: 18 },
  plansSection: { marginTop: 2 },
  planCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, borderRadius: 15, backgroundColor: LIGHT_COLORS.card, borderWidth: 1, borderColor: LIGHT_COLORS.cardBorder, marginBottom: 9 },
  planCardSelected: { borderColor: LIGHT_COLORS.primary, backgroundColor: LIGHT_COLORS.primaryLight },
  radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: LIGHT_COLORS.cardBorderHover, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: LIGHT_COLORS.primary },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: LIGHT_COLORS.primary },
  planName: { flex: 1, color: LIGHT_COLORS.foreground, fontSize: 14, fontWeight: '700' },
  planPrice: { color: LIGHT_COLORS.foreground, fontSize: 17, fontWeight: '700' },
  restoreButton: { minHeight: 45, alignItems: 'center', justifyContent: 'center' },
  restoreText: { color: LIGHT_COLORS.primary, fontSize: 13, fontWeight: '700' },
  storeNote: { color: LIGHT_COLORS.mutedText, fontSize: 11, lineHeight: 16, textAlign: 'center', marginBottom: 6 },
  manageButton: { marginTop: 16 },
  devLabel: { color: LIGHT_COLORS.mutedText, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  devBody: { color: LIGHT_COLORS.mutedText, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 12 },
  devButton: { minHeight: 50, borderRadius: 14, backgroundColor: LIGHT_COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  devButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, marginTop: 24 },
  legalLink: { color: LIGHT_COLORS.primary, fontSize: 12, fontWeight: '600' },
  legalDivider: { color: LIGHT_COLORS.subtleText },
  privacyContent: { paddingHorizontal: 24, paddingBottom: 40 },
  privacyClose: { alignSelf: 'flex-end', marginTop: 18, padding: 8 },
  privacyParagraph: { color: LIGHT_COLORS.mutedText, fontSize: 14, lineHeight: 22, marginTop: 14 },
});
