import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import {
  calculateDailyStats,
  formatAmount,
  toDateString,
  getDayName,
} from '../utils/calculations';
import {
  CATEGORIES,
  INCOME_CATEGORIES,
  PRESET_EXPENSES,
  PRESET_INCOMES,
  PAYMENT_METHOD_LABELS,
} from '../utils/categories';
import {
  Expense,
  Income,
  CategoryId,
  IncomeCategoryId,
  PaymentMethod,
  DailySectionTab,
} from '../types/expense';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  CreditCard,
  Wallet,
  Smartphone,
  Building,
  FileText,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Layers,
  PiggyBank,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

export const DailyTracker: React.FC = () => {
  const {
    expenses,
    incomes,
    addExpense,
    updateExpense,
    deleteExpense,
    addIncome,
    updateIncome,
    deleteIncome,
    budget,
    updateBudget,
    selectedDate,
    setSelectedDate,
    dailySectionTab,
    setDailySectionTab,
    openAddModal,
  } = useExpenses();

  // Fast inline expense entry state
  const [fastExpenseTitle, setFastExpenseTitle] = useState('');
  const [fastExpenseAmount, setFastExpenseAmount] = useState('');
  const [fastExpenseCategory, setFastExpenseCategory] = useState<CategoryId>('food');

  // Fast inline income entry state
  const [fastIncomeTitle, setFastIncomeTitle] = useState('');
  const [fastIncomeAmount, setFastIncomeAmount] = useState('');
  const [fastIncomeCategory, setFastIncomeCategory] = useState<IncomeCategoryId>('salary');

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpenseCat, setSelectedExpenseCat] = useState<string>('all');
  const [selectedIncomeCat, setSelectedIncomeCat] = useState<string>('all');

  // Inline editing states
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseTitle, setEditExpenseTitle] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseCategory, setEditExpenseCategory] = useState<CategoryId>('food');

  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editIncomeTitle, setEditIncomeTitle] = useState('');
  const [editIncomeAmount, setEditIncomeAmount] = useState('');
  const [editIncomeCategory, setEditIncomeCategory] = useState<IncomeCategoryId>('salary');

  // Daily stats calculated automatically
  const dailyStats = calculateDailyStats(expenses, incomes, selectedDate);
  const maxExpense = dailyStats.maxExpense;
  const maxIncome = dailyStats.maxIncome;

  // Budget comparison & dynamic limit option (customizable per user)
  const dailyBudget = budget.daily > 0 ? budget.daily : 500;
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(dailyBudget.toString());

  // Keep limitInput synced if dailyBudget changes
  React.useEffect(() => {
    setLimitInput(dailyBudget.toString());
  }, [dailyBudget]);

  const handleSaveLimit = (valToSave?: number) => {
    const val = valToSave !== undefined ? valToSave : parseFloat(limitInput);
    if (!isNaN(val) && val > 0) {
      updateBudget({ daily: Math.round(val) });
      setIsEditingLimit(false);
    }
  };

  const dailyBudgetPercent = Math.min((dailyStats.expenseTotal / dailyBudget) * 100, 100);
  const isOverBudget = dailyStats.expenseTotal > dailyBudget;
  const budgetHeadroom = dailyBudget - dailyStats.expenseTotal;

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

  // Submit Fast Inline Expense
  const handleFastAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(fastExpenseAmount);
    if (!fastExpenseTitle.trim() || isNaN(val) || val <= 0) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    addExpense({
      title: fastExpenseTitle.trim(),
      amount: Math.round(val * 100) / 100,
      category: fastExpenseCategory,
      date: selectedDate,
      time: timeStr,
      paymentMethod: 'digital',
    });

    setFastExpenseTitle('');
    setFastExpenseAmount('');
  };

  // Submit Fast Inline Income
  const handleFastAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(fastIncomeAmount);
    if (!fastIncomeTitle.trim() || isNaN(val) || val <= 0) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    addIncome({
      title: fastIncomeTitle.trim(),
      amount: Math.round(val * 100) / 100,
      category: fastIncomeCategory,
      date: selectedDate,
      time: timeStr,
      paymentMethod: 'bank_transfer',
    });

    setFastIncomeTitle('');
    setFastIncomeAmount('');
  };

  // Start edit expense
  const startEditExpense = (item: Expense) => {
    setEditingExpenseId(item.id);
    setEditExpenseTitle(item.title);
    setEditExpenseAmount(item.amount.toString());
    setEditExpenseCategory(item.category);
  };

  const saveEditExpense = (id: string) => {
    const num = parseFloat(editExpenseAmount);
    if (!editExpenseTitle.trim() || isNaN(num) || num <= 0) return;
    updateExpense(id, {
      title: editExpenseTitle.trim(),
      amount: Math.round(num * 100) / 100,
      category: editExpenseCategory,
    });
    setEditingExpenseId(null);
  };

  // Start edit income
  const startEditIncome = (item: Income) => {
    setEditingIncomeId(item.id);
    setEditIncomeTitle(item.title);
    setEditIncomeAmount(item.amount.toString());
    setEditIncomeCategory(item.category);
  };

  const saveEditIncome = (id: string) => {
    const num = parseFloat(editIncomeAmount);
    if (!editIncomeTitle.trim() || isNaN(num) || num <= 0) return;
    updateIncome(id, {
      title: editIncomeTitle.trim(),
      amount: Math.round(num * 100) / 100,
      category: editIncomeCategory,
    });
    setEditingIncomeId(null);
  };

  // Filtered expense items
  const filteredExpenses = dailyStats.expenses.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat =
      selectedExpenseCat === 'all' || item.category === selectedExpenseCat;
    return matchesSearch && matchesCat;
  });

  // Filtered income items
  const filteredIncomes = dailyStats.incomes.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat =
      selectedIncomeCat === 'all' || item.category === selectedIncomeCat;
    return matchesSearch && matchesCat;
  });

  // Helper payment icon
  const renderPaymentIcon = (method?: PaymentMethod) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-3.5 h-3.5" />;
      case 'cash':
        return <Wallet className="w-3.5 h-3.5" />;
      case 'digital':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'bank_transfer':
        return <Building className="w-3.5 h-3.5" />;
      case 'check':
        return <FileText className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Switcher Bar */}
      <div className="bg-white dark:bg-neutral-900 p-3 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-full overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevDay}
              className="p-1.5 sm:p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 sm:p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-semibold font-mono text-neutral-900 dark:text-white bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-xl px-2.5 sm:px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-neutral-400"
            />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hidden sm:inline">
              {getDayName(selectedDate, 'long')}
            </span>
          </div>

          {selectedDate !== toDateString() && (
            <button
              onClick={handleToday}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* TOP SUMMARY CARDS: 3-Pillar Daily Financial Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Today's Income */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Daily Income
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{formatAmount(dailyStats.incomeTotal, budget.currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {dailyStats.incomeCount} {dailyStats.incomeCount === 1 ? 'deposit' : 'deposits'} logged
          </div>
        </div>

        {/* Card 2: Today's Expenses */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Daily Expense
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
            {formatAmount(dailyStats.expenseTotal, budget.currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {dailyStats.expenseCount} {dailyStats.expenseCount === 1 ? 'item' : 'items'} logged
          </div>
        </div>

        {/* Card 3: Daily Net Balance / Savings */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Daily Net Cash Flow
            </span>
            <PiggyBank className="w-4 h-4 text-neutral-400" />
          </div>
          <div
            className={`text-2xl font-mono font-semibold tabular-nums ${
              dailyStats.netBalance > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : dailyStats.netBalance < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {dailyStats.netBalance > 0 ? '+' : ''}
            {formatAmount(dailyStats.netBalance, budget.currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            {dailyStats.netBalance > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                Surplus saved today
              </span>
            ) : dailyStats.netBalance < 0 ? (
              <span className="text-rose-600 dark:text-rose-400 inline-flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                Net daily deficit
              </span>
            ) : (
              <span>Balanced</span>
            )}
          </div>
        </div>
      </div>

      {/* DEDICATED SECTIONS SWITCHER (Requested by User: separate section for expense and income) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-2 sm:p-2.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 w-full max-w-full overflow-hidden">
        <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
          {/* Expenses Tab */}
          <button
            onClick={() => setDailySectionTab('expenses')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-2 text-xs font-medium rounded-lg transition-all min-w-0 ${
              dailySectionTab === 'expenses'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">Expenses</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200 dark:bg-neutral-700 font-mono shrink-0">
              {dailyStats.expenseCount}
            </span>
          </button>

          {/* Income Tab */}
          <button
            onClick={() => setDailySectionTab('income')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-2 text-xs font-medium rounded-lg transition-all min-w-0 ${
              dailySectionTab === 'income'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Income</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200 dark:bg-neutral-700 font-mono shrink-0">
              {dailyStats.incomeCount}
            </span>
          </button>

          {/* Dual Split Tab */}
          <button
            onClick={() => setDailySectionTab('both')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-xs font-medium rounded-lg transition-all min-w-0 ${
              dailySectionTab === 'both'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="truncate">Both</span>
          </button>
        </div>

        {/* Quick Add Modal triggers */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {dailySectionTab !== 'income' && (
            <button
              onClick={() => openAddModal('expense')}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
            >
              + Expense Form
            </button>
          )}
          {dailySectionTab !== 'expenses' && (
            <button
              onClick={() => openAddModal('income')}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors whitespace-nowrap shrink-0"
            >
              + Income Form
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: EXPENSE SECTION */}
      {(dailySectionTab === 'expenses' || dailySectionTab === 'both') && (
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <h2 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px] truncate">
                Daily Expenses Ledger
              </h2>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono shrink-0">
                ({formatAmount(dailyStats.expenseTotal, budget.currency)})
              </span>
            </div>
            {/* Dynamic User Daily Limit Option */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isEditingLimit ? (
                <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 p-1 rounded-xl border border-indigo-300 dark:border-indigo-700 shadow-xs">
                  <span className="text-xs font-mono text-neutral-400 pl-1.5">
                    {budget.currency}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    className="w-20 px-2 py-0.5 text-xs font-mono font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none"
                    autoFocus
                    placeholder="Limit"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveLimit();
                      }
                    }}
                  />
                  <div className="hidden sm:flex items-center gap-1">
                    {[200, 500, 1000, 2000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSaveLimit(preset)}
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                          dailyBudget === preset
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveLimit()}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingLimit(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setLimitInput(dailyBudget.toString());
                    setIsEditingLimit(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 border border-neutral-200/80 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer group"
                  title="Click to change your daily expense limit / quota"
                >
                  <SlidersHorizontal className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200" />
                  <span>
                    Daily Limit: <strong className="font-mono text-neutral-900 dark:text-white">{formatAmount(dailyBudget, budget.currency)}</strong>
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold underline ml-0.5">
                    Change
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Fast Inline Expense Form */}
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
            <form onSubmit={handleFastAddExpense} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-36 shrink-0">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 font-mono text-xs">
                  {budget.currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={fastExpenseAmount}
                  onChange={(e) => setFastExpenseAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>

              <input
                type="text"
                placeholder="What did you spend on? (e.g. Lunch, Coffee, Fuel)"
                value={fastExpenseTitle}
                onChange={(e) => setFastExpenseTitle(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
              />

              <select
                value={fastExpenseCategory}
                onChange={(e) => setFastExpenseCategory(e.target.value as CategoryId)}
                className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden"
              >
                {Object.values(CATEGORIES).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0"
              >
                + Add Expense
              </button>
            </form>

            {/* Quick Presets for Expense */}
            <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Quick Add:
              </span>
              {PRESET_EXPENSES.slice(0, 4).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFastExpenseTitle(p.title);
                    setFastExpenseAmount(p.amount.toString());
                    setFastExpenseCategory(p.category);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-md border border-neutral-200/60 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  {p.title} ({budget.currency}{p.amount})
                </button>
              ))}
            </div>
          </div>

          {/* Expense Headroom & Peak Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Headroom */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span>Daily Headroom Left</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLimitInput(dailyBudget.toString());
                      setIsEditingLimit(true);
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    title="Click to change your daily expense limit / quota"
                  >
                    (Quota: {budget.currency}{dailyBudget})
                  </button>
                </div>
                <span className="font-mono tabular-nums">
                  {dailyBudgetPercent.toFixed(0)}% of limit
                </span>
              </div>
              <div className="text-xl font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                {isOverBudget ? (
                  <span className="text-rose-600 dark:text-rose-400">
                    -{formatAmount(Math.abs(budgetHeadroom), budget.currency)} (Over)
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{formatAmount(budgetHeadroom, budget.currency)}
                  </span>
                )}
              </div>
              <div className="mt-2 w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverBudget
                      ? 'bg-rose-500'
                      : dailyBudgetPercent > 80
                      ? 'bg-amber-500'
                      : 'bg-neutral-800 dark:bg-neutral-200'
                  }`}
                  style={{ width: `${dailyBudgetPercent}%` }}
                />
              </div>
            </div>

            {/* Peak Expense */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                Peak Expense Today
              </div>
              {maxExpense ? (
                <div>
                  <div className="text-xl font-mono font-semibold text-neutral-900 dark:text-white tabular-nums truncate">
                    {formatAmount(maxExpense.amount, budget.currency)}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-300 truncate mt-0.5">
                    {maxExpense.title} · {CATEGORIES[maxExpense.category]?.name}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-400 italic mt-1">
                  No expenses logged yet today
                </div>
              )}
            </div>
          </div>

          {/* Expense Ledger Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-colors">
            {/* Category filter pills */}
            <div className="p-3 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedExpenseCat('all')}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  selectedExpenseCat === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                All Categories ({dailyStats.expenseCount})
              </button>
              {Object.values(CATEGORIES).map((cat) => {
                const count = dailyStats.expenses.filter((e) => e.category === cat.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedExpenseCat(cat.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      selectedExpenseCat === cat.id
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                    <span className="opacity-60 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="p-10 text-center text-xs text-neutral-400 dark:text-neutral-500">
                {dailyStats.expenseCount === 0 ? (
                  <div>
                    <p className="font-medium text-neutral-600 dark:text-neutral-400">
                      No expenses logged for this date.
                    </p>
                    <p className="mt-1">
                      Use the quick entry box above to log your first expense of the day.
                    </p>
                  </div>
                ) : (
                  'No expenses matched your filter criteria.'
                )}
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredExpenses.map((item) => {
                  const cat = CATEGORIES[item.category] || CATEGORIES.other;
                  const isEditing = editingExpenseId === item.id;

                  if (isEditing) {
                    return (
                      <div key={item.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={editExpenseTitle}
                            onChange={(e) => setEditExpenseTitle(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={editExpenseAmount}
                            onChange={(e) => setEditExpenseAmount(e.target.value)}
                            className="px-2.5 py-1 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                          />
                          <select
                            value={editExpenseCategory}
                            onChange={(e) => setEditExpenseCategory(e.target.value as CategoryId)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                          >
                            {Object.values(CATEGORIES).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingExpenseId(null)}
                            className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEditExpense(item.id)}
                            className="px-3 py-1 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                          title={cat.name}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span>{cat.name}</span>
                            {item.time && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono">{item.time}</span>
                              </>
                            )}
                            {item.paymentMethod && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1">
                                  {renderPaymentIcon(item.paymentMethod)}
                                  <span className="truncate max-w-[100px] sm:max-w-none">
                                    {item.paymentMethod === 'digital' ? 'UPI' : item.paymentMethod === 'bank_transfer' ? 'Bank' : PAYMENT_METHOD_LABELS[item.paymentMethod]}
                                  </span>
                                </span>
                              </>
                            )}
                            {item.notes && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="italic truncate max-w-[110px] sm:max-w-[150px]">{item.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="text-xs sm:text-sm font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                          {formatAmount(item.amount, budget.currency)}
                        </span>
                        <div className="flex items-center gap-0.5 sm:gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditExpense(item)}
                            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteExpense(item.id)}
                            className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: INCOME SECTION (Separate Section requested by User) */}
      {(dailySectionTab === 'income' || dailySectionTab === 'both') && (
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <h2 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px] truncate">
                Daily Income & Earnings Ledger
              </h2>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium shrink-0">
                (+{formatAmount(dailyStats.incomeTotal, budget.currency)})
              </span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
              {dailyStats.incomeCount} incoming transactions
            </div>
          </div>

          {/* Fast Inline Income Form */}
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/60 transition-colors">
            <form onSubmit={handleFastAddIncome} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-36 shrink-0">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                  +{budget.currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={fastIncomeAmount}
                  onChange={(e) => setFastIncomeAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono font-semibold rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 placeholder-emerald-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <input
                type="text"
                placeholder="Income source? (e.g. Daily Salary, Client Invoice, Cash Received)"
                value={fastIncomeTitle}
                onChange={(e) => setFastIncomeTitle(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />

              <select
                value={fastIncomeCategory}
                onChange={(e) => setFastIncomeCategory(e.target.value as IncomeCategoryId)}
                className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden"
              >
                {Object.values(INCOME_CATEGORIES).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0"
              >
                + Add Income
              </button>
            </form>

            {/* Quick Presets for Income */}
            <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" /> Quick Add:
              </span>
              {PRESET_INCOMES.slice(0, 4).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFastIncomeTitle(p.title);
                    setFastIncomeAmount(p.amount.toString());
                    setFastIncomeCategory(p.category);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  {p.title} (+{budget.currency}{p.amount})
                </button>
              ))}
            </div>
          </div>

          {/* Income Metric Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Income Today */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                Total Earned Today
              </div>
              <div className="text-xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{formatAmount(dailyStats.incomeTotal, budget.currency)}
              </div>
              <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {dailyStats.incomeCount} incoming entries recorded
              </div>
            </div>

            {/* Peak Income Source */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                Top Income Entry
              </div>
              {maxIncome ? (
                <div>
                  <div className="text-xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                    +{formatAmount(maxIncome.amount, budget.currency)}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-300 truncate mt-0.5">
                    {maxIncome.title} · {INCOME_CATEGORIES[maxIncome.category]?.name}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-400 italic mt-1">
                  No income logged yet today
                </div>
              )}
            </div>
          </div>

          {/* Income Ledger Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-colors">
            {/* Category filter pills */}
            <div className="p-3 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedIncomeCat('all')}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  selectedIncomeCat === 'all'
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                All Income Sources ({dailyStats.incomeCount})
              </button>
              {Object.values(INCOME_CATEGORIES).map((cat) => {
                const count = dailyStats.incomes.filter((i) => i.category === cat.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedIncomeCat(cat.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      selectedIncomeCat === cat.id
                        ? 'bg-emerald-600 text-white font-medium'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                    <span className="opacity-60 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {filteredIncomes.length === 0 ? (
              <div className="p-10 text-center text-xs text-neutral-400 dark:text-neutral-500">
                {dailyStats.incomeCount === 0 ? (
                  <div>
                    <p className="font-medium text-neutral-600 dark:text-neutral-400">
                      No income logged for this date.
                    </p>
                    <p className="mt-1">
                      Enter daily salary, freelance payout, or side-hustle money in the box above.
                    </p>
                  </div>
                ) : (
                  'No income records matched your search.'
                )}
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredIncomes.map((item) => {
                  const cat = INCOME_CATEGORIES[item.category] || INCOME_CATEGORIES.other_income;
                  const isEditing = editingIncomeId === item.id;

                  if (isEditing) {
                    return (
                      <div key={item.id} className="p-3 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={editIncomeTitle}
                            onChange={(e) => setEditIncomeTitle(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={editIncomeAmount}
                            onChange={(e) => setEditIncomeAmount(e.target.value)}
                            className="px-2.5 py-1 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                          />
                          <select
                            value={editIncomeCategory}
                            onChange={(e) => setEditIncomeCategory(e.target.value as IncomeCategoryId)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                          >
                            {Object.values(INCOME_CATEGORIES).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingIncomeId(null)}
                            className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEditIncome(item.id)}
                            className="px-3 py-1 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                          title={cat.name}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                              {cat.name}
                            </span>
                            {item.time && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono">{item.time}</span>
                              </>
                            )}
                            {item.paymentMethod && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1">
                                  {renderPaymentIcon(item.paymentMethod)}
                                  <span className="truncate max-w-[100px] sm:max-w-none">
                                    {item.paymentMethod === 'digital' ? 'UPI' : item.paymentMethod === 'bank_transfer' ? 'Bank' : PAYMENT_METHOD_LABELS[item.paymentMethod]}
                                  </span>
                                </span>
                              </>
                            )}
                            {item.notes && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="italic truncate max-w-[110px] sm:max-w-[150px]">{item.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="text-xs sm:text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatAmount(item.amount, budget.currency)}
                        </span>
                        <div className="flex items-center gap-0.5 sm:gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditIncome(item)}
                            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteIncome(item.id)}
                            className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
