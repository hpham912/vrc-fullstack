import React from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { featuredStarStyles as s } from './FeaturedStar.styles.ts';

interface FeaturedStarProps {
  /** Extra classes for placement, e.g. absolute positioning. The badge look itself lives here. */
  className?: string;
}

/**
 * Gold star marking a featured event. Shared so every screen marks
 * featured items the same way — the caller only decides where it sits.
 */
export const FeaturedStar: React.FC<FeaturedStarProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  return (
    <span
      className={`${s.badge} ${className}`.trim()}
      title={t('featuredBadge')}
      aria-label={t('featuredBadge')}
    >
      <Star className={s.icon} />
    </span>
  );
};
