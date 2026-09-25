import React, { useState, useRef, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from './common/ConfirmDialog';
import { CURRENCIES } from '../utils/categories';
import { formatAmount } from '../utils/calculations';
import { CategoryInfo } from '../types/expense';
import {
  User,
  Cloud,
  Check,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  Trash2,
  ExternalLink,
  RefreshCw,
  Plus,
  Edit2,
  AlertCircle,
  Smartphone,
  Laptop,
  Tablet,
  Shield,
  LogOut,
  Sparkles,
  X,
  Tag,
  Utensils,
  Car,
  Home,
  Zap,
  ShoppingBag,
  Film,
  Heart,
  BookOpen,
  Coffee,
  Wifi,
  Music,
  Plane,
  Gift,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { playIncomeSuccessSound, playExpenseSuccessSound } from '../utils/soundEffects';

const CATEGORY_ICONS_MAP: Record<string, React.ElementType> = {
  Tag,
  Utensils,
  Car,
  Home,
  Zap,
  ShoppingBag,
  Film,
  Heart,
  BookOpen,
  Coffee,
  Wifi,
  Music,
  Plane,
  Gift,
  Shield,
};

const COLOR_OPTIONS = [
  '#0D9488',
  '#0284C7',
  '#7C3AED',
  '#D97706',
  '#DB2777',
  '#059669',
  '#4F46E5',
  '#EA580C',
  '#64748B',
];

export const BudgetSettingsView: React.FC = () => {
  const {
    budget,
    updateBudget,
    expenses,
    incomes,
    categories,
    categoryList,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToSample,
    clearAll,
    importAllData,
    syncState,
    lastSyncTime: cloudLastSyncTime,
    forceSyncNow,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
  } = useExpenses();

  const {
    user,
    isConnected,
    isConnecting,
    isAutoSyncing,
    autoSyncEnabled,
    toggleAutoSync,
    lastSyncTime: driveLastSyncTime,
    signIn,
    signOut,
    saveDataToDrive,
    folderInfo,
  } = useGoogleDrive();

  const { showToast } = useToast();

  // Budgets state
  const [dailyInput, setDailyInput] = useState(budget.daily.toString());
  const [weeklyInput, setWeeklyInput] = useState(budget.weekly.toString());
  const [monthlyInput, setMonthlyInput] = useState(budget.monthly.toString());
  const [savingsInput, setSavingsInput] = useState((budget.monthlySavingsTarget || 10000).toString());
  const [budgetSavedFeedback, setBudgetSavedFeedback] = useState(false);

  // Online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync inputs with budget updates
  useEffect(() => {
    setDailyInput(budget.daily.toString());
    setWeeklyInput(budget.weekly.toString());
    setMonthlyInput(budget.monthly.toString());
    setSavingsInput((budget.monthlySavingsTarget || 10000).toString());
  }, [budget.daily, budget.weekly, budget.monthly, budget.monthlySavingsTarget]);

  // Modals & Dialogs
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [categoryFormName, setCategoryFormName] = useState('');
  const [categoryFormColor, setCategoryFormColor] = useState(COLOR_OPTIONS[0]);
  const [categoryFormIcon, setCategoryFormIcon] = useState('Tag');
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const choiceResult = await installPromptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('Aura Finance added to home screen!');
      }
      setInstallPromptEvent(null);
    } else {
      showToast('To install, tap your browser menu and select "Install" or "Add to Home Screen".', 'info');
    }
  };

  const handleCheckUpdates = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update().then(() => {
          showToast('Aura Finance is up to date (Version 2.0)');
        });
      });
    } else {
      showToast('Aura Finance is up to date (Version 2.0)');
    }
  };

  // Save budget changes
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

    setBudgetSavedFeedback(true);
    showToast('Budget settings saved');
    setTimeout(() => setBudgetSavedFeedback(false), 3000);
  };

  // Sync now action
  const handleManualSync = async () => {
    setIsSyncingNow(true);
    try {
      await forceSyncNow();
      if (isConnected) {
        await saveDataToDrive({ expenses, incomes, budget });
      }
      showToast('All changes synced');
    } catch {
      showToast('Unable to complete sync', 'error');
    } finally {
      setIsSyncingNow(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (expenses.length === 0 && incomes.length === 0) {
      showToast('No transactions to export', 'info');
      return;
    }

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
    link.setAttribute('download', `aura_finance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded');
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const backupObj = {
      version: 2,
      exportDate: new Date().toISOString(),
      budget,
      categories,
      expenses,
      incomes,
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aura_finance_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup file downloaded');
  };

  // Restore JSON
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            budget: parsed.budget,
            categories: parsed.categories,
          });
          if (parsed.budget) {
            updateBudget(parsed.budget);
          }
          showToast('Financial data restored successfully');
        } else if (Array.isArray(parsed)) {
          importAllData({ expenses: parsed, incomes: [] });
          showToast('Expenses imported successfully');
        } else {
          showToast('Unrecognized backup structure', 'error');
        }
      } catch {
        showToast('Invalid backup file format', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Category modal handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormName('');
    setCategoryFormColor(COLOR_OPTIONS[0]);
    setCategoryFormIcon('Tag');
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CategoryInfo) => {
    setEditingCategory(cat);
    setCategoryFormName(cat.name);
    setCategoryFormColor(cat.color || COLOR_OPTIONS[0]);
    setCategoryFormIcon(cat.icon || 'Tag');
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormName.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: categoryFormName.trim(),
        color: categoryFormColor,
        icon: categoryFormIcon,
      });
      showToast(`Updated category "${categoryFormName}"`);
    } else {
      addCategory(categoryFormName.trim(), categoryFormColor, categoryFormIcon);
      showToast(`Added category "${categoryFormName}"`);
    }
    setCategoryModalOpen(false);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    const res = deleteCategory(id);
    if (res.success) {
      showToast(`Deleted category "${name}"`);
    } else {
      showToast(res.reason || 'Cannot delete category in use', 'error');
    }
  };

  const effectiveEmail = user?.email || 'sreeragdermal@gmail.com';
  const effectiveName = user?.displayName || 'Sreerag Dermal';
  const effectivePhoto = user?.photoURL;
  const isUserConnected = Boolean(isConnected || user);

  const displayLastSync = driveLastSyncTime || cloudLastSyncTime || 'Just now';

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* -------------------------------------------------- */}
      {/* 1. PAGE HEADER                                     */}
      {/* -------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E7E3] dark:border-[#262B35] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-white">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-1">
            Manage your account, financial preferences, sync and data.
          </p>
        </div>

        {/* Small sync status indicator */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {isOnline ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAFAF8] dark:bg-[#161922] border border-[#E7E7E3] dark:border-[#262B35] text-xs text-[#667085] dark:text-[#9CA3AF]">
              <span className="w-2 h-2 rounded-full bg-[#00B86B]" />
              <span>Synced {displayLastSync}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              <span className="w-2 h-2 rounded-full border border-amber-500" />
              <span>Offline — changes will sync when you're back online</span>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* 2. PROFILE                                         */}
      {/* -------------------------------------------------- */}
      <section className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {effectivePhoto ? (
              <img
                src={effectivePhoto}
                alt={effectiveName}
                className="w-12 h-12 rounded-full object-cover ring-1 ring-[#E7E7E3] dark:ring-[#262B35]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#111827] dark:bg-white text-white dark:text-[#111827] flex items-center justify-center text-sm font-bold shrink-0">
                {effectiveName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#111827] dark:text-white truncate">
                {effectiveName}
              </h2>
              <div className="text-xs text-[#667085] dark:text-[#9CA3AF] truncate">
                {effectiveEmail}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                <span className="text-[#98A2B3] dark:text-[#6B7280]">Google Account:</span>
                {isUserConnected ? (
                  <span className="font-medium text-[#00B86B]">Connected</span>
                ) : (
                  <span className="font-medium text-[#98A2B3]">Not connected</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {isUserConnected ? (
              <>
                <button
                  onClick={() => showToast(`Signed in as ${effectiveEmail}`, 'info')}
                  className="px-3 py-1.5 text-xs font-medium text-[#111827] dark:text-white bg-[#FAFAF8] dark:bg-[#0E1015] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E7E7E3] dark:border-[#262B35] rounded-xl transition-colors cursor-pointer"
                >
                  Manage account
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#667085] hover:text-[#F43F6E] dark:text-[#9CA3AF] dark:hover:text-[#F43F6E] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <button
                onClick={signIn}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#111827] hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-neutral-100 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{isConnecting ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 3. CLOUD SYNC                                      */}
      {/* -------------------------------------------------- */}
      <section className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-xs space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-[#111827] dark:text-white">
            Cloud Sync
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
            Keep your Aura Finance data synchronized across your devices.
          </p>
        </div>

        {isUserConnected ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#FAFAF8] dark:bg-[#0E1015]/60 border border-[#E7E7E3] dark:border-[#262B35]">
              <div className="space-y-1">
                <div className="text-xs font-medium text-[#111827] dark:text-white flex items-center gap-2">
                  <span>Connected to Google Drive</span>
                  <span className="text-[#98A2B3]">·</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#00B86B] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00B86B]" />
                    All changes synced
                  </span>
                </div>
                <div className="text-[11px] text-[#667085] dark:text-[#9CA3AF]">
                  Last synced: {displayLastSync}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualSync}
                  disabled={isSyncingNow || isAutoSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#111827] hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow || isAutoSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncingNow || isAutoSyncing ? 'Syncing...' : 'Sync now'}</span>
                </button>

                <button
                  onClick={signOut}
                  className="px-3 py-1.5 text-xs font-medium text-[#667085] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Folder link & auto sync row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[#667085] dark:text-[#9CA3AF]">Automatic cloud backup:</span>
                <button
                  onClick={toggleAutoSync}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    autoSyncEnabled
                      ? 'bg-emerald-50 text-[#00B86B] dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-neutral-100 text-[#667085] dark:bg-neutral-800 dark:text-[#9CA3AF]'
                  }`}
                >
                  {autoSyncEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {folderInfo?.webViewLink && (
                <a
                  href={folderInfo.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#667085] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-white"
                >
                  <span>Open in Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#FAFAF8] dark:bg-[#0E1015]/60 border border-[#E7E7E3] dark:border-[#262B35] space-y-3">
            <div>
              <div className="text-xs font-medium text-[#111827] dark:text-white">
                Your data is currently stored on this device.
              </div>
              <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5 leading-relaxed">
                Sign in with Google to securely sync your financial records across your devices.
              </p>
            </div>
            <button
              onClick={signIn}
              disabled={isConnecting}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#111827] hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isConnecting ? 'Connecting...' : 'Continue with Google'}</span>
            </button>
          </div>
        )}
      </section>

      {/* -------------------------------------------------- */}
      {/* 4. MULTI-DEVICE SYNC                               */}
      {/* -------------------------------------------------- */}
      <section className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E7E3] dark:border-[#262B35] pb-3">
          <div className="flex items-center gap-4 text-xs font-medium text-[#111827] dark:text-white">
            <span className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-[#667085] dark:text-[#9CA3AF]" />
              <span>Desktop</span>
            </span>
            <span className="text-[#98A2B3]">·</span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#667085] dark:text-[#9CA3AF]" />
              <span>Mobile</span>
            </span>
            <span className="text-[#98A2B3]">·</span>
            <span className="flex items-center gap-1.5">
              <Tablet className="w-3.5 h-3.5 text-[#667085] dark:text-[#9CA3AF]" />
              <span>Tablet</span>
            </span>
          </div>

          <span className="text-[11px] text-[#667085] dark:text-[#9CA3AF]">
            Your financial data stays synchronized across your devices.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#667085] dark:text-[#9CA3AF] pt-1">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#00B86B]" />
            <span>Real-time sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#00B86B]" />
            <span>Automatic backup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#00B86B]" />
            <span>Cross-device access</span>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 5. PREFERENCES                                     */}
      {/* -------------------------------------------------- */}
      <section className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-xs space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-[#111827] dark:text-white">
            Preferences
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
            Configure transaction feedback, sound effects, currency, and date formats.
          </p>
        </div>

        {/* Sound Effects Setting */}
        <div className="p-4 rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {soundEffectsEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#98A2B3] shrink-0" />
                )}
                <span className="text-xs font-semibold text-[#111827] dark:text-white">
                  Sound Effects
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    soundEffectsEnabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-neutral-200/80 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {soundEffectsEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
                Play a subtle confirmation chime for income and a clean tactile tick for expenses upon saving.
              </p>
            </div>

            {/* Segmented Control [ ON ] [ OFF ] */}
            <div className="inline-flex p-1 bg-white dark:bg-[#161922] rounded-xl border border-[#E7E7E3] dark:border-[#262B35] self-start sm:self-auto shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setSoundEffectsEnabled(true);
                  playIncomeSuccessSound();
                  showToast('Sound effects turned ON');
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  soundEffectsEnabled
                    ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827] shadow-xs'
                    : 'text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => {
                  setSoundEffectsEnabled(false);
                  showToast('Sound effects turned OFF');
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !soundEffectsEnabled
                    ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827] shadow-xs'
                    : 'text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          {/* Interactive Audio Preview Pills when ON */}
          {soundEffectsEnabled && (
            <div className="pt-2 border-t border-[#E7E7E3]/60 dark:border-[#262B35]/60 flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-[10px] text-[#98A2B3] uppercase tracking-wider font-semibold">
                Test audio:
              </span>
              <button
                type="button"
                onClick={() => playIncomeSuccessSound()}
                className="px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Listen to the income confirmation chime"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Income Chime (~200ms)</span>
              </button>
              <button
                type="button"
                onClick={() => playExpenseSuccessSound()}
                className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Listen to the expense confirmation tick"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Expense Tick (~160ms)</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-2">
          {/* Currency selection */}
          <div>
            <label className="block text-xs font-medium text-[#111827] dark:text-white mb-2">
              Currency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { code: 'INR', symbol: '₹', label: 'INR — Indian Rupee' },
                { code: 'USD', symbol: '$', label: 'USD — US Dollar' },
                { code: 'EUR', symbol: '€', label: 'EUR — Euro' },
                { code: 'GBP', symbol: '£', label: 'GBP — British Pound' },
              ].map((curr) => {
                const isSelected = budget.currency === curr.symbol;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => {
                      updateBudget({ currency: curr.symbol });
                      showToast(`Currency set to ${curr.code} (${curr.symbol})`);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#111827] dark:border-white bg-[#111827]/5 dark:bg-white/5 font-semibold text-[#111827] dark:text-white'
                        : 'border-[#E7E7E3] dark:border-[#262B35] text-[#667085] dark:text-[#9CA3AF] hover:bg-[#FAFAF8] dark:hover:bg-[#0E1015]'
                    }`}
                  >
                    <div className="text-base font-mono font-semibold">
                      {curr.symbol}
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {curr.label}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-1.5">
              Default currency: INR ₹
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Date format */}
            <div>
              <label className="block text-xs font-medium text-[#111827] dark:text-white mb-2">
                Date format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const).map((fmt) => {
                  const isSelected = (budget.dateFormat || 'DD/MM/YYYY') === fmt;
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => updateBudget({ dateFormat: fmt })}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-mono text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#111827] dark:border-white bg-[#111827]/5 dark:bg-white/5 font-semibold text-[#111827] dark:text-white'
                          : 'border-[#E7E7E3] dark:border-[#262B35] text-[#667085] dark:text-[#9CA3AF] hover:bg-[#FAFAF8] dark:hover:bg-[#0E1015]'
                      }`}
                    >
                      {fmt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Week starts on */}
            <div>
              <label className="block text-xs font-medium text-[#111827] dark:text-white mb-2">
                Week starts on
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Monday', 'Sunday'] as const).map((day) => {
                  const isSelected = (budget.weekStartsOn || 'Monday') === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => updateBudget({ weekStartsOn: day })}
                      className={`py-2 px-3 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#111827] dark:border-white bg-[#111827]/5 dark:bg-white/5 font-semibold text-[#111827] dark:text-white'
                          : 'border-[#E7E7E3] dark:border-[#262B35] text-[#667085] dark:text-[#9CA3AF] hover:bg-[#FAFAF8] dark:hover:bg-[#0E1015]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 6. BUDGETS & TARGETS                               */}
      {/* -------------------------------------------------- */}
      <section className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-xs space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-[#111827] dark:text-white">
            Budgets & Savings
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
            Set spending limits and savings goals.
          </p>
        </div>

        <form onSubmit={handleSaveBudgets} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily spending limit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#111827] dark:text-white">
                  Daily spending limit
                </label>
                {/* Compact optional quick presets */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#98A2B3] mr-1">Quick:</span>
                  {[200, 500, 1000, 2000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDailyInput(preset.toString())}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#667085] dark:text-[#9CA3AF] font-mono transition-colors"
                    >
                      {budget.currency}{preset}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#98A2B3] font-mono text-xs">
                  {budget.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={dailyInput}
                  onChange={(e) => setDailyInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/60 text-[#111827] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#111827] dark:focus:ring-white"
                />
              </div>
            </div>

            {/* Weekly spending budget */}
            <div>
              <label className="block text-xs font-medium text-[#111827] dark:text-white mb-1.5">
                Weekly spending budget
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#98A2B3] font-mono text-xs">
                  {budget.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={weeklyInput}
                  onChange={(e) => setWeeklyInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/60 text-[#111827] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#111827] dark:focus:ring-white"
                />
              </div>
            </div>

            {/* Monthly spending budget */}
            <div>
              <label className="block text-xs font-medium text-[#111827] dark:text-white mb-1.5">
                Monthly spending budget
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#98A2B3] font-mono text-xs">
                  {budget.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={monthlyInput}
                  onChange={(e) => setMonthlyInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/60 text-[#111827] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#111827] dark:focus:ring-white"
                />
              </div>
            </div>

            {/* Monthly savings target */}
            <div>
              <label className="block text-xs font-medium text-[#111827] dark:text-white mb-1.5">
                Monthly savings target
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#00B86B] font-mono text-xs">
                  +{budget.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={savingsInput}
                  onChange={(e) => setSavingsInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono font-semibold rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/60 text-[#111827] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#111827] dark:focus:ring-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {budgetSavedFeedback && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#00B86B] font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Budget settings saved
                </span>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#111827] hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-neutral-100 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save changes
            </button>
          </div>
        </form>
      </section>

      {/* -------------------------------------------------- */}
      {/* 7. EXPENSE CATEGORIES                              */}
      {/* -------------------------------------------------- */}
      <section className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#111827] dark:text-white">
              Expense Categories
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
              Manage the categories used when recording transactions.
            </p>
          </div>

          <button
            onClick={handleOpenAddCategory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#111827] dark:text-white bg-[#FAFAF8] dark:bg-[#0E1015] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E7E7E3] dark:border-[#262B35] rounded-xl transition-colors cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add category</span>
          </button>
        </div>

        {/* Clean list rather than large cards */}
        <div className="divide-y divide-[#E7E7E3] dark:divide-[#262B35] border border-[#E7E7E3] dark:border-[#262B35] rounded-xl overflow-hidden">
          {categoryList.map((cat) => {
            const IconComp = CATEGORY_ICONS_MAP[cat.icon || 'Tag'] || Tag;
            const expenseCount = expenses.filter((e) => e.category === cat.id).length;

            return (
              <div
                key={cat.id}
                className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-[#FAFAF8]/80 dark:hover:bg-[#0E1015]/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color || '#64748B'}18`, color: cat.color || '#64748B' }}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#111827] dark:text-white truncate">
                      {cat.name}
                    </div>
                    <div className="text-[11px] text-[#667085] dark:text-[#9CA3AF]">
                      {expenseCount} transaction{expenseCount === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEditCategory(cat)}
                    className="p-1.5 text-[#667085] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    title="Edit category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-1.5 text-[#667085] hover:text-[#F43F6E] dark:text-[#9CA3AF] dark:hover:text-[#F43F6E] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 8. DATA & BACKUP                                   */}
      {/* -------------------------------------------------- */}
      <section className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-xs space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-[#111827] dark:text-white">
            Data & Backup
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
            Export or restore your personal financial records.
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleFileRestore}
          className="hidden"
        />

        <div className="divide-y divide-[#E7E7E3] dark:divide-[#262B35] border border-[#E7E7E3] dark:border-[#262B35] rounded-xl overflow-hidden">
          {/* Export CSV */}
          <div className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFAF8]/60 dark:hover:bg-[#0E1015]/40 transition-colors">
            <div>
              <div className="text-xs font-semibold text-[#111827] dark:text-white">
                Export CSV
              </div>
              <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                Download your transactions for Excel or Google Sheets.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111827] dark:text-white bg-[#FAFAF8] dark:bg-[#0E1015] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E7E7E3] dark:border-[#262B35] rounded-xl transition-colors cursor-pointer self-start sm:self-center"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#00B86B]" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Backup Data */}
          <div className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFAF8]/60 dark:hover:bg-[#0E1015]/40 transition-colors">
            <div>
              <div className="text-xs font-semibold text-[#111827] dark:text-white">
                Backup Data
              </div>
              <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                Create a complete backup of your Aura Finance data.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111827] dark:text-white bg-[#FAFAF8] dark:bg-[#0E1015] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E7E7E3] dark:border-[#262B35] rounded-xl transition-colors cursor-pointer self-start sm:self-center"
            >
              <Download className="w-3.5 h-3.5 text-[#667085] dark:text-[#9CA3AF]" />
              <span>Download Backup</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFAF8]/60 dark:hover:bg-[#0E1015]/40 transition-colors">
            <div>
              <div className="text-xs font-semibold text-[#111827] dark:text-white">
                Restore Backup
              </div>
              <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                Restore previously backed-up financial data.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111827] dark:text-white bg-[#FAFAF8] dark:bg-[#0E1015] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E7E7E3] dark:border-[#262B35] rounded-xl transition-colors cursor-pointer self-start sm:self-center"
            >
              <Upload className="w-3.5 h-3.5 text-[#667085] dark:text-[#9CA3AF]" />
              <span>Restore</span>
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 9. DANGER ZONE                                     */}
      {/* -------------------------------------------------- */}
      <section className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#F43F6E]">
            Danger Zone
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
            Irreversible actions that affect your locally stored financial data.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
          <div>
            <div className="text-xs font-semibold text-[#111827] dark:text-white">
              Clear all financial data
            </div>
            <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">
              Permanently remove transactions and reset Aura Finance on this device.
            </p>
          </div>

          <button
            onClick={() => setClearDialogOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-[#F43F6E] hover:text-white hover:bg-[#F43F6E] border border-rose-200 dark:border-rose-800 rounded-xl transition-colors cursor-pointer self-start sm:self-center shrink-0"
          >
            Clear all data
          </button>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 10. APP (Application)                              */}
      {/* -------------------------------------------------- */}
      <section className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#111827] dark:text-white">
              Application
            </h2>
            <div className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-[#111827] dark:text-white">Aura Finance</span>
              <span>·</span>
              <span>Version 2.0</span>
              <span>·</span>
              <span>Progressive Web App</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleInstallApp}
              className="px-3 py-1.5 text-xs font-medium text-[#111827] dark:text-white bg-[#FAFAF8] dark:bg-[#0E1015] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E7E7E3] dark:border-[#262B35] rounded-xl transition-colors cursor-pointer"
            >
              Install app
            </button>
            <button
              onClick={handleCheckUpdates}
              className="px-3 py-1.5 text-xs font-medium text-[#667085] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Check for updates
            </button>
          </div>
        </div>

        <div className="text-[11px] text-[#667085] dark:text-[#9CA3AF] pt-2 border-t border-[#E7E7E3] dark:border-[#262B35] flex items-center gap-3">
          <span className="text-[#98A2B3]">Supported platforms:</span>
          <span className="font-medium text-[#111827] dark:text-white">Desktop</span>
          <span>·</span>
          <span className="font-medium text-[#111827] dark:text-white">Mobile</span>
          <span>·</span>
          <span className="font-medium text-[#111827] dark:text-white">Tablet</span>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 11. PRIVACY                                        */}
      {/* -------------------------------------------------- */}
      <section className="p-4 sm:p-5 rounded-2xl bg-[#FAFAF8] dark:bg-[#161922]/50 border border-[#E7E7E3] dark:border-[#262B35] space-y-1">
        <h2 className="text-xs font-semibold text-[#111827] dark:text-white">
          Privacy
        </h2>
        <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
          Your financial data belongs to you. Local data is stored securely on your device. Cloud synchronization is available when you connect your Google account.
        </p>
      </section>

      {/* -------------------------------------------------- */}
      {/* 12. SIGN OUT                                       */}
      {/* -------------------------------------------------- */}
      {isUserConnected && (
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] bg-white dark:bg-[#161922]">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#98A2B3] font-semibold">
              Google Account
            </div>
            <div className="text-xs font-semibold text-[#111827] dark:text-white mt-0.5">
              {effectiveName}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-[#9CA3AF]">
              {effectiveEmail}
            </div>
          </div>

          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#667085] hover:text-[#F43F6E] dark:text-[#9CA3AF] dark:hover:text-[#F43F6E] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer self-start sm:self-center"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </section>
      )}

      {/* Danger Zone Clear Confirmation Modal */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        title="Clear all financial data?"
        description="This action cannot be undone. Your expenses, income, budgets and local records will be removed from this device."
        confirmLabel="Clear data"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          clearAll();
          setClearDialogOpen(false);
          showToast('Financial data cleared');
        }}
        onCancel={() => setClearDialogOpen(false)}
      />

      {/* Category Add/Edit Modal */}
      {categoryModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setCategoryModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#161922] w-full max-w-md rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xl p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#111827] dark:text-white">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 text-[#98A2B3] hover:text-[#111827] dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111827] dark:text-white mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subscriptions, Groceries"
                  value={categoryFormName}
                  onChange={(e) => setCategoryFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/60 text-[#111827] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#111827] dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111827] dark:text-white mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategoryFormColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        categoryFormColor === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#161922] ring-neutral-400' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111827] dark:text-white mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1">
                  {Object.entries(CATEGORY_ICONS_MAP).map(([iconKey, Comp]) => {
                    const isSelected = categoryFormIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setCategoryFormIcon(iconKey)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#111827] dark:border-white bg-[#111827]/5 dark:bg-white/5 text-[#111827] dark:text-white'
                            : 'border-[#E7E7E3] dark:border-[#262B35] text-[#667085] hover:bg-neutral-50 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#667085] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#111827] hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-neutral-100 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingCategory ? 'Update category' : 'Add category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
