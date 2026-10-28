import {
  CheckSquare,
  HandCoins,
  Wallet,
  ShoppingBag,
  Brain,
  FileText,
  Pill,
  GraduationCap,
  Shirt,
  Flame,
  Briefcase,
  KeyRound,
  LucideIcon
} from 'lucide-react';

export interface ModuleItem {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  category: 'core' | 'finance' | 'lifestyle' | 'growth';
  status: 'active' | 'coming-soon';
  color: string;
}

export const MODULES: ModuleItem[] = [
  {
    id: 'tasks',
    title: 'Tasks',
    description: 'Daily priorities, recurring to-dos & smart backlog',
    path: '/tasks',
    icon: CheckSquare,
    category: 'core',
    status: 'active',
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    id: 'borrow-lend',
    title: 'Borrow & Lend',
    description: 'Track money, books & items lent or borrowed',
    path: '/borrow-lend',
    icon: HandCoins,
    category: 'finance',
    status: 'active',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
  },
  {
    id: 'budget',
    title: 'Budget',
    description: 'Expense tracking, cashflow & month envelopes',
    path: '/budget',
    icon: Wallet,
    category: 'finance',
    status: 'active',
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40',
  },
  {
    id: 'shopping',
    title: 'Shopping',
    description: 'Wishlist, groceries, price tracker & buy limits',
    path: '/shopping',
    icon: ShoppingBag,
    category: 'lifestyle',
    status: 'active',
    color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40',
  },
  {
    id: 'brain',
    title: 'Second Brain',
    description: 'Notes, quick captures, idea sparks & resources',
    path: '/brain',
    icon: Brain,
    category: 'core',
    status: 'active',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40',
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'ID records, warranties, contracts & safe scans',
    path: '/documents',
    icon: FileText,
    category: 'core',
    status: 'active',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
  },
  {
    id: 'medicines',
    title: 'Medicines',
    description: 'Home medicine vault, dosages, refills & expiry tracker',
    path: '/medicines',
    icon: Pill,
    category: 'lifestyle',
    status: 'active',
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40',
  },
  {
    id: 'learning',
    title: 'Learning',
    description: 'Skills backlog, languages, doubts & curiosity vault',
    path: '/learning',
    icon: GraduationCap,
    category: 'growth',
    status: 'active',
    color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40',
  },
  {
    id: 'style',
    title: 'Style',
    description: 'Wardrobe lookbook, clothes, accessories, watches & haircut ideas',
    path: '/style',
    icon: Shirt,
    category: 'lifestyle',
    status: 'active',
    color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40',
  },
  {
    id: 'habits',
    title: 'Habits',
    description: 'Daily streak counters, rituals & momentum tracker',
    path: '/habits',
    icon: Flame,
    category: 'growth',
    status: 'coming-soon',
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40',
  },
  {
    id: 'career',
    title: 'Career & Projects',
    description: 'Portfolio showcases, live deployments, tech stacks & WIP tracker',
    path: '/career',
    icon: Briefcase,
    category: 'growth',
    status: 'active',
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
  },
  {
    id: 'credentials',
    title: 'Credentials',
    description: 'Client-side AES-256 encrypted passwords, Wi-Fi keys & PINs',
    path: '/credentials',
    icon: KeyRound,
    category: 'core',
    status: 'active',
    color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40',
  },
];
