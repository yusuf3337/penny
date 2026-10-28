import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/common/LocalizedPrimitives';
import { Header } from '../components/common/Header';
import { HeroUIModal } from '../components/common/HeroUIModal';
import { HeroUIInput } from '../components/common/HeroUIInput';
import { HeroUIButton } from '../components/common/HeroUIButton';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useLocale, AppLanguage } from '../context/LocaleContext';
import { useAppDialog } from '../context/AppDialogContext';
import { formatCurrency, parseAmountSafely } from '../utils/formatters';
import { installmentAmount, installmentDueDate } from '../services/storageService';

const COPY: Record<AppLanguage, Record<string, string>> = {
  tr: { title:'Taksitler', subtitle:'Planlanan ödemelerini takip et', add:'Taksit ekle', empty:'Henüz taksit planı yok.', name:'Ürün veya hizmet', nameHint:'Örn: Telefon', total:'Toplam tutar', count:'Taksit sayısı', monthly:'Aylık ödeme', date:'İlk ödeme tarihi (GG.AA.YYYY)', category:'Kategori', account:'Ödeme hesabı', bank:'Banka', cash:'Nakit', save:'Planı kaydet', pay:'Ödendi olarak işaretle', paid:'Tamamlandı', remaining:'Kalan', next:'Sıradaki ödeme', delete:'Planı sil', cancel:'Vazgeç', confirm:'Plan silinsin mi?', history:'Ödenmiş taksit işlemleri kayıtlı kalır.', error:'Bilgileri kontrol et. En az 2, en fazla 120 taksit seç.', paymentError:'Ödeme kaydedilemedi.' },
  en: { title:'Installments', subtitle:'Track planned payments', add:'Add installments', empty:'No installment plans yet.', name:'Product or service', nameHint:'E.g. Phone', total:'Total amount', count:'Number of payments', monthly:'Monthly payment', date:'First due date (DD.MM.YYYY)', category:'Category', account:'Payment account', bank:'Bank', cash:'Cash', save:'Save plan', pay:'Mark as paid', paid:'Completed', remaining:'Remaining', next:'Next payment', delete:'Delete plan', cancel:'Cancel', confirm:'Delete this plan?', history:'Paid transactions will remain in your records.', error:'Check the details. Choose 2 to 120 payments.', paymentError:'Could not record payment.' },
  de: { title:'Raten', subtitle:'Geplante Zahlungen verfolgen', add:'Raten hinzufügen', empty:'Noch keine Ratenpläne.', name:'Produkt oder Dienstleistung', nameHint:'Z. B. Telefon', total:'Gesamtbetrag', count:'Anzahl der Raten', monthly:'Monatliche Rate', date:'Erste Fälligkeit (TT.MM.JJJJ)', category:'Kategorie', account:'Zahlungskonto', bank:'Bank', cash:'Bargeld', save:'Plan speichern', pay:'Als bezahlt markieren', paid:'Abgeschlossen', remaining:'Offen', next:'Nächste Zahlung', delete:'Plan löschen', cancel:'Abbrechen', confirm:'Plan löschen?', history:'Bezahlte Buchungen bleiben erhalten.', error:'Angaben prüfen. 2 bis 120 Raten wählen.', paymentError:'Zahlung konnte nicht gespeichert werden.' },
  fr: { title:'Paiements échelonnés', subtitle:'Suivez vos paiements prévus', add:'Ajouter un échéancier', empty:'Aucun échéancier.', name:'Produit ou service', nameHint:'Ex. Téléphone', total:'Montant total', count:'Nombre de paiements', monthly:'Mensualité', date:'Première échéance (JJ.MM.AAAA)', category:'Catégorie', account:'Compte de paiement', bank:'Banque', cash:'Espèces', save:'Enregistrer', pay:'Marquer comme payé', paid:'Terminé', remaining:'Restant', next:'Prochain paiement', delete:'Supprimer', cancel:'Annuler', confirm:'Supprimer cet échéancier ?', history:'Les paiements effectués restent enregistrés.', error:'Vérifiez les données. Choisissez 2 à 120 paiements.', paymentError:'Paiement non enregistré.' },
  ko: { title:'할부', subtitle:'예정된 결제를 관리하세요', add:'할부 추가', empty:'할부 계획이 없습니다.', name:'상품 또는 서비스', nameHint:'예: 휴대폰', total:'총 금액', count:'할부 개월 수', monthly:'월 결제액', date:'첫 결제일 (DD.MM.YYYY)', category:'카테고리', account:'결제 계좌', bank:'은행', cash:'현금', save:'계획 저장', pay:'결제 완료 표시', paid:'완료', remaining:'남은 금액', next:'다음 결제', delete:'계획 삭제', cancel:'취소', confirm:'계획을 삭제할까요?', history:'완료된 거래 내역은 유지됩니다.', error:'정보를 확인하세요. 2~120개월을 선택하세요.', paymentError:'결제를 저장하지 못했습니다.' },
  zh: { title:'分期付款', subtitle:'跟踪计划付款', add:'添加分期', empty:'暂无分期计划。', name:'商品或服务', nameHint:'例如：手机', total:'总金额', count:'期数', monthly:'每月付款', date:'首期日期 (DD.MM.YYYY)', category:'类别', account:'付款账户', bank:'银行', cash:'现金', save:'保存计划', pay:'标记已付款', paid:'已完成', remaining:'剩余', next:'下次付款', delete:'删除计划', cancel:'取消', confirm:'删除此计划？', history:'已付款交易将保留。', error:'请检查信息。选择2至120期。', paymentError:'无法记录付款。' },
  ja: { title:'分割払い', subtitle:'予定の支払いを管理', add:'分割払いを追加', empty:'分割払いはありません。', name:'商品・サービス', nameHint:'例：スマートフォン', total:'合計金額', count:'支払い回数', monthly:'毎月の支払額', date:'初回支払日 (DD.MM.YYYY)', category:'カテゴリ', account:'支払い口座', bank:'銀行', cash:'現金', save:'保存', pay:'支払い済みにする', paid:'完了', remaining:'残額', next:'次の支払い', delete:'プランを削除', cancel:'キャンセル', confirm:'削除しますか？', history:'支払い済みの取引は残ります。', error:'入力を確認してください。2〜120回を選択。', paymentError:'支払いを記録できませんでした。' },
  ru: { title:'Рассрочка', subtitle:'Следите за платежами', add:'Добавить рассрочку', empty:'Планов рассрочки пока нет.', name:'Товар или услуга', nameHint:'Например, телефон', total:'Общая сумма', count:'Число платежей', monthly:'Ежемесячный платёж', date:'Первый платёж (ДД.ММ.ГГГГ)', category:'Категория', account:'Счёт оплаты', bank:'Банк', cash:'Наличные', save:'Сохранить план', pay:'Отметить оплату', paid:'Завершено', remaining:'Осталось', next:'Следующий платёж', delete:'Удалить план', cancel:'Отмена', confirm:'Удалить план?', history:'Оплаченные операции сохранятся.', error:'Проверьте данные. Выберите от 2 до 120 платежей.', paymentError:'Не удалось записать платёж.' },
  it: { title:'Rate', subtitle:'Tieni traccia dei pagamenti', add:'Aggiungi rate', empty:'Nessun piano rateale.', name:'Prodotto o servizio', nameHint:'Es. Telefono', total:'Importo totale', count:'Numero di rate', monthly:'Rata mensile', date:'Prima scadenza (GG.MM.AAAA)', category:'Categoria', account:'Conto di pagamento', bank:'Banca', cash:'Contanti', save:'Salva piano', pay:'Segna come pagata', paid:'Completato', remaining:'Rimanente', next:'Prossima rata', delete:'Elimina piano', cancel:'Annulla', confirm:'Eliminare il piano?', history:'Le rate pagate restano nelle transazioni.', error:'Controlla i dati. Scegli da 2 a 120 rate.', paymentError:'Impossibile registrare il pagamento.' },
};

export const InstallmentsScreen: React.FC<{ openRequest: number }> = ({ openRequest }) => {
  const { colors } = useTheme();
  const { language } = useLocale();
  const c = COPY[language];
  const { alert } = useAppDialog();
  const { installments, transactions, categories, handleSaveInstallment, handleDeleteInstallment, handlePayInstallment } = useData();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [count, setCount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Teknoloji');
  const [accountType, setAccountType] = useState<'bank' | 'cash'>('bank');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const previousRequest = useRef(openRequest);
  useEffect(() => { if (openRequest !== previousRequest.current) { previousRequest.current = openRequest; setOpen(true); } }, [openRequest]);
  const expenseCategories = categories.filter((item) => item.type === 'expense');
  const reset = () => { setTitle(''); setAmount(''); setCount(''); setDate(''); setError(''); setOpen(false); };
  const save = async () => {
    const parts = date.trim().split(/[.\-/]/).map(Number);
    const first = parts.length === 3 ? new Date(parts[2], parts[1] - 1, parts[0], 12) : new Date(NaN);
    const totalAmount = parseAmountSafely(amount);
    const countValue = Number(count);
    if (!title.trim() || totalAmount <= 0 || !Number.isInteger(countValue) || countValue < 2 || countValue > 120 || Math.round(totalAmount * 100) < countValue ||
      Number.isNaN(first.getTime()) || first.getDate() !== parts[0] || first.getMonth() !== parts[1] - 1 || first.getFullYear() !== parts[2]) { setError(c.error); return; }
    setBusy(true);
    try { await handleSaveInstallment({ title: title.trim(), totalAmount, count: countValue, firstDueDate: first.toISOString(), category, accountType }); reset(); }
    catch { setError(c.error); }
    finally { setBusy(false); }
  };
  const card = { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 14 } as const;
  return <>
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}>
      <Header title={c.title} subtitle={c.subtitle} rightActionIcon="add" onRightActionPress={() => setOpen(true)} />
      {installments.length === 0 && <View style={card}><Text localize={false} style={{ color: colors.mutedText, marginBottom: 14 }}>{c.empty}</Text><HeroUIButton onPress={() => setOpen(true)}>{c.add}</HeroUIButton></View>}
      {installments.map((plan) => {
        const paid = transactions.filter((tx) => tx.installmentPlanId === plan.id);
        const nextNumber = Array.from({ length: plan.count }, (_, index) => index + 1).find((number) => !paid.some((tx) => tx.installmentNumber === number));
        const paidTotal = paid.reduce((sum, tx) => sum + tx.rawAmount, 0);
        return <View key={plan.id} style={card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text localize={false} style={{ color: colors.foreground, fontSize: 19, fontWeight: '800', flex: 1 }}>{plan.title}</Text><TouchableOpacity accessibilityLabel={c.delete} onPress={() => alert(c.confirm, c.history, [{ text: c.cancel, style: 'cancel' }, { text: c.delete, style: 'destructive', onPress: () => void handleDeleteInstallment(plan.id) }])}><Ionicons name="trash-outline" size={20} color={colors.mutedText} /></TouchableOpacity></View>
          <Text localize={false} style={{ color: colors.mutedText, marginTop: 7 }}>{paid.length}/{plan.count} · {c.remaining}: {formatCurrency(Math.max(0, plan.totalAmount - paidTotal))}</Text>
          <View style={{ height: 6, borderRadius: 6, backgroundColor: colors.primaryLight, marginVertical: 16 }}><View style={{ height: 6, borderRadius: 6, backgroundColor: colors.primary, width: `${Math.min(100, paid.length / plan.count * 100)}%` }} /></View>
          {nextNumber ? <><Text localize={false} style={{ color: colors.foreground, marginBottom: 13 }}>{c.next} · {nextNumber}/{plan.count} · {installmentDueDate(plan, nextNumber).toLocaleDateString(language)} · {formatCurrency(installmentAmount(plan, nextNumber))}</Text><HeroUIButton onPress={() => void handlePayInstallment(plan.id, nextNumber).catch(() => alert(c.paymentError, c.paymentError))}>{c.pay}</HeroUIButton></> : <Text localize={false} style={{ color: colors.primary, fontWeight: '700' }}>{c.paid}</Text>}
        </View>;
      })}
    </ScrollView>
    <HeroUIModal isOpen={open} onClose={reset} title={c.add} footer={<HeroUIButton onPress={() => void save()} disabled={busy}>{c.save}</HeroUIButton>}>
      <HeroUIInput label={c.name} placeholder={c.nameHint} value={title} onChangeText={setTitle} />
      <HeroUIInput label={c.total} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <HeroUIInput label={c.count} value={count} onChangeText={setCount} keyboardType="number-pad" />
      {parseAmountSafely(amount) > 0 && Number(count) >= 2 && <Text localize={false} style={{ color: colors.primary, fontWeight: '700', marginBottom: 12 }}>{c.monthly}: {formatCurrency(Math.floor(Math.round(parseAmountSafely(amount) * 100) / Number(count)) / 100)}</Text>}
      <HeroUIInput label={c.date} placeholder="15.11.2026" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
      <Text localize={false} style={{ color: colors.foreground, fontWeight: '700', marginBottom: 9 }}>{c.category}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>{expenseCategories.map((item) => <TouchableOpacity key={item.id} onPress={() => setCategory(item.name)} style={{ padding: 10, marginRight: 8, borderRadius: 12, borderWidth: 1, borderColor: category === item.name ? colors.primary : colors.cardBorder }}><Text style={{ color: colors.foreground }}>{item.name}</Text></TouchableOpacity>)}</ScrollView>
      <Text localize={false} style={{ color: colors.foreground, fontWeight: '700', marginBottom: 9 }}>{c.account}</Text>
      <View style={{ flexDirection: 'row', gap: 9, marginBottom: 14 }}>{(['bank', 'cash'] as const).map((value) => <TouchableOpacity key={value} onPress={() => setAccountType(value)} style={{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: accountType === value ? colors.primary : colors.cardBorder }}><Text localize={false} style={{ color: colors.foreground, textAlign: 'center' }}>{c[value]}</Text></TouchableOpacity>)}</View>
      {!!error && <Text localize={false} style={{ color: '#C43D55' }}>{error}</Text>}
    </HeroUIModal>
  </>;
};
