import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Database,
  Plus,
  Info,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  LayoutTemplate,
  Bookmark,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Category,
  MonthlyBudget,
  BudgetTemplate,
  RecurringExpense,
  PlannedPurchase,
  PlannedPurchaseStatus,
  BudgetPlannerTab,
} from '../types/budget';
import { budgetService } from '../services/budgetService';
import {
  getCurrentMonthString,
  formatIndianCurrency,
  formatMonthLabel,
  getUpcomingMonths,
  computeBudgetPlanBreakdown,
} from '../utils/budgetUtils';
import { MonthSelector } from '../components/budget/MonthSelector';
import { BudgetHero } from '../components/budget/BudgetHero';
import { CategoryCard } from '../components/budget/CategoryCard';
import { CategoryFormModal } from '../components/budget/CategoryFormModal';
import { RecurringCard } from '../components/budget/RecurringCard';
import { RecurringFormModal } from '../components/budget/RecurringFormModal';
import { PlannedCard } from '../components/budget/PlannedCard';
import { PlannedFormModal } from '../components/budget/PlannedFormModal';
import { BudgetSchemaModal } from '../components/budget/BudgetSchemaModal';
import { SaveTemplateModal } from '../components/budget/SaveTemplateModal';
import { TemplateSheet } from '../components/budget/TemplateSheet';
import { TemplateBanner } from '../components/budget/TemplateBanner';

export const BudgetPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  // Synchronize active month with URL param
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : getCurrentMonthString()
  );

  // Keep selectedMonth in sync with browser Back / Forward URL changes
  useEffect(() => {
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam) && monthParam !== selectedMonth) {
      setSelectedMonth(monthParam);
    }
  }, [monthParam, selectedMonth]);

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setSearchParams({ month: newMonth });
  };

  // Main State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BudgetPlannerTab>('plan');
  const [categories, setCategories] = useState<Category[]>([]);
  const [budget, setBudget] = useState<MonthlyBudget>({
    user_id: userId,
    month: selectedMonth,
    income: 0,
    allocations: {},
  });
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [allPlanned, setAllPlanned] = useState<PlannedPurchase[]>([]);
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);

  // Refs to guarantee fresh values on rapid edits / saves
  const budgetRef = useRef<MonthlyBudget>(budget);
  useEffect(() => {
    budgetRef.current = budget;
  }, [budget]);

  // Modals & Sheets state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);

  const [isPlannedModalOpen, setIsPlannedModalOpen] = useState(false);
  const [editingPlanned, setEditingPlanned] = useState<PlannedPurchase | null>(null);

  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Template feature state
  const [showTemplateSheet, setShowTemplateSheet] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BudgetTemplate | null>(null);
  const [dismissedBanners, setDismissedBanners] = useState<Record<string, boolean>>({});

  // Collapsible upcoming months state
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  // Toast / Status state with proper timer cleanup
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [undoIncome, setUndoIncome] = useState<{ previous: number } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, duration = 2500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Load data whenever userId or selectedMonth changes
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, monthlyBudget, recurring, planned, tpls] = await Promise.all([
        budgetService.fetchCategories(userId),
        budgetService.fetchMonthlyBudget(userId, selectedMonth),
        budgetService.fetchRecurring(userId),
        budgetService.fetchPlanned(userId),
        budgetService.fetchTemplates(userId),
      ]);

      setCategories(cats);
      setBudget(monthlyBudget);
      budgetRef.current = monthlyBudget;
      setRecurringExpenses(recurring);
      setAllPlanned(planned);
      setTemplates(tpls);
    } catch (err) {
      console.error('Error loading budget planner data:', err);
      showToast('Error syncing data');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedMonth, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Planned purchases partition
  const thisMonthPlanned = useMemo(() => {
    return allPlanned.filter((p) => p.target_month === selectedMonth);
  }, [allPlanned, selectedMonth]);

  // Unified budget plan breakdown (manual allocations + active recurring bills + this month's planned purchases)
  const planBreakdown = useMemo(() => {
    return computeBudgetPlanBreakdown(
      categories,
      budget.allocations,
      recurringExpenses,
      thisMonthPlanned
    );
  }, [categories, budget.allocations, recurringExpenses, thisMonthPlanned]);

  const totalAllocated = planBreakdown.totalAllocated;
  const activeRecurringTotal = planBreakdown.totalRecurring;
  const unmatchedTotal =
    planBreakdown.unmatchedRecurringTotal + planBreakdown.unmatchedPlannedTotal;

  // Immediate allocation save (no stale debounce closure or refresh data loss)
  const handleUpdateAllocation = async (categoryId: string, amount: number) => {
    const currentBudget = budgetRef.current;
    const catBreakdown = planBreakdown.byCategoryId[categoryId];
    const committed = catBreakdown?.committedTotal || 0;

    // If user enters an amount below active bills/planned commitments for this category,
    // reset manual override to 0 so effective total equals the commitments without double counting.
    const manualValue = committed > 0 && amount < committed ? 0 : amount;
    const updatedAllocations = {
      ...currentBudget.allocations,
      [categoryId]: manualValue,
    };

    const nextBudget: MonthlyBudget = {
      ...currentBudget,
      allocations: updatedAllocations,
    };
    budgetRef.current = nextBudget;
    setBudget(nextBudget);

    try {
      await budgetService.upsertMonthlyBudget(
        userId,
        selectedMonth,
        nextBudget.income,
        updatedAllocations
      );
      if (committed > 0 && amount < committed) {
        showToast(`Includes ₹${formatIndianCurrency(committed)} from active bills/planned`, 3200);
      } else {
        showToast('Saved');
      }
    } catch (err) {
      console.error('Allocation save failed:', err);
      showToast('Failed to save allocation');
    }
  };

  // Inline income update
  const handleUpdateIncome = async (newIncome: number) => {
    const currentBudget = budgetRef.current;
    const oldIncome = currentBudget.income;
    const nextBudget: MonthlyBudget = { ...currentBudget, income: newIncome };
    budgetRef.current = nextBudget;
    setBudget(nextBudget);

    try {
      await budgetService.upsertMonthlyBudget(
        userId,
        selectedMonth,
        newIncome,
        nextBudget.allocations
      );

      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoIncome({ previous: oldIncome });
      undoTimerRef.current = setTimeout(() => {
        setUndoIncome(null);
        undoTimerRef.current = null;
      }, 5000);

      showToast(`Income set to ₹${formatIndianCurrency(newIncome)}`, 5000);
    } catch (err) {
      console.error('Update income failed:', err);
      const reverted: MonthlyBudget = { ...budgetRef.current, income: oldIncome };
      budgetRef.current = reverted;
      setBudget(reverted);
      showToast('Failed to update income');
    }
  };

  const handleUndoIncome = async () => {
    if (!undoIncome) return;
    const prevVal = undoIncome.previous;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndoIncome(null);

    const nextBudget: MonthlyBudget = { ...budgetRef.current, income: prevVal };
    budgetRef.current = nextBudget;
    setBudget(nextBudget);

    await budgetService.upsertMonthlyBudget(
      userId,
      selectedMonth,
      prevVal,
      nextBudget.allocations
    );
    showToast(`Restored income to ₹${formatIndianCurrency(prevVal)}`);
  };

  // Category Actions
  const handleSaveCategory = async (catData: { name: string; icon: string; color: string }) => {
    if (editingCategory) {
      const oldName = editingCategory.name;
      const updated = await budgetService.updateCategory(userId, editingCategory.id, catData);
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

      // Reflect cascaded category rename immediately in Recurring & Planned state
      if (oldName.trim().toLowerCase() !== updated.name.trim().toLowerCase()) {
        const oldNorm = oldName.trim().toLowerCase();
        setRecurringExpenses((prev) =>
          prev.map((r) =>
            r.category.trim().toLowerCase() === oldNorm ? { ...r, category: updated.name } : r
          )
        );
        setAllPlanned((prev) =>
          prev.map((p) =>
            p.category.trim().toLowerCase() === oldNorm ? { ...p, category: updated.name } : p
          )
        );
      }
      showToast('Category updated');
    } else {
      const created = await budgetService.addCategory(userId, catData);
      setCategories((prev) => [...prev, created]);
      const currentBudget = budgetRef.current;
      const updatedAllocations = { ...currentBudget.allocations, [created.id]: 0 };
      const nextBudget: MonthlyBudget = { ...currentBudget, allocations: updatedAllocations };
      budgetRef.current = nextBudget;
      setBudget(nextBudget);
      await budgetService.upsertMonthlyBudget(
        userId,
        selectedMonth,
        nextBudget.income,
        updatedAllocations
      );
      showToast('Category created');
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeletingCategory(true);
    try {
      await budgetService.deleteCategory(userId, categoryToDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));

      const currentBudget = budgetRef.current;
      const updatedAllocations = { ...currentBudget.allocations };
      delete updatedAllocations[categoryToDelete.id];
      const nextBudget: MonthlyBudget = { ...currentBudget, allocations: updatedAllocations };
      budgetRef.current = nextBudget;
      setBudget(nextBudget);
      await budgetService.upsertMonthlyBudget(
        userId,
        selectedMonth,
        nextBudget.income,
        updatedAllocations
      );
      setCategoryToDelete(null);
      showToast('Category deleted');
    } catch (err) {
      console.error('Delete category failed:', err);
      showToast('Failed to delete category');
    } finally {
      setDeletingCategory(false);
    }
  };

  // Recurring Actions
  const handleSaveRecurring = async (data: {
    name: string;
    amount: number;
    category: string;
    day_of_month: number;
    active: boolean;
  }) => {
    if (editingRecurring) {
      const updated = await budgetService.updateRecurring(
        userId,
        editingRecurring.id,
        data,
        editingRecurring
      );
      setRecurringExpenses((prev) =>
        prev
          .map((r) => (r.id === updated.id ? updated : r))
          .sort((a, b) => a.day_of_month - b.day_of_month)
      );
      showToast('Recurring expense updated');
    } else {
      const created = await budgetService.addRecurring(userId, data);
      setRecurringExpenses((prev) =>
        [...prev, created].sort((a, b) => a.day_of_month - b.day_of_month)
      );
      showToast('Recurring expense added');
    }
  };

  const handleToggleRecurring = async (id: string, active: boolean) => {
    const existing = recurringExpenses.find((r) => r.id === id);
    setRecurringExpenses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active } : r))
    );
    await budgetService.toggleRecurring(userId, id, active, existing);
  };

  const handleDeleteRecurring = async (id: string) => {
    setRecurringExpenses((prev) => prev.filter((r) => r.id !== id));
    await budgetService.deleteRecurring(userId, id);
    showToast('Recurring expense deleted');
  };

  // Planned Actions
  const handleSavePlanned = async (data: {
    name: string;
    amount: number;
    category: string;
    target_month: string;
    status: PlannedPurchaseStatus;
    notes?: string;
  }) => {
    if (editingPlanned) {
      const updated = await budgetService.updatePlanned(
        userId,
        editingPlanned.id,
        data,
        editingPlanned
      );
      setAllPlanned((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast('Planned purchase updated');
    } else {
      const created = await budgetService.addPlanned(userId, data);
      setAllPlanned((prev) => [created, ...prev]);
      showToast('Planned purchase added');
    }
  };

  const handleTogglePlannedBought = async (id: string, nextStatus: PlannedPurchaseStatus) => {
    const existing = allPlanned.find((p) => p.id === id);
    setAllPlanned((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
    );
    await budgetService.markPlannedBought(userId, id, nextStatus, existing);
    showToast(nextStatus === 'bought' ? 'Marked as bought ✓' : 'Marked back as planned');
  };

  const handleDeletePlanned = async (id: string) => {
    setAllPlanned((prev) => prev.filter((p) => p.id !== id));
    await budgetService.deletePlanned(userId, id);
    showToast('Planned purchase deleted');
  };

  const toggleUpcomingMonth = (m: string) => {
    setCollapsedMonths((prev) => ({
      ...prev,
      [m]: !prev[m],
    }));
  };

  // Template Actions
  const handleSaveTemplate = async (data: {
    name: string;
    allocations: Record<string, number>;
    is_default: boolean;
  }) => {
    if (editingTemplate) {
      const updated = await budgetService.updateTemplate(userId, editingTemplate.id, data);
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === updated.id ? updated : data.is_default ? { ...t, is_default: false } : t
        )
      );
      showToast('Template updated');
    } else {
      const created = await budgetService.saveAsTemplate(
        userId,
        data.name,
        data.allocations,
        data.is_default
      );
      const refreshed = await budgetService.fetchTemplates(userId);
      setTemplates(refreshed);
      showToast(`Template "${created.name}" saved!`);
    }
  };

  const handleApplyTemplate = async (template: BudgetTemplate) => {
    try {
      const result = await budgetService.applyTemplate(
        userId,
        template.id,
        selectedMonth,
        categories
      );
      setBudget(result.budget);
      budgetRef.current = result.budget;
      if (result.skippedCount > 0) {
        showToast(
          `Applied "${template.name}". Note: ${result.skippedCount} missing category skipped.`
        );
      } else {
        showToast(`Applied "${template.name}" to ${formatMonthLabel(selectedMonth)}!`);
      }
    } catch (err: any) {
      console.error('Apply template failed:', err);
      showToast(err?.message || 'Failed to apply template');
    }
  };

  const handleSetDefaultTemplate = async (template: BudgetTemplate) => {
    await budgetService.setDefaultTemplate(userId, template.id);
    const refreshed = await budgetService.fetchTemplates(userId);
    setTemplates(refreshed);
    showToast(`"${template.name}" set as default`);
  };

  const handleDeleteTemplate = async (template: BudgetTemplate) => {
    await budgetService.deleteTemplate(userId, template.id);
    setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    showToast(`Template "${template.name}" deleted`);
  };

  const handleOpenSaveCurrentPlan = () => {
    if (totalAllocated <= 0) {
      showToast('Allocate to at least one category before saving as a template', 3000);
      return;
    }
    setEditingTemplate(null);
    setShowSaveTemplateModal(true);
  };

  const handleFocusIncome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const btn = document.getElementById('budget-hero-income-btn');
    if (btn) btn.click();
  };

  const defaultTemplate = useMemo(() => {
    return templates.find((t) => t.is_default) || null;
  }, [templates]);

  // Show template banner if user has templates to apply to an unbudgeted month,
  // or if both income and allocations are 0 (brand new month setup)
  const shouldShowTemplateBanner = useMemo(() => {
    const manualTotal = Object.values(budget.allocations || {}).reduce(
      (s, v) => s + (Number(v) || 0),
      0
    );
    if (manualTotal > 0) return false;
    if (templates.length > 0) return true;
    return budget.income === 0 && totalAllocated === 0;
  }, [budget.allocations, budget.income, templates.length, totalAllocated]);

  // Include next 3 months PLUS any other months that have planned items (e.g., 4-12 months out)
  const upcomingMonthsList = useMemo(() => {
    const base = getUpcomingMonths(3, selectedMonth);
    const monthSet = new Set<string>(base);
    allPlanned.forEach((p) => {
      if (p.target_month && p.target_month !== selectedMonth) {
        monthSet.add(p.target_month);
      }
    });
    return Array.from(monthSet).sort((a, b) => a.localeCompare(b));
  }, [selectedMonth, allPlanned]);

  const upcomingPlannedByMonth = useMemo(() => {
    const grouped: Record<string, PlannedPurchase[]> = {};
    upcomingMonthsList.forEach((m) => {
      grouped[m] = allPlanned.filter((p) => p.target_month === m);
    });
    return grouped;
  }, [allPlanned, upcomingMonthsList]);

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-full px-4 pt-3 pb-8 text-[#111827] dark:text-[#f1f5f9] transition-colors duration-200 overflow-x-hidden space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white dark:bg-white/95 dark:text-slate-950 text-xs font-semibold shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 max-w-[90vw]">
          <span className="truncate">{toastMessage}</span>
          {undoIncome && (
            <button
              type="button"
              onClick={handleUndoIncome}
              className="flex items-center gap-1 text-indigo-400 dark:text-indigo-600 font-bold ml-1 pl-1.5 border-l border-white/20 dark:border-black/20 hover:underline cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              Undo
            </button>
          )}
        </div>
      )}

      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9] truncate">
              Budget Planner
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {templates.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTemplateSheet(true)}
                className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-[#6366f1] dark:text-[#818cf8] bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer border border-indigo-200/50 dark:border-indigo-800/40"
                title="Manage and Apply Templates"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Templates</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsSchemaModalOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Database Schema"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month Selector */}
        <MonthSelector currentMonth={selectedMonth} onMonthChange={handleMonthChange} />
      </div>

      {/* Hero Card */}
      <div>
        <BudgetHero
          month={selectedMonth}
          income={budget.income}
          totalAllocated={totalAllocated}
          onUpdateIncome={handleUpdateIncome}
        />
      </div>

      {/* Inline Banner for New/Unbudgeted Months */}
      {shouldShowTemplateBanner && !dismissedBanners[selectedMonth] && (
        <div>
          <TemplateBanner
            month={selectedMonth}
            defaultTemplate={defaultTemplate}
            templatesCount={templates.length}
            onApplyDefault={handleApplyTemplate}
            onBrowseTemplates={() => setShowTemplateSheet(true)}
            onSetIncome={handleFocusIncome}
            onDismiss={() =>
              setDismissedBanners((prev) => ({ ...prev, [selectedMonth]: true }))
            }
          />
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800/80 p-1 border border-[#e5e7eb] dark:border-[#334155]">
        <button
          type="button"
          onClick={() => setActiveTab('plan')}
          className={`flex-1 min-w-0 py-1.5 px-1 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
            activeTab === 'plan'
              ? 'bg-white dark:bg-[#1e293b] text-[#111827] dark:text-[#f1f5f9] shadow-xs'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
          }`}
        >
          Plan ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('recurring')}
          className={`flex-1 min-w-0 py-1.5 px-1 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
            activeTab === 'recurring'
              ? 'bg-white dark:bg-[#1e293b] text-[#111827] dark:text-[#f1f5f9] shadow-xs'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
          }`}
        >
          Recurring ({recurringExpenses.filter((r) => r.active).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('planned')}
          className={`flex-1 min-w-0 py-1.5 px-1 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
            activeTab === 'planned'
              ? 'bg-white dark:bg-[#1e293b] text-[#111827] dark:text-[#f1f5f9] shadow-xs'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
          }`}
        >
          Planned ({thisMonthPlanned.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-3.5 space-y-4">
        {/* ================= TAB 1: PLAN ================= */}
        {activeTab === 'plan' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8]">
                Category Allocations
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#6366f1] dark:text-[#818cf8] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-[#6b7280] dark:text-[#94a3b8]">
                Loading budget plan...
              </div>
            ) : categories.length === 0 ? (
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-8 text-center border border-dashed border-[#e5e7eb] dark:border-[#334155] space-y-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] mx-auto flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
                    No categories yet
                  </h4>
                  <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
                    Add your first category to start allocating your monthly income.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  + Add Category
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    allocationAmount={budget.allocations[category.id] || 0}
                    breakdown={planBreakdown.byCategoryId[category.id]}
                    totalIncome={budget.income}
                    onUpdateAllocation={handleUpdateAllocation}
                    onEditCategory={(cat) => {
                      setEditingCategory(cat);
                      setIsCategoryModalOpen(true);
                    }}
                    onDeleteCategory={(cat) => setCategoryToDelete(cat)}
                  />
                ))}

                {/* Uncategorized Active Commitments notice (if any bill/planned item uses a deleted/other category) */}
                {unmatchedTotal > 0 && (
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-xs">
                    <span className="text-amber-800 dark:text-amber-300 font-medium">
                      Other uncategorized bills / planned items
                    </span>
                    <span className="font-bold text-amber-900 dark:text-amber-200 shrink-0">
                      ₹{formatIndianCurrency(unmatchedTotal)}
                    </span>
                  </div>
                )}

                {/* Plan Summary Bottom Card */}
                <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold flex-wrap gap-1.5">
                    <span className="text-[#6b7280] dark:text-[#94a3b8] min-w-0">
                      Allocated ₹{formatIndianCurrency(totalAllocated)} / Income ₹{formatIndianCurrency(budget.income)}
                    </span>
                    <span
                      className={`text-xs font-bold shrink-0 ${
                        totalAllocated === budget.income && budget.income > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : totalAllocated > budget.income
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {budget.income === 0
                        ? 'Set income above'
                        : totalAllocated === budget.income
                        ? '100% Planned'
                        : `${Math.round((totalAllocated / budget.income) * 100)}% Planned`}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        totalAllocated > budget.income
                          ? 'bg-rose-500'
                          : totalAllocated === budget.income && budget.income > 0
                          ? 'bg-emerald-500'
                          : 'bg-[#6366f1]'
                      }`}
                      style={{
                        width:
                          budget.income > 0
                            ? `${Math.min(100, (totalAllocated / budget.income) * 100)}%`
                            : '0%',
                      }}
                    />
                  </div>

                  {budget.income === 0 && (
                    <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] italic text-center pt-1">
                      Set your income to start planning.
                    </p>
                  )}

                  {/* Save current plan as template button */}
                  <div className="pt-2 text-center border-t border-[#e5e7eb] dark:border-[#334155]">
                    <button
                      type="button"
                      onClick={handleOpenSaveCurrentPlan}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366f1] dark:text-[#818cf8] hover:text-indigo-700 dark:hover:text-indigo-300 py-1.5 px-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save current plan as template</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: RECURRING ================= */}
        {activeTab === 'recurring' && (
          <div className="space-y-3">
            {/* Info Banner */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <Info className="w-4 h-4 text-[#6366f1] dark:text-[#818cf8] shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                Active monthly bills automatically count toward their category in the Plan tab, so your budget stays accurate without double counting.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8]">
                Recurring Expenses
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingRecurring(null);
                  setIsRecurringModalOpen(true);
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#6366f1] dark:text-[#818cf8] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Bill
              </button>
            </div>

            {recurringExpenses.length === 0 ? (
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-8 text-center border border-dashed border-[#e5e7eb] dark:border-[#334155] space-y-2">
                <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">
                  No recurring bills added yet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecurring(null);
                    setIsRecurringModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-[#6366f1] text-white rounded-xl cursor-pointer"
                >
                  + Add First Bill
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recurringExpenses.map((item) => (
                  <RecurringCard
                    key={item.id}
                    item={item}
                    categoryLabel={item.category}
                    onToggleActive={handleToggleRecurring}
                    onEdit={(rec) => {
                      setEditingRecurring(rec);
                      setIsRecurringModalOpen(true);
                    }}
                    onDelete={handleDeleteRecurring}
                  />
                ))}

                {/* Total Bottom Bar */}
                <div className="mt-4 p-3.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] min-w-0">
                    Active Monthly Commitments
                  </span>
                  <span className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9] shrink-0">
                    Total: ₹{formatIndianCurrency(activeRecurringTotal)} / month
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: PLANNED ================= */}
        {activeTab === 'planned' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8]">
                Planned Purchases
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingPlanned(null);
                  setIsPlannedModalOpen(true);
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#6366f1] dark:text-[#818cf8] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Plan a Purchase
              </button>
            </div>

            {/* Section 1: This Month */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-[#f1f5f9]">
                <Calendar className="w-3.5 h-3.5 text-[#6366f1]" />
                <span>This Month ({formatMonthLabel(selectedMonth)})</span>
              </div>

              {thisMonthPlanned.length === 0 ? (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-dashed border-[#e5e7eb] dark:border-[#334155] text-center text-xs text-[#6b7280] dark:text-[#94a3b8]">
                  No upcoming purchases planned for this month.
                </div>
              ) : (
                <div className="space-y-2">
                  {thisMonthPlanned.map((item) => (
                    <PlannedCard
                      key={item.id}
                      item={item}
                      categoryLabel={item.category}
                      onToggleBought={handleTogglePlannedBought}
                      onEdit={(p) => {
                        setEditingPlanned(p);
                        setIsPlannedModalOpen(true);
                      }}
                      onDelete={handleDeletePlanned}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Upcoming & Other Scheduled Months (grouped & collapsible) */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9] block">
                Other Scheduled Months
              </span>

              {upcomingMonthsList.map((futureMonth) => {
                const items = upcomingPlannedByMonth[futureMonth] || [];
                const isCollapsed = collapsedMonths[futureMonth] || false;
                const totalMonthAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

                return (
                  <div
                    key={futureMonth}
                    className="rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleUpcomingMonth(futureMonth)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50/70 dark:bg-slate-900/40 text-left hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9] truncate">
                          {formatMonthLabel(futureMonth)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-slate-800 text-[#4b5563] dark:text-[#94a3b8] font-semibold shrink-0">
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {totalMonthAmount > 0 && (
                          <span className="text-xs font-bold text-[#6366f1] dark:text-[#818cf8]">
                            ₹{formatIndianCurrency(totalMonthAmount)}
                          </span>
                        )}
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-[#9ca3af]" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-[#9ca3af]" />
                        )}
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="p-2 space-y-2">
                        {items.length === 0 ? (
                          <p className="p-2 text-center text-[11px] text-[#6b7280] dark:text-[#94a3b8] italic">
                            Nothing planned for {formatMonthLabel(futureMonth)} yet.
                          </p>
                        ) : (
                          items.map((item) => (
                            <PlannedCard
                              key={item.id}
                              item={item}
                              categoryLabel={item.category}
                              onToggleBought={handleTogglePlannedBought}
                              onEdit={(p) => {
                                setEditingPlanned(p);
                                setIsPlannedModalOpen(true);
                              }}
                              onDelete={handleDeletePlanned}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Category Confirmation Modal (replaces blocked window.confirm) */}
      {categoryToDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingCategory) setCategoryToDelete(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e5e7eb] dark:border-[#334155] p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
                  Delete "{categoryToDelete.name}"?
                </h3>
                <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-1 leading-relaxed">
                  Manual allocations for this category will be removed. Any active recurring bills will remain in your Recurring tab.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e7eb] dark:border-[#334155]">
              <button
                type="button"
                disabled={deletingCategory}
                onClick={() => setCategoryToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingCategory}
                onClick={handleConfirmDeleteCategory}
                className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingCategory ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        editingCategory={editingCategory}
      />

      <RecurringFormModal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setEditingRecurring(null);
        }}
        categories={categories}
        onSave={handleSaveRecurring}
        editingItem={editingRecurring}
      />

      <PlannedFormModal
        isOpen={isPlannedModalOpen}
        onClose={() => {
          setIsPlannedModalOpen(false);
          setEditingPlanned(null);
        }}
        categories={categories}
        currentMonth={selectedMonth}
        onSave={handleSavePlanned}
        editingItem={editingPlanned}
      />

      <BudgetSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      {/* Template Bottom Sheet */}
      <TemplateSheet
        isOpen={showTemplateSheet}
        onClose={() => setShowTemplateSheet(false)}
        templates={templates}
        categories={categories}
        targetMonth={selectedMonth}
        onApply={handleApplyTemplate}
        onEdit={(tpl) => {
          setEditingTemplate(tpl);
          setShowSaveTemplateModal(true);
          setShowTemplateSheet(false);
        }}
        onSetDefault={handleSetDefaultTemplate}
        onDelete={handleDeleteTemplate}
        onCreateNew={handleOpenSaveCurrentPlan}
      />

      {/* Save / Edit Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        onClose={() => {
          setShowSaveTemplateModal(false);
          setEditingTemplate(null);
        }}
        categories={categories}
        initialName={editingTemplate ? editingTemplate.name : ''}
        initialAllocations={
          editingTemplate ? editingTemplate.allocations : planBreakdown.effectiveAllocations
        }
        initialIsDefault={editingTemplate ? editingTemplate.is_default : false}
        isEditing={!!editingTemplate}
        templateId={editingTemplate ? editingTemplate.id : undefined}
        existingTemplates={templates.map((t) => ({ id: t.id, name: t.name }))}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};
