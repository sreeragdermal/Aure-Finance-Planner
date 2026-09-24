import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import {
  calculateWeeklyStats,
  calculateMonthlyStats,
  formatAmount,
  toDateString,
} from '../utils/calculations';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  ArrowRight,
  PiggyBank,
} from 'lucide-react';

export const WeeklyMonthlyView: React.FC = () => {
  const { expenses, incomes, budget, setSelectedDate, setActiveTab } = useExpenses();

  // Mode: 'weekly' or 'monthly'
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  // Reference date for weekly calculation
  const [weekRefDate, setWeekRefDate] = useState(() => toDateString());

  // Reference month for monthly calculation ('YYYY-MM')
  const [monthRefStr, setMonthRefStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Calculate stats automatically with both expenses and incomes
  const weeklyStats = calculateWeeklyStats(expenses, incomes, weekRefDate);
  const monthlyStats = calculateMonthlyStats(expenses, incomes, monthRefStr);
  const topCategory = weeklyStats.topCategory;
  const topIncomeCategory = weeklyStats.topIncomeCategory;

  // Weekly navigation
  const handlePrevWeek = () => {
    const [y, m, d] = weekRefDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 7);
    setWeekRefDate(toDateString(prev));
  };

  const handleNextWeek = () => {
    const [y, m, d] = weekRefDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 7);
    setWeekRefDate(toDateString(next));
  };

  const handleCurrentWeek = () => {
    setWeekRefDate(toDateString());
  };

  // Monthly navigation
  const handlePrevMonth = () => {
    const [y, m] = monthRefStr.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setMonthRefStr(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleNextMonth = () => {
    const [y, m] = monthRefStr.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setMonthRefStr(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleCurrentMonth = () => {
    const d = new Date();
    setMonthRefStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Budget calculations
  const weeklyBudget = budget.weekly || 3500;
  const monthlyBudget = budget.monthly || 15000;

  const weeklyBudgetPercent = Math.min((weeklyStats.expenseTotal / weeklyBudget) * 100, 100);
  const isWeeklyOver = weeklyStats.expenseTotal > weeklyBudget;

  const monthlyBudgetPercent = Math.min((monthlyStats.expenseTotal / monthlyBudget) * 100, 100);
  const isMonthlyOver = monthlyStats.expenseTotal > monthlyBudget;

  // Jump to daily ledger
  const jumpToDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    setActiveTab('daily');
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Top Toggle & Period Selector */}
      <div className="bg-white dark:bg-neutral-900 p-3.5 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-full overflow-hidden">
        {/* Toggle Weekly vs Monthly */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-w-0 ${
              viewMode === 'weekly'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Weekly</span>
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-w-0 ${
              viewMode === 'monthly'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Monthly</span>
          </button>
        </div>

        {/* Date Period Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          {viewMode === 'weekly' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-semibold font-mono text-neutral-900 dark:text-white px-2.5 py-1 bg-neutral-50 dark:bg-neutral-800/80 rounded-lg border border-neutral-200/60 dark:border-neutral-700">
                {weeklyStats.startStr} to {weeklyStats.endStr}
              </div>
              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleCurrentWeek}
                className="text-xs font-medium px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100"
              >
                This Week
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-semibold text-neutral-900 dark:text-white px-3 py-1 bg-neutral-50 dark:bg-neutral-800/80 rounded-lg border border-neutral-200/60 dark:border-neutral-700">
                {monthlyStats.monthName} {monthRefStr.split('-')[0]}
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleCurrentMonth}
                className="text-xs font-medium px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100"
              >
                This Month
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: WEEKLY VIEW */}
      {viewMode === 'weekly' && (
        <div className="space-y-6">
          {/* 4 Weekly Financial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Week Income */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                <span>Week's Income</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{formatAmount(weeklyStats.incomeTotal, budget.currency)}
              </div>
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Avg +{formatAmount(weeklyStats.dailyAverageIncome, budget.currency)} / day
              </div>
            </div>

            {/* Total Week Expenses */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                <span>Week's Spending</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="text-2xl font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                {formatAmount(weeklyStats.expenseTotal, budget.currency)}
              </div>
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Avg {formatAmount(weeklyStats.dailyAverageExpense, budget.currency)} / day
              </div>
            </div>

            {/* Net Weekly Cash Flow */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                <span>Net Cash Surplus</span>
                <PiggyBank className="w-4 h-4 text-neutral-400" />
              </div>
              <div
                className={`text-2xl font-mono font-semibold tabular-nums ${
                  weeklyStats.netTotal >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {weeklyStats.netTotal > 0 ? '+' : ''}
                {formatAmount(weeklyStats.netTotal, budget.currency)}
              </div>
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                {weeklyStats.incomeTotal > 0
                  ? `${weeklyStats.savingsRate.toFixed(1)}% savings rate`
                  : 'No income logged'}
              </div>
            </div>

            {/* Expense Budget Headroom */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                <span>Weekly Budget Limit</span>
                <span className="font-mono text-[11px]">
                  {formatAmount(weeklyBudget, budget.currency)}
                </span>
              </div>
              <div className="text-2xl font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                {weeklyBudgetPercent.toFixed(0)}%
              </div>
              <div className="mt-2 text-xs">
                {isWeeklyOver ? (
                  <span className="text-rose-600 dark:text-rose-400">
                    Over budget by {formatAmount(weeklyStats.expenseTotal - weeklyBudget, budget.currency)}
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatAmount(weeklyBudget - weeklyStats.expenseTotal, budget.currency)} remaining
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top Categories Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                Top Spending Category This Week
              </div>
              {topCategory ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {topCategory.name}
                  </div>
                  <div className="text-sm font-mono font-semibold text-rose-600 dark:text-rose-400">
                    {formatAmount(topCategory.amount, budget.currency)}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-400 italic">No expenses recorded</div>
              )}
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                Top Income Source This Week
              </div>
              {topIncomeCategory ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {topIncomeCategory.name}
                  </div>
                  <div className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    +{formatAmount(topIncomeCategory.amount, budget.currency)}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-400 italic">No income recorded</div>
              )}
            </div>
          </div>

          {/* Day-by-Day Comparative Table / Cards */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-colors">
            <div className="p-4 sm:px-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  7-Day Distribution (Expense vs Income)
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Click any day to jump straight to its daily ledger
                </p>
              </div>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {weeklyStats.dayBreakdown.map((day) => {
                const isSelectedToday = day.date === toDateString();
                return (
                  <div
                    key={day.date}
                    onClick={() => jumpToDay(day.date)}
                    className="p-3.5 sm:px-6 flex items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 text-center">
                        <span className="block text-xs font-semibold text-neutral-900 dark:text-white">
                          {day.dayShort}
                        </span>
                        <span className="block text-[10px] font-mono text-neutral-400">
                          {day.date.split('-')[2]}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <span>{day.dayLong}</span>
                          {isSelectedToday && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +{formatAmount(day.incomeTotal, budget.currency)} in
                          </span>
                          <span>·</span>
                          <span className="text-rose-600 dark:text-rose-400">
                            -{formatAmount(day.expenseTotal, budget.currency)} out
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div
                          className={`text-sm font-mono font-semibold tabular-nums ${
                            day.netBalance > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : day.netBalance < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-neutral-500'
                          }`}
                        >
                          {day.netBalance > 0 ? '+' : ''}
                          {formatAmount(day.netBalance, budget.currency)}
                        </div>
                        <div className="text-[10px] text-neutral-400">net flow</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 group-hover:text-neutral-900 dark:group-hover:text-white transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MONTHLY VIEW */}
      {viewMode === 'monthly' && (
        <div className="space-y-6">
          {/* 4 Monthly Financial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Month Income */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                <span>Month's Income</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{formatAmount(monthlyStats.incomeTotal, budget.currency)}
              </div>
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Projected: +{formatAmount(monthlyStats.projectedIncomeTotal, budget.currency)}
              </div>
            </div>

            {/* Total Month Expenses */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                <span>Month's Spending</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="text-2xl font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                {formatAmount(monthlyStats.expenseTotal, budget.currency)}
              </div>
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Projected: {formatAmount(monthlyStats.projectedExpenseTotal, budget.currency)}
              </div>
            </div>

            {/* Net Monthly Cash Flow / Savings */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                <span>Net Savings</span>
                <PiggyBank className="w-4 h-4 text-neutral-400" />
              </div>
              <div
                className={`text-2xl font-mono font-semibold tabular-nums ${
                  monthlyStats.netTotal >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {monthlyStats.netTotal > 0 ? '+' : ''}
                {formatAmount(monthlyStats.netTotal, budget.currency)}
              </div>
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                {monthlyStats.incomeTotal > 0
                  ? `${monthlyStats.savingsRate.toFixed(1)}% savings rate`
                  : 'No income logged'}
              </div>
            </div>

            {/* Monthly Budget Progress */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                <span>Monthly Budget</span>
                <span className="font-mono text-[11px]">
                  {formatAmount(monthlyBudget, budget.currency)}
                </span>
              </div>
              <div className="text-2xl font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                {monthlyBudgetPercent.toFixed(0)}%
              </div>
              <div className="mt-2 text-xs">
                {isMonthlyOver ? (
                  <span className="text-rose-600 dark:text-rose-400">
                    Over limit by {formatAmount(monthlyStats.expenseTotal - monthlyBudget, budget.currency)}
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatAmount(monthlyBudget - monthlyStats.expenseTotal, budget.currency)} headroom
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Week-by-Week Intervals inside Month */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-colors">
            <div className="p-4 sm:px-6 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Monthly Breakdown by Week
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Pacing comparison across 7-day intervals
              </p>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {monthlyStats.weeks.map((w, idx) => (
                <div key={idx} className="p-4 sm:px-6 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                      {w.label}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-2 font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        +{formatAmount(w.incomeTotal, budget.currency)} in
                      </span>
                      <span>·</span>
                      <span className="text-rose-600 dark:text-rose-400">
                        -{formatAmount(w.expenseTotal, budget.currency)} out
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-mono font-semibold tabular-nums ${
                        w.netBalance > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : w.netBalance < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-neutral-500'
                      }`}
                    >
                      {w.netBalance > 0 ? '+' : ''}
                      {formatAmount(w.netBalance, budget.currency)}
                    </div>
                    <div className="text-[10px] text-neutral-400">net flow</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
