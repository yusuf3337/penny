import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
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
import { HeroUIModal } from '../common/HeroUIModal';
import { Alert } from 'heroui-native/alert';
import { useAppDialog } from '../../context/AppDialogContext';
import { ThemePreference, useTheme } from '../../context/ThemeContext';
import { LANGUAGE_OPTIONS, LanguagePreference, AppLanguage, getLanguageName, useLocale } from '../../context/LocaleContext';
import { CURRENCY_OPTIONS, CurrencyPreference, useCurrency } from '../../context/CurrencyContext';
import { isValidNickname, sanitizeNickname } from '../../utils/nickname';

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
  const [expandedSetting, setExpandedSetting] = useState<'appearance' | 'accent' | 'language' | 'currency' | null>(null);

  useEffect(() => {
    if (visible) {
      setNameInput(userName);
      setImportError('');
      if (!resetting) setShowResetConfirm(false);
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
        <Alert status="danger" className="mb-3 rounded-2xl">
          <Alert.Indicator />
          <Alert.Content><Alert.Description>{importError}</Alert.Description></Alert.Content>
        </Alert>
      ) : null}
      {statusMsg ? (
        <Alert status="success" className="mb-3 rounded-2xl">
          <Alert.Indicator />
          <Alert.Content><Alert.Description>{statusMsg}</Alert.Description></Alert.Content>
        </Alert>
      ) : null}

      {/* Profil İsmi Güncelleme */}
      <Text className="text-xs font-bold text-zinc-400 dark:text-[#93A5C8] uppercase tracking-wider mb-2">Profil İsmi</Text>
      <View className="flex-row items-center gap-2 mb-4">
        <TextInput
          className="flex-1 bg-zinc-100 dark:bg-[#1E2A48] rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-[#F5F7FF]"
          value={nameInput}
          onChangeText={(text) => setNameInput(sanitizeNickname(text))}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={40}
          placeholder="İsminiz..."
          placeholderTextColor="#A1A1AA"
        />
        <TouchableOpacity
          className="bg-brand px-4 py-3 rounded-2xl"
          onPress={handleSaveName}
          disabled={!isValidNickname(nameInput.trim())}
        >
          <Text className="text-brand-foreground text-xs font-bold">Kaydet</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: expandedSetting === 'appearance' }} className="flex-row items-center justify-between bg-zinc-100 dark:bg-[#1E2A48] rounded-xl px-4 py-3 mb-2" onPress={() => setExpandedSetting(expandedSetting === 'appearance' ? null : 'appearance')}>
        <Text className="text-sm font-semibold text-zinc-900 dark:text-[#F5F7FF]">{t('Görünüm')} · {preference === 'system' ? t('Sistem') : preference === 'light' ? t('Açık') : t('Koyu')}</Text>
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
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 border ${preference === value ? 'bg-brand-soft dark:bg-brand-soft border-brand' : 'bg-zinc-100 dark:bg-[#1E2A48] border-[#DAE3F4] dark:border-[#2B3A5D]'}`}
            onPress={() => { void setPreference(value as ThemePreference); setExpandedSetting(null); }}
          >
            <Ionicons name={icon} size={15} color={preference === value ? colors.primary : colors.mutedText} />
            <Text style={{ color: preference === value ? colors.primary : colors.mutedText, fontSize: 12, fontWeight: '700' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>}

      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: expandedSetting === 'accent' }} className="flex-row items-center justify-between bg-zinc-100 dark:bg-[#1E2A48] rounded-xl px-4 py-3 mb-2" onPress={() => setExpandedSetting(expandedSetting === 'accent' ? null : 'accent')}>
        <Text localize={false} style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>{accentCopy[language].title} · {accentCopy[language][accent]}</Text>
        <Ionicons name={expandedSetting === 'accent' ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedText} />
      </TouchableOpacity>
      {expandedSetting === 'accent' && <View className="flex-row flex-wrap gap-2 mb-4">
        {(Object.keys(ACCENT_PALETTES) as AccentPreference[]).map((option) => <TouchableOpacity key={option} accessibilityRole="radio" accessibilityState={{ selected: accent === option }} onPress={() => { void setAccent(option); setExpandedSetting(null); }} style={{ backgroundColor: colors.card, borderColor: accent === option ? colors.primary : colors.cardBorder, borderWidth: 1, borderRadius: 12, minWidth: '47%', padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: isDark ? ACCENT_PALETTES[option].dark : ACCENT_PALETTES[option].light }} />
          <Text localize={false} style={{ color: colors.foreground, fontSize: 13, fontWeight: accent === option ? '700' : '500' }}>{accentCopy[language][option]}</Text>
        </TouchableOpacity>)}
      </View>}

      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: expandedSetting === 'language' }} className="flex-row items-center justify-between bg-zinc-100 dark:bg-[#1E2A48] rounded-xl px-4 py-3 mb-2" onPress={() => setExpandedSetting(expandedSetting === 'language' ? null : 'language')}>
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
              className={`w-[31%] min-h-11 px-2 rounded-xl border items-center justify-center ${selected ? 'bg-brand-soft dark:bg-brand-soft border-brand' : 'bg-zinc-100 dark:bg-[#1E2A48] border-[#DAE3F4] dark:border-[#2B3A5D]'}`}
            >
              <Text localize={false} style={{ color: selected ? colors.primary : colors.secondaryForeground, fontSize: 12, fontWeight: selected ? '700' : '500', textAlign: 'center' }}>
                {option.code === 'system' ? t('Sistem dili') : getLanguageName(option.code, language)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>}

      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: expandedSetting === 'currency' }} className="flex-row items-center justify-between bg-zinc-100 dark:bg-[#1E2A48] rounded-xl px-4 py-3 mb-2" onPress={() => setExpandedSetting(expandedSetting === 'currency' ? null : 'currency')}>
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
              className={`min-w-[22%] min-h-11 px-3 rounded-xl border items-center justify-center ${selected ? 'bg-brand-soft dark:bg-brand-soft border-brand' : 'bg-zinc-100 dark:bg-[#1E2A48] border-[#DAE3F4] dark:border-[#2B3A5D]'}`}
            >
              <Text localize={false} style={{ color: selected ? colors.primary : colors.secondaryForeground, fontSize: 12, fontWeight: selected ? '700' : '500' }}>
                {option === 'system' ? currencyCopy[language].system : option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>}
      <Text localize={false} className="text-xs text-zinc-500 dark:text-[#BAC8E6] mb-5">{currencyCopy[language].note}</Text>

      {/* Dosya Bazlı Yedekleme & İndirme */}
      <Text className="text-xs font-bold text-zinc-400 dark:text-[#93A5C8] uppercase tracking-wider mb-2">
        Dosya İle Yedekleme (Dosya Paylaş & Yükle)
      </Text>

      <TouchableOpacity
        className="flex-row items-center gap-3 bg-brand p-3.5 rounded-2xl mb-2.5"
        onPress={handleShareJSONFile}
      >
        <Ionicons name="document-text" size={20} color={colors.primaryForeground} />
        <View className="flex-1">
          <Text className="text-sm font-bold text-brand-foreground">JSON Yedek Dosyası Kaydet / Paylaş</Text>
          <Text className="text-[11px] text-brand-foreground/80 mt-0.5">
            Tüm verilerinizi .json dosyası olarak Dosyalar/Drive'a kaydedin
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center gap-3 bg-zinc-100 dark:bg-[#1E2A48] p-3.5 rounded-2xl mb-2.5 active:bg-zinc-200"
        onPress={handlePickAndImportFile}
        disabled={importing}
      >
        <Ionicons name="folder-open" size={20} color={colors.primary} />
        <View className="flex-1">
          <Text className="text-sm font-bold text-zinc-900 dark:text-[#F5F7FF]">Cihazdan Yedek Dosyası Seç & Yükle</Text>
          <Text className="text-[11px] text-zinc-500 dark:text-[#BAC8E6] mt-0.5">
            Dosyalar'ınızdan .json yedeğinizi seçin, tüm verilerinizi anında geri yükleyin
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center gap-3 bg-zinc-100 dark:bg-[#1E2A48] p-3.5 rounded-2xl mb-2.5 active:bg-zinc-200"
        onPress={handleShareCSVFile}
      >
        <Ionicons name="stats-chart" size={18} color="#059669" />
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-sm font-bold text-zinc-900 dark:text-[#F5F7FF]">Excel (CSV) Dosyası İndir</Text>
          </View>
          <Text className="text-[11px] text-zinc-500 dark:text-[#BAC8E6] mt-0.5">
            İşlemleri Excel'de açılabilir .csv rapor dosyası olarak kaydedin
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
        <Text className="text-xs font-semibold text-zinc-500 dark:text-[#BAC8E6]">
          {showTextFallback ? 'Metin Kutusunu Gizle' : 'Metin Olarak Göster / Yapıştır'}
        </Text>
      </TouchableOpacity>

      {showTextFallback ? (
        <View className="bg-zinc-100 dark:bg-[#1E2A48] rounded-2xl p-3 mb-4">
          <TextInput
            className="text-xs text-zinc-800 dark:text-[#D8E7DC] h-28 leading-snug"
            multiline
            value={jsonText}
            onChangeText={setJsonText}
            placeholder="Yedek JSON metnini buraya kopyalayabilir veya yapıştırabilirsiniz..."
            placeholderTextColor="#A1A1AA"
          />
          <TouchableOpacity
            className="bg-brand py-2.5 rounded-xl items-center mt-2"
            onPress={handleApplyTextImport}
            disabled={importing}
          >
            <Text className="text-brand-foreground text-xs font-bold">Metindeki Yedeği Yükle</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Sıfırlama Butonu */}
      <Text className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Tehlikeli Bölge</Text>
      {showResetConfirm ? (
        <View className="bg-rose-50 dark:bg-[#44252E] p-3.5 rounded-2xl border border-rose-200 dark:border-[#68404A] mb-2">
          <Text className="text-sm font-bold text-rose-600 mb-1">Tüm Verileri Sıfırla</Text>
          <Text className="text-xs text-rose-700 dark:text-[#FDA4AF] mb-3">
            İşlemler, hedefler, abonelik kayıtları ve bütçeler silinecek.
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity className="flex-1 items-center rounded-xl bg-white dark:bg-[#1E2A48] py-3" onPress={() => setShowResetConfirm(false)}>
              <Text className="text-xs font-bold text-zinc-700 dark:text-[#D5E0F8]">Vazgeç</Text>
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
