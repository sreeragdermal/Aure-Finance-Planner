import React, { useState, useEffect } from 'react';
import { fetchAppUsersMetrics, AppUserProfile } from '../services/googleAuth';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import {
  Users,
  Shield,
  Smartphone,
  Laptop,
  RefreshCw,
  X,
  Clock,
  Sparkles,
  Lock,
  UserCheck,
} from 'lucide-react';

const OWNER_EMAIL = 'sreeragdermal@gmail.com';

interface AdminStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
}

export const AdminStatsModal: React.FC<AdminStatsModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
}) => {
  const { signIn, isConnecting } = useGoogleDrive();
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [users, setUsers] = useState<AppUserProfile[]>([]);

  const isOwner = currentUserEmail?.toLowerCase() === OWNER_EMAIL;

  const loadData = async () => {
    if (!isOwner) return;
    setLoading(true);
    try {
      const data = await fetchAppUsersMetrics();
      setTotalCount(data.totalCount);
      setUsers(data.users);
    } catch (err) {
      console.warn('Could not load owner stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isOwner) {
      loadData();
    }
  }, [isOpen, isOwner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xl p-6 sm:p-7 space-y-5 text-left text-neutral-900 dark:text-white my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Owner & Admin Portal
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Confidential
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Private adoption telemetry for Sreerag Dermal ({OWNER_EMAIL})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isOwner && (
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Refresh Stats"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isOwner ? (
          /* Private Locked Screen if someone other than Sreerag opens this */
          <div className="py-8 px-4 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                Restricted Owner Access
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                This dashboard is private and strictly reserved for the developer, <strong>Sreerag Dermal</strong>.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={async () => {
                  await signIn();
                }}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isConnecting ? 'Signing in...' : `Sign in as ${OWNER_EMAIL}`}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Admin Authorized View */
          <>
            {/* Big Counter Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-750">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block">
                  Total Users Registered
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                    {totalCount}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    People
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-750">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block">
                  Privacy Architecture
                </span>
                <div className="mt-1">
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    Zero Financial Storage
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Amounts stay in each user's private Drive
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-750">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block">
                  App Platform
                </span>
                <div className="mt-1">
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    PWA Web Application
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Installable on Mobile & PC
                  </p>
                </div>
              </div>
            </div>

            {/* Users List Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Recent Active Users ({users.length})</span>
                </div>
                <span className="text-[11px] font-normal text-neutral-400">
                  Real-time database
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-2xl border border-neutral-200/80 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                {users.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400">
                    {loading ? 'Fetching active users...' : 'No users recorded yet.'}
                  </div>
                ) : (
                  users.map((u) => {
                    const isMobile = u.devicePlatform === 'Mobile';
                    const isDev = u.email?.toLowerCase() === OWNER_EMAIL;
                    return (
                      <div
                        key={u.uid}
                        className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName || 'User'}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold flex items-center justify-center shrink-0 text-xs">
                              {u.displayName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="font-semibold text-neutral-900 dark:text-white truncate flex items-center gap-1.5">
                              <span>{u.displayName || 'User'}</span>
                              {isDev && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  Owner
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate">
                              {u.email || 'Google Account'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <div className="hidden sm:block text-[11px] text-neutral-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              <span>
                                {new Date(u.lastActiveAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <div
                            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                            title={u.devicePlatform}
                          >
                            {isMobile ? (
                              <Smartphone className="w-3.5 h-3.5" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Privacy Note */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Owner Confidentiality:</span>
              </div>
              <p className="leading-relaxed">
                This console and its Firebase metrics are strictly accessible only to your account (<strong>{OWNER_EMAIL}</strong>). Regular users cannot see this link or read user telemetry.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
