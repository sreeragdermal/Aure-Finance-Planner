import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  setCachedAccessToken,
  auth,
} from '../services/googleAuth';
import {
  findOrCreateAppFolder,
  findOrCreateMasterLedgerFile,
  updateDriveFileContent,
  uploadBackupToDrive,
  uploadCsvToDrive,
  listDriveBackups,
  downloadDriveFile,
  shareDriveItem,
  deleteDriveFile,
  DriveFile,
  DriveAuthError,
  DriveNetworkError,
} from '../services/googleDrive';
import { Expense, Income, BudgetConfig } from '../types/expense';

interface FolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

interface GoogleDriveContextType {
  user: User | null;
  token: string | null;
  isConnected: boolean;
  isUserSignedIn: boolean;
  isDriveConnected: boolean;
  isConnecting: boolean;
  isAutoSyncing: boolean;
  autoSyncEnabled: boolean;
  toggleAutoSync: () => void;
  folderInfo: FolderInfo | null;
  backups: DriveFile[];
  isLoadingBackups: boolean;
  lastSyncTime: string | null;
  statusMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  isSignInModalOpen: boolean;
  openSignInModal: () => void;
  closeSignInModal: () => void;
  rememberedAccount: { email: string | null; displayName: string | null; photoURL: string | null } | null;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  saveDataToDrive: (data: {
    expenses: Expense[];
    incomes: Income[];
    budget: BudgetConfig;
  }) => Promise<boolean>;
  saveCsvToDrive: (csvContent: string) => Promise<boolean>;
  loadBackupFromDrive: (
    fileId: string
  ) => Promise<{ expenses?: Expense[]; incomes?: Income[]; budget?: BudgetConfig } | null>;
  shareWithPerson: (email: string, role?: 'reader' | 'writer') => Promise<boolean>;
  deleteBackup: (fileId: string) => Promise<boolean>;
  refreshBackups: () => Promise<void>;
  triggerAutoSync: (data: {
    expenses: Expense[];
    incomes: Income[];
    budget: BudgetConfig;
  }) => void;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined);

const STORAGE_KEY_LAST_SYNC = 'aura_drive_last_sync';
const STORAGE_KEY_AUTO_SYNC = 'aura_drive_auto_sync_enabled';
const STORAGE_KEY_REMEMBERED_ACCOUNT = 'aura_remembered_account';

export const GoogleDriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTO_SYNC);
    return saved !== null ? saved === 'true' : true; // Enabled by default
  });
  const [masterFileId, setMasterFileId] = useState<string | null>(null);
  const [folderInfo, setFolderInfo] = useState<FolderInfo | null>(null);
  const [backups, setBackups] = useState<DriveFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC) || null;
  });

  // Remembered account from past sessions
  const [rememberedAccount, setRememberedAccount] = useState<{
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REMEMBERED_ACCOUNT);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sign-in modal - NEVER auto-opens on visit; only opens when user explicitly clicks Sign In
  const [isSignInModalOpen, setIsSignInModalOpen] = useState<boolean>(false);

  const openSignInModal = () => setIsSignInModalOpen(true);
  const closeSignInModal = () => {
    setIsSignInModalOpen(false);
  };

  const debounceTimerRef = useRef<any>(null);

  const toggleAutoSync = () => {
    setAutoSyncEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_AUTO_SYNC, String(next));
      showStatus(
        next ? 'Auto-sync enabled: Changes will automatically save to Google Drive' : 'Auto-sync paused',
        'info'
      );
      return next;
    });
  };

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  // Fetch folder and files once authenticated with graceful error handling
  const loadDriveData = useCallback(async (authToken: string, isUserInitiated: boolean = false) => {
    if (!authToken) return;
    setIsLoadingBackups(true);
    try {
      const folder = await findOrCreateAppFolder(authToken);
      setFolderInfo(folder);

      const files = await listDriveBackups(authToken);
      setBackups(files);
    } catch (err: any) {
      const isAuthOrNetwork =
        err instanceof DriveAuthError ||
        err instanceof DriveNetworkError ||
        err?.isAuthError ||
        err?.isNetworkError ||
        err?.status === 401 ||
        err?.status === 403 ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('expired') ||
        err?.message?.includes('unauthorized');

      if (isAuthOrNetwork) {
        // Silently clear expired or invalid token
        setCachedAccessToken(null);
        setToken(null);
        setFolderInfo(null);
        setMasterFileId(null);
        console.warn('Google Drive session inactive or offline. Waiting for user authentication.');
        if (isUserInitiated) {
          showStatus('Google Drive session expired. Please sign in again to connect.', 'info');
        }
      } else {
        console.warn('Google Drive notice:', err?.message || err);
        if (isUserInitiated) {
          showStatus(err.message || 'Error connecting to Google Drive', 'error');
        }
      }
    } finally {
      setIsLoadingBackups(false);
    }
  }, []);

  // Listen to Firebase Auth state - silently restore session without popups
  useEffect(() => {
    const currentUser = auth.currentUser;
    const initialToken = getAccessToken(currentUser?.uid);
    if (initialToken && currentUser) {
      loadDriveData(initialToken, false);
    }

    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        if (authUser) {
          const profile = {
            email: authUser.email,
            displayName: authUser.displayName,
            photoURL: authUser.photoURL,
          };
          setRememberedAccount(profile);
          localStorage.setItem(STORAGE_KEY_REMEMBERED_ACCOUNT, JSON.stringify(profile));
        }

        if (authToken && authUser) {
          setToken(authToken);
          loadDriveData(authToken, false);
        } else {
          setToken(null);
        }
        // Ensure modal is closed once user is logged in
        setIsSignInModalOpen(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setFolderInfo(null);
        setBackups([]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [loadDriveData]);

  // Sign in to Google
  const signIn = async (): Promise<boolean> => {
    setIsConnecting(true);
    try {
      const res = await googleSignIn();
      if (res && res.accessToken) {
        setUser(res.user);
        setToken(res.accessToken);
        const profile = {
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
        };
        setRememberedAccount(profile);
        localStorage.setItem(STORAGE_KEY_REMEMBERED_ACCOUNT, JSON.stringify(profile));
        setIsSignInModalOpen(false);
        showStatus(`Connected to Google Drive as ${res.user.email}`, 'success');
        await loadDriveData(res.accessToken, true);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      showStatus(err.message || 'Google sign-in was cancelled or failed', 'error');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await logoutGoogle();
      setUser(null);
      setToken(null);
      setFolderInfo(null);
      setBackups([]);
      localStorage.removeItem(STORAGE_KEY_REMEMBERED_ACCOUNT);
      setRememberedAccount(null);
      setIsSignInModalOpen(false);
      showStatus('Disconnected from Google Drive', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Save full JSON backup to Google Drive
  const saveDataToDrive = async (data: {
    expenses: Expense[];
    incomes: Income[];
    budget: BudgetConfig;
  }): Promise<boolean> => {
    const currentToken = token || getAccessToken(user?.uid);
    if (!currentToken) {
      showStatus('Please connect Google Drive first', 'error');
      return false;
    }

    try {
      showStatus('Saving backup to your Google Drive...', 'info');
      const backupPayload = {
        app: 'Aura Finance Ledger',
        version: 2,
        backupDate: new Date().toISOString(),
        userEmail: user?.email,
        ...data,
      };

      const file = await uploadBackupToDrive(currentToken, backupPayload);
      const nowStr = new Date().toLocaleString();
      setLastSyncTime(nowStr);
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowStr);

      // Refresh backup list
      const files = await listDriveBackups(currentToken);
      setBackups(files);

      showStatus(`Saved "${file.name}" to your Google Drive!`, 'success');
      return true;
    } catch (err: any) {
      if (err instanceof DriveAuthError || err?.isAuthError) {
        setCachedAccessToken(null);
        setToken(null);
        showStatus('Google Drive session expired. Please sign in again to save.', 'error');
      } else if (err instanceof DriveNetworkError || err?.isNetworkError) {
        showStatus('Network error: Unable to reach Google Drive.', 'error');
      } else {
        console.error('Drive save error:', err);
        showStatus(err.message || 'Failed to save to Google Drive', 'error');
      }
      return false;
    }
  };

  // Save CSV Spreadsheet to Google Drive
  const saveCsvToDrive = async (csvContent: string): Promise<boolean> => {
    const currentToken = token || getAccessToken(user?.uid);
    if (!currentToken) {
      showStatus('Please connect Google Drive first', 'error');
      return false;
    }

    try {
      showStatus('Uploading spreadsheet to Google Drive...', 'info');
      const file = await uploadCsvToDrive(currentToken, csvContent);
      const files = await listDriveBackups(currentToken);
      setBackups(files);
      showStatus(`Spreadsheet "${file.name}" created in Google Drive!`, 'success');
      return true;
    } catch (err: any) {
      if (err instanceof DriveAuthError || err?.isAuthError) {
        setCachedAccessToken(null);
        setToken(null);
        showStatus('Google Drive session expired. Please sign in again to save.', 'error');
      } else if (err instanceof DriveNetworkError || err?.isNetworkError) {
        showStatus('Network error: Unable to reach Google Drive.', 'error');
      } else {
        console.error('Drive CSV save error:', err);
        showStatus(err.message || 'Failed to save spreadsheet to Google Drive', 'error');
      }
      return false;
    }
  };

  // Load / restore backup from Google Drive
  const loadBackupFromDrive = async (
    fileId: string
  ): Promise<{ expenses?: Expense[]; incomes?: Income[]; budget?: BudgetConfig } | null> => {
    const currentToken = token || getAccessToken(user?.uid);
    if (!currentToken) {
      showStatus('Please connect Google Drive first', 'error');
      return null;
    }

    try {
      showStatus('Downloading backup from Google Drive...', 'info');
      const data = await downloadDriveFile(currentToken, fileId);
      showStatus('Backup downloaded successfully', 'success');
      return data;
    } catch (err: any) {
      if (err instanceof DriveAuthError || err?.isAuthError) {
        setCachedAccessToken(null);
        setToken(null);
        showStatus('Google Drive session expired. Please sign in again to download.', 'error');
      } else if (err instanceof DriveNetworkError || err?.isNetworkError) {
        showStatus('Network error: Unable to reach Google Drive.', 'error');
      } else {
        console.error('Drive download error:', err);
        showStatus(err.message || 'Failed to download from Google Drive', 'error');
      }
      return null;
    }
  };

  // Share file or folder with multiple people using their Gmail
  const shareWithPerson = async (
    email: string,
    role: 'reader' | 'writer' = 'reader'
  ): Promise<boolean> => {
    const currentToken = token || getAccessToken(user?.uid);
    if (!currentToken) {
      showStatus('Please connect Google Drive first', 'error');
      return false;
    }

    if (!folderInfo?.id) {
      showStatus('Drive folder not found', 'error');
      return false;
    }

    try {
      showStatus(`Sharing Google Drive folder with ${email}...`, 'info');
      await shareDriveItem(currentToken, folderInfo.id, email.trim(), role);
      showStatus(`Shared with ${email}! They can now view or access your ledger files in Drive.`, 'success');
      return true;
    } catch (err: any) {
      if (err instanceof DriveAuthError || err?.isAuthError) {
        setCachedAccessToken(null);
        setToken(null);
        showStatus('Google Drive session expired. Please sign in again to share.', 'error');
      } else {
        console.error('Drive share error:', err);
        showStatus(err.message || 'Failed to share folder in Google Drive', 'error');
      }
      return false;
    }
  };

  // Delete a backup from Drive
  const deleteBackup = async (fileId: string): Promise<boolean> => {
    const currentToken = token || getAccessToken(user?.uid);
    if (!currentToken) return false;

    try {
      await deleteDriveFile(currentToken, fileId);
      setBackups((prev) => prev.filter((b) => b.id !== fileId));
      showStatus('Backup removed from Google Drive', 'info');
      return true;
    } catch (err: any) {
      if (err instanceof DriveAuthError || err?.isAuthError) {
        setCachedAccessToken(null);
        setToken(null);
        showStatus('Google Drive session expired.', 'error');
      } else {
        console.error('Drive delete error:', err);
        showStatus(err.message || 'Failed to delete backup', 'error');
      }
      return false;
    }
  };

  // Continuous Auto-Sync when records change
  const triggerAutoSync = useCallback(
    (data: { expenses: Expense[]; incomes: Income[]; budget: BudgetConfig }) => {
      const currentToken = token || getAccessToken(user?.uid);
      if (!currentToken || !autoSyncEnabled) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        setIsAutoSyncing(true);
        try {
          const payload = {
            app: 'Aura Finance Ledger',
            version: 2,
            autoSync: true,
            lastUpdated: new Date().toISOString(),
            userEmail: user?.email,
            ...data,
          };

          let targetId = masterFileId;
          if (!targetId) {
            const masterFile = await findOrCreateMasterLedgerFile(currentToken, payload);
            targetId = masterFile.id;
            setMasterFileId(targetId);
          } else {
            await updateDriveFileContent(currentToken, targetId, payload);
          }

          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSyncTime(nowStr);
          localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowStr);
        } catch (err: any) {
          if (err instanceof DriveAuthError || err?.isAuthError) {
            setCachedAccessToken(null);
            setToken(null);
          }
          console.warn('Background auto-sync to Drive paused:', err?.message || err);
        } finally {
          setIsAutoSyncing(false);
        }
      }, 1600);
    },
    [token, autoSyncEnabled, masterFileId, user?.email, user?.uid]
  );

  const refreshBackups = async () => {
    const currentToken = token || getAccessToken(user?.uid);
    if (currentToken) {
      await loadDriveData(currentToken, true);
    }
  };

  return (
    <GoogleDriveContext.Provider
      value={{
        user,
        token,
        isConnected: Boolean(user && token),
        isUserSignedIn: Boolean(user || rememberedAccount),
        isDriveConnected: Boolean(user && token),
        isConnecting,
        isAutoSyncing,
        autoSyncEnabled,
        toggleAutoSync,
        folderInfo,
        backups,
        isLoadingBackups,
        lastSyncTime,
        statusMessage,
        isSignInModalOpen,
        openSignInModal,
        closeSignInModal,
        rememberedAccount,
        signIn,
        signOut,
        saveDataToDrive,
        saveCsvToDrive,
        loadBackupFromDrive,
        shareWithPerson,
        deleteBackup,
        refreshBackups,
        triggerAutoSync,
      }}
    >
      {children}
    </GoogleDriveContext.Provider>
  );
};

export const useGoogleDrive = () => {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
  }
  return context;
};
