import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { PageTab } from '../../types/expense';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Sliders,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  X,
} from 'lucide-react';

const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, openAddModal, budget } = useExpenses();

  // Animation & presence states for smooth exit transitions
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });

  const closeTimerRef = useRef<number | null>(null);
  const openTimerRef = useRef<number | null>(null);

  // Track viewport width for responsive bottom-sheet vs modal transforms
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check prefers-reduced-motion
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
    // Trigger entrance animation on next frame
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
    // Keep in DOM until exit animation finishes (240ms)
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

  // Keyboard accessibility: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
    };
  }, []);

  const navItems: { id: PageTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily', label: 'Ledger', icon: Calendar },
    { id: 'charts', label: 'Analytics', icon: BarChart3 },
    { id: 'budgets', label: 'Settings', icon: Sliders },
  ];

  const handleAction = (type: 'expense' | 'income') => {
    closeMenu();
    openAddModal(type);
  };

  return (
    <>
      {/* 
        Refined Record Transaction Modal / Bottom-Sheet 
        Rendered conditionally with proper animation lifecycle
      */}
      {isRendered && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Record Transaction"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-auto"
        >
          {/* Backdrop with quiet darkening, subtle 2px blur & smooth opacity transition */}
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

          {/* 
            Modal / Bottom Sheet Container
            Mobile (<640px): bottom-sheet docked to bottom-0 with rounded-t-[22px], safe-area padding
            Desktop (>=640px): centered modal with rounded-[22px], max-w-[440px]
          */}
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
            {/* Mobile Sheet Handle Pill Indicator */}
            <div className="sm:hidden flex justify-center pb-2 pt-0.5">
              <div className="w-9 h-1 rounded-full bg-[#E5E7EB] dark:bg-[#2D333F]" />
            </div>

            {/* Modal Header (Stagger delay ~40ms) */}
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

              {/* Close Button with subtle circle hover & scale on active press */}
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close modal"
                className="p-1.5 rounded-full text-[#98A2B3] hover:text-[#111827] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1F242F] transition-all duration-150 active:scale-[0.96] cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Transaction Options Staggered List */}
            <div className="space-y-2.5">
              {/* Option 1: Add Expense (Stagger delay ~70ms) */}
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
                  onClick={() => handleAction('expense')}
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

              {/* Option 2: Add Income (Stagger delay ~100ms) */}
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
                  onClick={() => handleAction('income')}
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

      {/* 
        Fixed Bottom Mobile Navigation Bar (< 768px)
      */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#161922]/95 backdrop-blur-md border-t border-[#E7E7E3] dark:border-[#262B35] px-3 py-2 flex items-center justify-around safe-area-inset-bottom">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-[#00B86B] font-semibold'
                  : 'text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* 
          Center Floating Circular + Button 
          Animates into a close state with rotate(90deg) over 280ms cubic-bezier(0.22, 1, 0.36, 1)
          Never jumps or shifts position
        */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={toggleMenu}
            aria-label={isOpen ? 'Close transaction menu' : 'Record transaction'}
            aria-expanded={isOpen}
            className="w-12 h-12 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-lg flex items-center justify-center cursor-pointer transition-transform duration-120 active:scale-95"
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

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-[#00B86B] font-semibold'
                  : 'text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 
        Desktop / Tablet Floating Circular + Button (>= 768px)
        Enables desktop users to also access the quick Record Transaction modal
        Clean, quiet, floating at bottom-right
      */}
      <aside aria-label="Quick actions" className={`hidden md:flex fixed bottom-6 right-6 ${isOpen ? 'z-[60]' : 'z-30'}`}>
        <button
          type="button"
          onClick={toggleMenu}
          aria-label={isOpen ? 'Close transaction menu' : 'Record transaction'}
          aria-expanded={isOpen}
          className="w-12 h-12 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.32)] flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 border border-black/5 dark:border-white/10"
          title="Quick Record Transaction"
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
      </aside>
    </>
  );
};
