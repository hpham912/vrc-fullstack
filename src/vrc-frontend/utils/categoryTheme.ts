import { LucideIcon, Users, Flame, BookOpen, Sparkles, Heart, Star } from 'lucide-react';
import type { TranslationKey } from '../context/translations.ts';

export interface CategoryTheme {
  cardBg: string;
  dateBox: string;
  monthText: string;
  badge: string;
  icon: LucideIcon;
  iconColor: string;
  actionBtn: string;
}

/**
 * Returns a vivid visual theme for event categories (Design B, 2026-11-16):
 * a deeper category tint on the card, a solid category-color date box
 * with white text, and a solid category badge. Matches the Youth &
 * Events section styling.
 */
export const getCategoryTheme = (cat: string = ''): CategoryTheme => {
  const lower = (cat || '').toLowerCase();
  if (lower.includes('youth') || lower.includes('giới trẻ') || lower.includes('thanh niên')) {
    return {
      cardBg: 'bg-gradient-to-br from-emerald-200/90 via-emerald-100/80 to-emerald-200/85 dark:from-emerald-900/50 dark:via-[#141b17] dark:to-emerald-900/40 border border-emerald-300/60 dark:border-emerald-500/40 shadow-sm hover:shadow-md',
      dateBox: 'bg-emerald-600 dark:bg-emerald-600 text-white border-emerald-700 dark:border-emerald-500',
      monthText: 'text-white/90',
      badge: 'bg-emerald-700 dark:bg-emerald-600 text-white',
      icon: Users,
      iconColor: 'text-emerald-700 dark:text-emerald-400',
      actionBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    };
  }
  if (lower.includes('worship') || lower.includes('thờ phượng')) {
    return {
      cardBg: 'bg-gradient-to-br from-indigo-200/90 via-indigo-100/80 to-indigo-200/85 dark:from-indigo-900/50 dark:via-[#161722] dark:to-indigo-900/40 border border-indigo-300/60 dark:border-indigo-500/40 shadow-sm hover:shadow-md',
      dateBox: 'bg-indigo-600 dark:bg-indigo-600 text-white border-indigo-700 dark:border-indigo-500',
      monthText: 'text-white/90',
      badge: 'bg-indigo-700 dark:bg-indigo-600 text-white',
      icon: Flame,
      iconColor: 'text-indigo-700 dark:text-indigo-400',
      actionBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    };
  }
  if (lower.includes('bible') || lower.includes('kinh thánh')) {
    return {
      cardBg: 'bg-gradient-to-br from-amber-200/90 via-amber-100/80 to-amber-200/85 dark:from-amber-900/50 dark:via-[#1d1712] dark:to-amber-900/40 border border-amber-300/60 dark:border-amber-500/40 shadow-sm hover:shadow-md',
      dateBox: 'bg-amber-600 dark:bg-amber-600 text-white border-amber-700 dark:border-amber-500',
      monthText: 'text-white/90',
      badge: 'bg-amber-700 dark:bg-amber-600 text-white',
      icon: BookOpen,
      iconColor: 'text-amber-700 dark:text-amber-400',
      actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    };
  }
  if (lower.includes('prayer') || lower.includes('cầu nguyện')) {
    return {
      cardBg: 'bg-gradient-to-br from-sky-200/90 via-sky-100/80 to-sky-200/85 dark:from-sky-900/50 dark:via-[#131b22] dark:to-sky-900/40 border border-sky-300/60 dark:border-sky-500/40 shadow-sm hover:shadow-md',
      dateBox: 'bg-sky-600 dark:bg-sky-600 text-white border-sky-700 dark:border-sky-500',
      monthText: 'text-white/90',
      badge: 'bg-sky-700 dark:bg-sky-600 text-white',
      icon: Sparkles,
      iconColor: 'text-sky-700 dark:text-sky-400',
      actionBtn: 'bg-sky-600 hover:bg-sky-700 text-white',
    };
  }
  if (lower.includes('fellowship') || lower.includes('thông công')) {
    return {
      cardBg: 'bg-gradient-to-br from-rose-200/90 via-rose-100/80 to-rose-200/85 dark:from-rose-900/50 dark:via-[#201418] dark:to-rose-900/40 border border-rose-300/60 dark:border-rose-500/40 shadow-sm hover:shadow-md',
      dateBox: 'bg-rose-600 dark:bg-rose-600 text-white border-rose-700 dark:border-rose-500',
      monthText: 'text-white/90',
      badge: 'bg-rose-700 dark:bg-rose-600 text-white',
      icon: Heart,
      iconColor: 'text-rose-700 dark:text-rose-400',
      actionBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
    };
  }
  return {
    cardBg: 'bg-gradient-to-br from-purple-200/90 via-purple-100/80 to-purple-200/85 dark:from-purple-900/50 dark:via-[#1a1422] dark:to-purple-900/40 border border-purple-300/60 dark:border-purple-500/40 shadow-sm hover:shadow-md',
    dateBox: 'bg-purple-600 dark:bg-purple-600 text-white border-purple-700 dark:border-purple-500',
    monthText: 'text-white/90',
    badge: 'bg-purple-700 dark:bg-purple-600 text-white',
    icon: Star,
    iconColor: 'text-purple-700 dark:text-purple-400',
    actionBtn: 'bg-purple-600 hover:bg-purple-700 text-white',
  };
};

/**
 * Returns translated label for category
 */
export const getCategoryLabel = (
  cat: string = '',
  language: 'vi' | 'en' = 'vi',
  t?: (key: TranslationKey, params?: Record<string, string | number>) => string
): string => {
  const lower = (cat || '').toLowerCase();
  if (t) {
    if (lower.includes('all') || lower.includes('tất cả')) return t('catAll');
    if (lower.includes('worship') || lower.includes('thờ phượng')) return t('catWorship');
    if (lower.includes('youth') || lower.includes('giới trẻ') || lower.includes('thanh niên')) return t('catYouth');
    if (lower.includes('bible') || lower.includes('kinh thánh')) return t('catBibleStudy');
    if (lower.includes('prayer') || lower.includes('cầu nguyện')) return t('catPrayer');
    if (lower.includes('fellowship') || lower.includes('thông công')) return t('catFellowship');
    if (lower.includes('special') || lower.includes('đặc biệt')) return t('catSpecial');
  } else {
    if (lower.includes('all') || lower.includes('tất cả')) return language === 'vi' ? 'Tất Cả' : 'All';
    if (lower.includes('worship') || lower.includes('thờ phượng')) return language === 'vi' ? 'Thờ Phượng' : 'Worship';
    if (lower.includes('youth') || lower.includes('giới trẻ') || lower.includes('thanh niên')) return language === 'vi' ? 'Giới Trẻ' : 'Youth';
    if (lower.includes('bible') || lower.includes('kinh thánh')) return language === 'vi' ? 'Kinh Thánh' : 'Bible Study';
    if (lower.includes('prayer') || lower.includes('cầu nguyện')) return language === 'vi' ? 'Cầu Nguyện' : 'Prayer';
    if (lower.includes('fellowship') || lower.includes('thông công')) return language === 'vi' ? 'Thông Công' : 'Fellowship';
    if (lower.includes('special') || lower.includes('đặc biệt')) return language === 'vi' ? 'Đặc Biệt' : 'Special';
  }
  return cat;
};
