import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import {
  calculateYearlyStats,
  formatAmount,
  formatCompactAmount,
} from '../utils/calculations';
import {
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  BarChart2,
  Calendar,
  Layers,
  PiggyBank,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const ChartsAnalyticsView: React.FC = () => {
  const { expenses, incomes, budget } = useExpenses();

  // Year state
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  // Hovered state for 12-month chart
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  // Category donut tab: 'expenses' or 'income'
  const [categoryDonutTab, setCategoryDonutTab] = useState<'expenses' | 'income'>('expenses');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Calculate Yearly stats automatically
  const yearlyStats = calculateYearlyStats(expenses, incomes, selectedYear);

  const handlePrevYear = () => setSelectedYear((y) => y - 1);
  const handleNextYear = () => setSelectedYear((y) => y + 1);

  // Scaling for 12-month bar chart (compare income & expenses max)
  const maxMonthValue = Math.max(
    ...yearlyStats.monthsData.map((m) => Math.max(m.expenseTotal, m.incomeTotal)),
    50
  );

  // Prepare Donut Chart slices for chosen tab
  const center = 150;
  const radius = 95;
  const circumference = 2 * Math.PI * radius;

  const currentCategoryList =
    categoryDonutTab === 'expenses'
      ? yearlyStats.categoryBreakdown
      : yearlyStats.incomeCategoryBreakdown;

  let cumulativePercent = 0;
  const donutSlices = currentCategoryList.map((cat) => {
    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += cat.percentage;

    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Top Year Selector */}
      <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Annual Financial & Cash Flow Analytics
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Automatic yearly rollups for expenses, income, and net savings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevYear}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Previous Year"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold font-mono text-neutral-900 dark:text-white px-3 py-1 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200/60 dark:border-neutral-700">
            {selectedYear}
          </span>
          <button
            onClick={handleNextYear}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Next Year"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Annual KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Annual Income */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <span>Annual Income ({selectedYear})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{formatAmount(yearlyStats.incomeTotal, budget.currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Avg +{formatAmount(yearlyStats.monthlyAverageIncome, budget.currency)} / mo
          </div>
        </div>

        {/* Total Annual Expenses */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <span>Annual Expenses ({selectedYear})</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
            {formatAmount(yearlyStats.expenseTotal, budget.currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Avg {formatAmount(yearlyStats.monthlyAverageExpense, budget.currency)} / mo
          </div>
        </div>

        {/* Net Cash Flow / Savings */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <span>Net Annual Savings</span>
            <PiggyBank className="w-4 h-4 text-neutral-400" />
          </div>
          <div
            className={`text-2xl font-mono font-semibold tabular-nums ${
              yearlyStats.netTotal >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {yearlyStats.netTotal > 0 ? '+' : ''}
            {formatAmount(yearlyStats.netTotal, budget.currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {yearlyStats.incomeTotal > 0
              ? `${yearlyStats.savingsRate.toFixed(1)}% annual savings rate`
              : 'No income logged'}
          </div>
        </div>

        {/* Peak Expense Month */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <span>Peak Spending Month</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          {yearlyStats.peakMonth ? (
            <>
              <div className="text-2xl font-semibold text-neutral-900 dark:text-white truncate">
                {yearlyStats.peakMonth.monthLong}
              </div>
              <div className="mt-2 text-xs font-mono text-rose-600 dark:text-rose-400">
                {formatAmount(yearlyStats.peakMonth.expenseTotal, budget.currency)} spent
              </div>
            </>
          ) : (
            <div className="text-xs text-neutral-400 italic mt-3">No expenses recorded</div>
          )}
        </div>
      </div>

      {/* 12-Month Comparative Bar Chart (Income vs Expense) */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Monthly Income vs Spending Comparison
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              12-month visual trajectory of earnings (emerald) vs spending (rose)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              Income
            </span>
            <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80 dark:bg-rose-400/80" />
              Expense
            </span>
          </div>
        </div>

        {/* Bar chart container */}
        <div className="h-64 flex items-end justify-between gap-1 sm:gap-3 pt-6 pb-2 border-b border-neutral-200/60 dark:border-neutral-800 relative">
          {yearlyStats.monthsData.map((m) => {
            const expHeight = maxMonthValue > 0 ? (m.expenseTotal / maxMonthValue) * 100 : 0;
            const incHeight = maxMonthValue > 0 ? (m.incomeTotal / maxMonthValue) * 100 : 0;
            const isHovered = hoveredMonthIndex === m.monthIndex;

            return (
              <div
                key={m.monthIndex}
                onMouseEnter={() => setHoveredMonthIndex(m.monthIndex)}
                onMouseLeave={() => setHoveredMonthIndex(null)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              >
                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute -top-16 z-20 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] py-1.5 px-2.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                    <div className="font-semibold">{m.monthLong}</div>
                    <div className="text-emerald-400 dark:text-emerald-600">
                      In: +{formatAmount(m.incomeTotal, budget.currency)}
                    </div>
                    <div className="text-rose-400 dark:text-rose-600">
                      Out: -{formatAmount(m.expenseTotal, budget.currency)}
                    </div>
                  </div>
                )}

                {/* Dual Bars */}
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Income Bar */}
                  <div
                    className="w-1/2 rounded-t-sm bg-emerald-500/80 group-hover:bg-emerald-500 transition-all duration-300 min-h-[3px]"
                    style={{ height: `${Math.max(incHeight, 3)}%` }}
                  />
                  {/* Expense Bar */}
                  <div
                    className="w-1/2 rounded-t-sm bg-rose-500/80 dark:bg-rose-400/80 group-hover:bg-rose-500 transition-all duration-300 min-h-[3px]"
                    style={{ height: `${Math.max(expHeight, 3)}%` }}
                  />
                </div>

                {/* Label */}
                <span className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-mono">
                  {m.monthShort}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donut Category Breakdown + Top Records Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Category Distribution
              </h3>
            </div>

            {/* Switch between Expense Donut and Income Donut */}
            <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <button
                onClick={() => setCategoryDonutTab('expenses')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  categoryDonutTab === 'expenses'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setCategoryDonutTab('income')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  categoryDonutTab === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {currentCategoryList.length === 0 ||
          (categoryDonutTab === 'expenses' && yearlyStats.expenseTotal === 0) ||
          (categoryDonutTab === 'income' && yearlyStats.incomeTotal === 0) ? (
            <div className="h-64 flex items-center justify-center text-xs text-neutral-400 italic">
              No {categoryDonutTab} data recorded for this year
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* SVG Donut */}
              <div className="relative w-48 h-48 shrink-0">
                <svg viewBox="0 0 300 300" className="w-full h-full -rotate-90">
                  {donutSlices.map((slice) => {
                    if (slice.percentage <= 0) return null;
                    return (
                      <circle
                        key={slice.id}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="38"
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        onMouseEnter={() => setHoveredCategory(slice.id)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    );
                  })}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xs text-neutral-400 font-medium">Total</span>
                  <span className="text-base font-semibold font-mono text-neutral-900 dark:text-white">
                    {formatCompactAmount(
                      categoryDonutTab === 'expenses'
                        ? yearlyStats.expenseTotal
                        : yearlyStats.incomeTotal,
                      budget.currency
                    )}
                  </span>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
                {currentCategoryList.map((cat) => {
                  if (cat.amount <= 0) return null;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-neutral-800 dark:text-neutral-200 truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="text-neutral-500 text-[11px]">
                          {cat.percentage.toFixed(1)}%
                        </span>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {formatAmount(cat.amount, budget.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Transactions: Incomes & Expenses */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-neutral-500" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Top Single Transactions ({selectedYear})
            </h3>
          </div>

          <div className="space-y-4">
            {/* Top Incomes */}
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                Top Incomes
              </span>
              <div className="mt-1.5 divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-xl overflow-hidden">
                {yearlyStats.topIncomes.length === 0 ? (
                  <div className="p-3 text-xs text-neutral-400 italic">No income entries</div>
                ) : (
                  yearlyStats.topIncomes.map((inc) => (
                    <div key={inc.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {inc.title}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">{inc.date}</div>
                      </div>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatAmount(inc.amount, budget.currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Expenses */}
            <div>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px]">
                Top Expenses
              </span>
              <div className="mt-1.5 divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-xl overflow-hidden">
                {yearlyStats.topExpenses.length === 0 ? (
                  <div className="p-3 text-xs text-neutral-400 italic">No expense entries</div>
                ) : (
                  yearlyStats.topExpenses.map((exp) => (
                    <div key={exp.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {exp.title}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">{exp.date}</div>
                      </div>
                      <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                        {formatAmount(exp.amount, budget.currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
