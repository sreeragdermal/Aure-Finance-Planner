import React, { useState } from 'react';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { useExpenses } from '../context/ExpenseContext';
import { DriveFile } from '../services/googleDrive';
import {
  Cloud,
  CloudCheck,
  CloudUpload,
  Download,
  FolderOpen,
  Share2,
  Users,
  Trash2,
  RefreshCw,
  ExternalLink,
  Check,
  AlertCircle,
  ShieldCheck,
  FileSpreadsheet,
  FileJson,
  X,
  Mail,
} from 'lucide-react';

export const GoogleDriveSyncSection: React.FC = () => {
  const {
    user,
    isConnected,
    isConnecting,
    isAutoSyncing,
    autoSyncEnabled,
    toggleAutoSync,
    folderInfo,
    backups,
    isLoadingBackups,
    lastSyncTime,
    statusMessage,
    signIn,
    signOut,
    saveDataToDrive,
    saveCsvToDrive,
    loadBackupFromDrive,
    shareWithPerson,
    deleteBackup,
    refreshBackups,
  } = useGoogleDrive();

  const { expenses, incomes, budget, importAllData } = useExpenses();

  // Dialog states
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'reader' | 'writer'>('writer');
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Restore confirmation dialog state (Mandatory confirmation for mutating data)
  const [fileToRestore, setFileToRestore] = useState<DriveFile | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Delete confirmation state
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generate CSV for Drive export
  const buildCsvContent = () => {
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

    return [headers.join(','), ...expenseRows.map((r) => r.join(',')), ...incomeRows.map((r) => r.join(','))].join('\n');
  };

  const handleSaveJsonToDrive = async () => {
    await saveDataToDrive({ expenses, incomes, budget });
  };

  const handleSaveCsvToDrive = async () => {
    const csv = buildCsvContent();
    await saveCsvToDrive(csv);
  };

  // Perform confirmed restore
  const handleConfirmRestore = async () => {
    if (!fileToRestore) return;
    setIsRestoring(true);
    try {
      const data = await loadBackupFromDrive(fileToRestore.id);
      if (data) {
        importAllData({
          expenses: data.expenses || [],
          incomes: data.incomes || [],
        });
        setFileToRestore(null);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // Perform confirmed delete
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBackup(fileToDelete.id);
      setFileToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail || !shareEmail.includes('@')) return;
    setIsSharing(true);
    try {
      const ok = await shareWithPerson(shareEmail, shareRole);
      if (ok) {
        setShareSuccess(`Folder shared with ${shareEmail}!`);
        setShareEmail('');
        setTimeout(() => setShareSuccess(null), 4000);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-6 space-y-6 transition-colors shadow-2xs">
      {/* Status banner if any */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200/70 dark:border-emerald-800/60'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200/70 dark:border-rose-800/60'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          ) : (
            <Cloud className="w-4 h-4 shrink-0 text-neutral-500" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Google Drive Storage & Multi-Person Access
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                100% Private Cloud
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Sync your ledger directly to your personal Google Drive and share files with family or team members via Gmail.
            </p>
          </div>
        </div>

        {/* Authentication Button or Active User Pill */}
        {!isConnected ? (
          <button
            onClick={signIn}
            disabled={isConnecting}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-xs font-semibold text-neutral-800 dark:text-white shadow-2xs transition-all active:scale-[0.99] shrink-0"
          >
            {/* Google G Logo */}
            <svg className="w-4 h-4" viewBox="0 0 48 48">
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
            <span>{isConnecting ? 'Connecting...' : 'Sign in with Google'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-7 h-7 rounded-lg object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-neutral-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px]">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Check className="w-2.5 h-2.5" />
                    Remembered
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[120px] sm:max-w-[150px]">
                  {user?.email}
                </div>
              </div>
            </div>

            <button
              onClick={signOut}
              className="p-2 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
              title="Disconnect Google Drive"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Connected Workspace Content */}
      {isConnected ? (
        <div className="space-y-6 pt-2">
          {/* Real-time Auto-Sync Status & Toggle Card */}
          <div className="p-4 rounded-xl border border-emerald-200/90 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50/70 via-emerald-50/40 to-transparent dark:from-emerald-950/30 dark:via-emerald-950/15 dark:to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                {isAutoSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CloudCheck className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Automatic Google Drive Cloud Sync
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      autoSyncEnabled
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        autoSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                      }`}
                    />
                    {isAutoSyncing
                      ? 'Syncing Now...'
                      : autoSyncEnabled
                      ? 'Live Auto-Sync Active'
                      : 'Auto-Sync Paused'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                  {autoSyncEnabled
                    ? 'Every expense, income, and budget edit is automatically saved into your Google Drive master ledger in real-time.'
                    : 'Auto-sync is paused. Turn on to have all financial records automatically update in Google Drive as you type.'}
                </p>
                {lastSyncTime && (
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono">
                    Last synced to Drive: {lastSyncTime}
                  </div>
                )}
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={toggleAutoSync}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {autoSyncEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action 1: Save Backup JSON */}
            <button
              onClick={handleSaveJsonToDrive}
              className="flex flex-col items-start p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 bg-neutral-50/60 dark:bg-neutral-800/60 text-left transition-all group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <CloudUpload className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                Save Backup to Drive
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Uploads current ledger data ({expenses.length} exp, {incomes.length} inc)
              </div>
            </button>

            {/* Action 2: Save Spreadsheet CSV */}
            <button
              onClick={handleSaveCsvToDrive}
              className="flex flex-col items-start p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 bg-neutral-50/60 dark:bg-neutral-800/60 text-left transition-all group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                Export Sheet to Drive
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Creates a CSV spreadsheet viewable in Google Sheets
              </div>
            </button>

            {/* Action 3: Open in Google Drive Folder */}
            {folderInfo?.webViewLink ? (
              <a
                href={folderInfo.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-start p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 bg-neutral-50/60 dark:bg-neutral-800/60 text-left transition-all group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span>Open Folder in Drive</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Browse folder directly in Google Drive app or web
                </div>
              </a>
            ) : (
              <div className="flex flex-col items-start p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800/40 text-left">
                <div className="w-8 h-8 rounded-lg bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center mb-2">
                  <FolderOpen className="w-4 h-4 text-neutral-500" />
                </div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Aura Finance Folder
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Folder created on initial backup
                </div>
              </div>
            )}
          </div>

          {/* MULTI-PERSON SHARING (Addresses "use multiple persons in there on data via Gmail") */}
          <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                Share Data with Multiple People (via Gmail)
              </h4>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
              Invite family members, spouses, or roommates to access your Google Drive ledger folder. They will receive an invitation on their Gmail and can view or update files in Google Drive.
            </p>

            <form onSubmit={handleShareSubmit} className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
              <div className="relative flex-1">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Enter partner's or team's Gmail address..."
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                  required
                />
              </div>

              <select
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value as 'reader' | 'writer')}
                aria-label="Google Drive permission role"
                className="px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden"
              >
                <option value="writer">Can Edit & Add Files (Writer)</option>
                <option value="reader">Can View & Download (Viewer)</option>
              </select>

              <button
                type="submit"
                disabled={isSharing || !shareEmail}
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-xl shadow-xs transition-all disabled:opacity-50 shrink-0"
              >
                {isSharing ? 'Sharing...' : 'Share Access'}
              </button>
            </form>

            {shareSuccess && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>{shareSuccess}</span>
              </div>
            )}
          </div>

          {/* File History / Backups List in Google Drive */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Files & Backups in Your Google Drive
                </h4>
                <span className="text-xs text-neutral-400 font-mono">
                  ({backups.length})
                </span>
              </div>

              <button
                onClick={refreshBackups}
                disabled={isLoadingBackups}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                title="Refresh Google Drive files"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {backups.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 text-xs">
                No backup files found yet in your Google Drive folder. Click "Save Backup to Drive" above to create your first cloud backup.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200/80 dark:border-neutral-800 rounded-xl overflow-hidden">
                {backups.map((file) => {
                  const isCsv = file.mimeType === 'text/csv' || file.name.endsWith('.csv');
                  const modified = new Date(file.modifiedTime).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={file.id}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                          {isCsv ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <FileJson className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                            {file.name}
                          </div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                            <span>Modified: {modified}</span>
                            {file.shared && (
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px]">
                                Shared
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* File actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Open in Drive */}
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Open file in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Restore Button (only for JSON backups) */}
                        {!isCsv && (
                          <button
                            onClick={() => setFileToRestore(file)}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors flex items-center gap-1"
                            title="Restore this backup into your current ledger"
                          >
                            <Download className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => setFileToDelete(file)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete from Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Sign in to Activate Cloud Facilities</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xl">
                Connect with your Google account to automatically store your ledger in your private Google Drive folder, invite family members via Gmail, and stay remembered across visits.
              </p>
            </div>

            <button
              onClick={signIn}
              disabled={isConnecting}
              className="flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 font-semibold text-xs shadow-md transition-all active:scale-[0.99] shrink-0 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
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
              <span>{isConnecting ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-start gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>100% Private Cloud:</strong> Uses secure <code>drive.file</code> scope. Only files created by Aura are accessed.</span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span><strong>Family Sharing:</strong> Share budget folders with other Gmail users to collaborate together.</span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <span><strong>Continuous Remembrance:</strong> Your profile stays remembered across sessions.</span>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY CONFIRMATION DIALOG FOR RESTORE (MUTATING DATA) */}
      {fileToRestore && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Confirm Ledger Restore
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Google Drive Backup
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <p className="font-semibold">
                Are you sure you want to restore from "{fileToRestore.name}"?
              </p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                This will download this backup from your Google Drive and replace your current active expenses and incomes with the contents of the backup.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setFileToRestore(null)}
                className="px-3.5 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                {isRestoring ? 'Restoring...' : 'Yes, Restore Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY CONFIRMATION DIALOG FOR DELETE (DELETING USER DATA) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Delete File from Google Drive?
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Permanent removal
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Are you sure you want to permanently delete <span className="font-semibold text-neutral-900 dark:text-white">"{fileToDelete.name}"</span> from your Google Drive? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete from Drive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
