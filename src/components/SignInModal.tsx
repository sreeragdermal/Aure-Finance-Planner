import React, { useState } from 'react';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import {
  Wallet,
  Cloud,
  Users,
  ShieldCheck,
  ArrowRight,
  X,
  AlertCircle,
} from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  canDismiss = true,
}) => {
  const { signIn, isConnecting } = useGoogleDrive();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setErrorMsg(null);
    try {
      const success = await signIn();
      if (success && onClose) {
        onClose();
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('Browser blocked the Google popup. Please allow popups for this site and try again.');
      } else if (err?.message) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Sign-in could not be completed. Please tap again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xl p-6 sm:p-7 overflow-hidden text-neutral-900 dark:text-neutral-100 transition-colors animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {/* Close / Skip button */}
        {canDismiss && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Close / Continue as Guest"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Brand & Minimal Intro */}
        <div className="text-center pt-2 pb-1 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md">
            <Wallet className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
              Welcome to Aura Finance
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Personal Daily, Weekly & Yearly Financial Ledger
            </p>
          </div>
        </div>

        {/* Sleek Minimal Features */}
        <div className="my-5 py-3 px-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/60 space-y-2.5 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Cloud className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
              <strong>Auto Google Drive Sync:</strong> Your finances safely stay in your own Drive.
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
              <strong>Family & Multi-Person:</strong> Invite family members via Gmail.
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
              <strong>100% Private & Remembered:</strong> Stays logged in on every visit.
            </div>
          </div>
        </div>

        {/* Error Note if any */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Prominent Google Sign-In Button */}
        <div className="space-y-3">
          <button
            onClick={handleSignIn}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
          >
            {/* Google SVG Logo */}
            <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 48 48">
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
            <span>
              {isConnecting ? 'Signing in with Google...' : 'Continue with Google'}
            </span>
          </button>

          {/* Skip / Continue as Guest */}
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="w-full text-center text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 py-1 transition-colors"
            >
              Skip & explore as Guest (offline mode)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
