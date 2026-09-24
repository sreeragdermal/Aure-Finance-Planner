import { Expense, Income } from '../types/expense';

/**
 * Clean slate for personal use: starts with 0 temporary mock records
 */
export function getInitialSampleExpenses(): Expense[] {
  return [];
}

export function getInitialSampleIncomes(): Income[] {
  return [];
}

/**
 * Optional demo data if user explicitly wants to preview charts in settings
 */
export function getDemoSampleData(): { expenses: Expense[]; incomes: Income[] } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  const getRelativeDate = (offsetDays: number): string => {
    const d = new Date(year, month, date + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const expenses: Expense[] = [
    {
      id: 'demo-exp-1',
      title: 'Espresso & Pastry',
      amount: 6.5,
      category: 'food',
      date: getRelativeDate(0),
      time: '08:30',
      paymentMethod: 'card',
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'demo-exp-2',
      title: 'Groceries & Produce',
      amount: 48.2,
      category: 'food',
      date: getRelativeDate(0),
      time: '13:15',
      paymentMethod: 'card',
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'demo-exp-3',
      title: 'Transit Pass',
      amount: 22.0,
      category: 'transport',
      date: getRelativeDate(-1),
      time: '09:00',
      paymentMethod: 'digital',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'demo-exp-4',
      title: 'Internet & Fiber Bill',
      amount: 65.0,
      category: 'utilities',
      date: getRelativeDate(-3),
      time: '11:00',
      paymentMethod: 'bank_transfer',
      createdAt: Date.now() - 259200000,
    },
  ];

  const incomes: Income[] = [
    {
      id: 'demo-inc-1',
      title: 'Monthly Salary Deposit',
      amount: 3200.0,
      category: 'salary',
      date: getRelativeDate(-2),
      time: '09:00',
      paymentMethod: 'bank_transfer',
      notes: 'Direct deposit',
      createdAt: Date.now() - 172800000,
    },
    {
      id: 'demo-inc-2',
      title: 'Freelance Design Project',
      amount: 450.0,
      category: 'freelance',
      date: getRelativeDate(0),
      time: '15:30',
      paymentMethod: 'digital',
      notes: 'Website UI deliverables',
      createdAt: Date.now() - 1800000,
    },
  ];

  return { expenses, incomes };
}
