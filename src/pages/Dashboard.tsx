import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CheckSquare,
  Wallet,
  HandCoins,
  Sparkles,
  ArrowRight,
  Calendar,
  Flame,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Plus,
  ShoppingBag,
  Pin,
  FolderLock,
  Pill,
  GraduationCap,
  Shirt,
  Briefcase,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
} from '../components/ui';

import { taskService } from '../services/taskService';
import { Task } from '../types/task';
import { isTaskToday } from '../utils/taskDate';

import { debtService } from '../services/debtService';
import { Debt } from '../types/debt';
import { formatCurrency, formatReturnDateBadge } from '../utils/debtDate';

import { budgetService } from '../services/budgetService';
import { MonthSummary } from '../types/budget';
import { getCurrentMonthString, formatIndianCurrency } from '../utils/budgetUtils';

import { shoppingService } from '../services/shoppingService';
import { ShoppingItem } from '../types/shopping';

import { brainService } from '../services/brainService';
import { BrainItem } from '../types/brain';

import { documentService } from '../services/documentService';
import { AppDocument } from '../types/document';
import { ExpiryBadge } from '../components/ExpiryBadge';

import { medicineService } from '../services/medicineService';
import { learningService } from '../services/learningService';
import { LearningItem } from '../types/learning';
import { styleService } from '../services/styleService';
import { projectService } from '../services/projectService';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState({ pending: 0, today: 0, done: 0 });
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Budget state for Card 2
  const [budgetSummary, setBudgetSummary] = useState<MonthSummary | null>(null);
  const [loadingBudget, setLoadingBudget] = useState(true);

  // Debts state for Card 3
  const [recentDebts, setRecentDebts] = useState<Debt[]>([]);
  const [debtStats, setDebtStats] = useState({
    borrowedTotal: 0,
    lentTotal: 0,
    pendingCount: 0,
    overdueCount: 0,
  });
  const [loadingDebts, setLoadingDebts] = useState(true);

  // Shopping state for Card 4
  const [recentWishlist, setRecentWishlist] = useState<ShoppingItem[]>([]);
  const [shoppingStats, setShoppingStats] = useState({
    totalWishlist: 0,
    plannedNovember: 0,
    essentialsNeed: 0,
  });
  const [loadingShopping, setLoadingShopping] = useState(true);

  // Second Brain state for Dashboard
  const [brainStats, setBrainStats] = useState<{ totalNotes: number; topPinned: BrainItem | null }>({
    totalNotes: 0,
    topPinned: null,
  });
  const [quickBrainTitle, setQuickBrainTitle] = useState('');
  const [quickBrainFeedback, setQuickBrainFeedback] = useState<string | null>(null);

  // Documents state for Card 5
  const [recentDocs, setRecentDocs] = useState<AppDocument[]>([]);
  const [docSummary, setDocSummary] = useState({
    total: 0,
    expiringSoon: 0,
    expired: 0,
  });
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Medicines state for Quick Modules
  const [medSummary, setMedSummary] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  // Learning state for Dashboard shortcut
  const [activeLearning, setActiveLearning] = useState<LearningItem | null>(null);
  const [learningCount, setLearningCount] = useState(0);

  // Style state for Dashboard shortcut
  const [styleCount, setStyleCount] = useState(0);

  // Career / Projects state for Dashboard shortcut
  const [projectStats, setProjectStats] = useState({ total: 0, live: 0 });

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Format today's date nicely
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  useEffect(() => {
    const fetchTasksSummary = async () => {
      setLoadingTasks(true);
      const { tasks } = await taskService.getTasks(userId);
      const pendingList = tasks.filter((t) => t.status === 'pending');
      const todayCount = pendingList.filter((t) => isTaskToday(t.due_date, t.created_at)).length;
      const doneCount = tasks.filter((t) => t.status === 'done').length;

      setTaskStats({
        pending: pendingList.length,
        today: todayCount,
        done: doneCount,
      });

      // Display up to 2 top pending tasks on dashboard
      setRecentTasks(pendingList.slice(0, 2));
      setLoadingTasks(false);
    };

    const fetchDebtsSummary = async () => {
      setLoadingDebts(true);
      const { debts } = await debtService.getDebts(userId);
      const pendingDebts = debts.filter((d) => d.status === 'pending');
      const borrowed = pendingDebts.filter((d) => d.direction === 'borrowed');
      const lent = pendingDebts.filter((d) => d.direction === 'lent');

      let overdue = 0;
      pendingDebts.forEach((d) => {
        const badge = formatReturnDateBadge(d.return_date, d.status);
        if (badge.isOverdue) overdue++;
      });

      const borrowedSum = borrowed.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const lentSum = lent.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      setDebtStats({
        borrowedTotal: borrowedSum,
        lentTotal: lentSum,
        pendingCount: pendingDebts.length,
        overdueCount: overdue,
      });

      setRecentDebts(pendingDebts.slice(0, 2));
      setLoadingDebts(false);
    };

    const fetchBudgetSummary = async () => {
      setLoadingBudget(true);
      const currentMonth = getCurrentMonthString();
      const sum = await budgetService.getMonthSummary(userId, currentMonth);
      setBudgetSummary(sum);
      setLoadingBudget(false);
    };

    const fetchShoppingSummary = async () => {
      setLoadingShopping(true);
      try {
        const [items, ess] = await Promise.all([
          shoppingService.fetchShoppingItems(userId),
          shoppingService.fetchEssentials(userId),
        ]);
        const activeItems = items.filter((i) => i.status !== 'bought');
        const novItems = activeItems.filter((i) => i.planned_month === '2026-11');
        const essentialsNeed = ess.filter((e) => e.status === 'need').length;

        setShoppingStats({
          totalWishlist: activeItems.length,
          plannedNovember: novItems.length,
          essentialsNeed,
        });

        // Top 2 high priority or active items
        const sorted = [...activeItems].sort((a, b) => {
          const priorityScore = { high: 3, med: 2, low: 1 };
          return (priorityScore[b.priority] || 1) - (priorityScore[a.priority] || 1);
        });
        setRecentWishlist(sorted.slice(0, 2));
      } catch (err) {
        console.warn('Dashboard shopping summary error:', err);
      } finally {
        setLoadingShopping(false);
      }
    };

    const fetchBrainSummary = async () => {
      try {
        const [cats, items] = await Promise.all([
          brainService.fetchCategories(userId),
          brainService.fetchAllItems(userId),
        ]);
        const pinned = (items as BrainItem[]).find((i: BrainItem) => i.is_pinned) || (items.length > 0 ? (items[0] as BrainItem) : null);
        setBrainStats({
          totalNotes: items.length,
          topPinned: pinned,
        });
      } catch (err) {
        console.warn('Dashboard brain summary error:', err);
      }
    };

    const fetchDocumentsSummary = async () => {
      setLoadingDocs(true);
      try {
        const [docs, sum] = await Promise.all([
          documentService.fetchDocuments(userId),
          documentService.getDocumentSummary(userId),
        ]);
        setDocSummary({
          total: sum.totalCount,
          expiringSoon: sum.expiringSoonCount,
          expired: sum.expiredCount,
        });
        setRecentDocs(docs.slice(0, 2));
      } catch (err) {
        console.warn('Dashboard documents summary error:', err);
      } finally {
        setLoadingDocs(false);
      }
    };

    const fetchMedicinesSummary = async () => {
      try {
        const { medicines } = await medicineService.fetchMedicines(userId);
        const sum = medicineService.calculateSummary(medicines);
        setMedSummary({
          total: sum.total,
          lowStock: sum.lowStock,
          outOfStock: sum.outOfStock,
        });
      } catch (err) {
        console.warn('Dashboard medicines summary error:', err);
      }
    };

    const fetchLearningSummary = async () => {
      try {
        const { items } = await learningService.fetchItems(userId);
        const sum = learningService.calculateSummary(items);
        setActiveLearning(sum.activeLearningItem || null);
        setLearningCount(sum.total);
      } catch (err) {
        console.warn('Dashboard learning summary error:', err);
      }
    };

    const fetchStyleSummary = async () => {
      try {
        const { items } = await styleService.fetchStyleItems(userId);
        setStyleCount(items.length);
      } catch (err) {
        console.warn('Dashboard style summary error:', err);
      }
    };

    const fetchProjectSummary = async () => {
      try {
        const sum = await projectService.getProjectsSummary(userId);
        setProjectStats({ total: sum.total, live: sum.live });
      } catch (err) {
        console.warn('Dashboard project summary error:', err);
      }
    };

    fetchTasksSummary();
    fetchDebtsSummary();
    fetchBudgetSummary();
    fetchShoppingSummary();
    fetchBrainSummary();
    fetchDocumentsSummary();
    fetchMedicinesSummary();
    fetchLearningSummary();
    fetchStyleSummary();
    fetchProjectSummary();
  }, [userId]);

  const handleToggleTask = async (taskId: string) => {
    setRecentTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTaskStats((prev) => ({
      ...prev,
      pending: Math.max(0, prev.pending - 1),
      done: prev.done + 1,
    }));
    await taskService.toggleTaskStatus(userId, taskId);
  };

  const handleQuickBrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBrainTitle.trim()) return;

    try {
      const cats = await brainService.fetchCategories(userId);
      const targetCatId = cats.length > 0 ? cats[0].id : 'bcat_1';
      const created = await brainService.addItem(userId, {
        category_id: targetCatId,
        title: quickBrainTitle.trim(),
      });
      setQuickBrainTitle('');
      setBrainStats((prev) => ({
        totalNotes: prev.totalNotes + 1,
        topPinned: prev.topPinned || created,
      }));
      setQuickBrainFeedback('Saved to Second Brain!');
      setTimeout(() => setQuickBrainFeedback(null), 2500);
    } catch {
      setQuickBrainFeedback('Failed to save');
    }
  };

  return (
    <div className="p-4 space-y-4 transition-colors duration-200">
      {/* Top Greeting & Date Header */}
      <div className="pt-2 pb-1">
        <div className="flex items-center justify-between text-xs text-[#6b7280] dark:text-[#94a3b8] mb-1 transition-colors duration-200">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#818cf8]" />
            {todayFormatted}
          </span>
          <span className="flex items-center gap-1 text-[11px] bg-indigo-50 dark:bg-indigo-950/80 text-[#6366f1] dark:text-[#818cf8] font-medium px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/60 transition-colors duration-200">
            <Sparkles className="w-3 h-3" /> Life OS v1.0
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9] transition-colors duration-200">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-0.5 transition-colors duration-200">
          Here is your daily snapshot across all life dimensions.
        </p>
      </div>

      {/* 3 CORE CARDS */}
      <div className="space-y-3.5">
        {/* Card 1: Today's Tasks (Now Live!) */}
        <Card className="hover:border-[#6366f1]/40 dark:hover:border-[#818cf8]/40 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-colors duration-200">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Today&apos;s Tasks</CardTitle>
                <CardDescription>
                  {taskStats.pending > 0
                    ? `${taskStats.pending} pending · ${taskStats.today} due today`
                    : 'All caught up for today!'}
                </CardDescription>
              </div>
            </div>
            <Badge variant="indigo">Live Module</Badge>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <div className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-3 text-center text-xs text-[#6b7280] dark:text-[#94a3b8]">
                Loading tasks...
              </div>
            ) : recentTasks.length > 0 ? (
              <div className="space-y-2">
                {recentTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(t.id)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 hover:bg-indigo-50/50 dark:hover:bg-slate-800 border border-[#e5e7eb] dark:border-[#334155] cursor-pointer transition-colors"
                  >
                    <Circle className="w-4 h-4 text-gray-400 hover:text-[#6366f1] shrink-0" />
                    <span className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] truncate flex-1">
                      {t.title}
                    </span>
                    {t.priority === 'high' && (
                      <span className="text-[10px] font-semibold text-rose-600 px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/60">
                        High
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-3.5 text-center border border-dashed border-[#e5e7eb] dark:border-[#334155] transition-colors duration-200">
                <p className="text-xs font-medium text-[#111827] dark:text-[#f1f5f9]">
                  No pending tasks for today ✨
                </p>
                <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
                  Tap below to add tasks to your daily focus list.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 justify-between">
            <NavLink
              to="/tasks"
              className="text-xs font-semibold text-[#6366f1] dark:text-[#818cf8] hover:underline inline-flex items-center gap-1 transition-colors duration-200"
            >
              Open Tasks Engine <ArrowRight className="w-3 h-3" />
            </NavLink>
            <NavLink
              to="/tasks"
              className="p-1 rounded-lg text-[#6366f1] dark:text-[#818cf8] hover:bg-indigo-50 dark:hover:bg-slate-800"
              title="Add task"
            >
              <Plus className="w-4 h-4" />
            </NavLink>
          </CardFooter>
        </Card>

        {/* Card 2: Budget Planner (Live Module!) */}
        <Card className="hover:border-[#6366f1]/40 dark:hover:border-[#818cf8]/40 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-[#6366f1] dark:text-[#818cf8] transition-colors duration-200">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Budget Planner</CardTitle>
                <CardDescription>
                  {budgetSummary && budgetSummary.income > 0
                    ? `Allocated ₹${formatIndianCurrency(budgetSummary.totalAllocated)} of ₹${formatIndianCurrency(budgetSummary.income)}`
                    : 'Plan monthly categories, bills & purchases'}
                </CardDescription>
              </div>
            </div>
            <Badge variant="indigo">Live Module</Badge>
          </CardHeader>
          <CardContent>
            {loadingBudget || !budgetSummary ? (
              <div className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-3 text-center text-xs text-[#6b7280] dark:text-[#94a3b8]">
                Loading budget summary...
              </div>
            ) : (
              <div className="space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                    <span className="text-[#6b7280] dark:text-[#94a3b8]">
                      Allocated:{' '}
                      <strong className="text-[#111827] dark:text-[#f1f5f9]">
                        {budgetSummary.income > 0
                          ? `${Math.round((budgetSummary.totalAllocated / budgetSummary.income) * 100)}%`
                          : '0%'}
                      </strong>
                    </span>
                    <span
                      className={`font-semibold ${
                        budgetSummary.unallocated > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : budgetSummary.unallocated < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {budgetSummary.unallocated > 0
                        ? `₹${formatIndianCurrency(budgetSummary.unallocated)} unallocated`
                        : budgetSummary.unallocated < 0
                        ? `Over by ₹${formatIndianCurrency(Math.abs(budgetSummary.unallocated))}`
                        : 'Balanced ✓'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        budgetSummary.totalAllocated > budgetSummary.income
                          ? 'bg-rose-500'
                          : budgetSummary.unallocated === 0 && budgetSummary.income > 0
                          ? 'bg-emerald-500'
                          : 'bg-[#6366f1] dark:bg-[#818cf8]'
                      }`}
                      style={{
                        width:
                          budgetSummary.income > 0
                            ? `${Math.min(100, (budgetSummary.totalAllocated / budgetSummary.income) * 100)}%`
                            : '0%',
                      }}
                    />
                  </div>
                </div>

                {/* Key Insights Row */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-[#e5e7eb] dark:border-[#334155]">
                    <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] block">
                      Savings Target
                    </span>
                    <span className="font-bold text-[#111827] dark:text-[#f1f5f9] text-xs">
                      {budgetSummary.savingsPercent}% of income
                    </span>
                    <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] block">
                      {budgetSummary.categoriesCount} categories planned
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-[#e5e7eb] dark:border-[#334155]">
                    <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] block">
                      Commitments
                    </span>
                    <span className="font-bold text-[#111827] dark:text-[#f1f5f9] text-xs truncate block">
                      {budgetSummary.recurringCount} bills · {budgetSummary.plannedCount} planned
                    </span>
                    <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] block">
                      ₹{formatIndianCurrency(budgetSummary.recurringTotal)}/mo recurring
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 justify-between">
            <NavLink
              to="/budget"
              className="text-xs font-semibold text-[#6366f1] dark:text-[#818cf8] hover:underline inline-flex items-center gap-1 transition-colors duration-200"
            >
              Open Budget Planner <ArrowRight className="w-3 h-3" />
            </NavLink>
            <NavLink
              to="/budget"
              className="p-1 rounded-lg text-[#6366f1] dark:text-[#818cf8] hover:bg-indigo-50 dark:hover:bg-slate-800"
              title="Open Planner"
            >
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </CardFooter>
        </Card>

        {/* Card 3: Due Debts (Live Module!) */}
        <Card className="hover:border-[#6366f1]/40 dark:hover:border-[#818cf8]/40 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 transition-colors duration-200">
                <HandCoins className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Due Debts</CardTitle>
                <CardDescription>
                  {debtStats.pendingCount > 0
                    ? `I Owe ₹${formatCurrency(debtStats.borrowedTotal)} · Owed ₹${formatCurrency(debtStats.lentTotal)}`
                    : 'All loans & debts are settled!'}
                </CardDescription>
              </div>
            </div>
            <Badge variant="indigo">Live Module</Badge>
          </CardHeader>
          <CardContent>
            {loadingDebts ? (
              <div className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-3 text-center text-xs text-[#6b7280] dark:text-[#94a3b8]">
                Loading debts...
              </div>
            ) : recentDebts.length > 0 ? (
              <div className="space-y-2">
                {recentDebts.map((d) => {
                  const badge = formatReturnDateBadge(d.return_date, d.status);
                  const isBorrowed = d.direction === 'borrowed';
                  return (
                    <NavLink
                      key={d.id}
                      to="/borrow-lend"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-[#e5e7eb] dark:border-[#334155] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isBorrowed ? 'bg-rose-500' : 'bg-orange-500'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] truncate">
                            {d.person}
                          </p>
                          <span
                            className={`text-[10px] font-medium ${
                              badge.isOverdue
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : 'text-[#6b7280] dark:text-[#94a3b8]'
                            }`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold shrink-0 ${
                          isBorrowed
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        ₹{formatCurrency(d.amount)}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-3.5 text-center border border-dashed border-[#e5e7eb] dark:border-[#334155] transition-colors duration-200">
                <p className="text-xs font-medium text-[#111827] dark:text-[#f1f5f9]">
                  No pending debts ✨
                </p>
                <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
                  Track money lent to friends or borrowed with due date alerts.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 justify-between">
            <NavLink
              to="/borrow-lend"
              className="text-xs font-semibold text-[#6366f1] dark:text-[#818cf8] hover:underline inline-flex items-center gap-1 transition-colors duration-200"
            >
              Open Borrow &amp; Lend <ArrowRight className="w-3 h-3" />
            </NavLink>
            <NavLink
              to="/borrow-lend"
              className="p-1 rounded-lg text-[#6366f1] dark:text-[#818cf8] hover:bg-amber-50 dark:hover:bg-slate-800"
              title="Add debt or loan"
            >
              <Plus className="w-4 h-4" />
            </NavLink>
          </CardFooter>
        </Card>

        {/* Card 4: Shopping Wishlist (Live Module!) */}
        <Card className="hover:border-pink-500/40 dark:hover:border-pink-500/40 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-950/50 flex items-center justify-center text-pink-600 dark:text-pink-400 transition-colors duration-200">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Shopping Wishlist</CardTitle>
                <CardDescription>
                  {shoppingStats.totalWishlist} saved · {shoppingStats.plannedNovember} planned for Nov
                  {shoppingStats.essentialsNeed > 0 ? ` · ${shoppingStats.essentialsNeed} essentials need` : ''}
                </CardDescription>
              </div>
            </div>
            <Badge variant="indigo">Live Module</Badge>
          </CardHeader>
          <CardContent>
            {loadingShopping ? (
              <div className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-3 text-center text-xs text-[#6b7280] dark:text-[#94a3b8]">
                Loading shopping wishlist...
              </div>
            ) : recentWishlist.length > 0 ? (
              <div className="space-y-2">
                {recentWishlist.map((item) => (
                  <NavLink
                    key={item.id}
                    to="/shopping"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 hover:bg-pink-50/40 dark:hover:bg-slate-800 border border-[#e5e7eb] dark:border-[#334155] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.priority === 'high'
                            ? 'bg-rose-500'
                            : item.priority === 'med'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                          <span>{item.category}</span>
                          {item.brand && <span>• {item.brand}</span>}
                          {item.planned_month && (
                            <span className="text-[#6366f1] dark:text-[#818cf8] font-bold">
                              • {item.planned_month === '2026-11' ? 'Nov 2026' : item.planned_month}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold shrink-0 text-[#111827] dark:text-[#f1f5f9]">
                      {item.target_price ? `₹${formatIndianCurrency(item.target_price)}` : '—'}
                    </span>
                  </NavLink>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-3.5 text-center border border-dashed border-[#e5e7eb] dark:border-[#334155] transition-colors duration-200">
                <p className="text-xs font-medium text-[#111827] dark:text-[#f1f5f9]">
                  Wishlist is empty ✨
                </p>
                <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
                  Track items to buy later, link stores &amp; integrate with your monthly budget.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 justify-between">
            <NavLink
              to="/shopping"
              className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-1 transition-colors duration-200"
            >
              Open Shopping Hub <ArrowRight className="w-3 h-3" />
            </NavLink>
            <NavLink
              to="/shopping"
              className="p-1 rounded-lg text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800"
              title="Add item to wishlist"
            >
              <Plus className="w-4 h-4" />
            </NavLink>
          </CardFooter>
        </Card>

        {/* Card 5: Documents Vault (Live Module!) */}
        <Card className="hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors duration-200">
                <FolderLock className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Documents Vault</CardTitle>
                <CardDescription>
                  {docSummary.total} files in vault
                  {docSummary.expiringSoon > 0 ? ` · ⚠️ ${docSummary.expiringSoon} expiring soon` : ''}
                  {docSummary.expired > 0 ? ` · 🔴 ${docSummary.expired} expired` : ''}
                </CardDescription>
              </div>
            </div>
            <Badge variant="indigo">Live Module</Badge>
          </CardHeader>
          <CardContent>
            {loadingDocs ? (
              <div className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-3 text-center text-xs text-[#6b7280] dark:text-[#94a3b8]">
                Loading documents...
              </div>
            ) : recentDocs.length > 0 ? (
              <div className="space-y-2">
                {recentDocs.map((doc) => (
                  <NavLink
                    key={doc.id}
                    to="/documents"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 hover:bg-blue-50/40 dark:hover:bg-slate-800 border border-[#e5e7eb] dark:border-[#334155] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div className="w-2 h-2 rounded-full shrink-0 bg-blue-500" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] truncate">
                          {doc.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                          <span>{doc.category}</span>
                          <span>• {doc.file_type.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <ExpiryBadge expiryDate={doc.expiry_date} />
                    </div>
                  </NavLink>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-3.5 text-center border border-dashed border-[#e5e7eb] dark:border-[#334155] transition-colors duration-200">
                <p className="text-xs font-medium text-[#111827] dark:text-[#f1f5f9]">
                  Vault is empty ✨
                </p>
                <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
                  Store warranties, ID cards &amp; contracts with expiry alerts.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 justify-between">
            <NavLink
              to="/documents"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 transition-colors duration-200"
            >
              Open Document Vault <ArrowRight className="w-3 h-3" />
            </NavLink>
            <NavLink
              to="/documents"
              className="p-1 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
              title="Upload document"
            >
              <Plus className="w-4 h-4" />
            </NavLink>
          </CardFooter>
        </Card>
      </div>

      {/* QUICK JUMP LIFE OS MODULE SHORTCUTS */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-xs font-bold tracking-wider uppercase text-[#6b7280] dark:text-[#94a3b8] transition-colors duration-200">
            Quick Modules
          </h2>
          <NavLink
            to="/brain"
            className="text-xs text-[#6366f1] dark:text-[#818cf8] font-medium hover:underline transition-colors duration-200"
          >
            Open Second Brain
          </NavLink>
        </div>

        {/* Currently Learning Banner (if item with status='learning') */}
        {activeLearning && (
          <NavLink
            to="/learning"
            className="mb-2 flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-cyan-50/90 to-indigo-50/70 dark:from-cyan-950/40 dark:to-indigo-950/40 border border-cyan-200/80 dark:border-cyan-800/50 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                    Currently Learning
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                </div>
                <p className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] truncate">
                  {activeLearning.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </NavLink>
        )}

        {/* Style Ideas Shortcut */}
        <NavLink
          to="/style"
          className="mb-2.5 flex items-center justify-between p-2.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/40 hover:border-violet-300 dark:hover:border-violet-700 transition-all text-xs group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0">
              <Shirt className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[#111827] dark:text-[#f1f5f9]">
              Style Ideas:{' '}
              <span className="text-violet-600 dark:text-violet-400 font-bold">
                {styleCount} {styleCount === 1 ? 'item' : 'items'}
              </span>
            </span>
          </div>
          <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            <span>Lookbook</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </NavLink>

        {/* Career & Portfolio Shortcut */}
        <NavLink
          to="/career"
          className="mb-2.5 flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-xs group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[#111827] dark:text-[#f1f5f9]">
              Portfolio:{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {projectStats.total} {projectStats.total === 1 ? 'project' : 'projects'}
              </span>{' '}
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ({projectStats.live} live)
              </span>
            </span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            <span>Portfolio</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </NavLink>

        {/* Credentials Vault Shortcut */}
        <NavLink
          to="/credentials"
          className="mb-2.5 flex items-center justify-between p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/40 hover:border-teal-300 dark:hover:border-teal-700 transition-all text-xs group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[#111827] dark:text-[#f1f5f9]">
              Credentials Vault:{' '}
              <span className="text-teal-700 dark:text-teal-300 font-bold">
                AES-256 Protected
              </span>
            </span>
          </div>
          <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            <span>Unlock</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </NavLink>

        <div className="grid grid-cols-6 gap-1">
          <NavLink
            to="/career"
            className="p-1.5 bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] rounded-xl flex flex-col items-center text-center hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-200 shadow-xs group"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <Briefcase className="w-3 h-3" />
            </div>
            <span className="text-[10px] font-semibold text-[#111827] dark:text-[#f1f5f9] truncate max-w-full">Career</span>
            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-full">
              {projectStats.total} proj
            </span>
          </NavLink>
          <NavLink
            to="/style"
            className="p-2 bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] rounded-xl flex flex-col items-center text-center hover:border-violet-300 dark:hover:border-violet-500/50 transition-all duration-200 shadow-xs group"
          >
            <div className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <Shirt className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-semibold text-[#111827] dark:text-[#f1f5f9]">Style</span>
            <span className="text-[9px] text-violet-600 dark:text-violet-400 font-semibold truncate max-w-full">
              {styleCount} items
            </span>
          </NavLink>

          <NavLink
            to="/learning"
            className="p-2 bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] rounded-xl flex flex-col items-center text-center hover:border-cyan-300 dark:hover:border-cyan-500/50 transition-all duration-200 shadow-xs group"
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-semibold text-[#111827] dark:text-[#f1f5f9]">Skills</span>
            <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-semibold truncate max-w-full">
              {learningCount} items
            </span>
          </NavLink>

          <NavLink
            to="/brain"
            className="p-2 bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] rounded-xl flex flex-col items-center text-center hover:border-purple-300 dark:hover:border-purple-500/50 transition-all duration-200 shadow-xs group"
          >
            <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <Brain className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-semibold text-[#111827] dark:text-[#f1f5f9]">Brain</span>
            <span className="text-[9px] text-purple-600 dark:text-purple-400 font-semibold truncate max-w-full">
              {brainStats.totalNotes} notes
            </span>
          </NavLink>

          <NavLink
            to="/medicines"
            className="p-2 bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] rounded-xl flex flex-col items-center text-center hover:border-rose-300 dark:hover:border-rose-500/50 transition-all duration-200 shadow-xs group"
          >
            <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <Pill className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-semibold text-[#111827] dark:text-[#f1f5f9]">Meds</span>
            <span className="text-[9px] font-semibold text-rose-600 dark:text-rose-400 truncate max-w-full">
              {medSummary.outOfStock > 0 ? `${medSummary.outOfStock} out` : `${medSummary.total} med`}
            </span>
          </NavLink>

          <NavLink
            to="/documents"
            className="p-2 bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] rounded-xl flex flex-col items-center text-center hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-200 shadow-xs group"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <FolderLock className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-semibold text-[#111827] dark:text-[#f1f5f9]">Vault</span>
            <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold truncate max-w-full">
              {docSummary.total} docs
            </span>
          </NavLink>
        </div>

        {/* Quick Brain Capture Strip */}
        <div className="mt-2.5 p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Quick Brain Capture
            </span>
            {quickBrainFeedback ? (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {quickBrainFeedback}
              </span>
            ) : brainStats.topPinned ? (
              <NavLink
                to="/brain"
                className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 truncate max-w-[180px]"
              >
                <Pin className="w-2.5 h-2.5 fill-purple-600 shrink-0" />
                <span className="truncate">{brainStats.topPinned.title}</span>
              </NavLink>
            ) : null}
          </div>

          <form onSubmit={handleQuickBrainSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={quickBrainTitle}
              onChange={(e) => setQuickBrainTitle(e.target.value)}
              placeholder="Capture thought or task (Enter to save)..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!quickBrainTitle.trim()}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer disabled:opacity-40 transition-colors shadow-xs"
            >
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
