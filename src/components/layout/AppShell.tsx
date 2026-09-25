import React, { useState, useEffect, useRef } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useGoogleDrive } from '../../context/GoogleDriveContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { AddExpenseModal } from '../AddExpenseModal';
import { DashboardView } from '../dashboard/DashboardView';
import { DailyTracker } from '../DailyTracker';
import { WeeklyMonthlyView } from '../WeeklyMonthlyView';
import { ChartsAnalyticsView } from '../ChartsAnalyticsView';
import { BudgetSettingsView } from '../BudgetSettingsView';
import { BudgetLimitsView } from '../tools/BudgetLimitsView';
import { CategoriesView } from '../tools/CategoriesView';
import { ExportBackupView } from '../tools/ExportBackupView';
import { GoogleLoginReminder } from '../common/GoogleLoginReminder';
import { Code2, Heart, ShieldCheck, X } from 'lucide-react';

/**
 * Background watcher that automatically syncs ledger records into Google Drive
 */
const AutoSyncWatcher: React.FC = () => {
  const { expenses, incomes, budget } = useExpenses();
  const { isConnected, autoSyncEnabled, triggerAutoSync } = useGoogleDrive();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isConnected && autoSyncEnabled) {
      triggerAutoSync({ expenses, incomes, budget });
    }
  }, [expenses, incomes, budget, isConnected, autoSyncEnabled, triggerAutoSync]);

  return null;
};

export const AppShell: React.FC = () => {
  const { activeTab, setActiveTab, isAddModalOpen, setIsAddModalOpen, selectedDate } = useExpenses();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global keyboard shortcut: Cmd+K / Ctrl+K opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex w-full max-w-full bg-[#FAFAF8] dark:bg-[#0E1015] text-[#111827] dark:text-[#F3F4F6] transition-colors overflow-x-hidden">
      <AutoSyncWatcher />

      {/* Desktop & Tablet Sidebar (collapsed 72px on tablet 768-1199px, full 250px on desktop >= 1200px, hidden on mobile < 768px) */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay (< 768px) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-[280px] h-full bg-white dark:bg-[#161922] shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#E7E7E3] dark:border-[#262B35] flex items-center justify-between">
              <span className="text-sm font-bold text-[#111827] dark:text-white">Aura Finance Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-[#667085] hover:text-[#111827] dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                isDrawer
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        {/* Top Header */}
        <TopBar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* View Router with Controlled Spacing (max-w-[1500px]) */}
        <main className="flex-1 w-full max-w-[1500px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-5 pb-20 md:pb-8 min-w-0 overflow-x-hidden">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'daily' && <DailyTracker />}
          {activeTab === 'weekly-monthly' && <WeeklyMonthlyView />}
          {activeTab === 'charts' && <ChartsAnalyticsView />}
          {activeTab === 'budgets' && <BudgetSettingsView />}
          {activeTab === 'budget-limits' && <BudgetLimitsView />}
          {activeTab === 'categories' && <CategoriesView />}
          {activeTab === 'backup' && <ExportBackupView />}
        </main>

        {/* Calm, Ultra-Compact Refined Footer */}
        <footer className="border-t border-[#E7E7E3] dark:border-[#262B35] py-3 px-4 sm:px-8 text-[11px] text-[#667085] dark:text-[#9CA3AF] bg-white/60 dark:bg-[#161922]/60 backdrop-blur-xs transition-colors mb-16 md:mb-0">
          <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#111827] dark:text-white">Aura Finance 2.0</span>
              <span>·</span>
              <span>Personal Ledger & Calculator</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
              <span>Designed & Developed by</span>
              <strong className="font-semibold text-[#111827] dark:text-white">Sreerag Dermal</strong>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation (< 1024px) */}
      <MobileNav />

      {/* Global Add Transaction Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultDate={selectedDate}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Google Login Reminder & Cloud Sync Notification */}
      <GoogleLoginReminder />
    </div>
  );
};
