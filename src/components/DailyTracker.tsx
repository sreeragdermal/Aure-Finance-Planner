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
  PAYMENT_METHOD_LABELS,
} from '../utils/categories';
import {
  Expense,
  Income,
  CategoryId,
  IncomeCategoryId,
  PaymentMethod,
} from '../types/expense';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
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
  PiggyBank,
  CheckCircle2,
  Check,
  SlidersHorizontal,
  Calendar,
} from 'lucide-react';
import { playIncomeSuccessSound, playExpenseSuccessSound } from '../utils/soundEffects';

// Expense Quick Add Presets specified in UX requirements
const EXPENSE_QUICK_PRESETS: { title: string; amount: number; category: CategoryId }[] = [
  { title: 'Chai & Snacks', amount: 30, category: 'food' },
  { title: 'Lunch / Thali', amount: 150, category: 'food' },
  { title: 'Groceries', amount: 750, category: 'shopping' },
  { title: 'Metro / Auto', amount: 80, category: 'transport' },
  { title: 'Mobile / WiFi', amount: 399, category: 'utilities' },
];

// Income Quick Add Presets specified in UX requirements
const INCOME_QUICK_PRESETS: { source: string; category: IncomeCategoryId; defaultAmount?: number }[] = [
  { source: 'Salary', category: 'salary', defaultAmount: 25000 },
  { source: 'Freelance', category: 'freelance', defaultAmount: 5000 },
  { source: 'Business', category: 'business', defaultAmount: 10000 },
  { source: 'Refund', category: 'refund', defaultAmount: 500 },
  { source: 'Other', category: 'other_income', defaultAmount: 1000 },
];

type LedgerHistoryFilter = 'all' | 'expense' | 'income';

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
    categories,
    categoryList,
    selectedDate,
    setSelectedDate,
  } = useExpenses();

  // Transaction composer state
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseCat, setExpenseCat] = useState<CategoryId>('food');
  const [incomeCat, setIncomeCat] = useState<IncomeCategoryId>('salary');

  // Inline validation & success feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<'amount' | 'description' | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [justAddedType, setJustAddedType] = useState<'expense' | 'income' | null>(null);

  // History filtering & search
  const [historyFilter, setHistoryFilter] = useState<LedgerHistoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline editing state for transactions
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseTitle, setEditExpenseTitle] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseCategory, setEditExpenseCategory] = useState<CategoryId>('food');

  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editIncomeTitle, setEditIncomeTitle] = useState('');
  const [editIncomeAmount, setEditIncomeAmount] = useState('');
  const [editIncomeCategory, setEditIncomeCategory] = useState<IncomeCategoryId>('salary');

  // Daily budget limit customizer
  const dailyBudget = budget.daily > 0 ? budget.daily : 500;
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(dailyBudget.toString());

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

  // Daily stats for selectedDate
  const dailyStats = calculateDailyStats(expenses, incomes, selectedDate);
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

  // Format date nicely: e.g. "September 25, 2026"
  const formattedDate = React.useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Form submission handler
  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorField(null);

    // 1. Validate Amount
    const numAmount = parseFloat(amount);
    if (!amount.trim() || isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      setErrorField('amount');
      return;
    }

    // 2. Validate Description / Source
    const cleanText = description.trim();
    if (!cleanText) {
      if (txType === 'expense') {
        setErrorMsg('Please enter what you spent on.');
      } else {
        setErrorMsg('Please enter where this money came from.');
      }
      setErrorField('description');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (txType === 'expense') {
      addExpense({
        title: cleanText,
        amount: Math.round(numAmount * 100) / 100,
        category: expenseCat,
        date: selectedDate,
        time: timeStr,
        paymentMethod: 'digital',
      });
      playExpenseSuccessSound();
      setSuccessMsg('✓ Expense added');
      setJustAddedType('expense');
    } else {
      addIncome({
        title: cleanText,
        amount: Math.round(numAmount * 100) / 100,
        category: incomeCat,
        date: selectedDate,
        time: timeStr,
        paymentMethod: 'bank_transfer',
      });
      playIncomeSuccessSound();
      setSuccessMsg('✓ Income added');
      setJustAddedType('income');
    }

    // Reset inputs
    setAmount('');
    setDescription('');

    // Clear brief 400ms visual animation highlight
    setTimeout(() => {
      setJustAddedType(null);
    }, 450);

    // Auto-clear success message after 3.5 seconds
    setTimeout(() => {
      setSuccessMsg(null);
    }, 3500);
  };

  // Quick Add for Expense
  const handleExpenseQuickAdd = (preset: { title: string; amount: number; category: CategoryId }) => {
    setAmount(preset.amount.toString());
    setDescription(preset.title);
    setExpenseCat(preset.category);
    setErrorMsg(null);
    setErrorField(null);
  };

  // Quick Add for Income
  const handleIncomeQuickAdd = (preset: { source: string; category: IncomeCategoryId; defaultAmount?: number }) => {
    setDescription(preset.source);
    setIncomeCat(preset.category);
    if (preset.defaultAmount && (!amount || parseFloat(amount) <= 0)) {
      setAmount(preset.defaultAmount.toString());
    }
    setErrorMsg(null);
    setErrorField(null);
  };

  // Start inline edits
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

  // Unified list of today's transactions
  type UnifiedTx =
    | { type: 'expense'; data: Expense }
    | { type: 'income'; data: Income };

  const unifiedTransactions: UnifiedTx[] = React.useMemo(() => {
    const list: UnifiedTx[] = [];

    if (historyFilter === 'all' || historyFilter === 'expense') {
      dailyStats.expenses.forEach((exp) => {
        list.push({ type: 'expense', data: exp });
      });
    }

    if (historyFilter === 'all' || historyFilter === 'income') {
      dailyStats.incomes.forEach((inc) => {
        list.push({ type: 'income', data: inc });
      });
    }

    // Filter by search query if any
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? list.filter((item) => {
          const title = item.data.title.toLowerCase();
          const notes = (item.data.notes || '').toLowerCase();
          const catName =
            item.type === 'expense'
              ? (categories[item.data.category]?.name || CATEGORIES[item.data.category]?.name || '').toLowerCase()
              : (INCOME_CATEGORIES[item.data.category]?.name || '').toLowerCase();
          return title.includes(query) || notes.includes(query) || catName.includes(query);
        })
      : list;

    // Stable sort: time descending if available, else createdAt
    return filtered.sort((a, b) => {
      const timeA = a.data.time || '00:00';
      const timeB = b.data.time || '00:00';
      if (timeA !== timeB) return timeB.localeCompare(timeA);
      return b.data.createdAt - a.data.createdAt;
    });
  }, [dailyStats.expenses, dailyStats.incomes, historyFilter, searchQuery, categories]);

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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ==================================================================== */}
      {/* 1. PAGE HEADER: DAILY LEDGER & DATE SELECTOR                         */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Daily Ledger
          </div>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0.5 tracking-tight">
            {formattedDate}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {getDayName(selectedDate, 'long')}
          </div>
        </div>

        {/* Date Navigation: < Today > */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                selectedDate === toDateString()
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Today
            </button>

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Direct Date Picker */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="text-xs font-semibold font-mono text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 rounded-xl px-2.5 py-2 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white cursor-pointer"
              title="Select specific date"
            />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. ADD TRANSACTION COMPOSER                                          */}
      {/* ==================================================================== */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-300 ${
          justAddedType === 'expense'
            ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 ring-2 ring-rose-400/25 shadow-xs'
            : justAddedType === 'income'
            ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900 ring-2 ring-emerald-400/25 shadow-xs'
            : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800'
        }`}
      >
        {/* Header & Segmented Toggle: [ Expense ] [ Income ] */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Add Transaction
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {txType === 'expense' ? 'Record daily expenses' : 'Record incoming earnings & deposits'}
            </p>
          </div>

          {/* Premium Segmented Control */}
          <div className="inline-flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 self-start sm:self-auto">
            {/* Expense Segment: subtle red/pink active state with expense icon */}
            <button
              type="button"
              onClick={() => {
                setTxType('expense');
                setErrorMsg(null);
                setErrorField(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                txType === 'expense'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold shadow-xs border border-rose-200/80 dark:border-rose-900/60'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Expense</span>
            </button>

            {/* Income Segment: subtle green active state with income icon */}
            <button
              type="button"
              onClick={() => {
                setTxType('income');
                setErrorMsg(null);
                setErrorField(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                txType === 'income'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold shadow-xs border border-emerald-200/80 dark:border-emerald-900/60'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Income</span>
            </button>
          </div>
        </div>

        {/* Small confirmation feedback */}
        {successMsg && (
          <div
            className={`mb-4 flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border transition-all animate-in fade-in duration-200 ${
              successMsg.includes('Income')
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
            }`}
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dynamic Form: Expense Mode vs Income Mode */}
        <form onSubmit={handleSubmitTransaction} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
            {/* Amount Field */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500 font-mono text-xs">
                  {budget.currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errorField === 'amount') {
                      setErrorMsg(null);
                      setErrorField(null);
                    }
                  }}
                  className={`w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold rounded-xl border bg-neutral-50/50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-1 ${
                    errorField === 'amount'
                      ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
                      : 'border-neutral-200 dark:border-neutral-700 focus:ring-neutral-900 dark:focus:ring-white'
                  }`}
                />
              </div>
            </div>

            {/* Description / Source Field */}
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                {txType === 'expense' ? 'Description' : 'Source'}
              </label>
              <input
                type="text"
                placeholder={
                  txType === 'expense'
                    ? 'What did you spend on? e.g. Lunch, Coffee, Fuel'
                    : 'Where did this money come from? e.g. Salary, Freelance, Refund'
                }
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errorField === 'description') {
                    setErrorMsg(null);
                    setErrorField(null);
                  }
                }}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-neutral-50/50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-1 ${
                  errorField === 'description'
                    ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
                    : 'border-neutral-200 dark:border-neutral-700 focus:ring-neutral-900 dark:focus:ring-white'
                }`}
              />
            </div>

            {/* Category Dropdown */}
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Category
              </label>
              {txType === 'expense' ? (
                <select
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value as CategoryId)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white cursor-pointer"
                >
                  {categoryList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={incomeCat}
                  onChange={(e) => setIncomeCat(e.target.value as IncomeCategoryId)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white cursor-pointer"
                >
                  {Object.values(INCOME_CATEGORIES).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Inline Validation Error */}
          {errorMsg && (
            <div className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5 pt-0.5">
              <span>●</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer ${
                txType === 'expense'
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-neutral-950'
              }`}
            >
              {txType === 'expense' ? 'Add Expense' : 'Add Income'}
            </button>
          </div>
        </form>

        {/* Quick Add Presets (Dynamically changes with toggle) */}
        {txType === 'expense' ? (
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3" /> Quick Add:
            </span>
            {EXPENSE_QUICK_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExpenseQuickAdd(preset)}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-neutral-200/80 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                {preset.title} <span className="font-mono text-neutral-500 dark:text-neutral-400">₹{preset.amount}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-emerald-500" /> Quick Add:
            </span>
            {INCOME_QUICK_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleIncomeQuickAdd(preset)}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-emerald-200/70 dark:border-emerald-800/70 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
              >
                {preset.source}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. TODAY'S SUMMARY                                                   */}
      {/* ==================================================================== */}
      <div className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
          Today's Summary
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Daily Expense Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
              justAddedType === 'expense'
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-xs ring-2 ring-rose-400/30 scale-[1.01]'
                : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Daily Spent
              </span>
              <div className="flex items-center gap-1.5">
                {justAddedType === 'expense' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in zoom-in duration-200">
                    <Check className="w-3 h-3" />
                    <span>Updated</span>
                  </span>
                )}
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
            </div>
            <div className={`text-2xl font-mono font-semibold tabular-nums transition-colors duration-300 ${
              justAddedType === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-900 dark:text-white'
            }`}>
              {formatAmount(dailyStats.expenseTotal, budget.currency)}
            </div>
            <div className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              {dailyStats.expenseCount} {dailyStats.expenseCount === 1 ? 'expense' : 'expenses'} logged
            </div>
          </div>

          {/* Daily Income Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
              justAddedType === 'income'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-xs ring-2 ring-emerald-400/30 scale-[1.01]'
                : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Daily Income
              </span>
              <div className="flex items-center gap-1.5">
                {justAddedType === 'income' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in duration-200">
                    <Check className="w-3 h-3" />
                    <span>Updated</span>
                  </span>
                )}
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="text-2xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums transition-colors duration-300">
              +{formatAmount(dailyStats.incomeTotal, budget.currency)}
            </div>
            <div className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              {dailyStats.incomeCount} {dailyStats.incomeCount === 1 ? 'income entry' : 'income entries'}
            </div>
          </div>

          {/* Net Cash Flow Card */}
          <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Net Cash Flow
              </span>
              <PiggyBank className="w-4 h-4 text-neutral-400" />
            </div>
            <div
              className={`text-2xl font-mono font-semibold tabular-nums ${
                dailyStats.netBalance > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : dailyStats.netBalance < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {dailyStats.netBalance > 0 ? '+' : ''}
              {formatAmount(dailyStats.netBalance, budget.currency)}
            </div>
            <div className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              {dailyStats.netBalance > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  Net surplus saved
                </span>
              ) : dailyStats.netBalance < 0 ? (
                <span className="text-rose-600 dark:text-rose-400 inline-flex items-center">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  Net daily deficit
                </span>
              ) : (
                <span>Balanced</span>
              )}
            </div>
          </div>
        </div>

        {/* Budget Quota / Headroom Bar (Clean & Compact) */}
        <div className="bg-white dark:bg-neutral-900 p-3.5 sm:p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-neutral-500 dark:text-neutral-400">Daily Budget Limit:</span>
            {isEditingLimit ? (
              <div className="inline-flex items-center gap-1.5">
                <span className="font-mono text-neutral-400">{budget.currency}</span>
                <input
                  type="number"
                  min="1"
                  step="50"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="w-20 px-2 py-0.5 font-mono text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLimit();
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSaveLimit()}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingLimit(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setLimitInput(dailyBudget.toString());
                  setIsEditingLimit(true);
                }}
                className="font-mono font-semibold text-neutral-900 dark:text-white hover:underline cursor-pointer inline-flex items-center gap-1"
                title="Change daily budget quota"
              >
                <span>{formatAmount(dailyBudget, budget.currency)}</span>
                <SlidersHorizontal className="w-3 h-3 text-neutral-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-500 dark:text-neutral-400">Headroom Left:</span>
            <span
              className={`font-mono font-semibold tabular-nums ${
                isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isOverBudget ? '-' : '+'}
              {formatAmount(Math.abs(budgetHeadroom), budget.currency)}
            </span>
            <span className="text-neutral-400 font-mono text-[11px]">
              ({dailyBudgetPercent.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. TODAY'S TRANSACTIONS                                              */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-colors">
        {/* Controls: Filter [ All | Expenses | Income ] & Search */}
        <div className="p-3.5 sm:p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
              Today's Transactions
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              ({dailyStats.expenseCount + dailyStats.incomeCount})
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Filter Toggle */}
            <div className="inline-flex p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
              <button
                type="button"
                onClick={() => setHistoryFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  historyFilter === 'all'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('expense')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  historyFilter === 'expense'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Expenses ({dailyStats.expenseCount})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('income')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  historyFilter === 'income'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Income ({dailyStats.incomeCount})
              </button>
            </div>

            {/* Compact Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {unifiedTransactions.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-2 text-neutral-400">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              No transactions for this day
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {searchQuery
                ? 'No transactions matched your search query.'
                : 'Use the form above to add an expense or income.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {unifiedTransactions.map((item) => {
              // EXPENSE ITEM
              if (item.type === 'expense') {
                const exp = item.data;
                const cat = categories[exp.category] || CATEGORIES[exp.category] || CATEGORIES.other;
                const isEditing = editingExpenseId === exp.id;

                if (isEditing) {
                  return (
                    <div key={`exp-${exp.id}`} className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={editExpenseTitle}
                          onChange={(e) => setEditExpenseTitle(e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={editExpenseAmount}
                          onChange={(e) => setEditExpenseAmount(e.target.value)}
                          className="px-2.5 py-1 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                          placeholder="Amount"
                        />
                        <select
                          value={editExpenseCategory}
                          onChange={(e) => setEditExpenseCategory(e.target.value as CategoryId)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                        >
                          {categoryList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingExpenseId(null)}
                          className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEditExpense(exp.id)}
                          className="px-3 py-1 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`exp-${exp.id}`}
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
                          {exp.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span>{cat.name}</span>
                          {exp.time && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">{exp.time}</span>
                            </>
                          )}
                          {exp.paymentMethod && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1">
                                {renderPaymentIcon(exp.paymentMethod)}
                                <span className="truncate max-w-[100px] sm:max-w-none">
                                  {exp.paymentMethod === 'digital'
                                    ? 'UPI'
                                    : exp.paymentMethod === 'bank_transfer'
                                    ? 'Bank'
                                    : PAYMENT_METHOD_LABELS[exp.paymentMethod]}
                                </span>
                              </span>
                            </>
                          )}
                          {exp.notes && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="italic truncate max-w-[120px]">{exp.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="text-xs sm:text-sm font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                        -{formatAmount(exp.amount, budget.currency)}
                      </span>
                      <div className="flex items-center gap-0.5 sm:gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => startEditExpense(exp)}
                          className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // INCOME ITEM
              const inc = item.data;
              const cat = INCOME_CATEGORIES[inc.category] || INCOME_CATEGORIES.other_income;
              const isEditing = editingIncomeId === inc.id;

              if (isEditing) {
                return (
                  <div key={`inc-${inc.id}`} className="p-3.5 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editIncomeTitle}
                        onChange={(e) => setEditIncomeTitle(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                        placeholder="Source"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={editIncomeAmount}
                        onChange={(e) => setEditIncomeAmount(e.target.value)}
                        className="px-2.5 py-1 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                        placeholder="Amount"
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
                        type="button"
                        onClick={() => setEditingIncomeId(null)}
                        className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditIncome(inc.id)}
                        className="px-3 py-1 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`inc-${inc.id}`}
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
                        {inc.title}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {cat.name}
                        </span>
                        {inc.time && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{inc.time}</span>
                          </>
                        )}
                        {inc.paymentMethod && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              {renderPaymentIcon(inc.paymentMethod)}
                              <span className="truncate max-w-[100px] sm:max-w-none">
                                {inc.paymentMethod === 'digital'
                                  ? 'UPI'
                                  : inc.paymentMethod === 'bank_transfer'
                                  ? 'Bank'
                                  : PAYMENT_METHOD_LABELS[inc.paymentMethod]}
                              </span>
                            </span>
                          </>
                        )}
                        {inc.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="italic truncate max-w-[120px]">{inc.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-xs sm:text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatAmount(inc.amount, budget.currency)}
                    </span>
                    <div className="flex items-center gap-0.5 sm:gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => startEditIncome(inc)}
                        className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                        title="Edit Income"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteIncome(inc.id)}
                        className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                        title="Delete Income"
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
  );
};
