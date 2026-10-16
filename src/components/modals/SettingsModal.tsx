import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, TextInput } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
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
import { LANGUAGE_OPTIONS, LanguagePreference, getLanguageName, useLocale } from '../../context/LocaleContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { alert } = useAppDialog();
  const { preference, setPreference, colors } = useTheme();
  const { language, preference: languagePreference, setPreference: setLanguagePreference, t } = useLocale();
  const { userName, updateUserName, reloadAllData, handleResetAllData } = useData();
  const { isPro, isBillingConfigured, openPaywall, toggleDevPro, resetPremiumStatus } = usePremium();
  const [nameInput, setNameInput] = useState(userName);
  const [statusMsg, setStatusMsg] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    if (visible) setNameInput(userName);
  }, [visible, userName]);

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
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
    const res = await pickAndImportBackupFileJSON();
    if (res.success) {
      await reloadAllData();
      alert('Başarılı', res.message || 'Yedek verileriniz cihazınızdan başarıyla yüklendi!');
      onClose();
    } else if (res.message !== 'İptal edildi') {
      alert('Hata', res.message || 'Yedek yükleme başarısız oldu.');
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
    if (!jsonText.trim()) {
      alert('Hata', 'Lütfen geçerli bir yedek JSON metni yapıştırın.');
      return;
    }

    const success = await importAllDataJSON(jsonText.trim());
    if (success) {
      await reloadAllData();
      alert('Başarılı', 'Yedek verileriniz başarıyla yüklendi!');
      setShowTextFallback(false);
      onClose();
    } else {
      alert('Hata', 'Yedek metin formatı geçersiz!');
    }
  };

  const handleConfirmReset = () => {
    alert(
      'Tüm Verileri Sıfırla',
      'Uygulamadaki işlemler, hedefler ve bütçeler silinecek. Mağaza aboneliğiniz bu işlemden etkilenmez. Emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            onClose();
            setTimeout(async () => {
              try {
                await resetPremiumStatus();
                await handleResetAllData();
              } catch (e) {
                console.error('Reset error:', e);
              }
            }, 300);
          },
        },
      ]
    );
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title="Ayarlar & Yedekleme"
      subtitle="Verilerinizi yönetin, dışa aktarın veya geri yükleyin."
      badge={{ text: 'SİSTEM', color: '#6366F1', bg: '#EEF2FF' }}
    >
      {/* Status Feedback Banner */}
      {statusMsg ? (
        <View className="flex-row items-center gap-2 bg-emerald-50 dark:bg-[#183C2D] p-2.5 rounded-xl mb-3">
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text className="text-xs font-semibold text-emerald-700 dark:text-[#70E0B0]">{statusMsg}</Text>
        </View>
      ) : null}

      {/* Penny Pro Status Banner Card */}
      <TouchableOpacity
        className="flex-row items-center justify-between p-3.5 rounded-2xl mb-4 border border-[#CAD8D2] dark:border-[#3C574E] bg-[#E3F2EC] dark:bg-[#203E35]"
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
            <Ionicons name={isPro ? 'checkmark-circle-outline' : 'lock-closed-outline'} size={20} color="#137C70" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-0.5">
              <Text className="text-sm font-bold text-zinc-900 dark:text-[#EAF2EE]">
                {isPro ? 'Penny Pro Aktif' : 'Penny Pro özellikleri'}
              </Text>
              <View className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#182521]">
                <Text className="text-[10px] font-bold text-[#137C70] dark:text-[#66C9AE]">
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
        <Ionicons name="chevron-forward" size={18} color="#137C70" />
      </TouchableOpacity>

      {/* Profil İsmi Güncelleme */}
      <Text className="text-xs font-bold text-zinc-400 dark:text-[#82978B] uppercase tracking-wider mb-2">Profil İsmi</Text>
      <View className="flex-row items-center gap-2 mb-4">
        <TextInput
          className="flex-1 bg-zinc-100 dark:bg-[#22332D] rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-[#EAF2EE]"
          value={nameInput}
          onChangeText={setNameInput}
          placeholder="İsminiz..."
          placeholderTextColor="#A1A1AA"
        />
        <TouchableOpacity
          className="bg-[#0D9488] px-4 py-3 rounded-2xl active:bg-teal-700"
          onPress={handleSaveName}
        >
          <Text className="text-white text-xs font-bold">Kaydet</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-xs font-bold text-zinc-400 dark:text-[#82978B] uppercase tracking-wider mb-2">Görünüm</Text>
      <View className="flex-row gap-2 mb-5">
        {([
          ['system', 'Sistem', 'phone-portrait-outline'],
          ['light', 'Açık', 'sunny-outline'],
          ['dark', 'Koyu', 'moon-outline'],
        ] as const).map(([value, label, icon]) => (
          <TouchableOpacity
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected: preference === value }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 border ${preference === value ? 'bg-[#E3F2EC] dark:bg-[#203E35] border-[#137C70]' : 'bg-zinc-100 dark:bg-[#22332D] border-[#E1E9E5] dark:border-[#2C4039]'}`}
            onPress={() => void setPreference(value as ThemePreference)}
          >
            <Ionicons name={icon} size={15} color={preference === value ? colors.primary : colors.mutedText} />
            <Text style={{ color: preference === value ? colors.primary : colors.mutedText, fontSize: 12, fontWeight: '700' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-xs font-bold text-zinc-400 dark:text-[#82978B] uppercase tracking-wider mb-2">Uygulama Dili</Text>
      <Text className="text-xs font-semibold text-[#137C70] dark:text-[#66C9AE] mb-2" localize={false}>
        {`${t('Seçili dil')}: ${getLanguageName(language, language)}`}
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-5">
        {([{ code: 'system', name: 'Sistem dili' }, ...LANGUAGE_OPTIONS] as { code: LanguagePreference; name: string }[]).map((option) => {
          const selected = languagePreference === option.code;
          return (
            <TouchableOpacity
              key={option.code}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => void setLanguagePreference(option.code)}
              className={`w-[31%] min-h-11 px-2 rounded-xl border items-center justify-center ${selected ? 'bg-[#E3F2EC] dark:bg-[#203E35] border-[#137C70]' : 'bg-zinc-100 dark:bg-[#22332D] border-[#E1E9E5] dark:border-[#2C4039]'}`}
            >
              <Text localize={false} style={{ color: selected ? colors.primary : colors.secondaryForeground, fontSize: 12, fontWeight: selected ? '700' : '500', textAlign: 'center' }}>
                {option.code === 'system' ? t('Sistem dili') : getLanguageName(option.code, language)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dosya Bazlı Yedekleme & İndirme */}
      <Text className="text-xs font-bold text-zinc-400 dark:text-[#82978B] uppercase tracking-wider mb-2">
        Dosya İle Yedekleme (Dosya Paylaş & Yükle)
      </Text>

      <TouchableOpacity
        className="flex-row items-center gap-3 bg-[#0D9488] p-3.5 rounded-2xl mb-2.5 active:bg-teal-700"
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
      >
        <Ionicons name="folder-open" size={20} color="#0D9488" />
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
            className="bg-[#0D9488] py-2.5 rounded-xl items-center mt-2 active:bg-teal-700"
            onPress={handleApplyTextImport}
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
            <Ionicons name="flask-outline" size={18} color="#137C70" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-zinc-900 dark:text-[#EAF2EE]">{isPro ? 'Pro testini kapat' : 'Pro erişimini test et'}</Text>
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* Sıfırlama Butonu */}
      <Text className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Tehlikeli Bölge</Text>
      <TouchableOpacity
        className="flex-row items-center justify-center gap-2 bg-rose-50 dark:bg-[#44252E] p-3.5 rounded-2xl border border-rose-200 dark:border-[#68404A] active:bg-rose-100 mb-2"
        onPress={handleConfirmReset}
      >
        <Ionicons name="trash-outline" size={18} color="#E11D48" />
        <Text className="text-sm font-bold text-rose-600">Tüm Verileri Sıfırla</Text>
      </TouchableOpacity>
    </HeroUIModal>
  );
};
