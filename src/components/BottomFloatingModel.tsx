import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Plus, ArrowDownLeft, ArrowUpRight, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BottomFloatingModel: React.FC = () => {
  const { openAddModal, budget } = useExpenses();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (type: 'income' | 'expense') => {
    setIsOpen(false);
    openAddModal(type);
  };

  return (
    <>
      {/* Dimmed Backdrop when menu is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-xs lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Floating Action Container (Visible on both Mobile and Tablet mode: lg:hidden) */}
      <div
        className="fixed bottom-5 right-5 z-50 lg:hidden flex flex-col items-end pointer-events-none select-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Animated Popup Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.94 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="pointer-events-auto mb-3 w-64 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-neutral-800 p-2 space-y-1.5 overflow-hidden"
              role="dialog"
              aria-label="Quick financial transaction options"
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80">
                <span>Quick Add</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {budget.currency} INR
                </span>
              </div>

              {/* Income Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect('income')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/70 dark:border-emerald-800/50 text-left transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <span>+ Log Income</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-200/60 dark:bg-emerald-800/60 font-mono text-emerald-800 dark:text-emerald-200">
                      +{budget.currency}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 truncate mt-0.5">
                    Salary, freelance, UPI transfer
                  </p>
                </div>
              </motion.button>

              {/* Expense Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect('expense')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-left transition-colors group shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>+ Log Expense</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-800 font-mono">
                      -{budget.currency}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 dark:text-neutral-600 truncate mt-0.5">
                    Chai, food, fuel, groceries, bills
                  </p>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Animated Floating Plus Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close quick menu' : 'Add expense or income'}
          whileTap={{ scale: 0.92 }}
          animate={{
            scale: isOpen ? 1.05 : 1,
            rotate: isOpen ? 135 : 0,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="pointer-events-auto relative w-14 h-14 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-xl flex items-center justify-center border border-white/20 dark:border-neutral-800 focus:outline-hidden"
        >
          {/* Subtle pulsating beacon animation when closed */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-2xl bg-emerald-500/25 animate-ping pointer-events-none -z-10" />
          )}

          <Plus className="w-6 h-6 stroke-[2.5]" />
        </motion.button>
      </div>
    </>
  );
};
