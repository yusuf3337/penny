import React, { useEffect, useRef, useState } from 'react';
import { Linking, View, TouchableOpacity } from 'react-native';
import { Text, TextInput } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT_PALETTES, AccentPreference, COLORS } from '../../constants/colors';
import { useData } from '../../context/DataContext';
import {
  exportAllDataJSON,
  importAllDataJSON,
  shareBackupFileJSON,
  shareTransactionsFileCSV,
  pickAndImportBackupFileJSON,
} from '../../services/storageService';
import { usePremium } from '../../context/PremiumContext';
import { HeroUIModal } from '../common/HeroUIModal';
import { useAppDialog } from '../../context/AppDialogContext';
import { ThemePreference, useTheme } from '../../context/ThemeContext';
import { LANGUAGE_OPTIONS, LanguagePreference, AppLanguage, getLanguageName, useLocale } from '../../context/LocaleContext';
import { CURRENCY_OPTIONS, CurrencyPreference, useCurrency } from '../../context/CurrencyContext';
import { getReminderStatus } from '../../services/notificationService';
import { isValidNickname, sanitizeNickname } from '../../utils/nickname';

const reminderCopy: Record<AppLanguage, { title: string; allowed: string; quiet: string; blocked: string; count: (n: number) => string; test: string; settings: string; testReady: string; testFailed: string }> = {
  tr: { title: 'Abonelik bildirimleri', allowed: 'Bildirim izni açık', quiet: 'Bildirimler sessiz veya kilit ekranında kapalı', blocked: 'Bildirim izni kapalı', count: n => `${n} hatırlatma planlandı`, test: '15 saniyelik test bildirimi', settings: 'Telefon ayarlarını aç', testReady: 'Telefonu kilitleyin; test bildirimi 15 saniye sonra gelmeli.', testFailed: 'Bildirim izni verilemedi. Telefon ayarlarını kontrol edin.' },
  en: { title: 'Subscription notifications', allowed: 'Notifications enabled', quiet: 'Notifications are quiet or hidden on the lock screen', blocked: 'Notifications disabled', count: n => `${n} reminders scheduled`, test: '15-second test notification', settings: 'Open phone settings', testReady: 'Lock your phone; the test should arrive in 15 seconds.', testFailed: 'Notification permission is unavailable. Check phone settings.' },
  de: { title: 'Abo-Benachrichtigungen', allowed: 'Benachrichtigungen aktiviert', quiet: 'Benachrichtigungen sind stumm oder auf dem Sperrbildschirm verborgen', blocked: 'Benachrichtigungen deaktiviert', count: n => `${n} Erinnerungen geplant`, test: 'Test in 15 Sekunden', settings: 'Telefoneinstellungen öffnen', testReady: 'Sperren Sie das Telefon; der Test sollte in 15 Sekunden erscheinen.', testFailed: 'Keine Berechtigung. Prüfen Sie die Telefoneinstellungen.' },
  fr: { title: 'Notifications d’abonnement', allowed: 'Notifications activées', quiet: 'Notifications silencieuses ou masquées sur l’écran verrouillé', blocked: 'Notifications désactivées', count: n => `${n} rappels programmés`, test: 'Test dans 15 secondes', settings: 'Ouvrir les réglages', testReady: 'Verrouillez le téléphone ; le test arrivera dans 15 secondes.', testFailed: 'Autorisation indisponible. Vérifiez les réglages du téléphone.' },
  ko: { title: '구독 알림', allowed: '알림이 켜져 있습니다', quiet: '알림이 조용히 전달되거나 잠금 화면에서 숨겨집니다', blocked: '알림이 꺼져 있습니다', count: n => `${n}개 알림 예약됨`, test: '15초 테스트 알림', settings: '휴대전화 설정 열기', testReady: '휴대전화를 잠그세요. 15초 후 테스트 알림이 옵니다.', testFailed: '알림 권한이 없습니다. 휴대전화 설정을 확인하세요.' },
  zh: { title: '订阅通知', allowed: '通知已开启', quiet: '通知为静默模式或在锁屏上隐藏', blocked: '通知已关闭', count: n => `已安排 ${n} 条提醒`, test: '15 秒测试通知', settings: '打开手机设置', testReady: '锁定手机；测试通知应在 15 秒后出现。', testFailed: '无法获得通知权限。请检查手机设置。' },
  ja: { title: '購読通知', allowed: '通知が有効です', quiet: '通知は静かに配信されるかロック画面で非表示です', blocked: '通知が無効です', count: n => `${n} 件の通知を予約済み`, test: '15 秒後にテスト通知', settings: '端末の設定を開く', testReady: '端末をロックしてください。15 秒後に通知が届きます。', testFailed: '通知の許可がありません。端末の設定を確認してください。' },
  ru: { title: 'Уведомления о подписках', allowed: 'Уведомления включены', quiet: 'Уведомления без звука или скрыты на экране блокировки', blocked: 'Уведомления выключены', count: n => `Запланировано напоминаний: ${n}`, test: 'Проверка через 15 секунд', settings: 'Открыть настройки телефона', testReady: 'Заблокируйте телефон; уведомление придёт через 15 секунд.', testFailed: 'Нет разрешения на уведомления. Проверьте настройки телефона.' },
  it: { title: 'Notifiche abbonamenti', allowed: 'Notifiche attive', quiet: 'Notifiche silenziose o nascoste nella schermata di blocco', blocked: 'Notifiche disattivate', count: n => `${n} promemoria programmati`, test: 'Notifica di prova tra 15 secondi', settings: 'Apri impostazioni telefono', testReady: 'Blocca il telefono; la prova arriverà tra 15 secondi.', testFailed: 'Autorizzazione non disponibile. Controlla le impostazioni.' },
};

const currencyCopy: Record<AppLanguage, { title: string; system: string; note: string }> = {
  tr: { title: 'Para birimi', system: 'Sistem', note: 'Para birimi değişirse kayıtlı tutarlar dönüştürülmez.' },
  en: { title: 'Currency', system: 'System', note: 'Changing currency does not convert existing amounts.' },
  de: { title: 'Währung', system: 'System', note: 'Beim Währungswechsel werden bestehende Beträge nicht umgerechnet.' },
  fr: { title: 'Devise', system: 'Système', note: 'Changer de devise ne convertit pas les montants existants.' },
  ko: { title: '통화', system: '시스템', note: '통화를 변경해도 기존 금액은 환산되지 않습니다.' },
  zh: { title: '货币', system: '系统', note: '更改货币不会换算已有金额。' },
  ja: { title: '通貨', system: 'システム', note: '通貨を変更しても既存の金額は換算されません。' },
  ru: { title: 'Валюта', system: 'Система', note: 'При смене валюты сохранённые суммы не пересчитываются.' },
  it: { title: 'Valuta', system: 'Sistema', note: 'Cambiare valuta non converte gli importi esistenti.' },
};

const accentCopy: Record<AppLanguage, { title: string; teal: string; blue: string; violet: string; coral: string }> = {
  tr: { title: 'Vurgu rengi', teal: 'Turkuaz', blue: 'Mavi', violet: 'Mor', coral: 'Mercan' },
  en: { title: 'Accent color', teal: 'Teal', blue: 'Blue', violet: 'Violet', coral: 'Coral' },
  de: { title: 'Akzentfarbe', teal: 'Türkis', blue: 'Blau', violet: 'Violett', coral: 'Koralle' },
  fr: { title: 'Couleur d’accent', teal: 'Turquoise', blue: 'Bleu', violet: 'Violet', coral: 'Corail' },
  ko: { title: '강조 색상', teal: '청록', blue: '파랑', violet: '보라', coral: '코랄' },
  zh: { title: '强调色', teal: '青绿', blue: '蓝色', violet: '紫色', coral: '珊瑚' },
  ja: { title: 'アクセントカラー', teal: 'ティール', blue: 'ブルー', violet: 'バイオレット', coral: 'コーラル' },
  ru: { title: 'Акцентный цвет', teal: 'Бирюзовый', blue: 'Синий', violet: 'Фиолетовый', coral: 'Коралловый' },
  it: { title: 'Colore principale', teal: 'Turchese', blue: 'Blu', violet: 'Viola', coral: 'Corallo' },
};

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { alert } = useAppDialog();
  const { preference, setPreference, accent, setAccent, isDark, colors } = useTheme();
  const { language, preference: languagePreference, setPreference: setLanguagePreference, t } = useLocale();
  const { currency, preference: currencyPreference, setPreference: setCurrencyPreference } = useCurrency();
  const { userName, updateUserName, reloadAllData, handleResetAllData } = useData();
  const { isPro, isBillingConfigured, openPaywall, toggleDevPro, resetPremiumStatus } = usePremium();
  const [nameInput, setNameInput] = useState(userName);
  const [statusMsg, setStatusMsg] = useState('');
  const [importError, setImportError] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const resetPending = useRef(false);
  const importPending = useRef<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<Awaited<ReturnType<typeof getReminderStatus>> | null>(null);
  const [expandedSetting, setExpandedSetting] = useState<'appearance' | 'accent' | 'language' | 'currency' | null>(null);

  useEffect(() => {
    if (visible) {
      setNameInput(userName);
      setImportError('');
      if (!resetting) setShowResetConfirm(false);
      void getReminderStatus().then(setReminderStatus).catch((error) => console.warn('Could not read notification status:', error));
    }
  }, [visible, userName]);

  const handleSaveName = async () => {
    if (!isValidNickname(nameInput.trim())) return;
    await updateUserName(nameInput.trim());
    setStatusMsg('Kullanıcı ismi güncellendi!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Share JSON File
  const handleShareJSONFile = async () => {
    setStatusMsg('Yedek dosyası hazırlanıyor...');
    const ok = await shareBackupFileJSON();
    if (ok) {
      setStatusMsg('Yedek dosyası paylaşım menüsüne açıldı!');
    } else {
      setStatusMsg('Yedek dosyası oluşturuldu.');
    }
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Share CSV File for Excel
  const handleShareCSVFile = async () => {
    if (!isPro) {
      onClose();
      setTimeout(() => {
        openPaywall('csv_export');
      }, 350);
      return;
    }
    setStatusMsg('Excel CSV rapor dosyası hazırlanıyor...');
    const ok = await shareTransactionsFileCSV();
    if (ok) {
      setStatusMsg('CSV dosyası paylaşım menüsüne açıldı!');
    } else {
      setStatusMsg('CSV dosyası oluşturuldu.');
    }
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Pick JSON File from Device & Import
  const handlePickAndImportFile = async () => {
    if (importing) return;
    setImportError('');
    setImporting(true);
    try {
      const res = await pickAndImportBackupFileJSON();
      if (res.success) {
        importPending.current = res.message || 'Yedek verileriniz cihazınızdan başarıyla yüklendi!';
        onClose();
      } else if (res.message !== 'İptal edildi') {
        setImportError(res.message || 'Yedek yükleme başarısız oldu.');
      }
    } finally {
      setImporting(false);
    }
  };

  // Manual Text fallback Export
  const handleExportTextJSON = async () => {
    const text = await exportAllDataJSON();
    setJsonText(text);
    setShowTextFallback(true);
  };

  // Manual Text fallback Import
  const handleApplyTextImport = async () => {
    if (importing) return;
    setImportError('');
    if (!jsonText.trim()) {
      setImportError('Lütfen geçerli bir yedek JSON metni yapıştırın.');
      return;
    }

    setImporting(true);
    try {
      const success = await importAllDataJSON(jsonText.trim());
      if (success) {
        importPending.current = 'Yedek verileriniz başarıyla yüklendi!';
        setShowTextFallback(false);
        onClose();
      } else {
        setImportError('Yedek metin formatı geçersiz!');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleResetAfterDismiss = () => {
    if (importPending.current) {
      const message = importPending.current;
      importPending.current = null;
      void reloadAllData().then(() => alert('Başarılı', message)).catch((error) => {
        console.error('Could not refresh restored data:', error);
        alert('Hata', 'Yedek yüklendi ancak ekran güncellenemedi. Uygulamayı yeniden açın.');
      });
      return;
    }
    if (!resetPending.current) return;
    resetPending.current = false;
    void (async () => {
      try {
        await resetPremiumStatus();
        await handleResetAllData();
      } catch (error) {
        console.error('Reset error:', error);
        alert('Hata', 'Veriler sıfırlanamadı. Tekrar deneyin.');
      } finally {
        setResetting(false);
        setShowResetConfirm(false);
      }
    })();
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      onDismiss={handleResetAfterDismiss}
      title="Ayarlar & Yedekleme"
      subtitle="Verilerinizi yönetin, dışa aktarın veya geri yükleyin."
      badge={{ text: 'SİSTEM', color: '#6366F1', bg: '#EEF2FF' }}
    >
      {/* Status Feedback Banner */}
      {importError ? (
        <View className="flex-row items-center gap-2 bg-red-50 dark:bg-[#3C2228] p-2.5 rounded-xl mb-3">
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text className="text-xs font-semibold text-red-700 dark:text-[#FFB4B4] flex-1">{importError}</Text>
        </View>
      ) : null}
      {statusMsg ? (
        <View className="flex-row items-center gap-2 bg-emerald-50 dark:bg-[#183C2D] p-2.5 rounded-xl mb-3">
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text className="text-xs font-semibold text-emerald-700 dark:text-[#70E0B0]">{statusMsg}</Text>
        </View>
      ) : null}

      {/* Penny Pro Status Banner Card */}
      <TouchableOpacity
        className="flex-row items-center justify-between p-3.5 rounded-2xl mb-4 border border-[#CAD8D2] dark:border-[#3C574E] bg-brand-soft dark:bg-brand-soft"
        activeOpacity={0.85}
        onPress={() => {
          onClose();
          setTimeout(() => {
            openPaywall('settings_upgrade');
          }, 350);
        }}
      >
        <View className="flex-row items-center gap-3 flex-1 mr-2">
          <View className="w-10 h-10 rounded-[14px] items-center justify-center bg-white dark:bg-[#182521]">
            <Ionicons name={isPro ? 'checkmark-circle-outline' : 'lock-closed-outline'} size={20} color={colors.primary} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-0.5">
              <Text className="text-sm font-bold text-zinc-900 dark:text-[#EAF2EE]">
                {isPro ? 'Penny Pro Aktif' : 'Penny Pro özellikleri'}
              </Text>
              <View className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#182521]">
                <Text className="text-[10px] font-bold text-brand dark:text-brand">
                  {isPro ? 'AKTİF' : 'İNCELE'}
                </Text>
              </View>
            </View>
            <Text className="text-[11px] text-zinc-500 dark:text-[#A9BDB2] leading-snug">
              {isPro
                ? 'Sınırsız bütçe & hedef, harcama bölüştürme ve tüm raporlar açık.'
                : 'Sınırsız bütçe, hedef, ortak harcama ve ayrıntılı raporlar.'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </TouchableOpacity>

      {/* Profil İsmi Güncelleme */}
      <Text className="text-xs font-bold text-zinc-400 dark:text-[#82978B] uppercase tracking-wider mb-2">Profil İsmi</Text>
      <View className="flex-row items-center gap-2 mb-4">
        <TextInput
          className="flex-1 bg-zinc-100 dark:bg-[#22332D] rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-[#EAF2EE]"
          value={nameInput}
          onChangeText={(text) => setNameInput(sanitizeNickname(text))}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={40}
          placeholder="İsminiz..."
          placeholderTextColor="#A1A1AA"
        />
        <TouchableOpacity
          className="bg-brand px-4 py-3 rounded-2xl active:bg-teal-700"
          onPress={handleSaveName}
          disabled={!isValidNickname(nameInput.trim())}
        >
          <Text className="text-white text-xs font-bold">Kaydet</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: expandedSetting === 'appearance' }} className="flex-row items-center justify-between bg-zinc-100 dark:bg-[#22332D] rounded-xl px-4 py-3 mb-2" onPress={() => setExpandedSetting(expandedSetting === 'appearance' ? null : 'appearance')}>
        <Text className="text-sm font-semibold text-zinc-900 dark:text-[#EAF2EE]">{t('Görünüm')} · {preference === 'system' ? t('Sistem') : preference === 'light' ? t('Açık') : t('Koyu')}</Text>
        <Ionicons name={expandedSetting === 'appearance' ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedText} />
      </TouchableOpacity>
      {expandedSetting === 'appearance' && <View className="flex-row gap-2 mb-4">
        {([
          ['system', 'Sistem', 'phone-portrait-outline'],
          ['light', 'Açık', 'sunny-outline'],
          ['dark', 'Koyu', 'moon-outline'],
        ] as const).map(([value, label, icon]) => (
          <TouchableOpacity
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected: preference === value }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 border ${preference === value ? 'bg-brand-soft dark:bg-brand-soft border-brand' : 'bg-zinc-100 dark:bg-[#22332D] border-[#E1E9E5] dark:border-[#2C4039]'}`}
            onPress={() => { void setPreference(value as ThemePreference); setExpandedSetting(null); }}
          >
            <Ionicons name={icon} size={15} color={preference === value ? colors.primary : colors.mutedText} />
            <Text style={{ color: preference === value ? colors.primary : colors.mutedText, fontSize: 12, fontWeight: '700' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>}

      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: expandedSetting === 'accent' }} className="flex-row items-center justify-between bg-zinc-100 dark:bg-[#22332D] rounded-xl px-4 py-3 mb-2" onPress={() => setExpandedSetting(expandedSetting === 'accent' ? null : 'accent')}>
        <Text localize={false} style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>{accentCopy[language].title} · {accentCopy[language][accent]}</Text>
        <Ionicons name={expandedSetting === 'accent' ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedText} />
      </TouchableOpacity>
      {expandedSetting === 'accent' && <View className="flex-row flex-wrap gap-2 mb-4">
        {(Object.keys(ACCENT_PALETTES) as AccentPreference[]).map((option) => <TouchableOpacity key={option} accessibilityRole="radio" accessibilityState={{ selected: accent === option }} onPress={() => { void setAccent(option); setExpandedSetting(null); }} style={{ backgroundColor: colors.card, borderColor: accent === option ? colors.primary : colors.cardBorder, borderWidth: 1, borderRadius: 12, minWidth: '47%', padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: isDark ? ACCENT_PALETTES[option].dark : ACCENT_PALETTES[option].light }} />
          <Text localize={false} style={{ color: colors.foreground, fontSize: 13, fontWeight: accent === option ? '700' : '500' }}>{accentCopy[language][option]}</Text>
        </TouchableOpacity>)}
      </View>}

      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: expandedSetting === 'language' }} className="flex-row items-center justify-between bg-zinc-100 dark:bg-[#22332D] rounded-xl px-4 py-3 mb-2" onPress={() => setExpandedSetting(expandedSetting === 'language' ? null : 'language')}>
        <Text localize={false} style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>{`${t('Uygulama Dili')} · ${getLanguageName(language, language)}`}</Text>
        <Ionicons name={expandedSetting === 'language' ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedText} />
      </TouchableOpacity>
      {expandedSetting === 'language' && <View className="flex-row flex-wrap gap-2 mb-4">
        {([{ code: 'system', name: 'Sistem dili' }, ...LANGUAGE_OPTIONS] as { code: LanguagePreference; name: string }[]).map((option) => {
          const selected = languagePreference === option.code;
          return (
            <TouchableOpacity
              key={option.code}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => { void setLanguagePreference(option.code); setExpandedSetting(null); }}
              className={`w-[31%] min-h-11 px-2 rounded-xl border items-center justify-center ${selected ? 'bg-brand-soft dark:bg-brand-soft border-brand' : 'bg-zinc-100 dark:bg-[#22332D] border-[#E1E9E5] dark:border-[#2C4039]'}`}
            >
              <Text localize={false} style={{ color: selected ? colors.primary : colors.secondaryForeground, fontSize: 12, fontWeight: selected ? '700' : '500', textAlign: 'center' }}>
                {option.code === 'system' ? t('Sistem dili') : getLanguageName(option.code, language)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>}

      <Text localize={false} className="text-xs font-bold text-zinc-400 dark:text-[#82978B] uppercase tracking-wider mb-2">
        {reminderCopy[language].title}
      </Text>
      <View className="bg-zinc-100 dark:bg-[#22332D] rounded-2xl p-3.5 mb-5">
        <Text localize={false} className="text-sm font-semibold text-zinc-800 dark:text-[#EAF2EE]">
          {reminderStatus ? reminderCopy[language][reminderStatus.status] : '…'}
        </Text>
        {reminderStatus ? (
          <Text localize={false} className="text-xs text-zinc-500 dark:text-[#A9BDB2] mt-1">
            {reminderCopy[language].count(reminderStatus.scheduled)}
          </Text>
        ) : null}
        <View className="flex-row flex-wrap gap-2 mt-3">
          {reminderStatus?.status !== 'allowed' ? (
            <TouchableOpacity
              className="rounded-xl border border-brand px-3 py-2.5"
              onPress={() => void Linking.openSettings()}
            >
              <Text localize={false} className="text-xs font-bold text-brand dark:text-brand">{reminderCopy[language].settings}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: expandedSetting === 'currency' }} className="flex-row items-center justify-between bg-zinc-100 dark:bg-[#22332D] rounded-xl px-4 py-3 mb-2" onPress={() => setExpandedSetting(expandedSetting === 'currency' ? null : 'currency')}>
        <Text localize={false} style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>{currencyCopy[language].title} · {currency}</Text>
        <Ionicons name={expandedSetting === 'currency' ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedText} />
      </TouchableOpacity>
      {expandedSetting === 'currency' && <View className="flex-row flex-wrap gap-2 mb-2">
        {(['system', ...CURRENCY_OPTIONS.map((item) => item.code)] as CurrencyPreference[]).map((option) => {
          const selected = currencyPreference === option;
          return (
            <TouchableOpacity
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => { void setCurrencyPreference(option); setExpandedSetting(null); }}
              className={`min-w-[22%] min-h-11 px-3 rounded-xl border items-center justify-center ${selected ? 'bg-brand-soft dark:bg-brand-soft border-brand' : 'bg-zinc-100 dark:bg-[#22332D] border-[#E1E9E5] dark:border-[#2C4039]'}`}
            >
              <Text localize={false} style={{ color: selected ? colors.primary : colors.secondaryForeground, fontSize: 12, fontWeight: selected ? '700' : '500' }}>
                {option === 'system' ? currencyCopy[language].system : option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>}
      <Text localize={false} className="text-xs text-zinc-500 dark:text-[#A9BDB2] mb-5">{currencyCopy[language].note}</Text>

      {/* Dosya Bazlı Yedekleme & İndirme */}
      <Text className="text-xs font-bold text-zinc-400 dark:text-[#82978B] uppercase tracking-wider mb-2">
        Dosya İle Yedekleme (Dosya Paylaş & Yükle)
      </Text>

      <TouchableOpacity
        className="flex-row items-center gap-3 bg-brand p-3.5 rounded-2xl mb-2.5 active:bg-teal-700"
        onPress={handleShareJSONFile}
      >
        <Ionicons name="document-text" size={20} color="#FFF" />
        <View className="flex-1">
          <Text className="text-sm font-bold text-white">JSON Yedek Dosyası Kaydet / Paylaş</Text>
          <Text className="text-[11px] text-teal-100 mt-0.5">
            Tüm verilerinizi .json dosyası olarak Dosyalar/Drive'a kaydedin
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center gap-3 bg-zinc-100 dark:bg-[#22332D] p-3.5 rounded-2xl mb-2.5 active:bg-zinc-200"
        onPress={handlePickAndImportFile}
        disabled={importing}
      >
        <Ionicons name="folder-open" size={20} color={colors.primary} />
        <View className="flex-1">
          <Text className="text-sm font-bold text-zinc-900 dark:text-[#EAF2EE]">Cihazdan Yedek Dosyası Seç & Yükle</Text>
          <Text className="text-[11px] text-zinc-500 dark:text-[#A9BDB2] mt-0.5">
            Dosyalar'ınızdan .json yedeğinizi seçin, tüm verilerinizi anında geri yükleyin
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center gap-3 bg-zinc-100 dark:bg-[#22332D] p-3.5 rounded-2xl mb-2.5 active:bg-zinc-200"
        onPress={handleShareCSVFile}
      >
        <Ionicons name="stats-chart" size={18} color="#059669" />
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-sm font-bold text-zinc-900 dark:text-[#EAF2EE]">Excel (CSV) Dosyası İndir</Text>
            {!isPro && (
              <View className="bg-amber-100 dark:bg-[#43341D] px-1.5 py-0.5 rounded">
                <Text className="text-[9px] font-extrabold text-amber-800 dark:text-[#FCD34D]">PRO</Text>
              </View>
            )}
          </View>
          <Text className="text-[11px] text-zinc-500 dark:text-[#A9BDB2] mt-0.5">
            {isPro
              ? "İşlemleri Excel'de açılabilir .csv rapor dosyası olarak kaydedin"
              : 'Penny Pro ile tüm işlemlerinizi Excel raporu olarak indirin'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Metin Kopyalama Alternatifi Toggle */}
      <TouchableOpacity
        className="flex-row items-center justify-center gap-1.5 py-2 mb-2"
        onPress={() => {
          if (!showTextFallback) handleExportTextJSON();
          else setShowTextFallback(false);
        }}
      >
        <Ionicons name="code-working-outline" size={16} color="#71717A" />
        <Text className="text-xs font-semibold text-zinc-500 dark:text-[#A9BDB2]">
          {showTextFallback ? 'Metin Kutusunu Gizle' : 'Metin Olarak Göster / Yapıştır'}
        </Text>
      </TouchableOpacity>

      {showTextFallback ? (
        <View className="bg-zinc-100 dark:bg-[#22332D] rounded-2xl p-3 mb-4">
          <TextInput
            className="text-xs text-zinc-800 dark:text-[#D8E7DC] h-28 leading-snug"
            multiline
            value={jsonText}
            onChangeText={setJsonText}
            placeholder="Yedek JSON metnini buraya kopyalayabilir veya yapıştırabilirsiniz..."
            placeholderTextColor="#A1A1AA"
          />
          <TouchableOpacity
            className="bg-brand py-2.5 rounded-xl items-center mt-2 active:bg-teal-700"
            onPress={handleApplyTextImport}
            disabled={importing}
          >
            <Text className="text-white text-xs font-bold">Metindeki Yedeği Yükle</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {__DEV__ && !isBillingConfigured && (
        <>
          <Text className="text-xs font-bold text-zinc-400 dark:text-[#82978B] uppercase tracking-wider mb-2 mt-2">
            Geliştirici Testi
          </Text>
          <TouchableOpacity
            className="flex-row items-center gap-3 bg-zinc-100 dark:bg-[#22332D] p-3.5 rounded-2xl mb-4 active:bg-zinc-200"
            onPress={async () => {
              await toggleDevPro();
              alert('Test Modu', !isPro ? 'Pro erişimi test için açıldı.' : 'Pro test erişimi kapatıldı.');
            }}
          >
            <Ionicons name="flask-outline" size={18} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-sm font-bold text-zinc-900 dark:text-[#EAF2EE]">{isPro ? 'Pro testini kapat' : 'Pro erişimini test et'}</Text>
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* Sıfırlama Butonu */}
      <Text className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Tehlikeli Bölge</Text>
      {showResetConfirm ? (
        <View className="bg-rose-50 dark:bg-[#44252E] p-3.5 rounded-2xl border border-rose-200 dark:border-[#68404A] mb-2">
          <Text className="text-sm font-bold text-rose-600 mb-1">Tüm Verileri Sıfırla</Text>
          <Text className="text-xs text-rose-700 dark:text-[#FDA4AF] mb-3">
            İşlemler, hedefler, abonelik kayıtları ve bütçeler silinecek. App Store aboneliğiniz devam eder.
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity className="flex-1 items-center rounded-xl bg-white dark:bg-[#22332D] py-3" onPress={() => setShowResetConfirm(false)}>
              <Text className="text-xs font-bold text-zinc-700 dark:text-[#CCDCD2]">Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center rounded-xl bg-rose-600 py-3"
              disabled={resetting}
              onPress={() => { setResetting(true); resetPending.current = true; onClose(); }}
            >
              <Text className="text-xs font-bold text-white">Evet, Sıfırla</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 bg-rose-50 dark:bg-[#44252E] p-3.5 rounded-2xl border border-rose-200 dark:border-[#68404A] active:bg-rose-100 mb-2"
          onPress={() => setShowResetConfirm(true)}
        >
          <Ionicons name="trash-outline" size={18} color="#E11D48" />
          <Text className="text-sm font-bold text-rose-600">Tüm Verileri Sıfırla</Text>
        </TouchableOpacity>
      )}
    </HeroUIModal>
  );
};
