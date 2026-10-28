import React from 'react';
import {
  PiggyBank,
  Zap,
  ShoppingBag,
  Home,
  Utensils,
  CreditCard,
  Wallet,
  Gift,
  Car,
  Heart,
  BookOpen,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  PiggyBank,
  Zap,
  ShoppingBag,
  Home,
  Utensils,
  CreditCard,
  Wallet,
  Gift,
  Car,
  Heart,
  BookOpen,
  MoreHorizontal,
};

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4' }) => {
  const IconComponent = ICON_MAP[name] || MoreHorizontal;
  return <IconComponent className={className} />;
};
