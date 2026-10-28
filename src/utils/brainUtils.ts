import React from 'react';
import {
  Folder,
  Star,
  Target,
  Briefcase,
  Heart,
  Home,
  ShoppingBag,
  Code,
  Lightbulb,
  Book,
  Map,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react';

export const BRAIN_ICON_NAMES = [
  'Folder',
  'Star',
  'Target',
  'Briefcase',
  'Heart',
  'Home',
  'ShoppingBag',
  'Code',
  'Lightbulb',
  'Book',
  'Map',
  'MoreHorizontal',
] as const;

export type BrainIconName = typeof BRAIN_ICON_NAMES[number];

export const BRAIN_ICON_MAP: Record<BrainIconName, LucideIcon> = {
  Folder,
  Star,
  Target,
  Briefcase,
  Heart,
  Home,
  ShoppingBag,
  Code,
  Lightbulb,
  Book,
  Map,
  MoreHorizontal,
};

export function getBrainIcon(iconName: string): LucideIcon {
  if (iconName in BRAIN_ICON_MAP) {
    return BRAIN_ICON_MAP[iconName as BrainIconName];
  }
  return Folder;
}

export interface BrainColorMeta {
  id: string;
  label: string;
  cardBg: string;
  text: string;
  border: string;
  iconBg: string;
  dot: string;
  ring: string;
}

export const BRAIN_COLORS: BrainColorMeta[] = [
  {
    id: 'purple',
    label: 'Purple',
    cardBg: 'bg-purple-50/80 dark:bg-purple-950/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200/80 dark:border-purple-800/50',
    iconBg: 'bg-purple-100/90 dark:bg-purple-900/60',
    dot: 'bg-purple-500',
    ring: 'focus:ring-purple-500',
  },
  {
    id: 'indigo',
    label: 'Indigo',
    cardBg: 'bg-indigo-50/80 dark:bg-indigo-950/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200/80 dark:border-indigo-800/50',
    iconBg: 'bg-indigo-100/90 dark:bg-indigo-900/60',
    dot: 'bg-indigo-500',
    ring: 'focus:ring-indigo-500',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    cardBg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/80 dark:border-emerald-800/50',
    iconBg: 'bg-emerald-100/90 dark:bg-emerald-900/60',
    dot: 'bg-emerald-500',
    ring: 'focus:ring-emerald-500',
  },
  {
    id: 'amber',
    label: 'Amber',
    cardBg: 'bg-amber-50/80 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/80 dark:border-amber-800/50',
    iconBg: 'bg-amber-100/90 dark:bg-amber-900/60',
    dot: 'bg-amber-500',
    ring: 'focus:ring-amber-500',
  },
  {
    id: 'rose',
    label: 'Rose',
    cardBg: 'bg-rose-50/80 dark:bg-rose-950/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200/80 dark:border-rose-800/50',
    iconBg: 'bg-rose-100/90 dark:bg-rose-900/60',
    dot: 'bg-rose-500',
    ring: 'focus:ring-rose-500',
  },
  {
    id: 'cyan',
    label: 'Cyan',
    cardBg: 'bg-cyan-50/80 dark:bg-cyan-950/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200/80 dark:border-cyan-800/50',
    iconBg: 'bg-cyan-100/90 dark:bg-cyan-900/60',
    dot: 'bg-cyan-500',
    ring: 'focus:ring-cyan-500',
  },
];

export function getBrainColorMeta(colorId?: string): BrainColorMeta {
  const found = BRAIN_COLORS.find((c) => c.id === colorId);
  return found || BRAIN_COLORS[0];
}
