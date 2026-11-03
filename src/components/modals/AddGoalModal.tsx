import { useCurrency } from '../../context/CurrencyContext';
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { Text } from '../common/LocalizedPrimitives';
import { SavingsGoal } from '../../types';
import { parseAmountSafely, formatNumberInput } from '../../utils/formatters';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { useTheme } from '../../context/ThemeContext';
import { AppLanguage, useLocale } from '../../context/LocaleContext';
import { GOAL_UNITS, GoalUnit, goalUnitSymbol } from '../../utils/goalUnits';

const GOAL_EMOJIS = ['🎯', '🏠', '✈️', '🚗', '💻', '🎓', '💍', '🏖️', '🛟', '🎁', '🐾', '📚'];
const isEmoji = (value: string) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(value);
const goalCopy: Record<AppLanguage, { subtitle: string; emoji: string; custom: string; saveError: string }> = {
  tr: { subtitle: 'Bir hedef belirleyin, ilerlemenizi kolayca izleyin.', emoji: 'Hedef Emojisi', custom: 'Kendi emojini yaz veya yapıştır', saveError: 'Hedef kaydedilemedi. Tekrar deneyin.' },
  en: { subtitle: 'Set a goal and track your progress.', emoji: 'Goal emoji', custom: 'Type or paste your own emoji', saveError: 'Could not save the goal. Try again.' },
  de: { subtitle: 'Setzen Sie ein Ziel und verfolgen Sie Ihren Fortschritt.', emoji: 'Ziel-Emoji', custom: 'Eigenes Emoji eingeben oder einfügen', saveError: 'Ziel konnte nicht gespeichert werden. Erneut versuchen.' },
  fr: { subtitle: 'Fixez un objectif et suivez vos progrès.', emoji: 'Emoji de l’objectif', custom: 'Saisissez ou collez votre emoji', saveError: 'Impossible d’enregistrer l’objectif. Réessayez.' },
  ko: { subtitle: '목표를 정하고 진행 상황을 확인하세요.', emoji: '목표 이모지', custom: '원하는 이모지를 입력하거나 붙여넣으세요', saveError: '목표를 저장하지 못했습니다. 다시 시도하세요.' },
  zh: { subtitle: '设定目标，轻松追踪进度。', emoji: '目标表情符号', custom: '输入或粘贴自选表情符号', saveError: '无法保存目标，请重试。' },
  ja: { subtitle: '目標を設定して進捗を確認しましょう。', emoji: '目標の絵文字', custom: '好きな絵文字を入力または貼り付け', saveError: '目標を保存できませんでした。再試行してください。' },
  ru: { subtitle: 'Поставьте цель и отслеживайте прогресс.', emoji: 'Эмодзи цели', custom: 'Введите или вставьте свой эмодзи', saveError: 'Не удалось сохранить цель. Повторите попытку.' },
  it: { subtitle: 'Imposta un obiettivo e segui i progressi.', emoji: 'Emoji obiettivo', custom: 'Scrivi o incolla la tua emoji', saveError: 'Impossibile salvare l’obiettivo. Riprova.' },
};
const unitCopy: Record<AppLanguage, { label: string; gold: string; note: string }> = {
  tr: { label: 'Hedef birimi', gold: 'Altın · gram', note: 'Birim değiştirilince tutarlar otomatik çevrilmez.' },
  en: { label: 'Goal unit', gold: 'Gold · grams', note: 'Changing the unit does not convert amounts.' },
  de: { label: 'Zieleinheit', gold: 'Gold · Gramm', note: 'Beim Wechsel der Einheit werden Beträge nicht umgerechnet.' },
  fr: { label: 'Unité de l’objectif', gold: 'Or · grammes', note: 'Changer d’unité ne convertit pas les montants.' },
  ko: { label: '목표 단위', gold: '금 · 그램', note: '단위를 변경해도 금액은 자동 환산되지 않습니다.' },
  zh: { label: '目标单位', gold: '黄金 · 克', note: '更改单位不会自动换算金额。' },
  ja: { label: '目標の単位', gold: '金 · グラム', note: '単位を変えても金額は自動換算されません。' },
  ru: { label: 'Единица цели', gold: 'Золото · граммы', note: 'При смене единицы суммы не пересчитываются.' },
  it: { label: 'Unità obiettivo', gold: 'Oro · grammi', note: 'Cambiare unità non converte gli importi.' },
};

interface AddGoalModalProps {
  visible: boolean;
  initialGoal?: SavingsGoal | null;
  onClose: () => void;
  onSave: (goal: Partial<SavingsGoal>) => Promise<void> | void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  initialGoal,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Birikim');
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [savedAmountInput, setSavedAmountInput] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [unit, setUnit] = useState<GoalUnit>('TRY');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { colors } = useTheme();
  const { language, t } = useLocale();
  const { currency } = useCurrency();

  useEffect(() => {
    if (visible) {
      if (initialGoal) {
        setTitle(initialGoal.title || '');
        setCategory(initialGoal.category || 'Birikim');
        setTargetAmountInput(
          initialGoal.targetAmount ? formatNumberInput(initialGoal.targetAmount.toString()) : ''
        );
        setSavedAmountInput(
          initialGoal.savedAmount ? formatNumberInput(initialGoal.savedAmount.toString()) : ''
        );
        setSelectedEmoji(initialGoal.emoji || '🎯');
        setUnit(initialGoal.unit || currency);
      } else {
        setTitle('');
        setCategory('Birikim');
        setTargetAmountInput('');
        setSavedAmountInput('');
        setSelectedEmoji('🎯');
        setUnit(currency);
      }
      setError('');
    }
  }, [visible, initialGoal, currency]);

  const handleSave = async () => {
    if (saving) return;
    if (!title.trim()) {
      setError('Lütfen bir hedef başlığı girin.');
      return;
    }
    const target = parseAmountSafely(targetAmountInput);
    if (target <= 0) {
      setError('Lütfen geçerli bir hedef tutar girin.');
      return;
    }
    const saved = parseAmountSafely(savedAmountInput);

    setSaving(true);
    try {
      await onSave({
        ...(initialGoal ? { id: initialGoal.id } : {}),
        title: title.trim(),
        category: category.trim() || 'Birikim',
        targetAmount: target,
        savedAmount: saved,
        emoji: selectedEmoji,
        unit,
      });
      setTitle('');
      setCategory('Birikim');
      setTargetAmountInput('');
      setSavedAmountInput('');
      setError('');
      onClose();
    } catch {
      setError(goalCopy[language].saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HeroUIModal
      isOpen={visible}
      onClose={onClose}
      title={initialGoal ? 'Hedefi Düzenle' : 'Yeni Hedef Ekle'}
      subtitle={goalCopy[language].subtitle}
      badge={{
        text: initialGoal ? 'DÜZENLEME' : 'HEDEF',
        color: '#0D9488',
        bg: '#CCFBF1',
      }}
      footer={
        <HeroUIButton
          variant="primary"
          size="lg"
          onPress={handleSave}
          disabled={saving}
          isLoading={saving}
          icon={initialGoal ? 'checkmark-circle-outline' : 'add-circle-outline'}
        >
          {initialGoal ? 'Değişiklikleri Kaydet' : 'Hedefi Oluştur'}
        </HeroUIButton>
      }
    >
      <HeroUIInput
        label="Hedef Adı"
        placeholder="Örn: Ev Peşinatı, Yeni Telefon, Tatil..."
        startIcon="flag-outline"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (error) setError('');
        }}
        errorMessage={!title.trim() && error ? error : undefined}
      />

      <HeroUIInput
        label="Kategori / Etiket"
        placeholder="Örn: Birikim, Seyahat, Elektronik"
        startIcon="pricetag-outline"
        value={category === 'Birikim' ? t('Birikim') : category}
        onChangeText={(value) => setCategory(value === t('Birikim') ? 'Birikim' : value)}
      />

      <Text localize={false} className="text-[13px] font-bold text-zinc-700 dark:text-[#D5E0F8] mb-2">{unitCopy[language].label}</Text>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {[...new Set<GoalUnit>([currency, ...(initialGoal?.unit ? [initialGoal.unit] : []), ...GOAL_UNITS])].map((option) => (
          <TouchableOpacity
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: unit === option }}
            onPress={() => setUnit(option)}
            className="rounded-xl border px-3 py-2"
            style={{ backgroundColor: unit === option ? colors.primaryLight : colors.card, borderColor: unit === option ? colors.primary : colors.cardBorder }}
          >
            <Text localize={false} style={{ color: colors.foreground, fontWeight: '700' }}>
              {option === 'XAU_G' ? unitCopy[language].gold : option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text localize={false} className="text-xs text-zinc-500 dark:text-[#BAC8E6] mb-4">{unitCopy[language].note}</Text>

      <HeroUIInput
        label="Hedef Tutar"
        prefix={goalUnitSymbol(unit)}
        placeholder="Örn: 50.000 veya 1.000.000"
        keyboardType="numeric"
        value={targetAmountInput}
        onChangeText={(text) => {
          setTargetAmountInput(formatNumberInput(text));
          if (error) setError('');
        }}
        errorMessage={
          title.trim() && parseAmountSafely(targetAmountInput) <= 0 && error
            ? error
            : undefined
        }
      />

      <HeroUIInput
        label="Mevcut Birikim (Opsiyonel)"
        prefix={goalUnitSymbol(unit)}
        placeholder="0"
        keyboardType="numeric"
        value={savedAmountInput}
        onChangeText={(text) => setSavedAmountInput(formatNumberInput(text))}
        description="Varsa bu hedefe önceden ayırdığınız tutarı girin."
      />
      {!!error && !!title.trim() && parseAmountSafely(targetAmountInput) > 0 && <Text localize={false} className="mb-3 text-[12px] font-semibold text-rose-600 dark:text-rose-400">{error}</Text>}

      <Text localize={false} className="text-[13px] font-bold text-zinc-700 dark:text-[#D5E0F8] mb-2">{goalCopy[language].emoji}</Text>
      <View className="flex-row flex-wrap gap-2.5 mb-3">
        {GOAL_EMOJIS.map((emoji) => {
          const isSelected = selectedEmoji === emoji;
          return (
            <TouchableOpacity
              key={emoji}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={emoji}
              className={`w-12 h-12 rounded-[16px] items-center justify-center border-[1.5px] ${
                isSelected
                  ? 'bg-brand-soft dark:bg-brand-soft border-brand'
                  : 'bg-zinc-100 dark:bg-[#1E2A48] border-transparent'
              }`}
              onPress={() => setSelectedEmoji(emoji)}
              activeOpacity={0.75}
            >
              <Text localize={false} style={{ fontSize: 24 }}>{emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View className="flex-row items-center gap-3 rounded-2xl border px-3 py-2 mb-2" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
        <Text localize={false} style={{ fontSize: 27 }}>{selectedEmoji}</Text>
        <TextInput
          accessibilityLabel={goalCopy[language].custom}
          placeholder={goalCopy[language].custom}
          placeholderTextColor={colors.mutedText}
          value={GOAL_EMOJIS.includes(selectedEmoji) ? '' : selectedEmoji}
          onChangeText={(value) => { if (isEmoji(value)) setSelectedEmoji(value.trim()); }}
          maxLength={12}
          className="flex-1 text-[14px]"
          style={{ color: colors.foreground }}
        />
      </View>
    </HeroUIModal>
  );
};
