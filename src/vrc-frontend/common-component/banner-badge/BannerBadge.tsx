import React from 'react';
import { bannerBadgeStyles } from './BannerBadge.styles.ts';

export interface BannerBadgeProps {
  children: React.ReactNode;
  className?: string;
}

// Shared BannerBadge: the pill label on a banner (featured event,
// spotlight). The shape lives here; the colors come from the
// banner's theme via className, so the same pill works on every
// theme and on any future banner. The caller passes the text (already
// picked for the current language) as children.
export const BannerBadge: React.FC<BannerBadgeProps> = ({ children, className }) => {
  return (
    <div className={`${bannerBadgeStyles.base} ${className ?? ''}`}>
      <span className="truncate">{children}</span>
    </div>
  );
};
