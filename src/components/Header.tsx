import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { PageTab } from '../types/expense';
import {
  Calendar,
  CalendarRange,
  BarChart3,
  Sliders,
  Sun,
  Moon,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Cloud,
  RefreshCw,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openAddModal,
    darkMode,
    toggleDarkMode,
    budget,
  } = useExpenses();

  const { isConnected, user, isAutoSyncing, autoSyncEnabled, openSignInModal, rememberedAccount } = useGoogleDrive();

  const navTabs: { id: PageTab; label: string; icon: React.ReactNode }[] = [
    { id: 'daily', label: 'Daily Ledger', icon: <Calendar className="w-4 h-4" /> },
    { id: 'weekly-monthly', label: 'Weekly & Monthly', icon: <CalendarRange className="w-4 h-4" /> },
    { id: 'charts', label: 'Yearly & Charts', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'budgets', label: 'Account & Settings', icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 w-full max-w-full overflow-hidden bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-xs shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-sm sm:text-base font-semibold tracking-tight text-neutral-900 dark:text-white block leading-tight truncate">
              Aura Finance
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium block truncate">
              Personal Ledger & Calculator
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Visible on Desktop >= 1024px) */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-neutral-100/80 dark:bg-neutral-800/80 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Unified Google Account & Drive Status */}
          {isConnected ? (
            <button
              onClick={() => setActiveTab('budgets')}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-all text-left shadow-2xs group"
              title={`Signed in as ${user?.displayName || user?.email} · Click to manage Account & Settings`}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google Account'}
                  className="w-5 h-5 rounded-md object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center text-[10px] font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 hidden sm:inline max-w-[100px] truncate">
                  {user?.displayName ? user.displayName.split(' ')[0] : user?.email?.split('@')[0]}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  {isAutoSyncing ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  <span className="hidden md:inline text-[10px]">
                    {isAutoSyncing ? 'Syncing' : 'Drive'}
                  </span>
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={openSignInModal}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>Sign In</span>
            </button>
          )}

          {/* Currency Indicator (₹) */}
          <div
            className="flex items-center text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60"
            title="Active Currency: Indian Rupee (₹)"
          >
            {budget.currency}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-hidden"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Desktop Only (>= 1024px): Quick Action Buttons (Mobile & Tablet mode use the Animated Bottom Floating FAB) */}
          <button
            onClick={() => openAddModal('income')}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl transition-all whitespace-nowrap shadow-2xs"
            title="Log Daily Income"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>+ {budget.currency} Income</span>
          </button>

          <button
            onClick={() => openAddModal('expense')}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white rounded-xl shadow-xs transition-all whitespace-nowrap"
            title="Log Daily Expense"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+ {budget.currency} Expense</span>
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Sub-Navigation Bar (< 1024px) */}
      <div className="flex lg:hidden overflow-x-auto px-3 py-2 border-t border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/50 gap-1 scrollbar-none max-w-full">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 transition-colors ${
                isActive
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
