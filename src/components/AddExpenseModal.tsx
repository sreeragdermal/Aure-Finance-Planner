import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { CategoryId, IncomeCategoryId, PaymentMethod } from '../types/expense';
import {
  CATEGORY_LIST,
  INCOME_CATEGORY_LIST,
  PRESET_EXPENSES,
  PRESET_INCOMES,
  PAYMENT_METHOD_LABELS,
} from '../utils/categories';
import { toDateString } from '../utils/calculations';
import {
  X,
  CreditCard,
  Wallet,
  Smartphone,
  Building,
  FileText,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
}) => {
  const { addExpense, addIncome, budget, modalType } = useExpenses();

  const [entryType, setEntryType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<CategoryId>('food');
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategoryId>('salary');
  const [date, setDate] = useState(defaultDate || toDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEntryType(modalType || 'expense');
      setDate(defaultDate || toDateString());
      setTitle('');
      setAmount('');
      setExpenseCategory('food');
      setIncomeCategory('salary');
      setPaymentMethod(modalType === 'income' ? 'bank_transfer' : 'digital');
      setNotes('');
    }
  }, [isOpen, defaultDate, modalType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!title.trim() || isNaN(num) || num <= 0) {
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const cleanAmount = Math.round(num * 100) / 100;
    const finalDate = date || toDateString();

    if (entryType === 'expense') {
      addExpense({
        title: title.trim(),
        amount: cleanAmount,
        category: expenseCategory,
        date: finalDate,
        time: timeStr,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
    } else {
      addIncome({
        title: title.trim(),
        amount: cleanAmount,
        category: incomeCategory,
        date: finalDate,
        time: timeStr,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  const applyExpensePreset = (preset: typeof PRESET_EXPENSES[0]) => {
    setTitle(preset.title);
    setAmount(preset.amount.toString());
    setExpenseCategory(preset.category);
  };

  const applyIncomePreset = (preset: typeof PRESET_INCOMES[0]) => {
    setTitle(preset.title);
    setAmount(preset.amount.toString());
    setIncomeCategory(preset.category);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 dark:bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Type Switcher */}
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                {entryType === 'expense' ? 'Log an Expense' : 'Log an Income'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {entryType === 'expense'
                  ? 'Record spending for accurate daily headroom & ledger tracking'
                  : 'Record earnings, paycheck, or incoming cash flow'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented Type Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setEntryType('expense');
                if (paymentMethod === 'bank_transfer') setPaymentMethod('card');
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-lg transition-all ${
                entryType === 'expense'
                  ? 'bg-white dark:bg-neutral-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Expense (Money Out)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEntryType('income');
                if (paymentMethod === 'card') setPaymentMethod('bank_transfer');
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-lg transition-all ${
                entryType === 'income'
                  ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Income (Money In)</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Row */}
        <div className="px-6 py-2.5 border-b border-neutral-100/60 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mb-1.5">
            <Sparkles className="w-3 h-3 text-neutral-400" />
            <span>Quick Suggestions:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entryType === 'expense'
              ? PRESET_EXPENSES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyExpensePreset(p)}
                    className="text-[11px] px-2 py-0.5 rounded-md border border-neutral-200/70 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {p.title} ({budget.currency}{p.amount})
                  </button>
                ))
              : PRESET_INCOMES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyIncomePreset(p)}
                    className="text-[11px] px-2 py-0.5 rounded-md border border-emerald-200/70 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  >
                    {p.title} (+{budget.currency}{p.amount})
                  </button>
                ))}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Amount & Date side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Amount ({budget.currency}) *
              </label>
              <div className="relative rounded-xl">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 font-mono text-base">
                  {budget.currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  className="block w-full pl-8 pr-4 py-2 text-base font-mono font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full px-3 py-2 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
              />
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {entryType === 'expense' ? 'Title / Description *' : 'Source / Description *'}
            </label>
            <input
              type="text"
              required
              placeholder={entryType === 'expense' ? 'e.g., Grocery Store, Coffee, Fuel' : 'e.g., Monthly Salary, Client Invoice, Freelance'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {entryType === 'expense'
                ? CATEGORY_LIST.map((cat) => {
                    const isSelected = expenseCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setExpenseCategory(cat.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium transition-all text-left ${
                          isSelected
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                            : 'bg-neutral-50/60 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </button>
                    );
                  })
                : INCOME_CATEGORY_LIST.map((cat) => {
                    const isSelected = incomeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setIncomeCategory(cat.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium transition-all text-left ${
                          isSelected
                            ? 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-neutral-950 shadow-2xs font-semibold'
                            : 'bg-neutral-50/60 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* Payment / Deposit Method */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              {entryType === 'expense' ? 'Payment Method' : 'Deposit / Account Method'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['card', 'cash', 'digital', 'bank_transfer', 'check'] as PaymentMethod[]).map((method) => {
                const isSelected = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                      isSelected
                        ? 'border border-neutral-900 dark:border-white bg-neutral-900/5 dark:bg-white/10 text-neutral-900 dark:text-white font-medium'
                        : 'border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    {method === 'card' && <CreditCard className="w-3.5 h-3.5" />}
                    {method === 'cash' && <Wallet className="w-3.5 h-3.5" />}
                    {method === 'digital' && <Smartphone className="w-3.5 h-3.5" />}
                    {method === 'bank_transfer' && <Building className="w-3.5 h-3.5" />}
                    {method === 'check' && <FileText className="w-3.5 h-3.5" />}
                    <span className="truncate">{PAYMENT_METHOD_LABELS[method]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Optional Note
            </label>
            <input
              type="text"
              placeholder="Add short note or tags..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-medium text-white rounded-xl shadow-xs transition-all ${
                entryType === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400'
                  : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
              }`}
            >
              {entryType === 'income' ? 'Save Income' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
