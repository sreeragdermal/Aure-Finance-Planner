import React, { useState, useEffect, useRef } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useGoogleDrive } from '../../context/GoogleDriveContext';
import { Cloud, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SESSION_DISMISSED_KEY = 'aura_login_reminder_dismissed_session';
const LAST_SHOWN_TIME_KEY = 'aura_login_reminder_last_shown';
const SUCCESS_BANNER_SHOWN_KEY = 'aura_cloud_sync_enabled_toast_shown';

export const GoogleLoginReminder: React.FC = () => {
  const { expenses, incomes } = useExpenses();
  const { isConnected, user, isConnecting, signIn } = useGoogleDrive();

  const [showPrompt, setShowPrompt] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const previousIsConnected = useRef<boolean>(isConnected);

  // Detect when user newly signs in successfully
  useEffect(() => {
    if (!previousIsConnected.current && (isConnected || user)) {
      setShowPrompt(false);
      const alreadyShown = sessionStorage.getItem(SUCCESS_BANNER_SHOWN_KEY);
      if (!alreadyShown) {
        setShowSuccessToast(true);
        sessionStorage.setItem(SUCCESS_BANNER_SHOWN_KEY, 'true');
        const timer = setTimeout(() => {
          setShowSuccessToast(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
    previousIsConnected.current = Boolean(isConnected || user);
  }, [isConnected, user]);

  // Evaluate whether to show the non-annoying prompt
  useEffect(() => {
    // If user is already connected or currently connecting, do not show
    if (isConnected || user || isConnecting) {
      setShowPrompt(false);
      return;
    }

    const totalRecords = expenses.length + incomes.length;
    // Only show after user has created financial records
    if (totalRecords === 0) {
      setShowPrompt(false);
      return;
    }

    // Check if dismissed in this session
    const isDismissedThisSession = sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true';
    if (isDismissedThisSession) {
      return;
    }

    // Check cooldown from last time it was shown (at least 2 hours or multiple sessions)
    const lastShown = localStorage.getItem(LAST_SHOWN_TIME_KEY);
    const now = Date.now();
    if (lastShown) {
      const elapsedMs = now - parseInt(lastShown, 10);
      const minCooldownMs = 1000 * 60 * 60 * 2; // 2 hours
      if (elapsedMs < minCooldownMs) {
        return;
      }
    }

    // Delay prompt slightly (e.g. 1.8 seconds) so it doesn't immediately snap in
    const timer = setTimeout(() => {
      setShowPrompt(true);
      localStorage.setItem(LAST_SHOWN_TIME_KEY, String(Date.now()));
    }, 1800);

    return () => clearTimeout(timer);
  }, [expenses.length, incomes.length, isConnected, user, isConnecting]);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
    localStorage.setItem(LAST_SHOWN_TIME_KEY, String(Date.now()));
  };

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch {
      // Handled in context
    }
  };

  return (
    <div
      className="fixed bottom-18 md:bottom-6 right-4 sm:right-6 z-40 max-w-sm pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <AnimatePresence>
        {/* Success toast after successful sign in */}
        {showSuccessToast && (
          <motion.div
            key="success-toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="pointer-events-auto bg-white dark:bg-[#161922] text-[#111827] dark:text-[#F3F4F6] p-4 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-xl flex items-start gap-3"
            role="status"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#00B86B] flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-xs font-semibold text-[#111827] dark:text-white">
                Cloud sync enabled
              </h4>
              <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5 leading-relaxed">
                Your data is now synchronized across your devices.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="p-1 text-[#98A2B3] hover:text-[#111827] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Non-annoying Login Reminder */}
        {showPrompt && !showSuccessToast && (
          <motion.div
            key="login-reminder"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="pointer-events-auto bg-white dark:bg-[#161922] p-4 sm:p-5 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-xl space-y-3"
            role="dialog"
            aria-labelledby="reminder-title"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  id="reminder-title"
                  className="text-xs font-semibold text-[#111827] dark:text-white"
                >
                  Save your data safely
                </h4>
                <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5 leading-relaxed">
                  Sign in with Google to sync your Aura Finance data across your devices.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 text-[#98A2B3] hover:text-[#111827] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Dismiss reminder"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSignIn}
                disabled={isConnecting}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#111827] hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-neutral-100 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {/* Google G Icon */}
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>{isConnecting ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-xl text-xs font-medium text-[#667085] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Not now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
