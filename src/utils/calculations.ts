import {
  Expense,
  Income,
  CategoryId,
  IncomeCategoryId,
} from '../types/expense';
import { CATEGORIES, INCOME_CATEGORIES } from './categories';

export interface DailyStats {
  dateStr: string;
  // Expense stats
  expenseTotal: number;
  expenseCount: number;
  expenses: Expense[];
  maxExpense: Expense | null;
  categoryTotals: Record<CategoryId, number>;

  // Income stats
  incomeTotal: number;
  incomeCount: number;
  incomes: Income[];
  maxIncome: Income | null;
  incomeCategoryTotals: Record<IncomeCategoryId, number>;

  // Net flow (Income - Expense)
  netBalance: number;

  // Compatibility aliases
  total: number;
  count: number;
}

export interface DayBreakdownItem {
  date: string;
  dayShort: string;
  dayLong: string;
  expenseTotal: number;
  incomeTotal: number;
  netBalance: number;
  total: number; // alias for expenseTotal
  count: number;
  percentage: number;
}

export interface WeeklyStats {
  startStr: string;
  endStr: string;
  expenseTotal: number;
  expenseCount: number;
  incomeTotal: number;
  incomeCount: number;
  netTotal: number;
  savingsRate: number;
  dailyAverageExpense: number;
  dailyAverageIncome: number;
  dayBreakdown: DayBreakdownItem[];
  topCategory: { id: CategoryId; name: string; amount: number } | null;
  topIncomeCategory: { id: IncomeCategoryId; name: string; amount: number } | null;
  prevExpenseTotal: number;
  prevIncomeTotal: number;
  diffPercent: number;
  incomeDiffPercent: number;
  weekExpenses: Expense[];
  weekIncomes: Income[];

  // Compatibility aliases
  total: number;
  count: number;
  dailyAverage: number;
  prevTotal: number;
}

export interface MonthlyStats {
  yearMonthStr: string;
  monthName: string;
  daysInMonth: number;
  daysPassed: number;
  daysRemaining: number;
  expenseTotal: number;
  incomeTotal: number;
  netTotal: number;
  savingsRate: number;
  dailyAverageExpense: number;
  dailyAverageIncome: number;
  projectedExpenseTotal: number;
  projectedIncomeTotal: number;
  weeks: {
    label: string;
    start: number;
    end: number;
    expenseTotal: number;
    incomeTotal: number;
    netBalance: number;
    total: number;
    count: number;
  }[];
  categoryMap: Partial<Record<CategoryId, number>>;
  incomeCategoryMap: Partial<Record<IncomeCategoryId, number>>;
  prevMonthExpenseTotal: number;
  prevMonthIncomeTotal: number;
  monthOverMonthChange: number;
  monthOverMonthIncomeChange: number;

  // Compatibility aliases
  total: number;
  count: number;
  dailyAverage: number;
  projectedTotal: number;
  prevMonthTotal: number;
}

export interface MonthSummaryItem {
  monthIndex: number;
  yearMonthStr: string;
  monthShort: string;
  monthLong: string;
  expenseTotal: number;
  incomeTotal: number;
  netTotal: number;
  total: number; // alias to expenseTotal
  count: number;
  percentage: number;
}

export interface YearlyStats {
  year: number;
  expenseTotal: number;
  incomeTotal: number;
  netTotal: number;
  savingsRate: number;
  count: number;
  monthsElapsed: number;
  monthlyAverageExpense: number;
  monthlyAverageIncome: number;
  peakMonth: MonthSummaryItem | null;
  peakIncomeMonth: MonthSummaryItem | null;
  monthsData: MonthSummaryItem[];
  categoryBreakdown: {
    id: CategoryId;
    name: string;
    color: string;
    amount: number;
    percentage: number;
  }[];
  incomeCategoryBreakdown: {
    id: IncomeCategoryId;
    name: string;
    color: string;
    amount: number;
    percentage: number;
  }[];
  topExpenses: Expense[];
  topIncomes: Income[];

  // Compatibility aliases
  total: number;
  monthlyAverage: number;
}

export function formatAmount(val: number, currency: string = '₹'): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(val) || 0);

  if (val < 0) {
    return `-${currency}${formatted}`;
  }
  return `${currency}${formatted}`;
}

export function formatCompactAmount(val: number, currency: string = '₹'): string {
  const abs = Math.abs(val);
  const prefix = val < 0 ? '-' : '';
  if (abs >= 10_000_000) {
    return `${prefix}${currency}${(abs / 10_000_000).toFixed(2)} Cr`;
  }
  if (abs >= 100_000) {
    return `${prefix}${currency}${(abs / 100_000).toFixed(1)} L`;
  }
  if (abs >= 10_000) {
    return `${prefix}${currency}${(abs / 1_000).toFixed(1)}k`;
  }
  return formatAmount(val, currency);
}

// Convert Date object to 'YYYY-MM-DD' local string
export function toDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get day of week name (Mon, Tue, etc.)
export function getDayName(dateStr: string, format: 'short' | 'long' = 'short'): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: format });
}

// Get Month name (Jan, Feb or January, etc.)
export function getMonthName(monthIndex: number, format: 'short' | 'long' = 'short'): string {
  const date = new Date(2026, monthIndex, 1);
  return date.toLocaleDateString('en-US', { month: format });
}

// Given a date string YYYY-MM-DD, get Monday and Sunday of that week
export function getWeekBoundaries(dateStr: string): { startStr: string; endStr: string; dates: string[] } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    dates.push(toDateString(nextDay));
  }

  return {
    startStr: dates[0],
    endStr: dates[6],
    dates,
  };
}

// Calculations for a specific single day (Expenses + Incomes)
export function calculateDailyStats(
  expenses: Expense[],
  incomes: Income[] = [],
  dateStr: string
): DailyStats {
  const dailyExpenses = expenses.filter((e) => e.date === dateStr);
  const dailyIncomes = incomes.filter((inc) => inc.date === dateStr);

  const expenseTotal = dailyExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const incomeTotal = dailyIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = incomeTotal - expenseTotal;

  // Find peak single expense
  let maxExpense: Expense | null = null;
  dailyExpenses.forEach((e) => {
    if (!maxExpense || e.amount > maxExpense.amount) {
      maxExpense = e;
    }
  });

  // Find peak single income
  let maxIncome: Income | null = null;
  dailyIncomes.forEach((inc) => {
    if (!maxIncome || inc.amount > maxIncome.amount) {
      maxIncome = inc;
    }
  });

  // Expense categories
  const categoryTotals: Record<CategoryId, number> = {
    food: 0,
    transport: 0,
    housing: 0,
    utilities: 0,
    shopping: 0,
    entertainment: 0,
    health: 0,
    education: 0,
    other: 0,
  };
  dailyExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  // Income categories
  const incomeCategoryTotals: Record<IncomeCategoryId, number> = {
    salary: 0,
    freelance: 0,
    business: 0,
    investment: 0,
    side_hustle: 0,
    gift_bonus: 0,
    refund: 0,
    other_income: 0,
  };
  dailyIncomes.forEach((inc) => {
    incomeCategoryTotals[inc.category] = (incomeCategoryTotals[inc.category] || 0) + inc.amount;
  });

  return {
    dateStr,
    expenseTotal,
    expenseCount: dailyExpenses.length,
    expenses: [...dailyExpenses].sort((a, b) => b.createdAt - a.createdAt),
    maxExpense,
    categoryTotals,

    incomeTotal,
    incomeCount: dailyIncomes.length,
    incomes: [...dailyIncomes].sort((a, b) => b.createdAt - a.createdAt),
    maxIncome,
    incomeCategoryTotals,

    netBalance,

    total: expenseTotal,
    count: dailyExpenses.length,
  };
}

// Calculations for a specific week containing refDateStr
export function calculateWeeklyStats(
  expenses: Expense[],
  incomes: Income[] = [],
  refDateStr: string
): WeeklyStats {
  const { startStr, endStr, dates } = getWeekBoundaries(refDateStr);

  const weekExpenses = expenses.filter((e) => e.date >= startStr && e.date <= endStr);
  const weekIncomes = incomes.filter((inc) => inc.date >= startStr && inc.date <= endStr);

  const expenseTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
  const incomeTotal = weekIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const netTotal = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0;

  const dailyAverageExpense = expenseTotal / 7;
  const dailyAverageIncome = incomeTotal / 7;

  // Day-by-day distribution
  const dayBreakdown: DayBreakdownItem[] = dates.map((dStr) => {
    const dayExp = weekExpenses.filter((e) => e.date === dStr);
    const dayInc = weekIncomes.filter((inc) => inc.date === dStr);
    const expTotal = dayExp.reduce((s, e) => s + e.amount, 0);
    const incTotal = dayInc.reduce((s, inc) => s + inc.amount, 0);

    return {
      date: dStr,
      dayShort: getDayName(dStr, 'short'),
      dayLong: getDayName(dStr, 'long'),
      expenseTotal: expTotal,
      incomeTotal: incTotal,
      netBalance: incTotal - expTotal,
      total: expTotal,
      count: dayExp.length + dayInc.length,
      percentage: expenseTotal > 0 ? (expTotal / expenseTotal) * 100 : 0,
    };
  });

  // Top expense category
  const expenseCatMap: Partial<Record<CategoryId, number>> = {};
  weekExpenses.forEach((e) => {
    expenseCatMap[e.category] = (expenseCatMap[e.category] || 0) + e.amount;
  });
  let topCategory: { id: CategoryId; name: string; amount: number } | null = null;
  Object.entries(expenseCatMap).forEach(([catId, amt]) => {
    const amountVal = amt || 0;
    if (amountVal > 0 && (!topCategory || amountVal > topCategory.amount)) {
      topCategory = {
        id: catId as CategoryId,
        name: CATEGORIES[catId as CategoryId]?.name || catId,
        amount: amountVal,
      };
    }
  });

  // Top income category
  const incomeCatMap: Partial<Record<IncomeCategoryId, number>> = {};
  weekIncomes.forEach((inc) => {
    incomeCatMap[inc.category] = (incomeCatMap[inc.category] || 0) + inc.amount;
  });
  let topIncomeCategory: { id: IncomeCategoryId; name: string; amount: number } | null = null;
  Object.entries(incomeCatMap).forEach(([catId, amt]) => {
    const amountVal = amt || 0;
    if (amountVal > 0 && (!topIncomeCategory || amountVal > topIncomeCategory.amount)) {
      topIncomeCategory = {
        id: catId as IncomeCategoryId,
        name: INCOME_CATEGORIES[catId as IncomeCategoryId]?.name || catId,
        amount: amountVal,
      };
    }
  });

  // Previous week comparison
  const [y, m, d] = refDateStr.split('-').map(Number);
  const prevWeekRef = new Date(y, m - 1, d - 7);
  const prevBoundaries = getWeekBoundaries(toDateString(prevWeekRef));

  const prevExpenses = expenses.filter(
    (e) => e.date >= prevBoundaries.startStr && e.date <= prevBoundaries.endStr
  );
  const prevIncomes = incomes.filter(
    (inc) => inc.date >= prevBoundaries.startStr && inc.date <= prevBoundaries.endStr
  );

  const prevExpenseTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
  const prevIncomeTotal = prevIncomes.reduce((s, inc) => s + inc.amount, 0);

  const diffPercent = prevExpenseTotal > 0 ? ((expenseTotal - prevExpenseTotal) / prevExpenseTotal) * 100 : 0;
  const incomeDiffPercent = prevIncomeTotal > 0 ? ((incomeTotal - prevIncomeTotal) / prevIncomeTotal) * 100 : 0;

  return {
    startStr,
    endStr,
    expenseTotal,
    expenseCount: weekExpenses.length,
    incomeTotal,
    incomeCount: weekIncomes.length,
    netTotal,
    savingsRate,
    dailyAverageExpense,
    dailyAverageIncome,
    dayBreakdown,
    topCategory,
    topIncomeCategory,
    prevExpenseTotal,
    prevIncomeTotal,
    diffPercent,
    incomeDiffPercent,
    weekExpenses,
    weekIncomes,

    // Aliases
    total: expenseTotal,
    count: weekExpenses.length,
    dailyAverage: dailyAverageExpense,
    prevTotal: prevExpenseTotal,
  };
}

// Calculations for a specific month ('YYYY-MM')
export function calculateMonthlyStats(
  expenses: Expense[],
  incomes: Income[] = [],
  yearMonthStr: string
): MonthlyStats {
  const [yearStr, monthStr] = yearMonthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthExpenses = expenses.filter((e) => e.date.startsWith(yearMonthStr));
  const monthIncomes = incomes.filter((inc) => inc.date.startsWith(yearMonthStr));

  const expenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const incomeTotal = monthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const netTotal = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0;

  const todayStr = toDateString();
  const isCurrentMonth = todayStr.startsWith(yearMonthStr);
  const todayDateNumber = parseInt(todayStr.split('-')[2], 10);
  const daysPassed = isCurrentMonth ? Math.min(todayDateNumber, daysInMonth) : daysInMonth;
  const daysRemaining = Math.max(0, daysInMonth - daysPassed);

  const dailyAverageExpense = daysPassed > 0 ? expenseTotal / daysPassed : 0;
  const dailyAverageIncome = daysPassed > 0 ? incomeTotal / daysPassed : 0;

  const projectedExpenseTotal = dailyAverageExpense * daysInMonth;
  const projectedIncomeTotal = dailyAverageIncome * daysInMonth;

  // Breakdown by 5 week intervals
  const weeks = [
    { label: 'Week 1 (1–7)', start: 1, end: 7, expenseTotal: 0, incomeTotal: 0, netBalance: 0, total: 0, count: 0 },
    { label: 'Week 2 (8–14)', start: 8, end: 14, expenseTotal: 0, incomeTotal: 0, netBalance: 0, total: 0, count: 0 },
    { label: 'Week 3 (15–21)', start: 15, end: 21, expenseTotal: 0, incomeTotal: 0, netBalance: 0, total: 0, count: 0 },
    { label: 'Week 4 (22–28)', start: 22, end: 28, expenseTotal: 0, incomeTotal: 0, netBalance: 0, total: 0, count: 0 },
    { label: `Week 5 (29–${daysInMonth})`, start: 29, end: daysInMonth, expenseTotal: 0, incomeTotal: 0, netBalance: 0, total: 0, count: 0 },
  ];

  monthExpenses.forEach((e) => {
    const dayNum = parseInt(e.date.split('-')[2], 10);
    const targetWeek = weeks.find((w) => dayNum >= w.start && dayNum <= w.end);
    if (targetWeek) {
      targetWeek.expenseTotal += e.amount;
      targetWeek.total += e.amount;
      targetWeek.count += 1;
    }
  });

  monthIncomes.forEach((inc) => {
    const dayNum = parseInt(inc.date.split('-')[2], 10);
    const targetWeek = weeks.find((w) => dayNum >= w.start && dayNum <= w.end);
    if (targetWeek) {
      targetWeek.incomeTotal += inc.amount;
      targetWeek.count += 1;
    }
  });

  weeks.forEach((w) => {
    w.netBalance = w.incomeTotal - w.expenseTotal;
  });

  // Expense categories
  const categoryMap: Partial<Record<CategoryId, number>> = {};
  monthExpenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  // Income categories
  const incomeCategoryMap: Partial<Record<IncomeCategoryId, number>> = {};
  monthIncomes.forEach((inc) => {
    incomeCategoryMap[inc.category] = (incomeCategoryMap[inc.category] || 0) + inc.amount;
  });

  // Previous month calculation
  const prevMonthDate = new Date(year, month - 2, 1);
  const prevYearMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthExpenses = expenses.filter((e) => e.date.startsWith(prevYearMonthStr));
  const prevMonthIncomes = incomes.filter((inc) => inc.date.startsWith(prevYearMonthStr));

  const prevMonthExpenseTotal = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const prevMonthIncomeTotal = prevMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0);

  const monthOverMonthChange = prevMonthExpenseTotal > 0 ? ((expenseTotal - prevMonthExpenseTotal) / prevMonthExpenseTotal) * 100 : 0;
  const monthOverMonthIncomeChange = prevMonthIncomeTotal > 0 ? ((incomeTotal - prevMonthIncomeTotal) / prevMonthIncomeTotal) * 100 : 0;

  return {
    yearMonthStr,
    monthName: getMonthName(month - 1, 'long'),
    daysInMonth,
    daysPassed,
    daysRemaining,
    expenseTotal,
    incomeTotal,
    netTotal,
    savingsRate,
    dailyAverageExpense,
    dailyAverageIncome,
    projectedExpenseTotal,
    projectedIncomeTotal,
    weeks,
    categoryMap,
    incomeCategoryMap,
    prevMonthExpenseTotal,
    prevMonthIncomeTotal,
    monthOverMonthChange,
    monthOverMonthIncomeChange,

    // Aliases
    total: expenseTotal,
    count: monthExpenses.length,
    dailyAverage: dailyAverageExpense,
    projectedTotal: projectedExpenseTotal,
    prevMonthTotal: prevMonthExpenseTotal,
  };
}

// Calculations for a specific year
export function calculateYearlyStats(
  expenses: Expense[],
  incomes: Income[] = [],
  year: number
): YearlyStats {
  const yearPrefix = `${year}-`;
  const yearExpenses = expenses.filter((e) => e.date.startsWith(yearPrefix));
  const yearIncomes = incomes.filter((inc) => inc.date.startsWith(yearPrefix));

  const expenseTotal = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
  const incomeTotal = yearIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const netTotal = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0;

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const monthsElapsed = year === currentYear ? currentMonthIndex + 1 : 12;

  const monthlyAverageExpense = monthsElapsed > 0 ? expenseTotal / monthsElapsed : 0;
  const monthlyAverageIncome = monthsElapsed > 0 ? incomeTotal / monthsElapsed : 0;

  // 12 months data
  const monthsData: MonthSummaryItem[] = Array.from({ length: 12 }, (_, i) => {
    const mStr = `${year}-${String(i + 1).padStart(2, '0')}`;
    const mExpenses = yearExpenses.filter((e) => e.date.startsWith(mStr));
    const mIncomes = yearIncomes.filter((inc) => inc.date.startsWith(mStr));

    const mExpTotal = mExpenses.reduce((sum, e) => sum + e.amount, 0);
    const mIncTotal = mIncomes.reduce((sum, inc) => sum + inc.amount, 0);

    return {
      monthIndex: i,
      yearMonthStr: mStr,
      monthShort: getMonthName(i, 'short'),
      monthLong: getMonthName(i, 'long'),
      expenseTotal: mExpTotal,
      incomeTotal: mIncTotal,
      netTotal: mIncTotal - mExpTotal,
      total: mExpTotal,
      count: mExpenses.length + mIncomes.length,
      percentage: expenseTotal > 0 ? (mExpTotal / expenseTotal) * 100 : 0,
    };
  });

  // Peak expense month
  let peakMonth: MonthSummaryItem | null = null;
  monthsData.forEach((m) => {
    if (m.expenseTotal > 0 && (!peakMonth || m.expenseTotal > peakMonth.expenseTotal)) {
      peakMonth = m;
    }
  });

  // Peak income month
  let peakIncomeMonth: MonthSummaryItem | null = null;
  monthsData.forEach((m) => {
    if (m.incomeTotal > 0 && (!peakIncomeMonth || m.incomeTotal > peakIncomeMonth.incomeTotal)) {
      peakIncomeMonth = m;
    }
  });

  // Expense Category breakdown
  const expCatMap: Partial<Record<CategoryId, number>> = {};
  yearExpenses.forEach((e) => {
    expCatMap[e.category] = (expCatMap[e.category] || 0) + e.amount;
  });
  const categoryBreakdown = Object.entries(CATEGORIES).map(([id, info]) => {
    const amt = expCatMap[id as CategoryId] || 0;
    return {
      id: id as CategoryId,
      name: info.name,
      color: info.color,
      amount: amt,
      percentage: expenseTotal > 0 ? (amt / expenseTotal) * 100 : 0,
    };
  }).sort((a, b) => b.amount - a.amount);

  // Income Category breakdown
  const incCatMap: Partial<Record<IncomeCategoryId, number>> = {};
  yearIncomes.forEach((inc) => {
    incCatMap[inc.category] = (incCatMap[inc.category] || 0) + inc.amount;
  });
  const incomeCategoryBreakdown = Object.entries(INCOME_CATEGORIES).map(([id, info]) => {
    const amt = incCatMap[id as IncomeCategoryId] || 0;
    return {
      id: id as IncomeCategoryId,
      name: info.name,
      color: info.color,
      amount: amt,
      percentage: incomeTotal > 0 ? (amt / incomeTotal) * 100 : 0,
    };
  }).sort((a, b) => b.amount - a.amount);

  // Top single expenses
  const topExpenses = [...yearExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Top single incomes
  const topIncomes = [...yearIncomes]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    year,
    expenseTotal,
    incomeTotal,
    netTotal,
    savingsRate,
    count: yearExpenses.length + yearIncomes.length,
    monthsElapsed,
    monthlyAverageExpense,
    monthlyAverageIncome,
    peakMonth,
    peakIncomeMonth,
    monthsData,
    categoryBreakdown,
    incomeCategoryBreakdown,
    topExpenses,
    topIncomes,

    // Aliases
    total: expenseTotal,
    monthlyAverage: monthlyAverageExpense,
  };
}
