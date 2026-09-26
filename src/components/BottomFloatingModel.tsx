import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Plus, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';

const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

export const BottomFloatingModel: React.FC = () => {
  const { openAddModal, budget } = useExpenses();
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });

  const closeTimerRef = useRef<number | null>(null);
  const openTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsRendered(true);
    setIsOpen(true);
    openTimerRef.current = window.setTimeout(() => {
      setIsAnimatingIn(true);
    }, 16);
  };

  const closeMenu = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    setIsOpen(false);
    setIsAnimatingIn(false);
    closeTimerRef.current = window.setTimeout(() => {
      setIsRendered(false);
    }, 240);
  };

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
    };
  }, []);

  const handleSelect = (type: 'income' | 'expense') => {
    closeMenu();
    openAddModal(type);
  };

  return (
    <>
      {isRendered && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Record Transaction"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-auto"
        >
          <div
            onClick={closeMenu}
            aria-hidden="true"
            className="fixed inset-0"
            style={{
              backgroundColor: 'rgba(10, 15, 25, 0.32)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              opacity: isAnimatingIn ? 1 : 0,
              transition: `opacity ${isAnimatingIn ? '260ms' : '220ms'} ${EASING}`,
            }}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[520px] sm:max-w-[460px] bg-white dark:bg-[#161922] border border-[#E7E7E3] dark:border-[#262B35] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)] p-4 sm:p-5 rounded-t-[22px] rounded-b-none sm:rounded-[22px] overflow-hidden"
            style={{
              paddingBottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.85rem))',
              opacity: isAnimatingIn ? 1 : 0,
              transform: prefersReducedMotion
                ? 'none'
                : isAnimatingIn
                ? 'translateY(0) scale(1)'
                : isMobile
                ? 'translateY(100%) scale(0.99)'
                : 'translateY(18px) scale(0.97)',
              transition: prefersReducedMotion
                ? 'opacity 180ms ease'
                : `opacity ${isAnimatingIn ? '380ms' : '220ms'} ${EASING}, transform ${
                    isAnimatingIn ? (isMobile ? '400ms' : '360ms') : (isMobile ? '240ms' : '220ms')
                  } ${EASING}`,
              willChange: 'transform, opacity',
            }}
          >
            <div className="sm:hidden flex justify-center pb-2 pt-0.5">
              <div className="w-9 h-1 rounded-full bg-[#E5E7EB] dark:bg-[#2D333F]" />
            </div>

            <div
              className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#F0F0EE] dark:border-[#262B35]"
              style={{
                opacity: isAnimatingIn ? 1 : 0,
                transform: prefersReducedMotion
                  ? 'none'
                  : isAnimatingIn
                  ? 'translateY(0)'
                  : 'translateY(6px)',
                transition: prefersReducedMotion
                  ? 'opacity 180ms ease'
                  : `opacity 260ms ${EASING} ${isAnimatingIn ? '40ms' : '0ms'}, transform 260ms ${EASING} ${
                      isAnimatingIn ? '40ms' : '0ms'
                    }`,
              }}
            >
              <div>
                <h3 className="text-sm font-semibold text-[#111827] dark:text-white tracking-tight">
                  Record Transaction
                </h3>
                <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                  Update your daily balance in {budget.currency}
                </p>
              </div>

              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close modal"
                className="p-1.5 rounded-full text-[#98A2B3] hover:text-[#111827] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1F242F] transition-all duration-150 active:scale-[0.96] cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div
                style={{
                  opacity: isAnimatingIn ? 1 : 0,
                  transform: prefersReducedMotion
                    ? 'none'
                    : isAnimatingIn
                    ? 'translateY(0)'
                    : 'translateY(6px)',
                  transition: prefersReducedMotion
                    ? 'opacity 180ms ease'
                    : `opacity 260ms ${EASING} ${isAnimatingIn ? '70ms' : '0ms'}, transform 260ms ${EASING} ${
                        isAnimatingIn ? '70ms' : '0ms'
                      }`,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSelect('expense')}
                  className="w-full flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#FFF0F4] hover:bg-rose-100/75 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200/60 dark:border-rose-800/40 text-left transition-all duration-120 cursor-pointer shadow-2xs active:scale-[0.985] group"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F43F6E] text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs sm:text-sm font-semibold text-[#F43F6E]">Add Expense</p>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-rose-200/50 dark:bg-rose-900/50 text-[#F43F6E] font-medium">
                        -{budget.currency}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] truncate mt-0.5">
                      Chai, groceries, dining, shopping, bills
                    </p>
                  </div>
                </button>
              </div>

              <div
                style={{
                  opacity: isAnimatingIn ? 1 : 0,
                  transform: prefersReducedMotion
                    ? 'none'
                    : isAnimatingIn
                    ? 'translateY(0)'
                    : 'translateY(6px)',
                  transition: prefersReducedMotion
                    ? 'opacity 180ms ease'
                    : `opacity 260ms ${EASING} ${isAnimatingIn ? '100ms' : '0ms'}, transform 260ms ${EASING} ${
                        isAnimatingIn ? '100ms' : '0ms'
                      }`,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSelect('income')}
                  className="w-full flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#E9FBF3] hover:bg-emerald-100/75 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 text-left transition-all duration-120 cursor-pointer shadow-2xs active:scale-[0.985] group"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#00B86B] text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:translate-y-0.5">
                    <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs sm:text-sm font-semibold text-[#00B86B]">Add Income</p>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-200/50 dark:bg-emerald-900/50 text-[#00B86B] font-medium">
                        +{budget.currency}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] truncate mt-0.5">
                      Salary, dividends, UPI deposits, freelance
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Container */}
      <div
        className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-none select-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <button
          type="button"
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close quick menu' : 'Add expense or income'}
          className="pointer-events-auto relative w-12 h-12 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-lg flex items-center justify-center cursor-pointer transition-transform duration-120 active:scale-95 border border-black/5 dark:border-white/10"
        >
          <div
            className="relative w-5 h-5 flex items-center justify-center"
            style={{
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: prefersReducedMotion
                ? 'none'
                : `transform 280ms ${EASING}`,
            }}
          >
            <Plus
              className="w-5 h-5 absolute transition-opacity duration-200"
              style={{ opacity: isOpen ? 0 : 1 }}
            />
            <X
              className="w-5 h-5 absolute transition-opacity duration-200"
              style={{ opacity: isOpen ? 1 : 0 }}
            />
          </div>
        </button>
      </div>
    </>
  );
};
