import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { Search, X, Calendar, ArrowUpRight, ArrowDownLeft, Tag, DollarSign } from 'lucide-react';
import { formatAmount } from '../../utils/calculations';
import { CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { expenses, incomes, budget, setSelectedDate, setActiveTab } = useExpenses();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const expenseMatches = expenses
      .filter((e) => {
        if (filterType === 'income') return false;
        const catName = CATEGORIES[e.category]?.name?.toLowerCase() || '';
        return (
          e.title.toLowerCase().includes(q) ||
          catName.includes(q) ||
          e.date.includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.amount.toString().includes(q)
        );
      })
      .map((e) => ({
        ...e,
        isIncome: false,
        categoryName: CATEGORIES[e.category]?.name || e.category,
      }));

    const incomeMatches = incomes
      .filter((inc) => {
        if (filterType === 'expense') return false;
        const catName = INCOME_CATEGORIES[inc.category]?.name?.toLowerCase() || '';
        return (
          inc.title.toLowerCase().includes(q) ||
          catName.includes(q) ||
          inc.date.includes(q) ||
          (inc.notes && inc.notes.toLowerCase().includes(q)) ||
          inc.amount.toString().includes(q)
        );
      })
      .map((inc) => ({
        ...inc,
        isIncome: true,
        categoryName: INCOME_CATEGORIES[inc.category]?.name || inc.category,
      }));

    const combined = [...expenseMatches, ...incomeMatches];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [query, expenses, incomes, filterType]);

  const handleSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setActiveTab('daily');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#161922] rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E7E7E3] dark:border-[#262B35]">
          <Search className="w-5 h-5 text-[#98A2B3] dark:text-[#6B7280] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions by title, category, note, or amount..."
            className="flex-1 bg-transparent text-sm text-[#111827] dark:text-[#F3F4F6] placeholder-[#98A2B3] dark:placeholder-[#6B7280] focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#98A2B3] hover:text-[#111827] dark:hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-[#667085] dark:text-[#9CA3AF] rounded-md hover:bg-neutral-200 transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#FAFAF8] dark:bg-[#0E1015]/40 border-b border-[#E7E7E3] dark:border-[#262B35] text-xs">
          <span className="text-[#667085] dark:text-[#9CA3AF] text-[11px] mr-1">Filter:</span>
          {(['all', 'expense', 'income'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                filterType === type
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-[#667085] dark:text-[#9CA3AF] hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
              }`}
            >
              {type === 'all' ? 'All records' : type === 'expense' ? 'Expenses' : 'Income'}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-[#98A2B3] dark:text-[#6B7280]">
            {results.length} result{results.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-xs text-[#98A2B3] dark:text-[#6B7280]">
              Type a word like <span className="text-[#111827] dark:text-white font-medium">coffee</span>,{' '}
              <span className="text-[#111827] dark:text-white font-medium">salary</span>, or{' '}
              <span className="text-[#111827] dark:text-white font-medium">500</span> to search.
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#98A2B3] dark:text-[#6B7280]">
              No transactions matched &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.date)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#FAFAF8] dark:hover:bg-[#0E1015]/60 cursor-pointer transition-colors border border-transparent hover:border-[#E7E7E3] dark:hover:border-[#262B35]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.isIncome
                        ? 'bg-[#E9FBF3] text-[#00B86B] dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-[#FFF0F4] text-[#F43F6E] dark:bg-rose-950/40 dark:text-rose-400'
                    }`}
                  >
                    {item.isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#667085] dark:text-[#9CA3AF] shrink-0">
                        {item.categoryName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#98A2B3] dark:text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.date} {item.time ? `· ${item.time}` : ''}
                      </span>
                      {item.notes && <span className="truncate max-w-[150px]">· {item.notes}</span>}
                    </div>
                  </div>
                </div>

                <div
                  className={`text-xs font-semibold font-mono tabular-nums shrink-0 ml-3 ${
                    item.isIncome ? 'text-[#00B86B]' : 'text-[#F43F6E]'
                  }`}
                >
                  {item.isIncome ? '+' : '-'}
                  {formatAmount(item.amount, budget.currency)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
