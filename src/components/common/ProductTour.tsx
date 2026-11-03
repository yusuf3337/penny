import React, { useEffect, useState } from 'react';
import { Modal, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from 'heroui-native/card';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './LocalizedPrimitives';
import { AppLanguage, useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { TabType } from '../../context/DataContext';

type FiveStrings = [string, string, string, string, string];
type TourCopy = { titles: FiveStrings; bodies: FiveStrings; skip: string; back: string; next: string; finish: string; progress: string };

const tabs: TabType[] = ['timeline', 'goals', 'budget', 'more', 'reports'];
const icons: (keyof typeof Ionicons.glyphMap)[] = ['wallet-outline', 'flag-outline', 'pie-chart-outline', 'grid-outline', 'bar-chart-outline'];
const copy: Record<AppLanguage, TourCopy> = {
  tr: { titles: ['Para akışın', 'Hedeflerin', 'Zarf bütçelerin', 'Diğer araçlar', 'Raporların'], bodies: ['Gelir ve giderlerini burada görürsün. Sağ alttaki Ekle düğmesiyle yeni bir işlem kaydedebilirsin.', 'Biriktirmek istediğin tutarı hedef olarak belirle. Hedefi lira, dolar, euro veya altın gramı ile takip edebilirsin.', 'Harcama kategorilerine aylık sınır koy. Bir işlem o kategoriye kaydedildiğinde zarfın kalan tutarı güncellenir.', 'Abonelikler, taksitler ve borç-alacak kayıtları Diğer bölümünde. Gerektiğinde bu araçları kullanabilirsin.', 'Aylık gelir-gider grafiğini ve finansal durumunu Raporlar’da görürsün. Ev veya araç gibi diğer varlıkları burada tahmini değeriyle ekleyebilirsin.'], skip: 'Turu geç', back: 'Geri', next: 'İleri', finish: 'Başla', progress: 'Adım' },
  en: { titles: ['Your money flow', 'Your goals', 'Budget envelopes', 'More tools', 'Your reports'], bodies: ['See your income and expenses here. Use Add at the bottom right to record a transaction.', 'Set an amount to save toward. You can track a goal in lira, dollars, euros, or grams of gold.', 'Set a monthly limit for a spending category. Transactions in that category update the envelope’s remaining amount.', 'Subscriptions, installments, and money owed are in More. Open these tools when you need them.', 'Reports show your monthly income and expenses and your financial position. Add other assets, such as a home or car, with an estimated value.'], skip: 'Skip tour', back: 'Back', next: 'Next', finish: 'Get started', progress: 'Step' },
  de: { titles: ['Dein Geldfluss', 'Deine Ziele', 'Budgetumschläge', 'Weitere Funktionen', 'Deine Berichte'], bodies: ['Hier siehst du Einnahmen und Ausgaben. Mit „Neu“ unten rechts erfasst du eine Buchung.', 'Lege ein Sparziel fest. Du kannst es in Lira, Dollar, Euro oder Gramm Gold verfolgen.', 'Lege ein Monatslimit für eine Ausgabenkategorie fest. Buchungen dieser Kategorie aktualisieren den Restbetrag.', 'Abonnements, Raten und Schulden findest du unter „Mehr“. Nutze diese Funktionen bei Bedarf.', 'Berichte zeigen Einnahmen, Ausgaben und deine Finanzlage. Weitere Werte wie Haus oder Auto kannst du mit einem Schätzwert ergänzen.'], skip: 'Tour überspringen', back: 'Zurück', next: 'Weiter', finish: 'Loslegen', progress: 'Schritt' },
  fr: { titles: ['Vos mouvements', 'Vos objectifs', 'Enveloppes budget', 'Autres outils', 'Vos rapports'], bodies: ['Retrouvez ici vos revenus et dépenses. Utilisez Ajouter en bas à droite pour enregistrer une opération.', 'Fixez un montant à épargner. Suivez votre objectif en livres turques, dollars, euros ou grammes d’or.', 'Fixez une limite mensuelle par catégorie. Chaque dépense enregistrée met à jour le montant restant.', 'Abonnements, paiements échelonnés et dettes se trouvent dans Plus. Ouvrez ces outils selon vos besoins.', 'Les rapports affichent vos revenus, dépenses et situation financière. Ajoutez aussi un bien comme une maison ou une voiture avec sa valeur estimée.'], skip: 'Passer la visite', back: 'Retour', next: 'Suivant', finish: 'Commencer', progress: 'Étape' },
  ko: { titles: ['내 돈의 흐름', '저축 목표', '예산 봉투', '기타 도구', '보고서'], bodies: ['수입과 지출을 여기서 확인하세요. 오른쪽 아래 추가 버튼으로 거래를 기록할 수 있습니다.', '저축 목표를 설정하세요. 리라, 달러, 유로 또는 금 그램 단위로 추적할 수 있습니다.', '지출 항목별 월 한도를 설정하세요. 해당 항목의 거래를 기록하면 남은 예산이 업데이트됩니다.', '구독, 할부, 빌려주거나 빌린 돈은 더보기에서 관리할 수 있습니다.', '보고서에서 월별 수입·지출과 재무 현황을 확인하세요. 집이나 자동차 같은 자산의 예상 가치도 추가할 수 있습니다.'], skip: '건너뛰기', back: '뒤로', next: '다음', finish: '시작하기', progress: '단계' },
  zh: { titles: ['资金流动', '储蓄目标', '预算信封', '更多工具', '财务报告'], bodies: ['在这里查看收入和支出。点击右下角的添加按钮即可记录交易。', '设定储蓄目标，可按里拉、美元、欧元或黄金克数追踪。', '为支出类别设定每月限额。记录该类别的交易后，剩余预算会自动更新。', '订阅、分期付款及借贷记录都在“更多”中，可按需使用。', '报告展示每月收支和财务状况。房屋、汽车等其他资产可按估算价值添加。'], skip: '跳过导览', back: '返回', next: '下一步', finish: '开始使用', progress: '步骤' },
  ja: { titles: ['お金の流れ', '貯蓄目標', '予算の封筒', 'その他の機能', 'レポート'], bodies: ['収入と支出をここで確認できます。右下の追加ボタンで取引を記録します。', '貯蓄目標を設定しましょう。リラ、ドル、ユーロ、金のグラム数で進捗を管理できます。', '支出カテゴリごとに月間上限を設定します。そのカテゴリの取引を記録すると残額が更新されます。', 'サブスクリプション、分割払い、貸し借りは「その他」にあります。必要なときに使えます。', 'レポートで月間の収支と資産状況を確認できます。家や車などは推定価値を入力して追加できます。'], skip: 'ツアーをスキップ', back: '戻る', next: '次へ', finish: '始める', progress: 'ステップ' },
  ru: { titles: ['Движение денег', 'Ваши цели', 'Бюджетные конверты', 'Другие инструменты', 'Ваши отчёты'], bodies: ['Здесь видны доходы и расходы. Кнопка «Добавить» справа внизу создаёт новую операцию.', 'Задайте цель накопления. Отслеживать её можно в лирах, долларах, евро или граммах золота.', 'Установите месячный лимит для категории расходов. Операции этой категории обновляют остаток конверта.', 'Подписки, рассрочка и долги находятся в разделе «Ещё». Пользуйтесь ими по мере необходимости.', 'Отчёты показывают месячные доходы, расходы и финансовое положение. Дом или автомобиль можно добавить по оценочной стоимости.'], skip: 'Пропустить', back: 'Назад', next: 'Далее', finish: 'Начать', progress: 'Шаг' },
  it: { titles: ['I tuoi movimenti', 'I tuoi obiettivi', 'Buste di budget', 'Altri strumenti', 'I tuoi report'], bodies: ['Qui trovi entrate e uscite. Usa Aggiungi in basso a destra per registrare un movimento.', 'Imposta un obiettivo di risparmio. Puoi seguirlo in lire turche, dollari, euro o grammi d’oro.', 'Imposta un limite mensile per una categoria. I movimenti di quella categoria aggiornano il budget rimanente.', 'Abbonamenti, rate e debiti si trovano in Altro. Usa questi strumenti quando servono.', 'I report mostrano entrate, uscite e situazione finanziaria. Puoi aggiungere casa o auto con un valore stimato.'], skip: 'Salta il tour', back: 'Indietro', next: 'Avanti', finish: 'Inizia', progress: 'Passo' },
};

interface ProductTourProps {
  visible: boolean;
  onNavigate: (tab: TabType) => void;
  onFinish: () => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({ visible, onNavigate, onFinish }) => {
  const { language } = useLocale();
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (visible) { setStep(0); onNavigate(tabs[0]); }
  }, [visible]);
  const c = copy[language];
  const goTo = (index: number) => { setStep(index); onNavigate(tabs[index]); };
  const next = () => step === tabs.length - 1 ? onFinish() : goTo(step + 1);

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onFinish} statusBarTranslucent accessibilityViewIsModal>
    <View style={{ flex: 1, backgroundColor: 'rgba(8, 15, 35, 0.32)' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <Card style={{ marginHorizontal: 18, marginTop: 18, padding: 20, borderRadius: 24, backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icons[step]} size={22} color={colors.primary} />
            </View>
            <TouchableOpacity accessibilityRole="button" onPress={onFinish} style={{ paddingVertical: 8, paddingHorizontal: 4 }}>
              <Text localize={false} style={{ color: colors.mutedText, fontSize: 13, fontWeight: '600' }}>{c.skip}</Text>
            </TouchableOpacity>
          </View>
          <Text localize={false} style={{ color: colors.foreground, fontSize: 22, fontWeight: '800', marginTop: 16 }}>{c.titles[step]}</Text>
          <Text localize={false} style={{ color: colors.secondaryForeground, fontSize: 14, lineHeight: 21, marginTop: 7 }}>{c.bodies[step]}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 }}>
            {tabs.map((_, index) => <View key={index} style={{ width: index === step ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: index === step ? colors.primary : colors.cardBorder }} />)}
            <Text localize={false} style={{ color: colors.mutedText, fontSize: 11, marginLeft: 'auto' }}>{c.progress} {step + 1}/{tabs.length}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            {step > 0 && <TouchableOpacity accessibilityRole="button" onPress={() => goTo(step - 1)} style={{ borderColor: colors.cardBorder, borderWidth: 1, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'center' }}>
              <Text localize={false} style={{ color: colors.foreground, fontSize: 14, fontWeight: '700' }}>{c.back}</Text>
            </TouchableOpacity>}
            <TouchableOpacity accessibilityRole="button" onPress={next} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 12, backgroundColor: colors.primary }}>
              <Text localize={false} style={{ color: colors.primaryForeground, fontSize: 14, fontWeight: '800' }}>{step === tabs.length - 1 ? c.finish : c.next}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </SafeAreaView>
    </View>
  </Modal>;
};
