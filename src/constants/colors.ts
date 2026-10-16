export const LIGHT_COLORS = {
  background: '#F5F7F5', foreground: '#182B29', card: '#FFFFFF',
  cardBorder: '#E1E9E5', cardBorderHover: '#CAD8D2',
  primary: '#137C70', primaryHover: '#0D635A', primaryLight: '#E3F2EC', primaryForeground: '#FFFFFF',
  secondary: '#EEF2EF', secondaryForeground: '#3B514C',
  emerald: '#10B981', emeraldBg: '#ECFDF5', emeraldText: '#047857',
  rose: '#F43F5E', roseBg: '#FFF1F2', roseText: '#BE123C',
  amber: '#F59E0B', amberBg: '#FEF3C7', amberText: '#B45309',
  indigo: '#6366F1', indigoBg: '#EEF2FF', indigoText: '#4338CA',
  purple: '#8B5CF6', purpleBg: '#F5F3FF', purpleText: '#6D28D9',
  blue: '#3B82F6', blueBg: '#EFF6FF', blueText: '#1D4ED8',
  accent: '#F59E0B', accentBg: '#FEF3C7', accentForeground: '#B45309',
  muted: '#EEF2EF', mutedText: '#667A73', subtleText: '#94A59E',
  shadow: 'rgba(24, 43, 41, 0.05)',
  textPrimary: '#182B29', textSecondary: '#667A73',
  income: '#10B981', expense: '#F43F5E', surface: '#FFFFFF', border: '#E1E9E5',
  incomeText: '#047857', expenseText: '#BE123C',
};

export const DARK_COLORS: typeof LIGHT_COLORS = {
  ...LIGHT_COLORS,
  background: '#0F1816', foreground: '#EAF2EE', card: '#182521',
  cardBorder: '#2C4039', cardBorderHover: '#3C574E',
  primary: '#66C9AE', primaryHover: '#8BD9C2', primaryLight: '#203E35', primaryForeground: '#10231D',
  secondary: '#22332D', secondaryForeground: '#CCDCD2',
  emerald: '#54D6A1', emeraldBg: '#183C2D', emeraldText: '#70E0B0',
  rose: '#FB7185', roseBg: '#44252E', roseText: '#FDA4AF',
  amber: '#FBBF24', amberBg: '#43341D', amberText: '#FCD34D',
  indigo: '#A5B4FC', indigoBg: '#2D3150', indigoText: '#C7D2FE',
  purple: '#C4B5FD', purpleBg: '#342B4A', purpleText: '#DDD6FE',
  blue: '#93C5FD', blueBg: '#21364B', blueText: '#BFDBFE',
  accent: '#FBBF24', accentBg: '#43341D', accentForeground: '#FCD34D',
  muted: '#22332D', mutedText: '#A9BDB2', subtleText: '#82978B',
  shadow: 'rgba(0, 0, 0, 0.25)',
  textPrimary: '#EAF2EE', textSecondary: '#A9BDB2',
  income: '#54D6A1', expense: '#FB7185', surface: '#182521', border: '#2C4039',
  incomeText: '#70E0B0', expenseText: '#FDA4AF',
};

export type AppColors = typeof LIGHT_COLORS;
let activeColors: AppColors = LIGHT_COLORS;
export const setActiveColors = (dark: boolean) => { activeColors = dark ? DARK_COLORS : LIGHT_COLORS; };
export const COLORS: AppColors = new Proxy(LIGHT_COLORS, {
  get(_target, key: keyof AppColors) { return activeColors[key]; },
});
