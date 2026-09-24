import React, { useState, useRef } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { GoogleDriveSyncSection } from './GoogleDriveSyncSection';
import { AdminStatsModal } from './AdminStatsModal';
import { CURRENCIES } from '../utils/categories';
import { formatAmount } from '../utils/calculations';
import {
  DollarSign,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  AlertCircle,
  FileSpreadsheet,
  PiggyBank,
  Sparkles,
  ShieldCheck,
  UserCheck,
  BarChart2,
  Smartphone,
  Laptop,
  Globe,
} from 'lucide-react';

export const BudgetSettingsView: React.FC = () => {
  const {
    budget,
    updateBudget,
    expenses,
    incomes,
    resetToSample,
    clearAll,
    importAllData,
  } = useExpenses();

  const { user, isConnected, openSignInModal, rememberedAccount } = useGoogleDrive();

  const [dailyInput, setDailyInput] = useState(budget.daily.toString());
  const [weeklyInput, setWeeklyInput] = useState(budget.weekly.toString());
  const [monthlyInput, setMonthlyInput] = useState(budget.monthly.toString());
  const [savingsInput, setSavingsInput] = useState((budget.monthlySavingsTarget || 10000).toString());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  // Keep form inputs synced with context
  React.useEffect(() => {
    setDailyInput(budget.daily.toString());
    setWeeklyInput(budget.weekly.toString());
    setMonthlyInput(budget.monthly.toString());
    setSavingsInput((budget.monthlySavingsTarget || 10000).toString());
  }, [budget.daily, budget.weekly, budget.monthly, budget.monthlySavingsTarget]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveBudgets = (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseFloat(dailyInput) || 0;
    const w = parseFloat(weeklyInput) || 0;
    const m = parseFloat(monthlyInput) || 0;
    const s = parseFloat(savingsInput) || 0;

    updateBudget({
      daily: d,
      weekly: w,
      monthly: m,
      monthlySavingsTarget: s,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // CSV Export (combining both Expenses & Incomes with a Type column)
  const handleExportCSV = () => {
    if (expenses.length === 0 && incomes.length === 0) return;

    const headers = ['Type', 'ID', 'Date', 'Time', 'Title', 'Category', 'Amount', 'Payment Method', 'Notes'];

    const expenseRows = expenses.map((e) => [
      'Expense',
      `"${e.id}"`,
      `"${e.date}"`,
      `"${e.time || ''}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      -e.amount,
      `"${e.paymentMethod || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const incomeRows = incomes.map((inc) => [
      'Income',
      `"${inc.id}"`,
      `"${inc.date}"`,
      `"${inc.time || ''}"`,
      `"${inc.title.replace(/"/g, '""')}"`,
      `"${inc.category}"`,
      inc.amount,
      `"${inc.paymentMethod || ''}"`,
      `"${(inc.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...expenseRows.map((r) => r.join(',')), ...incomeRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aura_finance_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export (full personal backup)
  const handleExportJSON = () => {
    const backupObj = {
      version: 2,
      exportDate: new Date().toISOString(),
      budget,
      expenses,
      incomes,
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aura_personal_finance_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.expenses || parsed.incomes) {
          importAllData({
            expenses: parsed.expenses || [],
            incomes: parsed.incomes || [],
          });
          if (parsed.budget) {
            updateBudget(parsed.budget);
          }
          alert('Data backup successfully restored!');
        } else if (Array.isArray(parsed)) {
          // Backward compatibility
          importAllData({ expenses: parsed, incomes: [] });
          alert('Expenses successfully imported!');
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Account & Settings
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                Google Powered
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Your Google identity, real-time Google Drive auto-sync, family sharing, and financial budget thresholds.
            </p>
          </div>

          {!isConnected && (
            <button
              onClick={openSignInModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs font-semibold shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>

        {/* Current status pill */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-medium border border-emerald-200/70 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Account: {user?.email} · Remembered
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sign-in recommended for automatic Drive backups
            </span>
          )}
          <span className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
            {expenses.length} Expenses Saved
          </span>
          <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono border border-emerald-200/60 dark:border-emerald-800/60">
            {incomes.length} Incomes Saved
          </span>
          <span className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
            Currency: {budget.currency}
          </span>
          {user?.email?.toLowerCase() === 'sreeragdermal@gmail.com' && (
            <button
              onClick={() => setAdminModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200/80 dark:border-indigo-800 transition-colors cursor-pointer"
              title="View private metrics"
            >
              <BarChart2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Owner Stats</span>
            </button>
          )}
        </div>
      </div>

      {/* Google Drive Personal Storage & Multi-Person Sync */}
      <GoogleDriveSyncSection />

      {/* Currency Selector */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
          Preferred Currency
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Select the currency symbol used across all calculations and inputs
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CURRENCIES.map((curr) => {
            const isSelected = budget.currency === curr.symbol;
            return (
              <button
                key={curr.code}
                onClick={() => updateBudget({ currency: curr.symbol })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-neutral-900 dark:border-white bg-neutral-900/5 dark:bg-white/5 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="text-base font-mono font-semibold text-neutral-900 dark:text-white">
                  {curr.symbol}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {curr.code} · {curr.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget & Goals Form */}
      <form
        onSubmit={handleSaveBudgets}
        className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors space-y-4"
      >
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Budget Limits & Target Goals
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Set expense thresholds for daily headroom tracking and monthly savings targets
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Daily Limit */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Daily Expense Quota / Limit ({budget.currency})
              </label>
              <div className="flex items-center gap-1">
                {[200, 500, 1000, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDailyInput(preset.toString())}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono transition-colors"
                  >
                    {budget.currency}{preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 font-mono text-xs">
                {budget.currency}
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={dailyInput}
                onChange={(e) => setDailyInput(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Personal daily spending cap (user customizable)
            </p>
          </div>

          {/* Weekly Limit */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Weekly Expense Budget ({budget.currency})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 font-mono text-xs">
                {budget.currency}
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={weeklyInput}
                onChange={(e) => setWeeklyInput(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Used for 7-day spending comparison</p>
          </div>

          {/* Monthly Limit */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Monthly Expense Budget ({budget.currency})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 font-mono text-xs">
                {budget.currency}
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={monthlyInput}
                onChange={(e) => setMonthlyInput(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Monthly spending cap</p>
          </div>

          {/* Monthly Savings Target */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Monthly Savings Target ({budget.currency})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                +{budget.currency}
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={savingsInput}
                onChange={(e) => setSavingsInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs font-mono font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Target net surplus (Income - Expenses)</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saveSuccess && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Settings updated
            </span>
          )}
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white rounded-xl shadow-xs transition-all"
          >
            Save Budget Settings
          </button>
        </div>
      </form>

      {/* Personal Data & Backup Section */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Data Backup & Privacy
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            All your financial records are stored securely and privately in your browser's local storage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
          >
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Spreadsheet (CSV)</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                All expenses & incomes compatible with Excel / Sheets
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400 shrink-0" />
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
          >
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                <span>Full Backup (JSON)</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Complete restore file of your personal finances
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400 shrink-0" />
          </button>

          {/* Import JSON */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  <span>Restore from Backup (JSON)</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Import a previously exported JSON backup
                </div>
              </div>
              <Upload className="w-4 h-4 text-neutral-400 shrink-0" />
            </button>
          </div>

          {/* Optional Demo Data */}
          <button
            onClick={() => {
              if (window.confirm('Load sample preview data? This will add demo records for previewing charts.')) {
                resetToSample();
              }
            }}
            className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
          >
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Load Sample Preview Data</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Populate a few demo records to preview features
              </div>
            </div>
            <RotateCcw className="w-4 h-4 text-neutral-400 shrink-0" />
          </button>
        </div>

        {/* Clear Data (Start Fresh for personal use) */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
          {confirmClearOpen ? (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Clear all personal data & start fresh?</span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  This permanently removes all expenses and incomes from your device.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmClearOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearAll();
                    setConfirmClearOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClearOpen(true)}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all data & reset to blank personal ledger</span>
            </button>
          )}
        </div>
      </div>

      {/* Web-Based Application & Install on Phone (PWA) Guide */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Web-Based Application (PWA)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Installable
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Aura Finance runs entirely as a modern Web App in any browser (Chrome, Safari, Edge, Firefox) without requiring an app store download.
            </p>
          </div>

          {user?.email?.toLowerCase() === 'sreeragdermal@gmail.com' && (
            <button
              onClick={() => setAdminModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-200 shrink-0 cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Owner Stats</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-750 space-y-1">
            <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Android & Chrome</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Tap browser menu (⋮) → tap <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong> to use as a full-screen app.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-750 space-y-1">
            <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>iPhone (iOS Safari)</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Tap the Share button (<span className="font-mono">⎋</span>) in Safari → tap <strong>"Add to Home Screen"</strong> for instant mobile launch.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-750 space-y-1">
            <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-purple-600" />
              <span>Windows & Mac PC</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              In Chrome or Edge, click the <strong>Install App icon</strong> on the address bar to open in its own clean desktop window.
            </p>
          </div>
        </div>
      </div>

      {/* Admin & Creator Analytics Modal */}
      <AdminStatsModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        currentUserEmail={user?.email}
      />
    </div>
  );
};
