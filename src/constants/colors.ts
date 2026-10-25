export const LIGHT_COLORS = {
  background: '#F6F8FF', foreground: '#14203A', card: '#FFFFFF',
  cardBorder: '#DAE3F4', cardBorderHover: '#BFCDE8',
  primary: '#285EDD', primaryHover: '#1D49B6', primaryLight: '#E6EDFF', primaryForeground: '#FFFFFF',
  secondary: '#EAF0FC', secondaryForeground: '#405578',
  emerald: '#08B888', emeraldBg: '#DCF9EF', emeraldText: '#006D55',
  rose: '#ED426B', roseBg: '#FFE8EF', roseText: '#B31342',
  amber: '#EE9A18', amberBg: '#FFF1D4', amberText: '#955700',
  indigo: '#5555E8', indigoBg: '#EBEBFF', indigoText: '#3939AF',
  purple: '#854EE1', purpleBg: '#F2E9FF', purpleText: '#6232B4',
  blue: '#2879E7', blueBg: '#E4F0FF', blueText: '#1555B4',
  accent: '#EE9A18', accentBg: '#FFF1D4', accentForeground: '#955700',
  muted: '#EAF0FC', mutedText: '#536582', subtleText: '#7183A0',
  shadow: 'rgba(30, 57, 119, 0.09)',
  textPrimary: '#14203A', textSecondary: '#536582',
  income: '#08B888', expense: '#ED426B', surface: '#FFFFFF', border: '#DAE3F4',
  incomeText: '#006D55', expenseText: '#B31342',
};

export const DARK_COLORS: typeof LIGHT_COLORS = {
  ...LIGHT_COLORS,
  background: '#0B1020', foreground: '#F5F7FF', card: '#17213A',
  cardBorder: '#2B3A5D', cardBorderHover: '#3E5280',
  primary: '#8DB4FF', primaryHover: '#ADCAFF', primaryLight: '#263D73', primaryForeground: '#0B1530',
  secondary: '#1E2A48', secondaryForeground: '#D5E0F8',
  emerald: '#38E3B0', emeraldBg: '#103E37', emeraldText: '#65F0C5',
  rose: '#FF6D91', roseBg: '#4C2339', roseText: '#FFB0C4',
  amber: '#FFC24F', amberBg: '#49381D', amberText: '#FFDA8E',
  indigo: '#A9B5FF', indigoBg: '#2C315E', indigoText: '#CED5FF',
  purple: '#D0A8FF', purpleBg: '#392A5B', purpleText: '#E2CAFF',
  blue: '#8FC0FF', blueBg: '#213E65', blueText: '#BDD9FF',
  accent: '#FFC24F', accentBg: '#49381D', accentForeground: '#FFDA8E',
  muted: '#1E2A48', mutedText: '#BAC8E6', subtleText: '#93A5C8',
  shadow: 'rgba(0, 0, 0, 0.3)',
  textPrimary: '#F5F7FF', textSecondary: '#BAC8E6',
  income: '#38E3B0', expense: '#FF6D91', surface: '#17213A', border: '#2B3A5D',
  incomeText: '#65F0C5', expenseText: '#FFB0C4',
};

export type AppColors = typeof LIGHT_COLORS;
let activeColors: AppColors = LIGHT_COLORS;
export type AccentPreference = 'teal' | 'blue' | 'violet' | 'coral';
export const ACCENT_PALETTES: Record<AccentPreference, { light: string; dark: string; lightSoft: string; darkSoft: string; lightHover: string; darkHover: string }> = {
  teal: { light: '#087F76', dark: '#50E2C1', lightSoft: '#DCF9F2', darkSoft: '#174C49', lightHover: '#06655D', darkHover: '#8DF4DB' },
  blue: { light: '#285EDD', dark: '#8DB4FF', lightSoft: '#E6EDFF', darkSoft: '#263D73', lightHover: '#1D49B6', darkHover: '#ADCAFF' },
  violet: { light: '#6D44C0', dark: '#CAA6FF', lightSoft: '#F0E8FF', darkSoft: '#43306B', lightHover: '#553398', darkHover: '#DFC7FF' },
  coral: { light: '#BC405B', dark: '#FF91AA', lightSoft: '#FFE9F0', darkSoft: '#5A2B47', lightHover: '#9B2F4A', darkHover: '#FFB7C9' },
};
export const getAccentColors = (dark: boolean, accent: AccentPreference): AppColors => {
  const base = dark ? DARK_COLORS : LIGHT_COLORS;
  const palette = ACCENT_PALETTES[accent];
  return { ...base, primary: dark ? palette.dark : palette.light, primaryHover: dark ? palette.darkHover : palette.lightHover, primaryLight: dark ? palette.darkSoft : palette.lightSoft };
};
export const setActiveColors = (dark: boolean, accent: AccentPreference = 'blue') => { activeColors = getAccentColors(dark, accent); };
export const COLORS: AppColors = new Proxy(LIGHT_COLORS, {
  get(_target, key: keyof AppColors) { return activeColors[key]; },
});
