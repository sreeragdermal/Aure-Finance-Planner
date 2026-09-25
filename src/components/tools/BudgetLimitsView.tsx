import React, { useState, useEffect } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useToast } from '../../context/ToastContext';
import { CURRENCIES } from '../../utils/categories';
import { formatAmount } from '../../utils/calculations';
import {
  PiggyBank,
  Check,
  Zap,
  Calendar,
  CalendarRange,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const BudgetLimitsView: React.FC = () => {
  const { budget, updateBudget, expenses, incomes, selectedDate, setActiveTab } = useExpenses();
  const { showToast } = useToast();

  const [dailyInput, setDailyInput] = useState(budget.daily.toString());
  const [weeklyInput, setWeeklyInput] = useState(budget.weekly.toString());
  const [monthlyInput, setMonthlyInput] = useState(budget.monthly.toString());
  const [savingsInput, setSavingsInput] = useState((budget.monthlySavingsTarget || 10000).toString());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Inline card edit states
  const [editingDaily, setEditingDaily] = useState(false);
  const [inlineDaily, setInlineDaily] = useState(budget.daily.toString());

  const [editingWeekly, setEditingWeekly] = useState(false);
  const [inlineWeekly, setInlineWeekly] = useState(budget.weekly.toString());

  const [editingMonthly, setEditingMonthly] = useState(false);
  const [inlineMonthly, setInlineMonthly] = useState(budget.monthly.toString());

  // Sync form inputs when budget context changes
  useEffect(() => {
    setDailyInput(budget.daily.toString());
    setWeeklyInput(budget.weekly.toString());
    setMonthlyInput(budget.monthly.toString());
    setSavingsInput((budget.monthlySavingsTarget || 10000).toString());
    setInlineDaily(budget.daily.toString());
    setInlineWeekly(budget.weekly.toString());
    setInlineMonthly(budget.monthly.toString());
  }, [budget.daily, budget.weekly, budget.monthly, budget.monthlySavingsTarget]);

  // Calculate live daily stats for headroom preview
  const todayExpensesTotal = expenses
    .filter((e) => e.date === selectedDate)
    .reduce((sum, e) => sum + e.amount, 0);
  const liveHeadroom = (parseFloat(dailyInput) || budget.daily) - todayExpensesTotal;

  // Calculate live monthly stats for savings target preview
  const currentMonth = selectedDate.substring(0, 7);
  const monthExpensesTotal = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);
  const monthIncomesTotal = incomes
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);
  const monthNetSurplus = monthIncomesTotal - monthExpensesTotal;

  const saveDailyInline = () => {
    const val = Math.max(0, Math.round(parseFloat(inlineDaily) || 0));
    updateBudget({ daily: val });
    setEditingDaily(false);
    showToast(`Daily budget limit updated to ${formatAmount(val, budget.currency)}!`);
  };

  const saveWeeklyInline = () => {
    const val = Math.max(0, Math.round(parseFloat(inlineWeekly) || 0));
    updateBudget({ weekly: val });
    setEditingWeekly(false);
    showToast(`Weekly budget limit updated to ${formatAmount(val, budget.currency)}!`);
  };

  const saveMonthlyInline = () => {
    const val = Math.max(0, Math.round(parseFloat(inlineMonthly) || 0));
    updateBudget({ monthly: val });
    setEditingMonthly(false);
    showToast(`Monthly budget limit updated to ${formatAmount(val, budget.currency)}!`);
  };

  const handleSaveBudgets = (e: React.FormEvent) => {
    e.preventDefault();
    const d = Math.max(0, Math.round(parseFloat(dailyInput) || 0));
    const w = Math.max(0, Math.round(parseFloat(weeklyInput) || 0));
    const m = Math.max(0, Math.round(parseFloat(monthlyInput) || 0));
    const s = Math.max(0, Math.round(parseFloat(savingsInput) || 0));

    updateBudget({
      daily: d,
      weekly: w,
      monthly: m,
      monthlySavingsTarget: s,
    });

    setSaveSuccess(true);
    showToast('Budget limits successfully updated!');
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E9FBF3] text-[#00B86B] dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#111827] dark:text-[#F3F4F6]">
                  Budget Limits & Target Goals
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                Configure your spending caps. Changes update your Daily Headroom, Weekly Overview, and Dashboard summaries immediately.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAF8] dark:bg-[#0E1015]/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E7E7E3] dark:border-[#262B35] text-xs font-semibold text-[#111827] dark:text-white transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>View Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#6D5DFB]" />
          </button>
        </div>
      </div>

      {/* 4 Live Preview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Daily Limit */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
                Daily Limit
              </span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#0D9488] dark:bg-teal-950/40 dark:text-teal-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            {editingDaily ? (
              <div className="space-y-1.5 my-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-[#98A2B3]">{budget.currency}</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={inlineDaily}
                    onChange={(e) => setInlineDaily(e.target.value)}
                    className="w-full px-2 py-1 text-sm font-mono font-bold rounded-lg border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/40 text-[#111827] dark:text-white focus:outline-hidden"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={saveDailyInline}
                    className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#111111] dark:bg-white dark:text-[#111111] rounded-lg transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInlineDaily(budget.daily.toString());
                      setEditingDaily(false);
                    }}
                    className="px-2 py-1 text-[11px] text-[#667085] hover:text-[#111827] dark:text-[#9CA3AF] rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold font-mono tabular-nums text-[#111827] dark:text-white">
                  {formatAmount(budget.daily, budget.currency)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInlineDaily(budget.daily.toString());
                    setEditingDaily(true);
                  }}
                  className="text-xs font-semibold text-[#00B86B] hover:text-emerald-700 dark:hover:text-emerald-300 px-2 py-0.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                >
                  [Change]
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-[#E7E7E3]/60 dark:border-[#262B35]/60 text-[11px] text-[#667085] dark:text-[#9CA3AF] flex items-center justify-between">
            <span>Today Headroom:</span>
            <span className={`font-mono font-semibold ${liveHeadroom >= 0 ? 'text-[#00B86B]' : 'text-[#F43F6E]'}`}>
              {formatAmount(liveHeadroom, budget.currency)}
            </span>
          </div>
        </div>

        {/* Weekly Limit */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
                Weekly Limit
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00B86B] dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            {editingWeekly ? (
              <div className="space-y-1.5 my-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-[#98A2B3]">{budget.currency}</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={inlineWeekly}
                    onChange={(e) => setInlineWeekly(e.target.value)}
                    className="w-full px-2 py-1 text-sm font-mono font-bold rounded-lg border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/40 text-[#111827] dark:text-white focus:outline-hidden"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={saveWeeklyInline}
                    className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#111111] dark:bg-white dark:text-[#111111] rounded-lg transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInlineWeekly(budget.weekly.toString());
                      setEditingWeekly(false);
                    }}
                    className="px-2 py-1 text-[11px] text-[#667085] hover:text-[#111827] dark:text-[#9CA3AF] rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold font-mono tabular-nums text-[#111827] dark:text-white">
                  {formatAmount(budget.weekly, budget.currency)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInlineWeekly(budget.weekly.toString());
                    setEditingWeekly(true);
                  }}
                  className="text-xs font-semibold text-[#00B86B] hover:text-emerald-700 dark:hover:text-emerald-300 px-2 py-0.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                >
                  [Change]
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-[#E7E7E3]/60 dark:border-[#262B35]/60 text-[11px] text-[#667085] dark:text-[#9CA3AF]">
            <span>Used for 7-day trajectory comparisons</span>
          </div>
        </div>

        {/* Monthly Limit */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
                Monthly Limit
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#6D5DFB] dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center">
                <CalendarRange className="w-4 h-4" />
              </div>
            </div>

            {editingMonthly ? (
              <div className="space-y-1.5 my-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-[#98A2B3]">{budget.currency}</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={inlineMonthly}
                    onChange={(e) => setInlineMonthly(e.target.value)}
                    className="w-full px-2 py-1 text-sm font-mono font-bold rounded-lg border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/40 text-[#111827] dark:text-white focus:outline-hidden"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={saveMonthlyInline}
                    className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#111111] dark:bg-white dark:text-[#111111] rounded-lg transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInlineMonthly(budget.monthly.toString());
                      setEditingMonthly(false);
                    }}
                    className="px-2 py-1 text-[11px] text-[#667085] hover:text-[#111827] dark:text-[#9CA3AF] rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold font-mono tabular-nums text-[#111827] dark:text-white">
                  {formatAmount(budget.monthly, budget.currency)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInlineMonthly(budget.monthly.toString());
                    setEditingMonthly(true);
                  }}
                  className="text-xs font-semibold text-[#00B86B] hover:text-emerald-700 dark:hover:text-emerald-300 px-2 py-0.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                >
                  [Change]
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-[#E7E7E3]/60 dark:border-[#262B35]/60 text-[11px] text-[#667085] dark:text-[#9CA3AF]">
            <span>Monthly spending cap</span>
          </div>
        </div>

        {/* Savings Target */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
                Savings Goal
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              +{formatAmount(budget.monthlySavingsTarget || 10000, budget.currency)}
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-[#E7E7E3]/60 dark:border-[#262B35]/60 text-[11px] text-[#667085] dark:text-[#9CA3AF] flex items-center justify-between">
            <span>Net Surplus:</span>
            <span className={`font-mono font-semibold ${monthNetSurplus >= 0 ? 'text-[#00B86B]' : 'text-[#F43F6E]'}`}>
              {formatAmount(monthNetSurplus, budget.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Budget Settings Form */}
      <form
        onSubmit={handleSaveBudgets}
        className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs transition-colors space-y-6"
      >
        <div>
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">
            Configure Spending Thresholds
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
            Tap a quick preset or type a customized number for your personal finances.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Daily Limit */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#111827] dark:text-neutral-200">
                Daily Expense Limit
              </label>
              <div className="flex items-center gap-1">
                {[200, 500, 1000, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDailyInput(preset.toString())}
                    className="text-[10px] px-1.5 py-0.5 rounded-lg bg-[#FAFAF8] dark:bg-neutral-800 hover:bg-neutral-200 text-[#111827] dark:text-neutral-300 font-mono transition-colors cursor-pointer"
                  >
                    {budget.currency}{preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-mono font-bold text-[#98A2B3]">
                {budget.currency}
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={dailyInput}
                onChange={(e) => setDailyInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm font-mono font-semibold rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/40 text-[#111827] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#111111] dark:focus:ring-white transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF]">
              Controls your Daily Headroom calculation in the Dashboard.
            </p>
          </div>

          {/* Weekly Limit */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#111827] dark:text-neutral-200">
                Weekly Expense Budget
              </label>
              <div className="flex items-center gap-1">
                {[1500, 3500, 7000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setWeeklyInput(preset.toString())}
                    className="text-[10px] px-1.5 py-0.5 rounded-lg bg-[#FAFAF8] dark:bg-neutral-800 hover:bg-neutral-200 text-[#111827] dark:text-neutral-300 font-mono transition-colors cursor-pointer"
                  >
                    {budget.currency}{preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-mono font-bold text-[#98A2B3]">
                {budget.currency}
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={weeklyInput}
                onChange={(e) => setWeeklyInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm font-mono font-semibold rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/40 text-[#111827] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#111111] dark:focus:ring-white transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF]">
              Controls your 7-Day Cash Flow and This Week Overview trajectory.
            </p>
          </div>

          {/* Monthly Limit */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#111827] dark:text-neutral-200">
                Monthly Expense Budget
              </label>
              <div className="flex items-center gap-1">
                {[10000, 15000, 25000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMonthlyInput(preset.toString())}
                    className="text-[10px] px-1.5 py-0.5 rounded-lg bg-[#FAFAF8] dark:bg-neutral-800 hover:bg-neutral-200 text-[#111827] dark:text-neutral-300 font-mono transition-colors cursor-pointer"
                  >
                    {budget.currency}{preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-mono font-bold text-[#98A2B3]">
                {budget.currency}
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={monthlyInput}
                onChange={(e) => setMonthlyInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm font-mono font-semibold rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/40 text-[#111827] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#111111] dark:focus:ring-white transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF]">
              Overall spending cap for monthly financial reviews.
            </p>
          </div>

          {/* Monthly Savings Target */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#111827] dark:text-neutral-200">
                Monthly Savings Target
              </label>
              <div className="flex items-center gap-1">
                {[5000, 10000, 20000, 30000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSavingsInput(preset.toString())}
                    className="text-[10px] px-1.5 py-0.5 rounded-lg bg-[#FAFAF8] dark:bg-neutral-800 hover:bg-neutral-200 text-[#111827] dark:text-neutral-300 font-mono transition-colors cursor-pointer"
                  >
                    +{budget.currency}{preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                +{budget.currency}
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={savingsInput}
                onChange={(e) => setSavingsInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm font-mono font-semibold rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/40 text-[#111827] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#111111] dark:focus:ring-white transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF]">
              Target net cash surplus (Total Incomes minus Total Expenses).
            </p>
          </div>
        </div>

        {/* Currency Selector */}
        <div className="pt-4 border-t border-[#E7E7E3] dark:border-[#262B35]">
          <label className="block text-xs font-semibold text-[#111827] dark:text-white mb-2">
            Active Currency Symbol
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CURRENCIES.map((curr) => {
              const isSelected = budget.currency === curr.symbol;
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => updateBudget({ currency: curr.symbol })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#111111] dark:border-white bg-[#111111]/5 dark:bg-white/10 font-bold'
                      : 'border-[#E7E7E3] dark:border-[#262B35] hover:bg-[#FAFAF8] dark:hover:bg-[#0E1015]/60'
                  }`}
                >
                  <div className="text-sm font-mono font-bold text-[#111827] dark:text-white">
                    {curr.symbol}
                  </div>
                  <div className="text-[10px] text-[#667085] dark:text-[#9CA3AF] mt-0.5 truncate">
                    {curr.code} · {curr.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E7E7E3] dark:border-[#262B35]">
          <div className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-[#9CA3AF]">
            <Sparkles className="w-3.5 h-3.5 text-[#6D5DFB]" />
            <span>Changes persist immediately to your local device and cloud account.</span>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs font-semibold text-[#00B86B] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Updated!
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#111111] dark:bg-white dark:text-[#111111] hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              Save Budget Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
