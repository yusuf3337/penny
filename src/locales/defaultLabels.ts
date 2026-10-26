import type { AppLanguage } from '../context/LocaleContext';

// These names are stored in existing records. Translate only when presenting them,
// so transactions and envelopes continue to match their saved category names.
export const DEFAULT_LABELS: Record<Exclude<AppLanguage, 'tr'>, Record<string, string>> = {
  en: {
    Teknoloji: 'Technology', Ev: 'Home', Yemek: 'Food', Faturalar: 'Bills',
    Sağlık: 'Health', Ulaşım: 'Transport', Eğlence: 'Entertainment',
    'Maaş / Hakediş': 'Salary / Contract income', 'Ortak Harcama': 'Shared expense',
    Birikim: 'Savings', HEDEF: 'GOAL',
    'Ortak Harcama Payı': 'Shared expense share', 'Ortak Harcama Tahsilatı': 'Shared expense repayment',
  },
  de: {
    Teknoloji: 'Technik', Ev: 'Wohnen', Yemek: 'Essen', Faturalar: 'Rechnungen',
    Sağlık: 'Gesundheit', Ulaşım: 'Verkehr', Eğlence: 'Freizeit',
    'Maaş / Hakediş': 'Gehalt / Honorar', 'Ortak Harcama': 'Geteilte Ausgabe',
    Birikim: 'Ersparnisse', HEDEF: 'ZIEL',
    'Ortak Harcama Payı': 'Anteil an gemeinsamer Ausgabe', 'Ortak Harcama Tahsilatı': 'Rückzahlung gemeinsamer Ausgabe',
  },
  fr: {
    Teknoloji: 'Technologie', Ev: 'Maison', Yemek: 'Alimentation', Faturalar: 'Factures',
    Sağlık: 'Santé', Ulaşım: 'Transport', Eğlence: 'Loisirs',
    'Maaş / Hakediş': 'Salaire / Honoraires', 'Ortak Harcama': 'Dépense partagée',
    Birikim: 'Épargne', HEDEF: 'OBJECTIF',
    'Ortak Harcama Payı': 'Part de dépense partagée', 'Ortak Harcama Tahsilatı': 'Remboursement de dépense partagée',
  },
  ko: {
    Teknoloji: '기술', Ev: '주거', Yemek: '식비', Faturalar: '공과금',
    Sağlık: '건강', Ulaşım: '교통', Eğlence: '여가',
    'Maaş / Hakediş': '급여 / 용역 수입', 'Ortak Harcama': '공동 지출',
    Birikim: '저축', HEDEF: '목표',
    'Ortak Harcama Payı': '공동 지출 분담금', 'Ortak Harcama Tahsilatı': '공동 지출 상환금',
  },
  zh: {
    Teknoloji: '科技', Ev: '居家', Yemek: '餐饮', Faturalar: '账单',
    Sağlık: '健康', Ulaşım: '交通', Eğlence: '娱乐',
    'Maaş / Hakediş': '工资 / 劳务收入', 'Ortak Harcama': '共同支出',
    Birikim: '储蓄', HEDEF: '目标',
    'Ortak Harcama Payı': '共同支出分摊', 'Ortak Harcama Tahsilatı': '共同支出还款',
  },
  ja: {
    Teknoloji: 'テクノロジー', Ev: '住まい', Yemek: '食費', Faturalar: '請求書',
    Sağlık: '健康', Ulaşım: '交通', Eğlence: '娯楽',
    'Maaş / Hakediş': '給与 / 業務収入', 'Ortak Harcama': '共同支出',
    Birikim: '貯蓄', HEDEF: '目標',
    'Ortak Harcama Payı': '共同支出の負担分', 'Ortak Harcama Tahsilatı': '共同支出の返済',
  },
  ru: {
    Teknoloji: 'Техника', Ev: 'Дом', Yemek: 'Питание', Faturalar: 'Счета',
    Sağlık: 'Здоровье', Ulaşım: 'Транспорт', Eğlence: 'Развлечения',
    'Maaş / Hakediş': 'Зарплата / гонорар', 'Ortak Harcama': 'Общий расход',
    Birikim: 'Накопления', HEDEF: 'ЦЕЛЬ',
    'Ortak Harcama Payı': 'Доля общего расхода', 'Ortak Harcama Tahsilatı': 'Возврат общего расхода',
  },
  it: {
    Teknoloji: 'Tecnologia', Ev: 'Casa', Yemek: 'Cibo', Faturalar: 'Bollette',
    Sağlık: 'Salute', Ulaşım: 'Trasporti', Eğlence: 'Svago',
    'Maaş / Hakediş': 'Stipendio / Compenso', 'Ortak Harcama': 'Spesa condivisa',
    Birikim: 'Risparmi', HEDEF: 'OBIETTIVO',
    'Ortak Harcama Payı': 'Quota della spesa condivisa', 'Ortak Harcama Tahsilatı': 'Rimborso della spesa condivisa',
  },
};
