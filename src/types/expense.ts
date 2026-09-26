export type CategoryId =
  | 'food'
  | 'transport'
  | 'housing'
  | 'utilities'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'other'
  | (string & {});

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  icon: string;
  isCustom?: boolean;
}

export type IncomeCategoryId =
  | 'salary'
  | 'freelance'
  | 'business'
  | 'investment'
  | 'side_hustle'
  | 'gift_bonus'
  | 'refund'
  | 'other_income';

export interface IncomeCategoryInfo {
  id: IncomeCategoryId;
  name: string;
  color: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  icon: string;
}

export type PaymentMethod = 'card' | 'cash' | 'digital' | 'bank_transfer' | 'check';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: CategoryId;
  date: string; // ISO format: YYYY-MM-DD
  time?: string; // HH:mm
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
  syncStatus?: 'synced' | 'pending_sync';
}

export interface Income {
  id: string;
  title: string;
  amount: number;
  category: IncomeCategoryId;
  date: string; // ISO format: YYYY-MM-DD
  time?: string; // HH:mm
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
  syncStatus?: 'synced' | 'pending_sync';
}

export type TransactionType = 'expense' | 'income';

export interface TransactionDoc {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD
  time?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  syncStatus?: 'synced' | 'pending_sync';
}

export interface BudgetConfig {
  daily: number;
  weekly: number;
  monthly: number;
  currency: string;
  monthlySavingsTarget?: number;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  weekStartsOn?: 'Monday' | 'Sunday';
}

export type DailySectionTab = 'expenses' | 'income' | 'both';
export type PageTab =
  | 'dashboard'
  | 'daily'
  | 'weekly-monthly'
  | 'charts'
  | 'budgets'
  | 'budget-limits'
  | 'categories'
  | 'backup';

