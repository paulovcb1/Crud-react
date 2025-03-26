export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string | string;
  category: string;
  created_at: string | string;
}

export type NewExpense = Omit<Expense, 'id' | 'created_at'>;

export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Moradia',
  'Outros'
] as const;

export type Category = typeof CATEGORIES[number];