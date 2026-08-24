import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_market', name: 'Market', icon: 'cart', color: '#F59E0B', type: 'expense' },
  { id: 'cat_food', name: 'Yemek & Kafe', icon: 'fast-food', color: '#EF4444', type: 'expense' },
  { id: 'cat_transport', name: 'Ulaşım', icon: 'bus', color: '#3B82F6', type: 'expense' },
  { id: 'cat_bills', name: 'Faturalar', icon: 'document-text', color: '#8B5CF6', type: 'expense' },
  { id: 'cat_salary', name: 'Maaş', icon: 'wallet', color: '#10B981', type: 'income' },
  { id: 'cat_freelance', name: 'Ek Gelir', icon: 'cash', color: '#06B6D4', type: 'income' },
];
