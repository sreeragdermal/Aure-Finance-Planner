import React, { useState, useMemo } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useToast } from '../../context/ToastContext';
import { CategoryInfo } from '../../types/expense';
import { formatAmount } from '../../utils/calculations';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Tag,
  Film,
  ShoppingBag,
  Zap,
  Car,
  Utensils,
  Heart,
  Home,
  BookOpen,
  Coffee,
  Gift,
  Wifi,
  Shield,
  Music,
  Plane,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const COLOR_PALETTE = [
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Sky Blue', hex: '#0284C7' },
  { name: 'Violet', hex: '#7C3AED' },
  { name: 'Warm Amber', hex: '#D97706' },
  { name: 'Pink Berry', hex: '#DB2777' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Coral', hex: '#EA580C' },
  { name: 'Slate', hex: '#64748B' },
];

const AVAILABLE_ICONS = [
  { id: 'Tag', component: Tag, label: 'General Tag' },
  { id: 'Utensils', component: Utensils, label: 'Dining' },
  { id: 'Car', component: Car, label: 'Transport' },
  { id: 'Home', component: Home, label: 'Housing' },
  { id: 'Zap', component: Zap, label: 'Bills' },
  { id: 'ShoppingBag', component: ShoppingBag, label: 'Shopping' },
  { id: 'Film', component: Film, label: 'Entertainment' },
  { id: 'Heart', component: Heart, label: 'Health' },
  { id: 'BookOpen', component: BookOpen, label: 'Education' },
  { id: 'Coffee', component: Coffee, label: 'Café & Snacks' },
  { id: 'Wifi', component: Wifi, label: 'Internet & Tech' },
  { id: 'Music', component: Music, label: 'Streaming' },
  { id: 'Plane', component: Plane, label: 'Travel' },
  { id: 'Gift', component: Gift, label: 'Gifts' },
  { id: 'Shield', component: Shield, label: 'Insurance' },
];

export const CategoriesView: React.FC = () => {
  const { categories, categoryList, addCategory, updateCategory, deleteCategory, expenses, budget, setActiveTab } =
    useExpenses();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(COLOR_PALETTE[0].hex);
  const [catIcon, setCatIcon] = useState('Tag');

  // Deletion state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Category usage stats across transactions
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    expenses.forEach((e) => {
      if (!stats[e.category]) {
        stats[e.category] = { count: 0, total: 0 };
      }
      stats[e.category].count += 1;
      stats[e.category].total += e.amount;
    });
    return stats;
  }, [expenses]);

  const handleOpenAdd = () => {
    setEditingCatId(null);
    setCatName('');
    setCatColor(COLOR_PALETTE[0].hex);
    setCatIcon('Tag');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryInfo) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatColor(cat.color || COLOR_PALETTE[0].hex);
    setCatIcon(cat.icon || 'Tag');
    setModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Please enter a category name', 'error');
      return;
    }

    if (editingCatId) {
      updateCategory(editingCatId, {
        name: catName.trim(),
        color: catColor,
        icon: catIcon,
        bgLight: `${catColor}15`,
        bgDark: `${catColor}25`,
        textLight: catColor,
        textDark: catColor,
      });
      showToast(`Updated category "${catName.trim()}"`);
    } else {
      addCategory(catName.trim(), catColor, catIcon);
      showToast(`Added new category "${catName.trim()}"! Available in Record Transaction.`);
    }

    setModalOpen(false);
  };

  const handleDeleteClick = (cat: CategoryInfo) => {
    const count = categoryStats[cat.id]?.count || 0;
    if (count > 0) {
      setWarningMessage(
        `Cannot delete "${cat.name}" because it is currently used by ${count} recorded transaction${
          count === 1 ? '' : 's'
        }. Please reassign or delete these transactions first.`
      );
      return;
    }
    setDeleteConfirmId(cat.id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      const res = deleteCategory(deleteConfirmId);
      if (res.success) {
        showToast('Category deleted');
      } else {
        showToast(res.reason || 'Failed to delete category', 'error');
      }
    }
    setDeleteConfirmId(null);
  };

  const getIconComponent = (iconName: string) => {
    const found = AVAILABLE_ICONS.find((i) => i.id === iconName);
    return found ? found.component : Tag;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#161922] p-5 sm:p-6 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7C3AED] dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#111827] dark:text-[#F3F4F6]">
                  Expense Categories
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300">
                  {categoryList.length} Active
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                Categories are synced across all forms, filters, and analytics. Add new categories like &ldquo;Subscriptions&rdquo; or customize colors.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111111] dark:bg-white text-white dark:text-[#111111] hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold shadow-2xs transition-all active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Warning Notice if deletion blocked */}
      {warningMessage && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p>{warningMessage}</p>
          </div>
          <button
            onClick={() => setWarningMessage(null)}
            className="p-1 text-amber-600 hover:text-amber-800 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {categoryList.map((cat) => {
          const IconComp = getIconComponent(cat.icon);
          const usage = categoryStats[cat.id] || { count: 0, total: 0 };
          const isStandard = !cat.isCustom;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-[#161922] p-4 rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white truncate">
                      {cat.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-[10px] text-[#667085] dark:text-[#9CA3AF]">
                        {isStandard ? 'Default Category' : 'Custom Category'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-[#98A2B3] hover:text-[#111827] dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title={`Edit ${cat.name}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(cat)}
                    className="p-1.5 text-[#98A2B3] hover:text-[#F43F6E] rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title={`Delete ${cat.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Usage Stats Footer */}
              <div className="pt-2.5 border-t border-[#E7E7E3] dark:border-[#262B35] flex items-center justify-between text-[11px]">
                <span className="text-[#667085] dark:text-[#9CA3AF]">
                  {usage.count} transaction{usage.count === 1 ? '' : 's'}
                </span>
                <span className="font-mono font-semibold text-[#111827] dark:text-white">
                  {formatAmount(usage.total, budget.currency)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#161922] rounded-2xl border border-[#E7E7E3] dark:border-[#262B35] shadow-2xl p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E7E7E3] dark:border-[#262B35] pb-3">
              <h2 className="text-sm font-bold text-[#111827] dark:text-white">
                {editingCatId ? 'Edit Category' : 'Create New Category'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#98A2B3] hover:text-[#111827] dark:hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111827] dark:text-white">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Subscriptions, Groceries, Pet Care"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E7E7E3] dark:border-[#262B35] bg-[#FAFAF8] dark:bg-[#0E1015]/40 text-[#111827] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#111111] dark:focus:ring-white transition-all"
                  autoFocus
                  required
                />
              </div>

              {/* Color Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111827] dark:text-white">
                  Category Accent Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((color) => {
                    const isSelected = catColor.toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setCatColor(color.hex)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'ring-2 ring-offset-2 ring-[#111111] dark:ring-white scale-110' : ''
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111827] dark:text-white">
                  Category Icon
                </label>
                <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1 border border-[#E7E7E3] dark:border-[#262B35] rounded-xl bg-[#FAFAF8] dark:bg-[#0E1015]/30">
                  {AVAILABLE_ICONS.map((icon) => {
                    const IconC = icon.component;
                    const isSelected = catIcon === icon.id;
                    return (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => setCatIcon(icon.id)}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] font-semibold'
                            : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-[#667085] dark:text-[#9CA3AF]'
                        }`}
                        title={icon.label}
                      >
                        <IconC className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview Pill */}
              <div className="p-3 rounded-xl bg-[#FAFAF8] dark:bg-[#0E1015]/40 border border-[#E7E7E3] dark:border-[#262B35] flex items-center justify-between">
                <span className="text-xs text-[#667085] dark:text-[#9CA3AF]">Dropdown Preview:</span>
                <div
                  className="px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: `${catColor}15`, color: catColor }}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{catName.trim() || 'Category Name'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#667085] hover:text-[#111827] dark:text-[#9CA3AF] rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#111111] dark:bg-white dark:text-[#111111] hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {editingCatId ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Category Deletion */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        title="Delete Category?"
        description="Are you sure you want to delete this category? This category has no active transactions."
        confirmLabel="Delete Category"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
