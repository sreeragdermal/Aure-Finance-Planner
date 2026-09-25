import React, { useState, useMemo } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useGoogleDrive } from '../../context/GoogleDriveContext';
import { useToast } from '../../context/ToastContext';
import {
  calculateDailyStats,
  calculateWeeklyStats,
  formatAmount,
  toDateString,
} from '../../utils/calculations';
import {
  CATEGORIES,
  INCOME_CATEGORIES,
  PRESET_EXPENSES,
  PRESET_INCOMES,
} from '../../utils/categories';
import { playIncomeSuccessSound, playExpenseSuccessSound } from '../../utils/soundEffects';
import {
  CategoryId,
  IncomeCategoryId,
  Expense,
  Income,
} from '../../types/expense';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet,
  Tag,
  Clock,
  Trash2,
  Check,
  X,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const DashboardView: React.FC = () => {
  const {
    expenses,
    incomes,
    addExpense,
    deleteExpense,
    addIncome,
    budget,
    updateBudget,
    categories,
    categoryList,
    selectedDate,
    setSelectedDate,
    setActiveTab,
    cloudUser,
  } = useExpenses();

  const { user } = useGoogleDrive();
  const { showToast } = useToast();

  const userName = user?.displayName?.split(' ')[0] || cloudUser?.displayName?.split(' ')[0] || 'Sreerag';

  // Quick form state
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('food');
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategoryId>('salary');

  // Daily Ledger filter state
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState('all');
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(budget.daily.toString());

  // Confirm delete dialog state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Format selected date nicely (e.g., Friday, 25 September 2026)
  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  // Format short date for navigation button (e.g., 25 Sep 2026)
  const shortDateDisplay = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [selectedDate]);

  // Daily statistics for selected date
  const dailyStats = useMemo(() => {
    return calculateDailyStats(expenses, incomes, selectedDate);
  }, [expenses, incomes, selectedDate]);

  // Weekly stats for right column
  const weeklyStats = useMemo(() => {
    return calculateWeeklyStats(expenses, incomes, selectedDate);
  }, [expenses, incomes, selectedDate]);

  // Calculations for daily headroom and budget percent
  const dailyBudget = budget.daily > 0 ? budget.daily : 500;
  const budgetHeadroom = dailyBudget - dailyStats.expenseTotal;
  const budgetPercentUsed = Math.min((dailyStats.expenseTotal / dailyBudget) * 100, 100);

  // Weekly budget headroom
  const weeklyBudget = budget.weekly || 3500;
  const weeklySpent = weeklyStats.expenseTotal;
  const weeklyRemaining = Math.max(0, weeklyBudget - weeklySpent);
  const weeklyPercentUsed = Math.min(Math.round((weeklySpent / weeklyBudget) * 100), 100);

  // Date Navigation handlers
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setSelectedDate(toDateString(prev));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    setSelectedDate(toDateString(next));
  };

  const handleToday = () => {
    setSelectedDate(toDateString());
  };

  // Submit Quick Add Form
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    const cleanTitle =
      title.trim() ||
      (txType === 'expense'
        ? categories[category]?.name || CATEGORIES[category]?.name || 'Expense'
        : INCOME_CATEGORIES[incomeCategory]?.name || 'Income');

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (txType === 'expense') {
      addExpense({
        title: cleanTitle,
        amount: Math.round(val * 100) / 100,
        category,
        date: selectedDate,
        time: timeStr,
        paymentMethod: 'digital',
      });
      playExpenseSuccessSound();
      showToast(`Added expense of ${formatAmount(val, budget.currency)}`);
    } else {
      addIncome({
        title: cleanTitle,
        amount: Math.round(val * 100) / 100,
        category: incomeCategory,
        date: selectedDate,
        time: timeStr,
        paymentMethod: 'digital',
      });
      playIncomeSuccessSound();
      showToast(`Added income of ${formatAmount(val, budget.currency)}`);
    }

    setAmount('');
    setTitle('');
  };

  // Quick Action pill click handler (instant log)
  const handlePresetExpenseClick = (preset: typeof PRESET_EXPENSES[0]) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    addExpense({
      title: preset.title,
      amount: preset.amount,
      category: preset.category,
      date: selectedDate,
      time: timeStr,
      paymentMethod: 'digital',
    });
    playExpenseSuccessSound();
    showToast(`Logged ${preset.title} (${formatAmount(preset.amount, budget.currency)})`);
  };

  const handlePresetIncomeClick = (preset: typeof PRESET_INCOMES[0]) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    addIncome({
      title: preset.title,
      amount: preset.amount,
      category: preset.category,
      date: selectedDate,
      time: timeStr,
      paymentMethod: 'digital',
    });
    playIncomeSuccessSound();
    showToast(`Logged ${preset.title} (${formatAmount(preset.amount, budget.currency)})`);
  };

  // Save updated daily budget limit
  const handleSaveLimit = () => {
    const val = parseFloat(limitInput);
    if (!isNaN(val) && val > 0) {
      updateBudget({ daily: Math.round(val) });
      setEditingLimit(false);
      showToast('Daily budget limit updated');
    }
  };

  // Filtered today's transactions for the ledger preview
  const dayExpenses = useMemo(() => {
    return expenses.filter((e) => e.date === selectedDate);
  }, [expenses, selectedDate]);

  const filteredDayExpenses = useMemo(() => {
    return dayExpenses.filter((e) => {
      const matchCat = ledgerCategoryFilter === 'all' || e.category === ledgerCategoryFilter;
      const matchSearch =
        !ledgerSearch.trim() ||
        e.title.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        CATEGORIES[e.category]?.name.toLowerCase().includes(ledgerSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [dayExpenses, ledgerCategoryFilter, ledgerSearch]);

  // Today's category spending for the mini chart
  const todayCategoryBreakdown = useMemo(() => {
    const catMap: Record<string, number> = {};
    dayExpenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    return Object.entries(catMap)
      .map(([catId, amt]) => ({
        id: catId,
        info: categories[catId] || CATEGORIES[catId as CategoryId] || { name: catId, color: '#64748B' },
        amount: amt,
        percentage: total > 0 ? (amt / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [dayExpenses, categories]);

  // Dynamic budget insight message (calm language, responsive to weekly status)
  const budgetInsight = useMemo(() => {
    const spent = weeklyStats.expenseTotal;
    const diff = weeklyBudget - spent;
    const pct = Math.round((spent / weeklyBudget) * 100);

    if (diff < 0) {
      return {
        title: 'Budget Alert',
        message: 'Your spending is above this week’s budget.',
        isAlert: true,
      };
    }
    if (diff <= 350) {
      return {
        title: 'Stay on Track',
        message: `${formatAmount(diff, budget.currency)} remaining in your weekly budget.`,
        isAlert: false,
      };
    }
    if (pct >= 60) {
      return {
        title: 'Stay on Track',
        message: `You’ve used ${pct}% of your weekly budget.`,
        isAlert: false,
      };
    }
    return {
      title: 'Stay on Track',
      message: `You’re within your weekly budget with ${formatAmount(diff, budget.currency)} remaining.`,
      isAlert: false,
    };
  }, [weeklyStats.expenseTotal, weeklyBudget, budget.currency]);

  // 7-day cash flow bar chart calculations
  const weeklyDays = weeklyStats.dayBreakdown;
  const hasWeeklyActivity = weeklyStats.expenseTotal > 0 || weeklyStats.incomeTotal > 0;
  const maxDayValue = Math.max(
    ...weeklyDays.map((d) => Math.max(d.expenseTotal, d.incomeTotal)),
    50
  );

  return (
    <div className="space-y-4 sm:space-y-4.5 max-w-full overflow-hidden">
      {/* 1. Hero Section & Date Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white dark:bg-[#161922] p-4 sm:p-5 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-[#F3F4F6]">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-0.5">
            Here&apos;s your financial overview for{' '}
            <span className="font-semibold text-[#111827] dark:text-white">
              {formattedSelectedDate}
            </span>
          </p>
        </div>

        {/* Polished Date Navigator: < Today > 25 Sep 2026 */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-[#FAFAF8] dark:bg-[#0E1015]/60 p-1 rounded-xl border border-[#E7E7E3] dark:border-[#262B35]">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Jump to Today"
          >
            Today
          </button>
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-[#E7E7E3] dark:bg-[#262B35] mx-1" />
          <label className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#111827] dark:text-[#F3F4F6] cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <Calendar className="w-3.5 h-3.5 text-[#6D5DFB]" />
            <span className="font-mono">{shortDateDisplay}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* 2. Four Financial Summary Cards (1 col mobile, 2x2 tablet 768-1199px, 4 cols desktop >= 1200px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Daily Income (Mint theme) */}
        <div className="w-full min-w-0 bg-white dark:bg-[#161922] p-4 sm:p-4.5 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
              Daily Income
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E9FBF3] text-[#00B86B] dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-[28px] leading-tight font-bold font-mono tabular-nums text-[#111827] dark:text-[#F3F4F6] tracking-tight">
            {formatAmount(dailyStats.incomeTotal, budget.currency)}
          </p>
          <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00B86B]" />
            {dailyStats.incomeCount} deposit{dailyStats.incomeCount === 1 ? '' : 's'} logged
          </p>
        </div>

        {/* Daily Expense (Pink theme) */}
        <div className="w-full min-w-0 bg-white dark:bg-[#161922] p-4 sm:p-4.5 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
              Daily Expense
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FFF0F4] text-[#F43F6E] dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-[28px] leading-tight font-bold font-mono tabular-nums text-[#111827] dark:text-[#F3F4F6] tracking-tight">
            {formatAmount(dailyStats.expenseTotal, budget.currency)}
          </p>
          <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F43F6E]" />
            {dailyStats.expenseCount} item{dailyStats.expenseCount === 1 ? '' : 's'} logged
          </p>
        </div>

        {/* Net Cash Flow (Purple/Neutral theme) */}
        <div className="w-full min-w-0 bg-white dark:bg-[#161922] p-4 sm:p-4.5 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
              Net Cash Flow
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                dailyStats.netBalance > 0
                  ? 'bg-[#E9FBF3] text-[#00B86B] dark:bg-emerald-950/40 dark:text-emerald-400'
                  : dailyStats.netBalance < 0
                  ? 'bg-[#FFF0F4] text-[#F43F6E] dark:bg-rose-950/40 dark:text-rose-400'
                  : 'bg-[#F1EFFF] text-[#6D5DFB] dark:bg-indigo-950/40 dark:text-indigo-400'
              }`}
            >
              {dailyStats.netBalance > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : dailyStats.netBalance < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
            </div>
          </div>
          <p
            className={`text-2xl sm:text-[28px] leading-tight font-bold font-mono tabular-nums tracking-tight ${
              dailyStats.netBalance > 0
                ? 'text-[#00B86B]'
                : dailyStats.netBalance < 0
                ? 'text-[#F43F6E]'
                : 'text-[#111827] dark:text-[#F3F4F6]'
            }`}
          >
            {dailyStats.netBalance > 0 ? '+' : ''}
            {formatAmount(dailyStats.netBalance, budget.currency)}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-[#667085] dark:text-[#9CA3AF]">
              {dailyStats.netBalance > 0
                ? 'Surplus'
                : dailyStats.netBalance < 0
                ? 'Deficit'
                : 'Balanced'}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                dailyStats.netBalance > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : dailyStats.netBalance < 0
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {dailyStats.netBalance > 0 ? 'Surplus' : dailyStats.netBalance < 0 ? 'Deficit' : 'Balanced'}
            </span>
          </div>
        </div>

        {/* Daily Headroom (Teal/Green theme with dynamic indicator) */}
        <div className="w-full min-w-0 bg-white dark:bg-[#161922] p-4 sm:p-4.5 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
              Daily Headroom
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                budgetHeadroom >= 0
                  ? 'bg-[#F0FDFA] text-[#0D9488] dark:bg-teal-950/40 dark:text-teal-400'
                  : 'bg-[#FFF0F4] text-[#F43F6E] dark:bg-rose-950/40 dark:text-rose-400'
              }`}
            >
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl sm:text-[28px] leading-tight font-bold font-mono tabular-nums tracking-tight ${
              budgetHeadroom >= 0 ? 'text-[#111827] dark:text-[#F3F4F6]' : 'text-[#F43F6E]'
            }`}
          >
            {formatAmount(budgetHeadroom, budget.currency)}
          </p>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#667085] dark:text-[#9CA3AF]">
              <span>of {formatAmount(dailyBudget, budget.currency)} limit</span>
              <span className="font-semibold font-mono">{Math.round(budgetPercentUsed)}% used</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  budgetHeadroom < 0
                    ? 'bg-[#F43F6E]'
                    : budgetPercentUsed > 80
                    ? 'bg-amber-400'
                    : 'bg-[#00B86B]'
                }`}
                style={{ width: `${Math.min(budgetPercentUsed, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Layout (Single Column on Mobile & Tablet < 1200px, 2-Column on Desktop >= 1200px) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column (Full width on Tablet/Mobile, 8 cols ~ 70% on Desktop >= 1200px) */}
        <div className="w-full min-w-0 xl:col-span-8 space-y-4 sm:space-y-4.5">
          {/* Record Transaction Section (Primary Action) */}
          <div className="bg-white dark:bg-[#161922] p-4 sm:p-5 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">
                  Record Transaction
                </span>
                <span className="text-[11px] text-[#98A2B3] dark:text-[#6B7280]">
                  ({shortDateDisplay})
                </span>
              </div>

              {/* Type Switcher */}
              <div className="flex items-center gap-1 p-0.5 bg-[#FAFAF8] dark:bg-[#0E1015]/60 rounded-xl border border-[#E7E7E3] dark:border-[#262B35] shrink-0">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    txType === 'expense'
                      ? 'bg-white dark:bg-neutral-800 text-[#F43F6E] shadow-2xs'
                      : 'text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827]'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    txType === 'income'
                      ? 'bg-white dark:bg-neutral-800 text-[#00B86B] shadow-2xs'
                      : 'text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827]'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            {/* Quick Add Form (Responsive 2x2 on Tablet, Single row on Desktop >= 1200px, Never clips Add button) */}
            <form onSubmit={handleQuickAdd} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-2.5">
                {/* Amount input */}
                <div className="relative w-full min-w-0 sm:col-span-1 xl:col-span-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-mono font-semibold text-[#98A2B3]">
                    {budget.currency}
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/40 text-xs sm:text-sm font-mono font-semibold text-[#111827] dark:text-white placeholder-[#98A2B3] focus:outline-hidden focus:ring-1 focus:ring-[#111111] dark:focus:ring-white transition-all min-w-0"
                    required
                  />
                </div>

                {/* Description */}
                <div className="w-full min-w-0 sm:col-span-1 xl:col-span-4">
                  <input
                    type="text"
                    placeholder={
                      txType === 'expense'
                        ? 'What did you spend on? e.g. Lunch, Coffee, Fuel'
                        : 'Source e.g. Freelance payout, Salary'
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/40 text-xs sm:text-sm text-[#111827] dark:text-white placeholder-[#98A2B3] focus:outline-hidden focus:ring-1 focus:ring-[#111111] dark:focus:ring-white transition-all min-w-0"
                  />
                </div>

                {/* Category selector */}
                <div className="w-full min-w-0 sm:col-span-1 xl:col-span-3">
                  <select
                    value={txType === 'expense' ? category : incomeCategory}
                    onChange={(e) =>
                      txType === 'expense'
                        ? setCategory(e.target.value as CategoryId)
                        : setIncomeCategory(e.target.value as IncomeCategoryId)
                    }
                    className="w-full px-2.5 py-2 rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/40 text-xs font-medium text-[#111827] dark:text-white focus:outline-hidden cursor-pointer min-w-0"
                  >
                    {txType === 'expense'
                      ? categoryList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      : Object.values(INCOME_CATEGORIES).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Add button */}
                <div className="w-full min-w-0 sm:col-span-1 xl:col-span-2">
                  <button
                    type="submit"
                    className={`w-full py-2 px-4 rounded-xl text-xs font-semibold text-white shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 min-w-0 ${
                      txType === 'expense'
                        ? 'bg-[#F43F6E] hover:bg-rose-600'
                        : 'bg-[#00B86B] hover:bg-emerald-600'
                    }`}
                  >
                    Add {txType === 'expense' ? 'Expense' : 'Income'}
                  </button>
                </div>
              </div>

              {/* Functional Quick Action Presets (Chai, Lunch, Groceries, Metro, Mobile) */}
              <div className="pt-2 border-t border-[#E7E7E3]/60 dark:border-[#262B35]/60 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-[#667085] dark:text-[#9CA3AF] mr-0.5">
                  Quick Add:
                </span>
                {txType === 'expense'
                  ? PRESET_EXPENSES.map((preset) => (
                      <button
                        key={preset.title}
                        type="button"
                        onClick={() => handlePresetExpenseClick(preset)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#FAFAF8] dark:bg-[#0E1015]/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#111827] dark:text-[#F3F4F6] border border-[#E7E7E3] dark:border-[#262B35] transition-colors cursor-pointer"
                      >
                        {preset.title}{' '}
                        <span className="font-mono text-[#F43F6E]">
                          {budget.currency}{preset.amount}
                        </span>
                      </button>
                    ))
                  : PRESET_INCOMES.map((preset) => (
                      <button
                        key={preset.title}
                        type="button"
                        onClick={() => handlePresetIncomeClick(preset)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#FAFAF8] dark:bg-[#0E1015]/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#111827] dark:text-[#F3F4F6] border border-[#E7E7E3] dark:border-[#262B35] transition-colors cursor-pointer"
                      >
                        {preset.title}{' '}
                        <span className="font-mono text-[#00B86B]">
                          +{budget.currency}{preset.amount}
                        </span>
                      </button>
                    ))}
              </div>
            </form>
          </div>

          {/* Daily Expenses Ledger (Compact empty state, no excessive space) */}
          <div className="bg-white dark:bg-[#161922] rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs overflow-hidden transition-colors">
            {/* Ledger Header */}
            <div className="p-4 sm:px-5 sm:py-3.5 border-b border-[#E7E7E3] dark:border-[#262B35] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">
                    Daily Expenses Ledger
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#667085] dark:text-[#9CA3AF] font-medium font-mono">
                    {dayExpenses.length} entries
                  </span>
                </div>
                <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                  Transactions logged on {shortDateDisplay}
                </p>
              </div>

              {/* Right: Daily Limit indicator with edit option */}
              <div className="flex items-center gap-2 self-start sm:self-auto bg-[#FAFAF8] dark:bg-[#0E1015]/50 px-2.5 py-1 rounded-xl border border-[#E7E7E3] dark:border-[#262B35]">
                {editingLimit ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value)}
                      className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-white dark:bg-neutral-800 border rounded text-[#111827] dark:text-white"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveLimit}
                      className="p-1 text-[#00B86B] hover:text-emerald-700 cursor-pointer"
                      title="Save Limit"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingLimit(false)}
                      className="p-1 text-[#98A2B3] hover:text-neutral-700 cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider text-[#98A2B3] dark:text-[#6B7280] block leading-none">
                        Daily Limit
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#111827] dark:text-white">
                        {formatAmount(dailyBudget, budget.currency)}
                      </span>
                    </div>
                    <button
                      onClick={() => setEditingLimit(true)}
                      className="text-[11px] font-medium text-[#6D5DFB] hover:text-indigo-700 dark:hover:text-indigo-400 ml-1 transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="px-4 py-2 bg-[#FAFAF8] dark:bg-[#0E1015]/30 border-b border-[#E7E7E3] dark:border-[#262B35] flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Filter today's records..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-[#E7E7E3] dark:border-[#262B35] bg-white dark:bg-[#161922] text-xs text-[#111827] dark:text-white placeholder-[#98A2B3] focus:outline-hidden"
                />
                <Tag className="w-3.5 h-3.5 text-[#98A2B3] absolute left-2.5 top-2" />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={ledgerCategoryFilter}
                  onChange={(e) => setLedgerCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E7E7E3] dark:border-[#262B35] bg-white dark:bg-[#161922] text-xs text-[#667085] dark:text-[#9CA3AF] focus:outline-hidden w-full sm:w-auto cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categoryList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compact Transaction List or Compact Empty State */}
            <div className="divide-y divide-[#E7E7E3] dark:divide-[#262B35]">
              {filteredDayExpenses.length === 0 ? (
                /* Compact Empty State (Reduced vertical height substantially) */
                <div className="py-6 px-4 text-center">
                  <div className="w-8 h-8 rounded-xl bg-[#FAFAF8] dark:bg-neutral-800/80 border border-[#E7E7E3] dark:border-[#262B35] flex items-center justify-center mx-auto text-[#98A2B3] dark:text-[#6B7280] mb-2">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">
                    No expenses logged today
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                    Add your first expense above or tap a quick add preset.
                  </p>
                </div>
              ) : (
                filteredDayExpenses.map((tx) => {
                  const cat = categories[tx.category] || CATEGORIES[tx.category as CategoryId] || CATEGORIES.other;
                  return (
                    <div
                      key={tx.id}
                      className="p-3 sm:px-4 sm:py-3 flex items-center justify-between hover:bg-[#FAFAF8] dark:hover:bg-[#0E1015]/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: cat.bgLight, color: cat.color }}
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F3F4F6] truncate">
                            {tx.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#667085] dark:text-[#9CA3AF]">
                            <span className="font-medium text-[#111827] dark:text-neutral-300">
                              {cat.name}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-[#98A2B3]" />
                              {tx.time || 'Today'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 ml-3">
                        <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-[#F43F6E]">
                          -{formatAmount(tx.amount, budget.currency)}
                        </span>
                        <button
                          onClick={() => setDeleteConfirmId(tx.id)}
                          className="p-1 text-[#98A2B3] hover:text-[#F43F6E] dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Ledger Footer */}
            {filteredDayExpenses.length > 0 && (
              <div className="px-4 py-2.5 bg-[#FAFAF8] dark:bg-[#0E1015]/40 border-t border-[#E7E7E3] dark:border-[#262B35] flex items-center justify-between text-xs">
                <span className="text-[#667085] dark:text-[#9CA3AF] text-[11px]">
                  Showing {filteredDayExpenses.length} of {dayExpenses.length} expense{dayExpenses.length === 1 ? '' : 's'}
                </span>
                <button
                  onClick={() => setActiveTab('daily')}
                  className="font-semibold text-[#6D5DFB] hover:text-indigo-600 flex items-center gap-1 cursor-pointer text-xs"
                >
                  <span>Detailed Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Full width on Tablet/Mobile underneath, 4 cols ~ 30% on Desktop >= 1200px) */}
        <div className="w-full min-w-0 xl:col-span-4 space-y-4">
          {/* This Week Overview */}
          <div className="bg-white dark:bg-[#161922] p-4 sm:p-4.5 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs transition-colors space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">
                This Week Overview
              </h3>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#98A2B3] dark:text-[#6B7280]">
                Week Trajectory
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="p-2.5 rounded-xl bg-[#FAFAF8] dark:bg-[#0E1015]/40 border border-[#E7E7E3] dark:border-[#262B35]">
                <span className="text-[10px] text-[#667085] dark:text-[#9CA3AF] block mb-0.5">Total Income</span>
                <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-[#00B86B]">
                  +{formatAmount(weeklyStats.incomeTotal, budget.currency)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAFAF8] dark:bg-[#0E1015]/40 border border-[#E7E7E3] dark:border-[#262B35]">
                <span className="text-[10px] text-[#667085] dark:text-[#9CA3AF] block mb-0.5">Total Expense</span>
                <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-[#F43F6E]">
                  -{formatAmount(weeklyStats.expenseTotal, budget.currency)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-[#667085] dark:text-[#9CA3AF] block">Net Cash Surplus</span>
                <span
                  className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
                    weeklyStats.netTotal >= 0 ? 'text-[#00B86B]' : 'text-[#F43F6E]'
                  }`}
                >
                  {weeklyStats.netTotal >= 0 ? '+' : ''}
                  {formatAmount(weeklyStats.netTotal, budget.currency)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#667085] dark:text-[#9CA3AF] block">Weekly Budget</span>
                <span className="text-xs font-mono font-semibold text-[#111827] dark:text-white">
                  {formatAmount(weeklyBudget, budget.currency)}
                </span>
              </div>
            </div>

            {/* Subtle budget indicator */}
            <div className="pt-1 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#667085] dark:text-[#9CA3AF]">
                <span>{formatAmount(weeklySpent, budget.currency)} used</span>
                <span className="font-semibold">{formatAmount(weeklyRemaining, budget.currency)} remaining</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    weeklySpent > weeklyBudget
                      ? 'bg-[#F43F6E]'
                      : weeklyPercentUsed > 80
                      ? 'bg-amber-400'
                      : 'bg-[#00B86B]'
                  }`}
                  style={{ width: `${weeklyPercentUsed}%` }}
                />
              </div>
            </div>
          </div>

          {/* 7-Day Cash Flow Chart (Section 8: Minimal empty state when no data, real bars with today highlighted when data exists) */}
          <div className="bg-white dark:bg-[#161922] p-4 sm:p-4.5 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs transition-colors space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">
                7-Day Cash Flow
              </h3>
              {hasWeeklyActivity && (
                <div className="flex items-center gap-2.5 text-[10px]">
                  <span className="flex items-center gap-1 text-[#00B86B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00B86B]" />
                    Income
                  </span>
                  <span className="flex items-center gap-1 text-[#F43F6E]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F43F6E]" />
                    Expense
                  </span>
                </div>
              )}
            </div>

            {hasWeeklyActivity ? (
              /* Real Data Bars */
              <div className="pt-1">
                <div className="h-28 flex items-end justify-between gap-1.5 pb-1.5 border-b border-[#E7E7E3] dark:border-[#262B35]">
                  {weeklyDays.map((d) => {
                    const isCurrent = d.date === selectedDate;
                    const expHeight = maxDayValue > 0 ? (d.expenseTotal / maxDayValue) * 100 : 0;
                    const incHeight = maxDayValue > 0 ? (d.incomeTotal / maxDayValue) * 100 : 0;

                    return (
                      <div
                        key={d.date}
                        onClick={() => setSelectedDate(d.date)}
                        className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all p-0.5 rounded-lg ${
                          isCurrent ? 'bg-[#FAFAF8] dark:bg-[#0E1015]/60 ring-1 ring-[#00B86B]/40' : 'hover:bg-neutral-50'
                        }`}
                        title={`${d.dayLong} (${d.date}): Income ${formatAmount(d.incomeTotal, budget.currency)}, Expense ${formatAmount(d.expenseTotal, budget.currency)}`}
                      >
                        <div className="w-full flex items-end justify-center gap-0.5 h-20">
                          {/* Income Bar */}
                          <div
                            className="w-1.5 rounded-t-sm bg-[#00B86B] transition-all duration-300"
                            style={{ height: `${Math.max(incHeight, d.incomeTotal > 0 ? 8 : 2)}%` }}
                          />
                          {/* Expense Bar */}
                          <div
                            className="w-1.5 rounded-t-sm bg-[#F43F6E] transition-all duration-300"
                            style={{ height: `${Math.max(expHeight, d.expenseTotal > 0 ? 8 : 2)}%` }}
                          />
                        </div>
                        <span
                          className={`text-[9px] font-medium ${
                            isCurrent
                              ? 'text-[#00B86B] font-bold'
                              : 'text-[#667085] dark:text-[#9CA3AF]'
                          }`}
                        >
                          {d.dayShort}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Minimal Empty State with subtle weekday labels */
              <div className="pt-2 text-center space-y-2.5">
                <div className="py-2.5 px-3 bg-[#FAFAF8] dark:bg-[#0E1015]/40 rounded-xl border border-[#E7E7E3] dark:border-[#262B35]">
                  <p className="text-xs font-semibold text-[#111827] dark:text-[#F3F4F6]">
                    No cash-flow activity yet
                  </p>
                  <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                    Add income or expenses to see your weekly trend.
                  </p>
                </div>
                {/* Weekday labels subtly underneath */}
                <div className="flex items-center justify-between text-[10px] text-[#98A2B3] dark:text-[#6B7280] px-1 font-mono">
                  {weeklyDays.map((d) => (
                    <span
                      key={d.date}
                      className={d.date === selectedDate ? 'text-[#00B86B] font-bold underline' : ''}
                    >
                      {d.dayShort}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Today's Spending by Category */}
          <div className="bg-white dark:bg-[#161922] p-4 sm:p-4.5 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs transition-colors space-y-2.5">
            <h3 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">
              Today&apos;s Spending by Category
            </h3>

            {todayCategoryBreakdown.length === 0 ? (
              <p className="text-[11px] text-[#98A2B3] dark:text-[#6B7280] py-2 text-center">
                No category spending yet.
              </p>
            ) : (
              <div className="space-y-2 pt-0.5">
                {todayCategoryBreakdown.slice(0, 4).map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#111827] dark:text-neutral-200 text-[11px]">
                        {item.info?.name || item.id}
                      </span>
                      <span className="font-mono tabular-nums text-[#667085] dark:text-[#9CA3AF] text-[11px]">
                        {formatAmount(item.amount, budget.currency)} ({Math.round(item.percentage)}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.info?.color || '#00B86B',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stay on Track (Dynamic Calm Insight) */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              budgetInsight.isAlert
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider">
                {budgetInsight.title}
              </h4>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {budgetInsight.message}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Transaction Deletion */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action will update your daily, weekly, and monthly totals."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteExpense(deleteConfirmId);
            showToast('Expense deleted');
          }
          setDeleteConfirmId(null);
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
