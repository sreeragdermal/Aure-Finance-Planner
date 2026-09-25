import {
  CategoryId,
  CategoryInfo,
  IncomeCategoryId,
  IncomeCategoryInfo,
  PaymentMethod,
} from '../types/expense';

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  food: {
    id: 'food',
    name: 'Food & Dining',
    color: '#0D9488', // Teal
    bgLight: '#F0FDFA',
    bgDark: 'rgba(13, 148, 136, 0.15)',
    textLight: '#0F766E',
    textDark: '#5EEAD4',
    icon: 'Utensils',
  },
  transport: {
    id: 'transport',
    name: 'Transport & Fuel',
    color: '#0284C7', // Sky blue
    bgLight: '#F0F9FF',
    bgDark: 'rgba(2, 132, 199, 0.15)',
    textLight: '#0369A1',
    textDark: '#7DD3FC',
    icon: 'Car',
  },
  housing: {
    id: 'housing',
    name: 'Housing & Rent',
    color: '#7C3AED', // Soft violet
    bgLight: '#F5F3FF',
    bgDark: 'rgba(124, 58, 237, 0.15)',
    textLight: '#6D28D9',
    textDark: '#C4B5FD',
    icon: 'Home',
  },
  utilities: {
    id: 'utilities',
    name: 'Bills & Utilities',
    color: '#D97706', // Warm amber
    bgLight: '#FFFBEB',
    bgDark: 'rgba(217, 119, 6, 0.15)',
    textLight: '#B45309',
    textDark: '#FCD34D',
    icon: 'Zap',
  },
  shopping: {
    id: 'shopping',
    name: 'Shopping & Groceries',
    color: '#DB2777', // Berry / Pink
    bgLight: '#FDF2F8',
    bgDark: 'rgba(219, 39, 119, 0.15)',
    textLight: '#BE185D',
    textDark: '#F472B6',
    icon: 'ShoppingBag',
  },
  entertainment: {
    id: 'entertainment',
    name: 'Entertainment & OTT',
    color: '#8B5CF6', // Purple
    bgLight: '#FAF5FF',
    bgDark: 'rgba(139, 92, 246, 0.15)',
    textLight: '#7C3AED',
    textDark: '#DDD6FE',
    icon: 'Film',
  },
  health: {
    id: 'health',
    name: 'Health & Pharmacy',
    color: '#059669', // Emerald
    bgLight: '#ECFDF5',
    bgDark: 'rgba(5, 150, 105, 0.15)',
    textLight: '#047857',
    textDark: '#6EE7B7',
    icon: 'Heart',
  },
  education: {
    id: 'education',
    name: 'Education & Courses',
    color: '#4F46E5', // Indigo
    bgLight: '#EEF2FF',
    bgDark: 'rgba(79, 70, 229, 0.15)',
    textLight: '#4338CA',
    textDark: '#A5B4FC',
    icon: 'BookOpen',
  },
  other: {
    id: 'other',
    name: 'Other Expenses',
    color: '#64748B', // Slate
    bgLight: '#F8FAFC',
    bgDark: 'rgba(100, 116, 139, 0.15)',
    textLight: '#475569',
    textDark: '#CBD5E1',
    icon: 'CircleDot',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export const INCOME_CATEGORIES: Record<IncomeCategoryId, IncomeCategoryInfo> = {
  salary: {
    id: 'salary',
    name: 'Salary & Wages',
    color: '#10B981', // Emerald green
    bgLight: '#ECFDF5',
    bgDark: 'rgba(16, 185, 129, 0.15)',
    textLight: '#047857',
    textDark: '#6EE7B7',
    icon: 'Briefcase',
  },
  freelance: {
    id: 'freelance',
    name: 'Freelance & Contract',
    color: '#0D9488', // Teal
    bgLight: '#F0FDFA',
    bgDark: 'rgba(13, 148, 136, 0.15)',
    textLight: '#0F766E',
    textDark: '#5EEAD4',
    icon: 'Laptop',
  },
  business: {
    id: 'business',
    name: 'Business & Sales',
    color: '#0284C7', // Sky Blue
    bgLight: '#F0F9FF',
    bgDark: 'rgba(2, 132, 199, 0.15)',
    textLight: '#0369A1',
    textDark: '#7DD3FC',
    icon: 'TrendingUp',
  },
  investment: {
    id: 'investment',
    name: 'Dividends & Mutual Funds',
    color: '#6366F1', // Indigo
    bgLight: '#EEF2FF',
    bgDark: 'rgba(99, 102, 241, 0.15)',
    textLight: '#4338CA',
    textDark: '#A5B4FC',
    icon: 'PiggyBank',
  },
  side_hustle: {
    id: 'side_hustle',
    name: 'Side Hustles & Gigs',
    color: '#F59E0B', // Amber
    bgLight: '#FFFBEB',
    bgDark: 'rgba(245, 158, 11, 0.15)',
    textLight: '#B45309',
    textDark: '#FCD34D',
    icon: 'Sparkles',
  },
  gift_bonus: {
    id: 'gift_bonus',
    name: 'Gifts & Bonuses',
    color: '#EC4899', // Pink
    bgLight: '#FDF2F8',
    bgDark: 'rgba(236, 72, 153, 0.15)',
    textLight: '#BE185D',
    textDark: '#F472B6',
    icon: 'Gift',
  },
  refund: {
    id: 'refund',
    name: 'Cashback & Refunds',
    color: '#14B8A6', // Cyan/Teal
    bgLight: '#F0FDFA',
    bgDark: 'rgba(20, 184, 166, 0.15)',
    textLight: '#0F766E',
    textDark: '#5EEAD4',
    icon: 'RotateCcw',
  },
  other_income: {
    id: 'other_income',
    name: 'Other Income',
    color: '#64748B', // Slate
    bgLight: '#F8FAFC',
    bgDark: 'rgba(100, 116, 139, 0.15)',
    textLight: '#475569',
    textDark: '#CBD5E1',
    icon: 'PlusCircle',
  },
};

export const INCOME_CATEGORY_LIST = Object.values(INCOME_CATEGORIES);

// Rupee (₹) and global presets
export const PRESET_EXPENSES = [
  { title: 'Chai & Snacks', amount: 30, category: 'food' as CategoryId },
  { title: 'Lunch / Thali', amount: 150, category: 'food' as CategoryId },
  { title: 'Groceries', amount: 750, category: 'shopping' as CategoryId },
  { title: 'Metro / Auto', amount: 80, category: 'transport' as CategoryId },
  { title: 'Mobile / WiFi', amount: 399, category: 'utilities' as CategoryId },
];

export const PRESET_INCOMES = [
  { title: 'Monthly Salary', amount: 45000, category: 'salary' as IncomeCategoryId },
  { title: 'Freelance Payout', amount: 12000, category: 'freelance' as IncomeCategoryId },
  { title: 'Side Gig / Project', amount: 2500, category: 'side_hustle' as IncomeCategoryId },
  { title: 'Mutual Fund / Dividend', amount: 1200, category: 'investment' as IncomeCategoryId },
  { title: 'UPI Gift / Received', amount: 500, category: 'gift_bonus' as IncomeCategoryId },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  digital: 'UPI / Digital Wallet (GPay, PhonePe, Paytm)',
  card: 'Debit / Credit Card',
  cash: 'Physical Cash',
  bank_transfer: 'Bank Transfer (IMPS / NEFT / NetBanking)',
  check: 'Cheque / Draft',
};

export const CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc' },
];
