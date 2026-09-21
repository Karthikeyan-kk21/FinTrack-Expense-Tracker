import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  Sparkles,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  DollarSign,
  Gift,
  PlusCircle,
  Tag,
  Coffee,
  Plane,
  Smartphone,
  Shield,
  Book,
  Music,
  Tv,
  Smile,
  CreditCard,
  Building,
  Activity,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  Sparkles,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  DollarSign,
  Gift,
  PlusCircle,
  Tag,
  Coffee,
  Plane,
  Smartphone,
  Shield,
  Book,
  Music,
  Tv,
  Smile,
  CreditCard,
  Building,
  Activity,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const CATEGORY_COLORS = [
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#64748B', // Slate
];

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)' },
];

export const getCategoryIcon = (iconName: string = 'Tag'): LucideIcon => {
  return ICON_MAP[iconName] || Tag;
};
