import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useGoogleDrive } from '../../context/GoogleDriveContext';
import { PageTab } from '../../types/expense';
import {
  LayoutDashboard,
  Calendar,
  CalendarRange,
  BarChart3,
  Sliders,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Tags,
  Download,
  Wallet,
  LogOut,
  LogIn,
} from 'lucide-react';

interface SidebarProps {
  isDrawer?: boolean;
  onClose?: () => void;
  onOpenExportBackup?: () => void;
  onOpenCategories?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isDrawer = false,
  onClose,
  onOpenExportBackup,
  onOpenCategories,
}) => {
  const {
    activeTab,
    setActiveTab,
    openAddModal,
    cloudUser,
    accountEmail,
  } = useExpenses();

  const { user, signIn, signOut } = useGoogleDrive();

  const effectiveEmail = user?.email || cloudUser?.email || accountEmail || 'Sreeragdermal@gmail.com';
  const effectiveName = user?.displayName || 'Sreerag Dermal';

  const navItems: { id: PageTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily', label: 'Daily Ledger', icon: Calendar },
    { id: 'weekly-monthly', label: 'Weekly & Monthly', icon: CalendarRange },
    { id: 'charts', label: 'Yearly & Charts', icon: BarChart3 },
    { id: 'budgets', label: 'Account & Settings', icon: Sliders },
  ];

  // Base layout styles depending on whether rendered as standalone drawer or responsive sidebar
  const asideWidth = isDrawer ? 'w-full' : 'w-[72px] xl:w-[250px]';
  const paddingX = isDrawer ? 'px-4' : 'px-2 xl:px-4';
  const textDisplay = isDrawer ? 'inline' : 'hidden xl:inline';
  const blockDisplay = isDrawer ? 'block' : 'hidden xl:block';
  const itemJustify = isDrawer ? 'justify-start' : 'justify-center xl:justify-start';

  return (
    <aside
      className={`${asideWidth} h-screen sticky top-0 bg-white dark:bg-[#161922] border-r border-[#E7E7E3] dark:border-[#262B35] flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-200 overflow-x-hidden`}
    >
      <div className={`flex flex-col flex-1 overflow-y-auto ${paddingX} py-5 space-y-5 no-scrollbar`}>
        {/* Brand Header */}
        <div className={`flex items-center gap-3 px-1 xl:px-2 ${isDrawer ? 'justify-start' : 'justify-center xl:justify-start'}`}>
          <div
            className="w-9 h-9 rounded-xl bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center shadow-xs shrink-0"
            title="Aura Finance — Personal Ledger & Calculator"
          >
            <Wallet className="w-5 h-5" />
          </div>
          <div className={`min-w-0 ${blockDisplay}`}>
            <h1 className="text-sm font-semibold tracking-tight text-[#111827] dark:text-[#F3F4F6] leading-tight truncate">
              Aura Finance
            </h1>
            <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] font-medium truncate">
              Personal Ledger & Calculator
            </p>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="space-y-1">
          <p className={`text-[10px] font-semibold uppercase tracking-wider text-[#98A2B3] dark:text-[#6B7280] px-2 mb-2 ${blockDisplay}`}>
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose?.();
                }}
                title={item.label}
                className={`w-full flex items-center gap-3 px-2.5 xl:px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${itemJustify} ${
                  isActive
                    ? 'bg-[#E9FBF3] text-[#00B86B] dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold'
                    : 'text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00B86B]' : 'text-[#98A2B3] dark:text-[#6B7280]'}`} />
                <span className={`truncate ${textDisplay}`}>{item.label}</span>
                {isActive && (
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-[#00B86B] dark:bg-emerald-400 shrink-0 ${textDisplay}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="space-y-1.5 pt-2 border-t border-[#E7E7E3] dark:border-[#262B35]">
          <p className={`text-[10px] font-semibold uppercase tracking-wider text-[#98A2B3] dark:text-[#6B7280] px-2 mb-2 ${blockDisplay}`}>
            Quick Actions
          </p>
          <button
            onClick={() => {
              openAddModal('income');
              onClose?.();
            }}
            title="Add Income"
            className={`w-full flex items-center gap-2.5 px-2.5 xl:px-3 py-2 rounded-xl text-xs font-medium text-[#00B86B] bg-[#E9FBF3] hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/40 transition-colors cursor-pointer ${itemJustify}`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 shrink-0 text-[#00B86B]" />
            <span className={textDisplay}>+ Add Income</span>
          </button>
          <button
            onClick={() => {
              openAddModal('expense');
              onClose?.();
            }}
            title="Add Expense"
            className={`w-full flex items-center gap-2.5 px-2.5 xl:px-3 py-2 rounded-xl text-xs font-medium text-[#F43F6E] bg-[#FFF0F4] hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200/50 dark:border-rose-800/40 transition-colors cursor-pointer ${itemJustify}`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-[#F43F6E]" />
            <span className={textDisplay}>+ Add Expense</span>
          </button>
        </div>

        {/* Tools Section */}
        <div className="space-y-1 pt-2 border-t border-[#E7E7E3] dark:border-[#262B35]">
          <p className={`text-[10px] font-semibold uppercase tracking-wider text-[#98A2B3] dark:text-[#6B7280] px-2 mb-2 ${blockDisplay}`}>
            Tools
          </p>
          {[
            { id: 'budget-limits' as PageTab, label: 'Budget Limits', icon: PiggyBank },
            { id: 'categories' as PageTab, label: 'Categories', icon: Tags },
            { id: 'backup' as PageTab, label: 'Export & Backup', icon: Download },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose?.();
                }}
                title={item.label}
                className={`w-full flex items-center gap-3 px-2.5 xl:px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${itemJustify} ${
                  isActive
                    ? 'bg-[#E9FBF3] text-[#00B86B] dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold'
                    : 'text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00B86B]' : 'text-[#98A2B3] dark:text-[#6B7280]'}`} />
                <span className={`truncate ${textDisplay}`}>{item.label}</span>
                {isActive && (
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-[#00B86B] dark:bg-emerald-400 shrink-0 ${textDisplay}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className={`p-2 xl:p-3 border-t border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8]/50 dark:bg-[#0E1015]/40`}>
        <div className={`flex items-center ${isDrawer ? 'justify-between' : 'justify-center xl:justify-between'} p-1.5 xl:p-2 rounded-xl bg-white dark:bg-[#161922] border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs`}>
          <div className="flex items-center gap-2.5 min-w-0" title={`${effectiveName} (${effectiveEmail})`}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={effectiveName}
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-[#00B86B]/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center text-xs font-bold shrink-0">
                {effectiveName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`min-w-0 ${blockDisplay}`}>
              <p className="text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] truncate leading-tight">
                {effectiveName}
              </p>
              <p className="text-[10px] text-[#667085] dark:text-[#9CA3AF] truncate">
                {effectiveEmail}
              </p>
            </div>
          </div>

          <div className={blockDisplay}>
            {user ? (
              <button
                onClick={signOut}
                className="p-1.5 text-[#98A2B3] hover:text-[#F43F6E] dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={signIn}
                className="p-1.5 text-[#00B86B] hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg hover:bg-[#E9FBF3] dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                title="Sign in with Google"
              >
                <LogIn className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
