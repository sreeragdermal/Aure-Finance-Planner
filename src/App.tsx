/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext';
import { GoogleDriveProvider, useGoogleDrive } from './context/GoogleDriveContext';
import { Header } from './components/Header';
import { DailyTracker } from './components/DailyTracker';
import { WeeklyMonthlyView } from './components/WeeklyMonthlyView';
import { ChartsAnalyticsView } from './components/ChartsAnalyticsView';
import { BudgetSettingsView } from './components/BudgetSettingsView';
import { AddExpenseModal } from './components/AddExpenseModal';
import { BottomFloatingModel } from './components/BottomFloatingModel';
import { SignInModal } from './components/SignInModal';
import { AdminStatsModal } from './components/AdminStatsModal';
import { Code2, Heart, Sparkles, BarChart2 } from 'lucide-react';

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

const MainContent: React.FC = () => {
  const { activeTab, isAddModalOpen, setIsAddModalOpen, selectedDate } = useExpenses();
  const { isSignInModalOpen, closeSignInModal, user } = useGoogleDrive();
  const [isAdminModalOpen, setIsAdminModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#FBFBFB] dark:bg-[#0F1117] text-neutral-900 dark:text-neutral-100 transition-colors">
      <AutoSyncWatcher />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-7 pb-28 lg:pb-10 overflow-x-hidden">
        {activeTab === 'daily' && <DailyTracker />}
        {activeTab === 'weekly-monthly' && <WeeklyMonthlyView />}
        {activeTab === 'charts' && <ChartsAnalyticsView />}
        {activeTab === 'budgets' && <BudgetSettingsView />}
      </main>

      {/* Welcome & Facilities Sign-In Gateway Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={closeSignInModal}
        canDismiss={true}
      />

      {/* Admin Analytics Modal */}
      <AdminStatsModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUserEmail={user?.email}
      />

      {/* Global Add Expense & Income Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultDate={selectedDate}
      />

      {/* Floating Plus Button with Animated Popup (Mobile & Tablet: lg:hidden) */}
      <BottomFloatingModel />

      {/* Prominent Footer clearly displaying Designed & Developed by Sreerag Dermal */}
      <footer className="border-t border-neutral-200/80 dark:border-neutral-800/80 py-6 text-center text-xs text-neutral-600 dark:text-neutral-400 mb-16 lg:mb-0 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left">
            <span className="font-semibold text-neutral-900 dark:text-white tracking-tight">
              Aura Finance
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">·</span>
            <span className="text-neutral-500 dark:text-neutral-400">
              Daily, Weekly & Yearly Financial Calculator
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs">
              <Code2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <button
                onClick={() => {
                  if (user?.email?.toLowerCase() === 'sreeragdermal@gmail.com') {
                    setIsAdminModalOpen(true);
                  }
                }}
                className={`text-xs text-neutral-600 dark:text-neutral-300 ${
                  user?.email?.toLowerCase() === 'sreeragdermal@gmail.com'
                    ? 'hover:text-neutral-900 dark:hover:text-white cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                Designed and Developed by{' '}
                <strong className="font-bold text-neutral-900 dark:text-white">
                  Sreerag Dermal
                </strong>
              </button>
              {/* Private Admin pill: Visible ONLY to owner Sreerag Dermal */}
              {user?.email?.toLowerCase() === 'sreeragdermal@gmail.com' && (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="ml-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-80 transition-opacity cursor-pointer"
                  title="Private Owner Console"
                >
                  Owner Console
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ExpenseProvider>
      <GoogleDriveProvider>
        <MainContent />
      </GoogleDriveProvider>
    </ExpenseProvider>
  );
}
