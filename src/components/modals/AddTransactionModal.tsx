import { getCurrencySymbol } from '../../context/CurrencyContext';
import React, { useState, useEffect, useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { Ionicons } from '@expo/vector-icons';
import { AppTransaction, Account } from '../../types';
import { getAccounts, DEFAULT_CATEGORIES } from '../../services/storageService';
import { formatNumberInput, parseAmountSafely, formatCurrency } from '../../utils/formatters';
import { AppLanguage, getFormattingLocale, useLocale } from '../../context/LocaleContext';
import { useData } from '../../context/DataContext';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { useTheme } from '../../context/ThemeContext';
import { Surface } from 'heroui-native/surface';
import { useVoiceTransaction } from '../../hooks/useVoiceTransaction';
import { parseVoiceTransaction } from '../../utils/voiceTransaction';

interface AddTransactionModalProps {
  visible: boolean;
  initialTransaction?: AppTransaction | null;
  prefillTransaction?: AppTransaction | null;
  initialType?: 'income' | 'expense';
  onClose: () => void;
  onSave: (tx: Omit<AppTransaction, 'id' | 'date'> & { date?: string }) => Promise<void> | void;
}

const accountCopy: Record<AppLanguage, { title: string; required: string }> = {
  tr: { title: 'Hesap seçimi', required: 'Banka veya nakit hesabı seçin.' },
  en: { title: 'Account', required: 'Choose bank or cash.' },
  de: { title: 'Konto', required: 'Bank oder Bargeld auswählen.' },
  fr: { title: 'Compte', required: 'Choisissez banque ou espèces.' },
  ko: { title: '계좌 선택', required: '은행 또는 현금을 선택하세요.' },
  zh: { title: '选择账户', required: '请选择银行或现金。' },
  ja: { title: '口座を選択', required: '銀行または現金を選択してください。' },
  ru: { title: 'Счёт', required: 'Выберите банк или наличные.' },
  it: { title: 'Conto', required: 'Scegli banca o contanti.' },
};
const quickCopy: Record<AppLanguage, { repeat: string; remembered: string; repeatHint: string }> = {
  tr: { repeat: 'İşlemi Tekrarla', remembered: 'Önceki seçimi kullan', repeatHint: 'Önceki işlem hazır. Tutarı kontrol edip kaydedin.' },
  en: { repeat: 'Repeat transaction', remembered: 'Use previous selection', repeatHint: 'Previous details are ready. Check the amount before saving.' },
  de: { repeat: 'Buchung wiederholen', remembered: 'Vorherige Auswahl verwenden', repeatHint: 'Vorherige Angaben sind bereit. Prüfen Sie den Betrag.' },
  fr: { repeat: 'Répéter l’opération', remembered: 'Utiliser le choix précédent', repeatHint: 'Les détails précédents sont prêts. Vérifiez le montant.' },
  ko: { repeat: '거래 다시 입력', remembered: '이전 선택 사용', repeatHint: '이전 거래 정보가 준비되었습니다. 금액을 확인하세요.' },
  zh: { repeat: '重复交易', remembered: '使用上次选择', repeatHint: '已填入上次交易信息，请确认金额。' },
  ja: { repeat: '取引を再入力', remembered: '前回の選択を使用', repeatHint: '前回の内容を入力しました。金額を確認してください。' },
  ru: { repeat: 'Повторить операцию', remembered: 'Использовать прошлый выбор', repeatHint: 'Предыдущие данные готовы. Проверьте сумму.' },
  it: { repeat: 'Ripeti operazione', remembered: 'Usa la scelta precedente', repeatHint: 'I dati precedenti sono pronti. Controlla l’importo.' },
};

const voiceCopy: Record<AppLanguage, { title: string; hint: string; start: string; stop: string; listening: string; review: string; permission: string; unavailable: string; noSpeech: string; failed: string }> = {
  tr: { title: 'Sesle işlem ekle', hint: 'Örn: “Market için 250 lira nakit gider”', start: 'Konuşmaya başla', stop: 'Dinlemeyi bitir', listening: 'Dinleniyor…', review: 'Alanları kontrol edip eksikleri tamamlayın.', permission: 'Mikrofon ve konuşma tanıma izni gerekli.', unavailable: 'Sesli giriş için yeni TestFlight veya geliştirme build’i gerekir.', noSpeech: 'Ses algılanmadı. Tekrar deneyin.', failed: 'Ses anlaşılamadı. Tekrar deneyin.' },
  en: { title: 'Add by voice', hint: 'Try “Spent 25 dollars on coffee in cash”', start: 'Start speaking', stop: 'Finish listening', listening: 'Listening…', review: 'Review the fields and complete any missing details.', permission: 'Microphone and speech recognition access is required.', unavailable: 'Voice entry needs a new TestFlight or development build.', noSpeech: 'No speech detected. Try again.', failed: 'Could not understand your speech. Try again.' },
  de: { title: 'Per Sprache hinzufügen', hint: 'Zum Beispiel: „25 Euro Kaffee bar bezahlt“', start: 'Sprechen', stop: 'Aufnahme beenden', listening: 'Hört zu…', review: 'Felder prüfen und Fehlendes ergänzen.', permission: 'Mikrofon- und Spracherkennungszugriff erforderlich.', unavailable: 'Spracheingabe erfordert einen neuen TestFlight- oder Entwicklungs-Build.', noSpeech: 'Keine Sprache erkannt. Erneut versuchen.', failed: 'Sprache nicht verstanden. Erneut versuchen.' },
  fr: { title: 'Ajouter par la voix', hint: 'Ex. : « 25 euros de café en espèces »', start: 'Parler', stop: 'Terminer l’écoute', listening: 'Écoute…', review: 'Vérifiez les champs et complétez les détails manquants.', permission: 'Accès au microphone et à la reconnaissance vocale requis.', unavailable: 'Un nouveau build TestFlight ou de développement est nécessaire.', noSpeech: 'Aucune parole détectée. Réessayez.', failed: 'Parole non comprise. Réessayez.' },
  ko: { title: '음성으로 추가', hint: '예: “커피 2500원 현금 지출”', start: '말하기 시작', stop: '듣기 종료', listening: '듣는 중…', review: '내용을 확인하고 빠진 항목을 입력하세요.', permission: '마이크 및 음성 인식 권한이 필요합니다.', unavailable: '음성 입력에는 새 TestFlight 또는 개발 빌드가 필요합니다.', noSpeech: '음성이 감지되지 않았습니다. 다시 시도하세요.', failed: '음성을 이해하지 못했습니다. 다시 시도하세요.' },
  zh: { title: '语音添加', hint: '例如：“现金支付 25 元咖啡”', start: '开始说话', stop: '结束聆听', listening: '正在聆听…', review: '请检查字段并补充缺少的信息。', permission: '需要麦克风和语音识别权限。', unavailable: '语音输入需要新的 TestFlight 或开发版本。', noSpeech: '未检测到语音，请重试。', failed: '无法识别语音，请重试。' },
  ja: { title: '音声で追加', hint: '例：「コーヒーに現金で250円支出」', start: '話し始める', stop: '聞き取りを終了', listening: '聞き取り中…', review: '入力内容を確認し、不足分を補ってください。', permission: 'マイクと音声認識の許可が必要です。', unavailable: '音声入力には新しいTestFlightまたは開発ビルドが必要です。', noSpeech: '音声が検出されませんでした。再試行してください。', failed: '音声を認識できませんでした。再試行してください。' },
  ru: { title: 'Добавить голосом', hint: 'Например: «Кофе 250 рублей наличными»', start: 'Начать говорить', stop: 'Завершить запись', listening: 'Слушаю…', review: 'Проверьте поля и заполните недостающие данные.', permission: 'Нужен доступ к микрофону и распознаванию речи.', unavailable: 'Для голосового ввода нужна новая сборка TestFlight или разработки.', noSpeech: 'Речь не обнаружена. Повторите попытку.', failed: 'Не удалось распознать речь. Повторите попытку.' },
  it: { title: 'Aggiungi con la voce', hint: 'Per esempio: “25 euro per un caffè in contanti”', start: 'Inizia a parlare', stop: 'Termina ascolto', listening: 'In ascolto…', review: 'Controlla i campi e completa i dettagli mancanti.', permission: 'Servono i permessi per microfono e riconoscimento vocale.', unavailable: 'Serve una nuova build TestFlight o di sviluppo.', noSpeech: 'Nessuna voce rilevata. Riprova.', failed: 'Voce non compresa. Riprova.' },
};

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  initialTransaction,
  prefillTransaction,
  initialType = 'expense',
  onClose,
  onSave,
}) => {
  const { categories: contextCategories, budgets, transactions, handleAddCategory } = useData();
  const { colors } = useTheme();
  const { language, t } = useLocale();
  const voice = useVoiceTransaction(visible);
  const categoriesList = contextCategories && contextCategories.length > 0
    ? contextCategories
    : DEFAULT_CATEGORIES;

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [accountError, setAccountError] = useState(false);
  const [txDate, setTxDate] = useState<Date>(new Date());
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredCategories = useMemo(() => {
    const matching = categoriesList.filter((category) => category.type === type);
    if (type !== 'expense') return matching;
    const budgetNames = new Set(budgets.map((budget) => budget.categoryName.trim().toLocaleLowerCase('tr-TR')));
    return [...matching].sort((a, b) =>
      Number(budgetNames.has(b.name.trim().toLocaleLowerCase('tr-TR'))) -
      Number(budgetNames.has(a.name.trim().toLocaleLowerCase('tr-TR')))
    );
  }, [categoriesList, budgets, type]);
  const budgetNames = useMemo(
    () => new Set(budgets.map((budget) => budget.categoryName.trim().toLocaleLowerCase('tr-TR'))),
    [budgets]
  );
  const rememberedTransaction = useMemo(() => {
    if (initialTransaction || prefillTransaction || title.trim().length < 2) return null;
    const normalizedTitle = title.trim().toLocaleLowerCase(language === 'tr' ? 'tr-TR' : undefined);
    return transactions.find((transaction) =>
      transaction.type === type &&
      transaction.title.trim().toLocaleLowerCase(language === 'tr' ? 'tr-TR' : undefined) === normalizedTitle &&
      filteredCategories.some((category) => category.name === transaction.category)
    ) ?? null;
  }, [transactions, title, type, filteredCategories, initialTransaction, prefillTransaction, language]);

  useEffect(() => {
    if (visible) {
      const source = initialTransaction ?? prefillTransaction;
      setType(source?.type === 'income' ? 'income' : source?.type === 'expense' ? 'expense' : initialType);
      setTitle(source?.title ?? '');
      setAmountInput(source ? formatNumberInput(String(source.rawAmount)) : '');
      setSelectedCategory(source?.category ?? '');
      const existingDate = initialTransaction?.date ? new Date(initialTransaction.date) : new Date();
      setTxDate(Number.isNaN(existingDate.getTime()) ? new Date() : existingDate);
      setError('');
      setSelectionError('');
      setAccountError(false);
      setSelectedAccountId('');
      setShowDetails(false);
      setShowVoice(false);
      getAccounts().then((accs) => {
        setAccounts(accs);
        const matching = accs.find((acc) => acc.id === source?.accountId)
          ?? accs.find((acc) => acc.type === source?.accountType);
        setSelectedAccountId(matching?.id ?? '');
      });
    }
  }, [visible, initialTransaction, prefillTransaction, initialType]);

  useEffect(() => {
    if (!voice.finalTranscript) return;
    const draft = parseVoiceTransaction(
      voice.finalTranscript,
      language,
      categoriesList.map((category) => ({ ...category, localizedName: t(category.name) })),
    );
    setType(draft.type);
    if (draft.amount) setAmountInput(formatNumberInput(String(draft.amount)));
    if (draft.title) setTitle(draft.title);
    if (draft.category) setSelectedCategory(draft.category);
    if (draft.accountType) {
      const account = accounts.find((item) => item.type === draft.accountType);
      if (account) { setSelectedAccountId(account.id); setAccountError(false); }
    }
    setError('');
    setSelectionError('');
  }, [voice.finalTranscript, accounts]);

  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError('Lütfen bir kategori adı girin.');
      return;
    }
    const existing = filteredCategories.find((category) => category.name.trim().toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'));
    if (existing) {
      setSelectedCategory(existing.name);
      setSelectionError('');
      setShowCategoryInput(false);
      setNewCategoryName('');
      setCategoryError('');
      return;
    }
    if (creatingCategory) return;
    setCreatingCategory(true);
    try {
      await handleAddCategory(name, type, type === 'expense' ? 'pricetag-outline' : 'arrow-down-circle-outline');
      setSelectedCategory(name);
      setSelectionError('');
      setNewCategoryName('');
      setCategoryError('');
      setShowCategoryInput(false);
    } catch {
      setCategoryError('Kategori oluşturulamadı. Tekrar deneyin.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const setToday = () => setTxDate(new Date());
  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setTxDate(d);
  };
  const stepDay = (delta: number) => {
    const d = new Date(txDate.getTime());
    d.setDate(d.getDate() + delta);
    setTxDate(d);
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isYesterday = (d: Date) => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    return d.toDateString() === yest.toDateString();
  };

  const handleSave = async () => {
    if (creatingCategory || saving) return;
    if (!title.trim()) {
      setError('Lütfen bir başlık veya açıklama girin.');
      return;
    }
    const parsedAmount = parseAmountSafely(amountInput);
    if (parsedAmount <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }

    const selectedAcc = accounts.find((account) => account.id === selectedAccountId);
    if (!selectedAcc) {
      setAccountError(true);
      return;
    }

    const categoryToUse = filteredCategories.find((category) => category.name === selectedCategory)?.name;
    if (!categoryToUse) {
      setSelectionError('Kategori Seçin');
      return;
    }

    const formattedAmount = `${type === 'income' ? '+' : '-'}${formatCurrency(parsedAmount)}`;

    let iconName = 'pricetag-outline';
    const foundCat = categoriesList.find((c) => c.name === categoryToUse);
    if (foundCat) iconName = foundCat.icon;
    else if (type === 'income') iconName = 'arrow-down-left';

    const accountType: 'bank' | 'cash' = selectedAcc.type === 'cash' ? 'cash' : 'bank';

    setSaving(true);
    try {
    await onSave({
      title: title.trim(),
      category: categoryToUse,
      amount: formattedAmount,
      rawAmount: parsedAmount,
      type,
      iconName,
      accountId: selectedAccountId,
      accountName: selectedAcc.name,
      accountType,
      date: txDate.toISOString(),
    });

    // Reset inputs
    setTitle('');
    setAmountInput('');
    setError('');
    setSelectedCategory('');
    setSelectionError('');
    setSelectedAccountId('');
    setAccountError(false);
    setTxDate(new Date());
    setShowDetails(false);
    setShowCategoryInput(false);
    onClose();
    } catch {
      setError('İşlem kaydedilemedi. Tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title={initialTransaction ? 'İşlemi Düzenle' : prefillTransaction ? quickCopy[language].repeat : 'Yeni İşlem Ekle'}
      subtitle={initialTransaction ? 'İşlem bilgilerini güncelleyin.' : prefillTransaction ? quickCopy[language].repeatHint : 'Gelir veya gider hareketlerinizi anında kaydedin.'}
      badge={{
        text: type === 'expense' ? 'GİDER' : 'GELİR',
        color: type === 'expense' ? '#BE123C' : '#047857',
        bg: type === 'expense' ? '#FFF1F2' : '#ECFDF5',
      }}
      footer={
        <HeroUIButton
          variant={type === 'expense' ? 'danger' : 'success'}
          size="lg"
          onPress={handleSave}
          disabled={creatingCategory || saving}
          icon={type === 'expense' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
        >
          {initialTransaction ? 'Değişiklikleri Kaydet' : type === 'expense' ? 'Gideri Kaydet' : 'Geliri Kaydet'}
        </HeroUIButton>
      }
    >
      {!initialTransaction && !prefillTransaction && <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: showVoice }}
        onPress={() => setShowVoice((current) => !current)}
        className="mb-4 flex-row items-center justify-between rounded-2xl px-4 py-3 bg-brand-soft"
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="mic-outline" size={18} color={colors.primary} />
          <Text localize={false} className="text-[13px] font-semibold text-brand">{voiceCopy[language].title}</Text>
        </View>
        <Ionicons name={showVoice ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
      </TouchableOpacity>}
      {!initialTransaction && !prefillTransaction && showVoice && <Surface variant="secondary" className="mb-5 rounded-2xl p-4">
        <View className="mb-3 flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-[14px] bg-brand-soft">
            <Ionicons name="mic-outline" size={20} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text localize={false} className="text-[14px] font-bold text-[#14203A] dark:text-[#F5F7FF]">{voiceCopy[language].title}</Text>
            <Text localize={false} className="mt-0.5 text-[12px] text-zinc-500 dark:text-[#BAC8E6]">{voiceCopy[language].hint}</Text>
          </View>
        </View>
        <HeroUIButton
          variant={voice.status === 'listening' ? 'danger' : 'flat'}
          size="sm"
          icon={voice.status === 'listening' ? 'stop-circle-outline' : 'mic-outline'}
          disabled={voice.status === 'starting' || voice.status === 'processing'}
          onPress={() => voice.status === 'listening' ? voice.stop() : void voice.start(getFormattingLocale())}
        >
          {voice.status === 'listening' ? voiceCopy[language].stop : voice.status === 'starting' || voice.status === 'processing' ? voiceCopy[language].listening : voiceCopy[language].start}
        </HeroUIButton>
        {!!voice.transcript && <Text localize={false} className="mt-3 text-[13px] font-medium text-zinc-700 dark:text-[#D4E2D9]">“{voice.transcript}”</Text>}
        {!!voice.finalTranscript && <Text localize={false} className="mt-1 text-[11px] text-zinc-500 dark:text-[#BAC8E6]">{voiceCopy[language].review}</Text>}
        {!!voice.error && <Text localize={false} className="mt-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">{voiceCopy[language][voice.error]}</Text>}
      </Surface>}

      {/* HeroUI Segmented Tabs for Transaction Type */}
      <View className="flex-row bg-zinc-100 dark:bg-[#1E2A48] rounded-[18px] p-1 mb-4 gap-1.5">
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-[14px] ${
            type === 'expense' ? 'bg-white dark:bg-[#17213A] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => { setType('expense'); setSelectedCategory(''); setSelectionError(''); }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-up-circle"
            size={18}
            color={type === 'expense' ? '#F43F5E' : '#71717A'}
          />
          <Text
            className={`text-sm font-bold ${
              type === 'expense' ? 'text-rose-500' : 'text-zinc-500 dark:text-[#BAC8E6]'
            }`}
          >
            Gider
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-[14px] ${
            type === 'income' ? 'bg-white dark:bg-[#17213A] shadow-sm' : 'bg-transparent'
          }`}
          onPress={() => { setType('income'); setSelectedCategory(''); setSelectionError(''); }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-down-circle"
            size={18}
            color={type === 'income' ? '#10B981' : '#71717A'}
          />
          <Text
            className={`text-sm font-bold ${
              type === 'income' ? 'text-emerald-500' : 'text-zinc-500 dark:text-[#BAC8E6]'
            }`}
          >
            Gelir
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title Input */}
      <HeroUIInput
        label="İşlem Başlığı"
        placeholder="Örn: Market Alışverişi, Maaş, Kahve..."
        startIcon="create-outline"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (error) setError('');
        }}
        errorMessage={!title.trim() && error ? error : undefined}
      />
      {rememberedTransaction && (selectedCategory !== rememberedTransaction.category ||
        !selectedAccountId ||
        (rememberedTransaction.accountId && selectedAccountId !== rememberedTransaction.accountId)) && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            setSelectedCategory(rememberedTransaction.category);
            const matchingAccount = accounts.find((account) => account.id === rememberedTransaction.accountId)
              ?? accounts.find((account) => account.type === rememberedTransaction.accountType);
            if (matchingAccount) setSelectedAccountId(matchingAccount.id);
            setSelectionError('');
            setAccountError(false);
          }}
          className="mb-4 flex-row items-center gap-3 rounded-2xl border px-3.5 py-3"
          style={{ borderColor: colors.cardBorder, backgroundColor: colors.card }}
        >
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <View className="flex-1">
            <Text localize={false} className="text-[12px] font-bold text-brand">{quickCopy[language].remembered}</Text>
            <Text localize={false} className="text-[12px] text-zinc-500 dark:text-[#BAC8E6]">{t(rememberedTransaction.category)} · {rememberedTransaction.accountType === 'cash' ? t('Nakit') : t('Banka')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={colors.mutedText} />
        </TouchableOpacity>
      )}

      {/* Amount Input */}
      <HeroUIInput
        label="Tutar"
        prefix={getCurrencySymbol()}
        placeholder="0,00"
        keyboardType="numeric"
        value={amountInput}
        onChangeText={(text) => {
          setAmountInput(formatNumberInput(text));
          if (error) setError('');
        }}
        errorMessage={
          title.trim() && parseAmountSafely(amountInput) <= 0 && error ? error : undefined
        }
      />
      {!!error && !!title.trim() && parseAmountSafely(amountInput) > 0 && (
        <Text className="text-xs text-rose-500 font-semibold mb-3">{error}</Text>
      )}

      <View className="mb-4">
        <Text localize={false} className="text-[13px] font-bold text-zinc-700 dark:text-[#D5E0F8] mb-2">
          {accountCopy[language].title}
        </Text>
        <View className="flex-row gap-2">
          {accounts.filter((account) => account.type === 'bank' || account.type === 'cash').sort((a, b) => Number(a.type === 'cash') - Number(b.type === 'cash')).map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            return (
              <TouchableOpacity
                key={acc.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={acc.type === 'cash' ? t('Nakit') : t('Banka')}
                className={`flex-1 flex-row items-center justify-center gap-2 rounded-[14px] border-[1.5px] py-3 ${
                  isSelected
                    ? 'bg-brand-soft border-brand'
                    : accountError
                      ? 'bg-zinc-100 dark:bg-[#1E2A48] border-rose-400'
                      : 'bg-zinc-100 dark:bg-[#1E2A48] border-transparent'
                }`}
                onPress={() => { setSelectedAccountId(acc.id); setAccountError(false); }}
                activeOpacity={0.75}
              >
                <Ionicons name={acc.type === 'cash' ? 'wallet-outline' : 'card-outline'} size={18} color={isSelected ? colors.primary : colors.mutedText} />
                <Text localize={false} className={`text-sm font-bold ${isSelected ? 'text-brand' : 'text-zinc-600 dark:text-[#BAC8E6]'}`}>
                  {acc.type === 'cash' ? t('Nakit') : t('Banka')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {accountError && <Text localize={false} className="text-xs font-semibold text-rose-500 mt-1.5">{accountCopy[language].required}</Text>}
      </View>

      {/* Category selection stays visible so envelope spending is attributed correctly. */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[13px] font-bold text-zinc-700 dark:text-[#D5E0F8]">Kategori</Text>
        <TouchableOpacity
          onPress={() => {
            setShowCategoryInput((current) => !current);
            setCategoryError('');
          }}
          activeOpacity={0.7}
          className="flex-row items-center gap-1"
        >
          <Ionicons name="add" size={15} color={colors.primary} />
          <Text className="text-xs font-bold text-brand dark:text-brand">Yeni Kategori</Text>
        </TouchableOpacity>
      </View>

      {showCategoryInput && (
        <View className="mb-3 rounded-2xl bg-zinc-50 dark:bg-[#1E2A48] p-3">
          <HeroUIInput
            label="Kategori Adı"
            placeholder="Örn: Sağlık, Spor, Hobiler..."
            value={newCategoryName}
            onChangeText={(value) => {
              setNewCategoryName(value);
              if (categoryError) setCategoryError('');
            }}
            errorMessage={categoryError || undefined}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={createCategory}
          />
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-xl bg-zinc-200 dark:bg-[#2B3A5D] py-2.5"
              onPress={() => { setShowCategoryInput(false); setCategoryError(''); }}
            >
              <Text className="text-sm font-semibold text-zinc-700 dark:text-[#D5E0F8]">Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-xl bg-brand py-2.5"
              onPress={createCategory}
              disabled={creatingCategory}
            >
              <Text className="text-sm font-semibold text-brand-foreground">Kategoriyi Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className="flex-row flex-wrap gap-2 mb-3">
        {filteredCategories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const hasBudget = type === 'expense' && budgetNames.has(cat.name.trim().toLocaleLowerCase('tr-TR'));
          return (
            <TouchableOpacity
              key={cat.id}
              className={`flex-row items-center gap-1.5 py-2 px-3 rounded-[14px] border-[1.5px] ${
                isSelected
                  ? type === 'income'
                    ? 'bg-emerald-50 dark:bg-[#183C2D] border-emerald-500'
                    : 'bg-rose-50 dark:bg-[#44252E] border-rose-500'
                  : 'bg-zinc-100 dark:bg-[#1E2A48] border-transparent'
              }`}
              onPress={() => { setSelectedCategory(cat.name); setSelectionError(''); }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={cat.icon as any}
                size={15}
                color={isSelected ? (type === 'income' ? '#047857' : '#BE123C') : '#71717A'}
              />
              <Text className={`text-[13px] ${isSelected ? (type === 'income' ? 'text-emerald-700 dark:text-[#70E0B0] font-bold' : 'text-rose-700 dark:text-[#FDA4AF] font-bold') : 'text-zinc-500 dark:text-[#BAC8E6] font-semibold'}`}>
                {cat.name}
              </Text>
              {hasBudget && <Text className="text-[11px] font-bold text-brand dark:text-brand">Zarf</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
      {!!selectionError && <Text className="text-xs text-rose-500 font-semibold mb-3">{selectionError}</Text>}

      <TouchableOpacity
        className="flex-row items-center justify-between rounded-xl bg-zinc-100 dark:bg-[#1E2A48] px-3 py-2.5 mb-3"
        onPress={() => setShowDetails((current) => !current)}
      >
        <Text className="text-[13px] font-semibold text-zinc-600 dark:text-[#BAC8E6]">İşlem Tarihi</Text>
        <Ionicons name={showDetails ? 'chevron-up' : 'chevron-down'} size={16} color="#71717A" />
      </TouchableOpacity>

      {/* Date Selector */}
      {showDetails && <>
      <View className="flex-row items-center justify-between mb-4 gap-2.5">
        <View className="flex-row gap-1.5">
          <TouchableOpacity
            className={`py-2 px-3 rounded-xl border ${
              isToday(txDate)
                ? 'bg-brand-soft dark:bg-brand-soft border-brand'
                : 'bg-zinc-100 dark:bg-[#1E2A48] border-transparent'
            }`}
            onPress={setToday}
            activeOpacity={0.75}
          >
            <Text
              className={`text-xs ${
                isToday(txDate) ? 'font-bold text-brand' : 'font-semibold text-zinc-500 dark:text-[#BAC8E6]'
              }`}
            >
              Bugün
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-2 px-3 rounded-xl border ${
              isYesterday(txDate)
                ? 'bg-brand-soft dark:bg-brand-soft border-brand'
                : 'bg-zinc-100 dark:bg-[#1E2A48] border-transparent'
            }`}
            onPress={setYesterday}
            activeOpacity={0.75}
          >
            <Text
              className={`text-xs ${
                isYesterday(txDate) ? 'font-bold text-brand' : 'font-semibold text-zinc-500 dark:text-[#BAC8E6]'
              }`}
            >
              Dün
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-zinc-100 dark:bg-[#1E2A48] rounded-xl px-1 py-0.5">
          <TouchableOpacity
            className="w-7 h-7 rounded-full items-center justify-center"
            onPress={() => stepDay(-1)}
          >
            <Ionicons name="chevron-back" size={16} color="#18181B" />
          </TouchableOpacity>
          <Text className="text-xs font-bold text-zinc-900 dark:text-[#F5F7FF] px-2">
            {txDate.toLocaleDateString(getFormattingLocale(), { day: 'numeric', month: 'short' })}
          </Text>
          <TouchableOpacity
            className="w-7 h-7 rounded-full items-center justify-center"
            onPress={() => stepDay(1)}
          >
            <Ionicons name="chevron-forward" size={16} color="#18181B" />
          </TouchableOpacity>
        </View>
      </View>
      </>}
    </HeroUIModal>
  );
};
