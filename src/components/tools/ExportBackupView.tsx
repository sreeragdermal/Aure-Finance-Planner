import React, { useRef, useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useGoogleDrive } from '../../context/GoogleDriveContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { GoogleDriveSyncSection } from '../GoogleDriveSyncSection';
import {
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  Database,
  ArrowRight,
} from 'lucide-react';

export const ExportBackupView: React.FC = () => {
  const {
    expenses,
    incomes,
    budget,
    categories,
    updateBudget,
    importAllData,
    resetToSample,
    clearAll,
    setActiveTab,
  } = useExpenses();
  const { isConnected } = useGoogleDrive();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmSampleOpen, setConfirmSampleOpen] = useState(false);

  // CSV Export
  const handleExportCSV = () => {
    if (expenses.length === 0 && incomes.length === 0) {
      showToast('No transactions to export', 'info');
      return;
    }

    const headers = [
      'Type',
      'ID',
      'Date',
      'Time',
      'Title',
      'Category',
      'Amount',
      'Payment Method',
      'Notes',
    ];

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

    const csvContent = [
      headers.join(','),
      ...expenseRows.map((r) => r.join(',')),
      ...incomeRows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `aura_finance_backup_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Spreadsheet (CSV) exported successfully!');
  };

  // Full JSON Backup Export
  const handleExportJSON = () => {
    const backupObj = {
      version: 2,
      exportDate: new Date().toISOString(),
      app: 'Aura Finance 2.0',
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
    link.setAttribute(
      'download',
      `aura_personal_finance_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Full JSON backup downloaded!');
  };

  // Restore from JSON Backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.expenses || parsed.incomes || Array.isArray(parsed)) {
          const loadedExpenses = Array.isArray(parsed.expenses)
            ? parsed.expenses
            : Array.isArray(parsed)
            ? parsed
            : [];
          const loadedIncomes = Array.isArray(parsed.incomes) ? parsed.incomes : [];

          importAllData({
            expenses: loadedExpenses,
            incomes: loadedIncomes,
            budget: parsed.budget,
            categories: parsed.categories,
          });

          if (parsed.budget) {
            updateBudget(parsed.budget);
          }

          showToast(
            `Restored ${loadedExpenses.length} expense(s) and ${loadedIncomes.length} income(s)!`
          );
        } else {
          showToast('Invalid backup file: missing transaction records', 'error');
        }
      } catch (err) {
        showToast('Backup restoration failed: Invalid JSON format', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0284C7] dark:bg-sky-950/40 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#111827] dark:text-[#F3F4F6]">
                  Data Backup & Privacy
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                  Private & Offline First
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                Export your financial records to CSV spreadsheet or full JSON backup, restore existing backups, and manage private local storage.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAF8] dark:bg-[#0E1015]/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E7E7E3] dark:border-[#262B35] text-xs font-semibold text-[#111827] dark:text-white transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>View Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#6D5DFB]" />
          </button>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-4 pt-4 border-t border-[#E7E7E3] dark:border-[#262B35] flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[#111827] dark:text-neutral-200 font-mono font-medium">
            {expenses.length} Expenses Stored
          </span>
          <span className="px-3 py-1 rounded-lg bg-[#E9FBF3] text-[#00B86B] dark:bg-emerald-950/40 dark:text-emerald-400 font-mono font-medium">
            {incomes.length} Incomes Stored
          </span>
          <span className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[#111827] dark:text-neutral-200 font-mono">
            Currency: {budget.currency}
          </span>
          {isConnected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Google Drive Auto-Sync Active
            </span>
          )}
        </div>
      </div>

      {/* Primary Export & Import Grid */}
      <div className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs transition-colors space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">
            Export & Restore Files
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
            Choose an export format or restore your records from a previous backup file.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-between p-4 rounded-xl border border-[#E7E7E3] dark:border-[#262B35] hover:bg-[#FAFAF8] dark:hover:bg-[#0E1015]/60 transition-all text-left group cursor-pointer"
          >
            <div>
              <div className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Export Spreadsheet (CSV)</span>
              </div>
              <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-1">
                Open in Microsoft Excel, Google Sheets, or Apple Numbers.
              </p>
            </div>
            <Download className="w-4 h-4 text-[#98A2B3] group-hover:text-[#111827] dark:group-hover:text-white transition-colors shrink-0 ml-2" />
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-between p-4 rounded-xl border border-[#E7E7E3] dark:border-[#262B35] hover:bg-[#FAFAF8] dark:hover:bg-[#0E1015]/60 transition-all text-left group cursor-pointer"
          >
            <div>
              <div className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-[#6D5DFB]" />
                <span>Full Backup (JSON)</span>
              </div>
              <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-1">
                Complete restore archive including budgets, categories, and records.
              </p>
            </div>
            <Download className="w-4 h-4 text-[#98A2B3] group-hover:text-[#111827] dark:group-hover:text-white transition-colors shrink-0 ml-2" />
          </button>

          {/* Restore JSON */}
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
              className="w-full flex items-center justify-between p-4 rounded-xl border border-[#E7E7E3] dark:border-[#262B35] hover:bg-[#FAFAF8] dark:hover:bg-[#0E1015]/60 transition-all text-left group cursor-pointer"
            >
              <div>
                <div className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#0284C7]" />
                  <span>Restore from Backup (JSON)</span>
                </div>
                <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-1">
                  Upload a previously exported JSON backup file.
                </p>
              </div>
              <Upload className="w-4 h-4 text-[#98A2B3] group-hover:text-[#111827] dark:group-hover:text-white transition-colors shrink-0 ml-2" />
            </button>
          </div>

          {/* Load Sample Demo Data */}
          <button
            onClick={() => setConfirmSampleOpen(true)}
            className="flex items-center justify-between p-4 rounded-xl border border-[#E7E7E3] dark:border-[#262B35] hover:bg-[#FAFAF8] dark:hover:bg-[#0E1015]/60 transition-all text-left group cursor-pointer"
          >
            <div>
              <div className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Load Sample Preview Data</span>
              </div>
              <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-1">
                Populate demo records to preview analytics, cash flow, and categories.
              </p>
            </div>
            <RotateCcw className="w-4 h-4 text-[#98A2B3] group-hover:text-[#111827] dark:group-hover:text-white transition-colors shrink-0 ml-2" />
          </button>
        </div>

        {/* Clear All Data */}
        <div className="pt-4 border-t border-[#E7E7E3] dark:border-[#262B35]">
          <button
            onClick={() => setConfirmClearOpen(true)}
            className="text-xs font-semibold text-[#F43F6E] hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all financial records & start fresh with a blank ledger</span>
          </button>
        </div>
      </div>

      {/* Google Drive Auto-Sync Component */}
      <GoogleDriveSyncSection />

      {/* Confirm Clear All Data Dialog */}
      <ConfirmDialog
        isOpen={confirmClearOpen}
        title="Clear All Financial Records?"
        description="Are you sure? This will permanently delete all locally stored expense and income records from this browser. You can export a backup beforehand."
        confirmLabel="Delete All Records"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          clearAll();
          setConfirmClearOpen(false);
          showToast('All records cleared. Fresh personal ledger started.');
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />

      {/* Confirm Load Sample Data Dialog */}
      <ConfirmDialog
        isOpen={confirmSampleOpen}
        title="Load Sample Preview Records?"
        description="This will add sample income and expense records to help you explore the charts, categories, and weekly/monthly cash flow distributions."
        confirmLabel="Load Sample Data"
        cancelLabel="Cancel"
        isDestructive={false}
        onConfirm={() => {
          resetToSample();
          setConfirmSampleOpen(false);
          showToast('Sample records loaded successfully!');
        }}
        onCancel={() => setConfirmSampleOpen(false)}
      />
    </div>
  );
};
