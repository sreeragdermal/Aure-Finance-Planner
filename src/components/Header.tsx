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

  const { user, signIn, signOut, isConnecting } = useGoogleDrive();

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
          {/* User Sign In / Profile */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 text-xs">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="font-medium text-neutral-800 dark:text-neutral-200 hidden sm:inline max-w-[100px] truncate text-[11px]">
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
              <button
                onClick={signOut}
                className="text-[10px] text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors ml-1 cursor-pointer"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              disabled={isConnecting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-2xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              title="Sign in with Google to save and sync data"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isConnecting ? 'Signing in...' : 'Sign In'}</span>
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
