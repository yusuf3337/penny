import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card } from 'heroui-native/card';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../common/LocalizedPrimitives';
import { HeroUIModal } from '../common/HeroUIModal';
import { HeroUIInput } from '../common/HeroUIInput';
import { HeroUIButton } from '../common/HeroUIButton';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { AppLanguage, useLocale } from '../../context/LocaleContext';
import { useData } from '../../context/DataContext';
import { useAppDialog } from '../../context/AppDialogContext';
import { FinancialAsset } from '../../types';
import { formatCurrency, formatNumberInput, parseAmountSafely } from '../../utils/formatters';
import { formatGoalAmount } from '../../utils/goalUnits';

const copy: Record<AppLanguage, {
  heading: string; net: string; available: string; bank: string; cash: string; receivables: string;
  assets: string; debts: string; installments: string; add: string; edit: string; delete: string;
  name: string; value: string; save: string; cancel: string; note: string; foreign: string;
  empty: string; invalid: string; failed: string; deleteTitle: string; deleteMessage: string;
}> = {
  tr: { heading: 'Finansal durum', net: 'Tahmini net durum', available: 'Kayıtlı hesap bakiyesi', bank: 'Banka', cash: 'Nakit', receivables: 'Alacaklar', assets: 'Diğer varlıklar', debts: 'Borçlar', installments: 'Kalan taksitler', add: 'Varlık ekle', edit: 'Varlığı düzenle', delete: 'Sil', name: 'Varlık adı', value: 'Tahmini değeri', save: 'Kaydet', cancel: 'Vazgeç', note: 'Yalnızca kayıtlı veriler ve elinizle girdiğiniz değerler kullanılır. Hedef birikimleri ayrıca eklenmez.', foreign: 'Diğer para birimindeki varlıklar net toplama katılmaz.', empty: 'Henüz ek varlık yok.', invalid: 'Ad ve geçerli bir değer girin.', failed: 'Varlık kaydedilemedi.', deleteTitle: 'Varlığı sil', deleteMessage: 'Bu varlığı silmek istiyor musunuz?' },
  en: { heading: 'Financial position', net: 'Estimated net position', available: 'Recorded account balance', bank: 'Bank', cash: 'Cash', receivables: 'Money owed to you', assets: 'Other assets', debts: 'Money you owe', installments: 'Remaining installments', add: 'Add asset', edit: 'Edit asset', delete: 'Delete', name: 'Asset name', value: 'Estimated value', save: 'Save', cancel: 'Cancel', note: 'Only recorded balances and values you enter are used. Goal savings are not added again.', foreign: 'Assets in other currencies are excluded from the net total.', empty: 'No other assets yet.', invalid: 'Enter a name and a valid value.', failed: 'Could not save the asset.', deleteTitle: 'Delete asset', deleteMessage: 'Delete this asset?' },
  de: { heading: 'Finanzlage', net: 'Geschätztes Nettovermögen', available: 'Erfasster Kontostand', bank: 'Bank', cash: 'Bargeld', receivables: 'Forderungen', assets: 'Weitere Vermögenswerte', debts: 'Schulden', installments: 'Offene Raten', add: 'Wert hinzufügen', edit: 'Wert bearbeiten', delete: 'Löschen', name: 'Bezeichnung', value: 'Geschätzter Wert', save: 'Speichern', cancel: 'Abbrechen', note: 'Es zählen nur erfasste Salden und eingegebene Werte. Sparziele werden nicht nochmals addiert.', foreign: 'Werte in anderen Währungen zählen nicht zur Nettosumme.', empty: 'Noch keine weiteren Werte.', invalid: 'Name und gültigen Wert eingeben.', failed: 'Wert konnte nicht gespeichert werden.', deleteTitle: 'Wert löschen', deleteMessage: 'Diesen Wert löschen?' },
  fr: { heading: 'Situation financière', net: 'Situation nette estimée', available: 'Solde des comptes enregistrés', bank: 'Banque', cash: 'Espèces', receivables: 'Créances', assets: 'Autres actifs', debts: 'Dettes', installments: 'Versements restants', add: 'Ajouter un actif', edit: 'Modifier l’actif', delete: 'Supprimer', name: 'Nom de l’actif', value: 'Valeur estimée', save: 'Enregistrer', cancel: 'Annuler', note: 'Seuls les soldes enregistrés et les valeurs saisies sont utilisés. Les objectifs d’épargne ne sont pas ajoutés une seconde fois.', foreign: 'Les actifs dans d’autres devises sont exclus du total net.', empty: 'Aucun autre actif.', invalid: 'Saisissez un nom et une valeur valide.', failed: 'Impossible d’enregistrer l’actif.', deleteTitle: 'Supprimer l’actif', deleteMessage: 'Supprimer cet actif ?' },
  ko: { heading: '재무 현황', net: '예상 순자산', available: '기록된 계좌 잔액', bank: '은행', cash: '현금', receivables: '받을 돈', assets: '기타 자산', debts: '갚을 돈', installments: '남은 할부금', add: '자산 추가', edit: '자산 수정', delete: '삭제', name: '자산 이름', value: '예상 가치', save: '저장', cancel: '취소', note: '기록된 잔액과 직접 입력한 가치만 사용합니다. 목표 저축액은 중복 합산하지 않습니다.', foreign: '다른 통화의 자산은 순합계에서 제외됩니다.', empty: '추가 자산이 없습니다.', invalid: '이름과 올바른 금액을 입력하세요.', failed: '자산을 저장하지 못했습니다.', deleteTitle: '자산 삭제', deleteMessage: '이 자산을 삭제할까요?' },
  zh: { heading: '财务状况', net: '估算净值', available: '已记录账户余额', bank: '银行', cash: '现金', receivables: '应收款', assets: '其他资产', debts: '欠款', installments: '剩余分期', add: '添加资产', edit: '编辑资产', delete: '删除', name: '资产名称', value: '估算价值', save: '保存', cancel: '取消', note: '仅使用已记录余额和您输入的价值。储蓄目标不会重复计入。', foreign: '其他币种的资产不计入净值。', empty: '暂无其他资产。', invalid: '请输入名称和有效金额。', failed: '无法保存资产。', deleteTitle: '删除资产', deleteMessage: '确定删除此资产？' },
  ja: { heading: '資産状況', net: '推定純資産', available: '記録済み口座残高', bank: '銀行', cash: '現金', receivables: '貸付金', assets: 'その他の資産', debts: '借入金', installments: '残りの分割払い', add: '資産を追加', edit: '資産を編集', delete: '削除', name: '資産名', value: '推定価値', save: '保存', cancel: 'キャンセル', note: '記録済み残高と入力した価値のみを使用します。貯蓄目標は重複して加算しません。', foreign: '他通貨の資産は純資産合計に含まれません。', empty: 'その他の資産はまだありません。', invalid: '名前と有効な金額を入力してください。', failed: '資産を保存できませんでした。', deleteTitle: '資産を削除', deleteMessage: 'この資産を削除しますか？' },
  ru: { heading: 'Финансовое положение', net: 'Оценка чистых активов', available: 'Учтённый остаток', bank: 'Банк', cash: 'Наличные', receivables: 'Долги вам', assets: 'Другие активы', debts: 'Ваши долги', installments: 'Остаток рассрочки', add: 'Добавить актив', edit: 'Изменить актив', delete: 'Удалить', name: 'Название актива', value: 'Оценочная стоимость', save: 'Сохранить', cancel: 'Отмена', note: 'Учитываются только записанные остатки и введённые вами значения. Накопления по целям не прибавляются повторно.', foreign: 'Активы в других валютах исключены из чистой суммы.', empty: 'Других активов пока нет.', invalid: 'Введите название и корректную сумму.', failed: 'Не удалось сохранить актив.', deleteTitle: 'Удалить актив', deleteMessage: 'Удалить этот актив?' },
  it: { heading: 'Situazione finanziaria', net: 'Patrimonio netto stimato', available: 'Saldo dei conti registrati', bank: 'Banca', cash: 'Contanti', receivables: 'Crediti', assets: 'Altri beni', debts: 'Debiti', installments: 'Rate rimanenti', add: 'Aggiungi bene', edit: 'Modifica bene', delete: 'Elimina', name: 'Nome del bene', value: 'Valore stimato', save: 'Salva', cancel: 'Annulla', note: 'Si usano solo i saldi registrati e i valori inseriti. I risparmi degli obiettivi non vengono sommati di nuovo.', foreign: 'I beni in altre valute sono esclusi dal totale netto.', empty: 'Nessun altro bene.', invalid: 'Inserisci un nome e un importo valido.', failed: 'Impossibile salvare il bene.', deleteTitle: 'Elimina bene', deleteMessage: 'Eliminare questo bene?' },
};

export const FinancialStatus: React.FC = () => {
  const { colors } = useTheme();
  const { currency } = useCurrency();
  const { language } = useLocale();
  const { alert } = useAppDialog();
  const { bankBalance, cashBalance, debts, installments, transactions, assets, handleSaveAsset, handleDeleteAsset } = useData();
  const c = copy[language];
  const [editing, setEditing] = useState<FinancialAsset | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const receivables = debts.filter((debt) => debt.type === 'given' && !debt.isCompleted).reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const borrowed = debts.filter((debt) => debt.type === 'taken' && !debt.isCompleted).reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const remainingInstallments = installments.reduce((sum, plan) => {
    const paid = new Set(transactions.filter((tx) => tx.installmentPlanId === plan.id).map((tx) => tx.installmentNumber));
    let remaining = 0;
    for (let number = 1; number <= plan.count; number += 1) {
      if (!paid.has(number)) {
        const regular = Math.floor(Math.round(plan.totalAmount * 100) / plan.count);
        remaining += (number === plan.count ? Math.round(plan.totalAmount * 100) - regular * (plan.count - 1) : regular) / 100;
      }
    }
    return sum + remaining;
  }, 0);
  const matchingAssets = assets.filter((asset) => asset.currency === currency);
  const otherAssets = assets.filter((asset) => asset.currency !== currency);
  const assetTotal = matchingAssets.reduce((sum, asset) => sum + asset.estimatedValue, 0);
  const net = bankBalance + cashBalance + receivables + assetTotal - borrowed - remainingInstallments;

  const openEditor = (asset?: FinancialAsset) => {
    setEditing(asset || null);
    setTitle(asset?.title || '');
    setValue(asset ? formatNumberInput(String(asset.estimatedValue)) : '');
    setError('');
    setModalOpen(true);
  };
  const save = async () => {
    const estimatedValue = parseAmountSafely(value);
    if (!title.trim() || !value.trim() || !Number.isFinite(estimatedValue) || estimatedValue < 0) {
      setError(c.invalid); return;
    }
    setSaving(true);
    try {
      await handleSaveAsset({ id: editing?.id, title: title.trim(), estimatedValue, currency: editing?.currency || currency });
      setModalOpen(false);
    } catch {
      setError(c.failed);
    } finally {
      setSaving(false);
    }
  };
  const row = (label: string, amount: number, negative = false) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, gap: 12 }}>
      <Text localize={false} style={{ color: colors.mutedText, fontSize: 13, flex: 1 }}>{label}</Text>
      <Text localize={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ color: negative ? colors.roseText : colors.foreground, fontSize: 14, fontWeight: '700', maxWidth: '55%' }}>{formatCurrency(amount)}</Text>
    </View>
  );

  return <>
    <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: 22, padding: 20, marginBottom: 16 }}>
      <Text localize={false} style={{ color: colors.mutedText, fontSize: 13, fontWeight: '700' }}>{c.net}</Text>
      <Text localize={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55} style={{ color: net >= 0 ? colors.emeraldText : colors.roseText, fontSize: 30, fontWeight: '800', marginTop: 5 }}>{formatCurrency(net)}</Text>
      <Text localize={false} style={{ color: colors.mutedText, fontSize: 11, marginTop: 8, lineHeight: 17 }}>{c.note}</Text>
    </Card>
    <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: 22, padding: 20, marginBottom: 16 }}>
      <Text localize={false} style={{ color: colors.foreground, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>{c.heading}</Text>
      {row(c.bank, bankBalance)}
      {row(c.cash, cashBalance)}
      {row(c.receivables, receivables)}
      {row(c.assets, assetTotal)}
      <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: 6 }} />
      {row(c.debts, borrowed, true)}
      {row(c.installments, remainingInstallments, true)}
    </Card>
    <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: 22, padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Text localize={false} style={{ color: colors.foreground, fontSize: 16, fontWeight: '800', flex: 1 }}>{c.assets}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => openEditor()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 }}>
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text localize={false} style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>{c.add}</Text>
        </TouchableOpacity>
      </View>
      {!assets.length && <Text localize={false} style={{ color: colors.mutedText, fontSize: 13, marginTop: 12 }}>{c.empty}</Text>}
      {assets.map((asset) => <View key={asset.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
        <TouchableOpacity accessibilityRole="button" onPress={() => openEditor(asset)} style={{ flex: 1, minWidth: 0 }}>
          <Text localize={false} numberOfLines={1} style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>{asset.title}</Text>
          <Text localize={false} numberOfLines={1} style={{ color: colors.mutedText, fontSize: 12 }}>{formatGoalAmount(asset.estimatedValue, asset.currency)}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={c.edit} onPress={() => openEditor(asset)}><Ionicons name="create-outline" size={18} color={colors.primary} /></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={c.delete} onPress={() => alert(c.deleteTitle, c.deleteMessage, [{ text: c.cancel, style: 'cancel' }, { text: c.delete, style: 'destructive', onPress: () => { void handleDeleteAsset(asset.id); } }])}><Ionicons name="trash-outline" size={18} color={colors.mutedText} /></TouchableOpacity>
      </View>)}
      {!!otherAssets.length && <Text localize={false} style={{ color: colors.mutedText, fontSize: 11, marginTop: 10 }}>{c.foreign}</Text>}
    </Card>
    <HeroUIModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? c.edit : c.add} footer={<HeroUIButton variant="primary" size="lg" onPress={save} disabled={saving} isLoading={saving}>{c.save}</HeroUIButton>}>
      <HeroUIInput label={c.name} value={title} onChangeText={setTitle} />
      <HeroUIInput label={`${c.value} (${editing?.currency || currency})`} value={value} onChangeText={(text) => setValue(formatNumberInput(text))} keyboardType="numeric" errorMessage={error || undefined} />
    </HeroUIModal>
  </>;
};
