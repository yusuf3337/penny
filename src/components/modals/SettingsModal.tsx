import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useData } from '../../context/DataContext';
import {
  exportAllDataJSON,
  exportTransactionsCSV,
  importAllDataJSON,
  shareBackupFileJSON,
  shareTransactionsFileCSV,
  pickAndImportBackupFileJSON,
} from '../../services/storageService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { userName, updateUserName, reloadAllData, handleResetAllData } = useData();
  const [nameInput, setNameInput] = useState(userName);
  const [statusMsg, setStatusMsg] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    await updateUserName(nameInput.trim());
    setStatusMsg('Kullanıcı ismi güncellendi!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // 📁 Share JSON File
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

  // 📊 Share CSV File for Excel
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

  // 📂 Pick JSON File from Device & Import
  const handlePickAndImportFile = async () => {
    const res = await pickAndImportBackupFileJSON();
    if (res.success) {
      await reloadAllData();
      Alert.alert('Başarılı 🥳', res.message || 'Yedek verileriniz cihazınızdan başarıyla yüklendi!');
      onClose();
    } else if (res.message !== 'İptal edildi') {
      Alert.alert('Hata ⚠️', res.message || 'Yedek yükleme başarısız oldu.');
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
      Alert.alert('Hata', 'Lütfen geçerli bir yedek JSON metni yapıştırın.');
      return;
    }

    const success = await importAllDataJSON(jsonText.trim());
    if (success) {
      await reloadAllData();
      Alert.alert('Başarılı', 'Yedek verileriniz başarıyla yüklendi!');
      setShowTextFallback(false);
      onClose();
    } else {
      Alert.alert('Hata', 'Yedek metin formatı geçersiz!');
    }
  };

  const handleConfirmReset = () => {
    Alert.alert(
      'Tüm Verileri Sıfırla',
      'Uygulamadaki tüm işlemler, hedefler, bütçeler ve abonelikler kalıcı olarak silinecek. Emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await handleResetAllData();
            Alert.alert('Sıfırlandı', 'Tüm verileriniz temizlendi.');
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Ionicons name="settings-outline" size={22} color={COLORS.foreground} />
              <Text style={styles.headerTitle}>Veri Yedekleme & Ayarlar</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Status Feedback Banner */}
            {statusMsg ? (
              <View style={styles.statusBanner}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.emeraldText} />
                <Text style={styles.statusBannerText}>{statusMsg}</Text>
              </View>
            ) : null}

            {/* Profil İsmi Güncelleme */}
            <Text style={styles.sectionLabel}>Profil İsmi</Text>
            <View style={styles.nameRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="İsminiz..."
                placeholderTextColor={COLORS.mutedText}
              />
              <TouchableOpacity style={styles.saveNameBtn} onPress={handleSaveName}>
                <Text style={styles.saveNameText}>Kaydet</Text>
              </TouchableOpacity>
            </View>

            {/* Dosya Bazlı Yedekleme & İndirme */}
            <Text style={styles.sectionLabel}>Dosya İle Yedekleme (Dosya Paylaş & Yükle)</Text>

            <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleShareJSONFile}>
              <Ionicons name="document-text" size={20} color="#FFF" />
              <View style={styles.btnTextWrap}>
                <Text style={styles.actionBtnTitleWhite}>📁 JSON Yedek Dosyası Kaydet / Paylaş</Text>
                <Text style={styles.actionBtnSubWhite}>
                  Tüm verilerinizi .json dosyası olarak Dosyalar/Drive'a kaydedin
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnSecondary} onPress={handlePickAndImportFile}>
              <Ionicons name="folder-open" size={20} color={COLORS.primary} />
              <View style={styles.btnTextWrap}>
                <Text style={styles.actionBtnTitle}>📂 Cihazdan Yedek Dosyası Seç & Yükle</Text>
                <Text style={styles.actionBtnSub}>
                  Dosyalar'ınızdan .json yedeğinizi seçin, tüm verilerinizi anında geri yükleyin
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShareCSVFile}>
              <Ionicons name="stats-chart" size={18} color={COLORS.emeraldText} />
              <View style={styles.btnTextWrap}>
                <Text style={styles.actionBtnTitle}>📊 Excel (CSV) Dosyası İndir</Text>
                <Text style={styles.actionBtnSub}>
                  İşlemleri Excel'de açılabilir .csv rapor dosyası olarak kaydedin
                </Text>
              </View>
            </TouchableOpacity>

            {/* Metin Kopyalama Alternatifi Toggle */}
            <TouchableOpacity
              style={styles.textFallbackToggle}
              onPress={() => {
                if (!showTextFallback) handleExportTextJSON();
                else setShowTextFallback(false);
              }}
            >
              <Ionicons name="code-working-outline" size={16} color={COLORS.mutedText} />
              <Text style={styles.textFallbackToggleText}>
                {showTextFallback ? 'Metin Kutusunu Gizle' : 'Metin Olarak Göster / Yapıştır'}
              </Text>
            </TouchableOpacity>

            {showTextFallback ? (
              <View style={styles.jsonContainer}>
                <TextInput
                  style={styles.jsonTextInput}
                  multiline
                  value={jsonText}
                  onChangeText={setJsonText}
                  placeholder="Yedek JSON metnini buraya kopyalayabilir veya yapıştırabilirsiniz..."
                  placeholderTextColor={COLORS.mutedText}
                />
                <TouchableOpacity style={styles.importConfirmBtn} onPress={handleApplyTextImport}>
                  <Text style={styles.importConfirmText}>📥 Metindeki Yedeği Yükle</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Sıfırlama Butonu */}
            <Text style={styles.sectionLabel}>Tehlikeli Bölge</Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleConfirmReset}>
              <Ionicons name="trash-outline" size={18} color={COLORS.roseText} />
              <Text style={styles.dangerBtnText}>Tüm Verileri Sıfırla</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.emeraldBg,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.emeraldText,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mutedText,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.foreground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  saveNameBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 14,
  },
  saveNameText: {
    color: COLORS.primaryForeground,
    fontWeight: '700',
    fontSize: 13,
  },

  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 10,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
    gap: 12,
  },
  btnTextWrap: {
    flex: 1,
  },
  actionBtnTitleWhite: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  actionBtnSubWhite: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  actionBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  actionBtnSub: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },

  textFallbackToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  textFallbackToggleText: {
    fontSize: 12,
    color: COLORS.mutedText,
    fontWeight: '600',
  },

  jsonContainer: {
    marginTop: 8,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  jsonTextInput: {
    height: 100,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 10,
    fontSize: 11,
    color: COLORS.foreground,
    textAlignVertical: 'top',
  },
  importConfirmBtn: {
    backgroundColor: COLORS.emerald,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  importConfirmText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },

  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.roseBg,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginBottom: 20,
    gap: 8,
  },
  dangerBtnText: {
    color: COLORS.roseText,
    fontWeight: '700',
    fontSize: 14,
  },
});
