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
 * Returns distinct soft-tinted visual theme for event categories.
 * Matches the Youth & Events section styling.
 */
export const getCategoryTheme = (cat: string = ''): CategoryTheme => {
  const lower = (cat || '').toLowerCase();
  if (lower.includes('youth') || lower.includes('giới trẻ') || lower.includes('thanh niên')) {
    return {
      cardBg: 'bg-gradient-to-br from-emerald-100/85 via-emerald-50/70 to-teal-100/75 dark:from-emerald-950/40 dark:via-[#141b17] dark:to-teal-950/30 border border-stone-900/10 dark:border-emerald-500/25 shadow-sm hover:shadow-md',
      dateBox: 'bg-white/95 dark:bg-stone-900/95 text-emerald-950 dark:text-emerald-300 border border-stone-900/10 dark:border-stone-700/60',
      monthText: 'text-emerald-800 dark:text-emerald-400',
      badge: 'bg-emerald-700 dark:bg-emerald-600 text-white',
      icon: Users,
      iconColor: 'text-emerald-700 dark:text-emerald-400',
      actionBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    };
  }
  if (lower.includes('worship') || lower.includes('thờ phượng')) {
    return {
      cardBg: 'bg-gradient-to-br from-indigo-100/85 via-indigo-50/70 to-violet-100/75 dark:from-indigo-950/40 dark:via-[#161722] dark:to-violet-950/30 border border-stone-900/10 dark:border-indigo-500/25 shadow-sm hover:shadow-md',
      dateBox: 'bg-white/95 dark:bg-stone-900/95 text-indigo-950 dark:text-indigo-300 border border-stone-900/10 dark:border-stone-700/60',
      monthText: 'text-indigo-800 dark:text-indigo-400',
      badge: 'bg-indigo-700 dark:bg-indigo-600 text-white',
      icon: Flame,
      iconColor: 'text-indigo-700 dark:text-indigo-400',
      actionBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    };
  }
  if (lower.includes('bible') || lower.includes('kinh thánh')) {
    return {
      cardBg: 'bg-gradient-to-br from-amber-100/85 via-amber-50/70 to-orange-100/75 dark:from-amber-950/40 dark:via-[#1d1712] dark:to-orange-950/30 border border-stone-900/10 dark:border-amber-500/25 shadow-sm hover:shadow-md',
      dateBox: 'bg-white/95 dark:bg-stone-900/95 text-amber-950 dark:text-amber-300 border border-stone-900/10 dark:border-stone-700/60',
      monthText: 'text-amber-800 dark:text-amber-400',
      badge: 'bg-amber-700 dark:bg-amber-600 text-white',
      icon: BookOpen,
      iconColor: 'text-amber-700 dark:text-amber-400',
      actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    };
  }
  if (lower.includes('prayer') || lower.includes('cầu nguyện')) {
    return {
      cardBg: 'bg-gradient-to-br from-sky-100/85 via-sky-50/70 to-cyan-100/75 dark:from-sky-950/40 dark:via-[#131b22] dark:to-cyan-950/30 border border-stone-900/10 dark:border-sky-500/25 shadow-sm hover:shadow-md',
      dateBox: 'bg-white/95 dark:bg-stone-900/95 text-sky-950 dark:text-sky-300 border border-stone-900/10 dark:border-stone-700/60',
      monthText: 'text-sky-800 dark:text-sky-400',
      badge: 'bg-sky-700 dark:bg-sky-600 text-white',
      icon: Sparkles,
      iconColor: 'text-sky-700 dark:text-sky-400',
      actionBtn: 'bg-sky-600 hover:bg-sky-700 text-white',
    };
  }
  if (lower.includes('fellowship') || lower.includes('thông công')) {
    return {
      cardBg: 'bg-gradient-to-br from-rose-100/85 via-rose-50/70 to-pink-100/75 dark:from-rose-950/40 dark:via-[#201418] dark:to-pink-950/30 border border-stone-900/10 dark:border-rose-500/25 shadow-sm hover:shadow-md',
      dateBox: 'bg-white/95 dark:bg-stone-900/95 text-rose-950 dark:text-rose-300 border border-stone-900/10 dark:border-stone-700/60',
      monthText: 'text-rose-800 dark:text-rose-400',
      badge: 'bg-rose-700 dark:bg-rose-600 text-white',
      icon: Heart,
      iconColor: 'text-rose-700 dark:text-rose-400',
      actionBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
    };
  }
  return {
    cardBg: 'bg-gradient-to-br from-purple-100/85 via-purple-50/70 to-fuchsia-100/75 dark:from-purple-950/40 dark:via-[#1a1422] dark:to-fuchsia-950/30 border border-stone-900/10 dark:border-purple-500/25 shadow-sm hover:shadow-md',
    dateBox: 'bg-white/95 dark:bg-stone-900/95 text-purple-950 dark:text-purple-300 border border-stone-900/10 dark:border-stone-700/60',
    monthText: 'text-purple-800 dark:text-purple-400',
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
