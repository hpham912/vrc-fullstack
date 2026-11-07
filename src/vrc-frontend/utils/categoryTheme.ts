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
      cardBg: 'bg-gradient-to-br from-emerald-100/85 via-emerald-50/70 to-teal-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
      dateBox: 'bg-white/95 text-emerald-950 border border-stone-900/10',
      monthText: 'text-emerald-800',
      badge: 'bg-emerald-700 text-white',
      icon: Users,
      iconColor: 'text-emerald-700',
      actionBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    };
  }
  if (lower.includes('worship') || lower.includes('thờ phượng')) {
    return {
      cardBg: 'bg-gradient-to-br from-indigo-100/85 via-indigo-50/70 to-violet-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
      dateBox: 'bg-white/95 text-indigo-950 border border-stone-900/10',
      monthText: 'text-indigo-800',
      badge: 'bg-indigo-700 text-white',
      icon: Flame,
      iconColor: 'text-indigo-700',
      actionBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    };
  }
  if (lower.includes('bible') || lower.includes('kinh thánh')) {
    return {
      cardBg: 'bg-gradient-to-br from-amber-100/85 via-amber-50/70 to-orange-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
      dateBox: 'bg-white/95 text-amber-950 border border-stone-900/10',
      monthText: 'text-amber-800',
      badge: 'bg-amber-700 text-white',
      icon: BookOpen,
      iconColor: 'text-amber-700',
      actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    };
  }
  if (lower.includes('prayer') || lower.includes('cầu nguyện')) {
    return {
      cardBg: 'bg-gradient-to-br from-sky-100/85 via-sky-50/70 to-cyan-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
      dateBox: 'bg-white/95 text-sky-950 border border-stone-900/10',
      monthText: 'text-sky-800',
      badge: 'bg-sky-700 text-white',
      icon: Sparkles,
      iconColor: 'text-sky-700',
      actionBtn: 'bg-sky-600 hover:bg-sky-700 text-white',
    };
  }
  if (lower.includes('fellowship') || lower.includes('thông công')) {
    return {
      cardBg: 'bg-gradient-to-br from-rose-100/85 via-rose-50/70 to-pink-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
      dateBox: 'bg-white/95 text-rose-950 border border-stone-900/10',
      monthText: 'text-rose-800',
      badge: 'bg-rose-700 text-white',
      icon: Heart,
      iconColor: 'text-rose-700',
      actionBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
    };
  }
  return {
    cardBg: 'bg-gradient-to-br from-purple-100/85 via-purple-50/70 to-fuchsia-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
    dateBox: 'bg-white/95 text-purple-950 border border-stone-900/10',
    monthText: 'text-purple-800',
    badge: 'bg-purple-700 text-white',
    icon: Star,
    iconColor: 'text-purple-700',
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
