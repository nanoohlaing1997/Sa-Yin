export type TxType = 'expense' | 'income';

export type Category = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  type: TxType;
};

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', label: 'Food & Drink', emoji: '🍜', color: '#E5484D', type: 'expense' },
  { id: 'transport', label: 'Transport', emoji: '🚕', color: '#F2A93B', type: 'expense' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#8E4EC6', type: 'expense' },
  { id: 'bills', label: 'Bills & Utilities', emoji: '💡', color: '#2F6BFF', type: 'expense' },
  { id: 'housing', label: 'Housing', emoji: '🏠', color: '#0E7C86', type: 'expense' },
  { id: 'health', label: 'Health', emoji: '💊', color: '#17A673', type: 'expense' },
  { id: 'fun', label: 'Entertainment', emoji: '🎬', color: '#D6409F', type: 'expense' },
  { id: 'other-expense', label: 'Other', emoji: '📦', color: '#6B7382', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', label: 'Salary', emoji: '💼', color: '#17A673', type: 'income' },
  { id: 'bonus', label: 'Bonus', emoji: '🎁', color: '#0E7C86', type: 'income' },
  { id: 'freelance', label: 'Freelance', emoji: '🧑‍💻', color: '#2F6BFF', type: 'income' },
  { id: 'other-income', label: 'Other', emoji: '➕', color: '#6B7382', type: 'income' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

const BY_ID = new Map(ALL_CATEGORIES.map((c) => [c.id, c]));

const UNKNOWN: Category = {
  id: 'unknown',
  label: 'Uncategorised',
  emoji: '❓',
  color: '#6B7382',
  type: 'expense',
};

export function categoriesFor(type: TxType): Category[] {
  return type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}

export function getCategory(id: string): Category {
  return BY_ID.get(id) ?? UNKNOWN;
}
