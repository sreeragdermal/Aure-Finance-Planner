import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useGoogleDrive } from '../../context/GoogleDriveContext';
import { CURRENCIES } from '../../utils/categories';
import {
  Search,
  Sun,
  Moon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Menu,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface TopBarProps {
  onOpenSearch: () => void;
  onOpenMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSearch, onOpenMobileMenu }) => {
  const {
    activeTab,
    budget,
    updateBudget,
    darkMode,
    toggleDarkMode,
    openAddModal,
    syncState,
    forceSyncNow,
  } = useExpenses();

  const { user, signIn, isConnecting, isAutoSyncing } = useGoogleDrive();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'daily':
        return 'Daily Expenses Ledger';
      case 'weekly-monthly':
        return 'Weekly & Monthly Overview';
      case 'charts':
        return 'Annual Financial & Cash Flow';
      case 'budgets':
        return 'Account & Settings';
      case 'budget-limits':
        return 'Budget Limits';
      case 'categories':
        return 'Categories';
      case 'backup':
        return 'Export & Backup';
      default:
        return 'Dashboard';
    }
  };

  const cycleCurrency = () => {
    const currentIndex = CURRENCIES.findIndex((c) => c.symbol === budget.currency);
    const nextIndex = (currentIndex + 1) % CURRENCIES.length;
    updateBudget({ currency: CURRENCIES[nextIndex].symbol });
  };

  return (
    <header className="sticky top-0 z-20 w-full h-15 bg-white/95 dark:bg-[#161922]/95 backdrop-blur-md border-b border-[#E7E7E3] dark:border-[#262B35] px-4 sm:px-6 flex items-center justify-between gap-3 transition-colors">
      {/* Left: Mobile Menu Trigger + Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs min-w-0 truncate">
          <span className="text-[#98A2B3] dark:text-[#6B7280] hidden sm:inline shrink-0">Aura Finance</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#98A2B3] dark:text-[#6B7280] hidden sm:inline shrink-0" />
          <h2 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F3F4F6] truncate">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Global Sync Indicator */}
        <button
          onClick={() => {
            if (isOnline) forceSyncNow();
          }}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FAFAF8] dark:bg-[#0E1015]/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E7E7E3] dark:border-[#262B35] text-xs text-[#667085] dark:text-[#9CA3AF] transition-colors cursor-pointer"
          title={
            !isOnline
              ? "Offline — changes will sync when you're back online"
              : isAutoSyncing || syncState === 'syncing'
              ? 'Syncing changes...'
              : 'All changes saved & synced (click to sync now)'
          }
        >
          {!isOnline ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full border border-amber-500" />
              <span className="text-[11px] text-amber-700 dark:text-amber-400">Offline</span>
            </>
          ) : isAutoSyncing || syncState === 'syncing' ? (
            <>
              <RefreshCw className="w-3 h-3 text-[#00B86B] animate-spin" />
              <span className="text-[11px] text-[#00B86B]">Syncing...</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B86B]" />
              <span className="text-[11px]">Synced</span>
            </>
          )}
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FAFAF8] dark:bg-[#0E1015]/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E7E7E3] dark:border-[#262B35] text-xs text-[#667085] dark:text-[#9CA3AF] transition-colors cursor-pointer"
          title="Search transactions (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#98A2B3] dark:text-[#6B7280]" />
          <span className="hidden md:inline">Search records</span>
          <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-[#E7E7E3] dark:border-[#262B35] text-[#98A2B3]">
            ⌘K
          </kbd>
        </button>

        {/* Currency Selector (cycles on click) */}
        <button
          onClick={cycleCurrency}
          className="px-2.5 py-1.5 rounded-xl bg-[#FAFAF8] dark:bg-[#0E1015]/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E7E7E3] dark:border-[#262B35] text-xs font-mono font-semibold text-[#111827] dark:text-[#F3F4F6] transition-colors cursor-pointer"
          title={`Active currency: ${budget.currency}. Click to switch currency.`}
        >
          {budget.currency}
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Primary Action Buttons (Desktop only >= 1200px) */}
        <div className="hidden xl:flex items-center gap-1.5 ml-1">
          <button
            onClick={() => openAddModal('income')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#00B86B] bg-[#E9FBF3] hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Income</span>
          </button>
          <button
            onClick={() => openAddModal('expense')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#F43F6E] hover:bg-rose-600 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Expense</span>
          </button>
        </div>

        {/* User Sign In / Avatar */}
        {user ? (
          <div className="flex items-center gap-2 pl-1">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-[#00B86B]/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center text-[11px] font-bold">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={signIn}
            disabled={isConnecting}
            className="hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#111827] dark:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors"
          >
            <span>{isConnecting ? 'Signing in...' : 'Sign In'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
