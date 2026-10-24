import type { AppLanguage } from '../context/LocaleContext';

export interface VoiceCategory {
  name: string;
  type: 'income' | 'expense' | 'transfer';
  localizedName?: string;
}

export interface VoiceTransactionDraft {
  type: 'income' | 'expense';
  amount?: number;
  title?: string;
  accountType?: 'bank' | 'cash';
  category?: string;
}

const terms: Record<AppLanguage, { income: string[]; expense: string[]; bank: string[]; cash: string[] }> = {
  tr: { income: ['gelir', 'kazanç', 'maaş', 'aldım'], expense: ['gider', 'harcama', 'harcadım', 'ödedim'], bank: ['banka', 'kart', 'hesap'], cash: ['nakit', 'elden', 'cüzdan'] },
  en: { income: ['income', 'earned', 'salary', 'received'], expense: ['expense', 'spent', 'paid', 'spend'], bank: ['bank', 'card', 'account'], cash: ['cash', 'wallet'] },
  de: { income: ['einnahme', 'gehalt', 'verdient'], expense: ['ausgabe', 'ausgegeben', 'bezahlt'], bank: ['bank', 'karte', 'konto'], cash: ['bargeld', 'bar'] },
  fr: { income: ['revenu', 'salaire', 'reçu'], expense: ['dépense', 'dépensé', 'payé'], bank: ['banque', 'carte', 'compte'], cash: ['espèces', 'liquide'] },
  ko: { income: ['수입', '급여', '받았'], expense: ['지출', '썼', '결제'], bank: ['은행', '카드', '계좌'], cash: ['현금', '지갑'] },
  zh: { income: ['收入', '工资', '收到'], expense: ['支出', '消费', '支付'], bank: ['银行', '银行卡', '账户'], cash: ['现金', '钱包'] },
  ja: { income: ['収入', '給料', '受け取'], expense: ['支出', '出費', '払っ'], bank: ['銀行', 'カード', '口座'], cash: ['現金', '財布'] },
  ru: { income: ['доход', 'зарплата', 'получил'], expense: ['расход', 'потратил', 'оплатил'], bank: ['банк', 'карта', 'счёт'], cash: ['наличные', 'наличными', 'кошелёк'] },
  it: { income: ['entrata', 'stipendio', 'ricevuto'], expense: ['spesa', 'speso', 'pagato'], bank: ['banca', 'carta', 'conto'], cash: ['contanti', 'portafoglio'] },
};

const currencyWords = ['tl', 'try', 'lira', 'lirası', 'dolar', 'dollar', 'dollars', 'usd', 'euro', 'euros', 'eur', 'sterlin', 'pound', 'yen', 'yuan', 'won', 'ruble', 'рублей', 'рубля', 'рубль', '원', '円', '元', '유로', '달러', 'ユーロ', 'ドル', '欧元', '美元'];
const fillerWords = ['için', 'bir', 'işlem', 'ekle', 'kaydet', 'olarak', 'ile', 'on', 'for', 'a', 'the', 'add', 'transaction', 'in', 'to', 'of'];
const turkishNumbers: Record<string, number> = {
  sıfır: 0, bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, altı: 6, yedi: 7, sekiz: 8, dokuz: 9,
  on: 10, yirmi: 20, otuz: 30, kırk: 40, elli: 50, altmıs: 60, yetmis: 70, seksen: 80, doksan: 90,
  yuz: 100, bin: 1000,
};

const normalize = (value: string): string => value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const hasTerm = (text: string, term: string): boolean => {
  const normalized = normalize(term);
  return normalized.length > 1 && (` ${text} `).includes(` ${normalized} `)
    || /[^a-z]/i.test(normalized) && text.includes(normalized);
};

const parseNumericAmount = (value: string): { amount: number; source: string } | undefined => {
  const matches = [...value.matchAll(/(?:^|[^\d])((?:\d{1,3}(?:[.,\s]\d{3})+|\d+)(?:[.,]\d{1,2})?)/gu)];
  const candidates = matches.map((match) => {
    const source = match[1];
    const lastDot = source.lastIndexOf('.');
    const lastComma = source.lastIndexOf(',');
    const decimalIndex = Math.max(lastDot, lastComma);
    const hasDecimal = decimalIndex >= 0 && source.slice(decimalIndex + 1).replace(/\D/g, '').length <= 2;
    const integer = (hasDecimal ? source.slice(0, decimalIndex) : source).replace(/\D/g, '');
    const fraction = hasDecimal ? source.slice(decimalIndex + 1).replace(/\D/g, '') : '';
    const amount = Number(`${integer}.${fraction || '0'}`);
    const after = value.slice((match.index ?? 0) + match[0].length, (match.index ?? 0) + match[0].length + 18);
    const nearCurrency = currencyWords.some((word) => hasTerm(normalize(after), word));
    return { amount, source, nearCurrency };
  }).filter((item) => item.amount > 0 && Number.isFinite(item.amount));
  const picked = candidates.find((item) => item.nearCurrency) ?? candidates[0];
  return picked && { amount: picked.amount, source: picked.source };
};

const parseTurkishWordAmount = (value: string): { amount: number; source: string } | undefined => {
  const tokens = normalize(value).split(' ');
  for (let index = 0; index < tokens.length; index += 1) {
    if (!(tokens[index] in turkishNumbers)) continue;
    let end = index;
    let group = 0;
    let total = 0;
    while (end < tokens.length && tokens[end] in turkishNumbers) {
      const number = turkishNumbers[tokens[end]];
      if (number === 100) group = (group || 1) * 100;
      else if (number === 1000) { total += (group || 1) * 1000; group = 0; }
      else group += number;
      end += 1;
    }
    const amount = total + group;
    if (amount > 0 && (end - index > 1 || currencyWords.includes(tokens[end]))) {
      return { amount, source: tokens.slice(index, end).join(' ') };
    }
    index = end - 1;
  }
  return undefined;
};

export function parseVoiceTransaction(
  transcript: string,
  language: AppLanguage,
  categories: VoiceCategory[],
): VoiceTransactionDraft {
  const normalized = normalize(transcript);
  const dictionary = terms[language];
  const explicitIncome = dictionary.income.some((word) => hasTerm(normalized, word));
  const explicitExpense = dictionary.expense.some((word) => hasTerm(normalized, word));
  const matchingCategory = categories.find((category) =>
    [category.localizedName, category.name].some((name) => name && (
      hasTerm(normalized, name) || normalize(name).split(' ').some((part) => part.length >= 4 && hasTerm(normalized, part))
    )));
  const type: 'income' | 'expense' = explicitIncome && !explicitExpense ? 'income'
    : explicitExpense && !explicitIncome ? 'expense'
      : matchingCategory?.type === 'income' ? 'income' : 'expense';
  const category = matchingCategory?.type === type ? matchingCategory.name : undefined;
  const accountType = dictionary.cash.some((word) => hasTerm(normalized, word)) ? 'cash'
    : dictionary.bank.some((word) => hasTerm(normalized, word)) ? 'bank' : undefined;
  const amountMatch = parseNumericAmount(transcript)
    ?? (language === 'tr' ? parseTurkishWordAmount(transcript) : undefined);

  let title = normalized;
  if (amountMatch) title = title.replace(normalize(amountMatch.source), ' ');
  for (const word of [...dictionary.income, ...dictionary.expense, ...dictionary.bank, ...dictionary.cash, ...currencyWords, ...fillerWords]) {
    const normalizedWord = normalize(word);
    title = /[^a-zı]/i.test(normalizedWord)
      ? title.replaceAll(normalizedWord, ' ').trim()
      : (` ${title} `).replace(` ${normalizedWord} `, ' ').trim();
  }
  if (category) {
    for (const categoryName of [matchingCategory?.localizedName, category]) {
      if (categoryName) title = (` ${title} `).replace(` ${normalize(categoryName)} `, ' ').trim();
    }
  }
  title = title.replace(/\s+/g, ' ').trim();
  if (language === 'ja') title = title.replace(/[にでをへとて]+(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
  const resolvedTitle = title || (matchingCategory?.localizedName ?? matchingCategory?.name);
  return {
    type,
    amount: amountMatch?.amount,
    title: resolvedTitle ? (resolvedTitle.charAt(0).toLocaleUpperCase(language === 'tr' ? 'tr-TR' : undefined) + resolvedTitle.slice(1)).normalize('NFC') : undefined,
    accountType,
    category,
  };
}
