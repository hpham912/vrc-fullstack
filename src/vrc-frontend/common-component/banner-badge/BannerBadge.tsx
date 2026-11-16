import React from 'react';
import { bannerBadgeStyles } from './BannerBadge.styles.ts';

export interface BannerBadgeProps {
  children: React.ReactNode;
  className?: string;
  // Inline style for runtime-computed colors (a custom banner theme's
  // colors are only known at runtime, so they cannot be Tailwind
  // classes). Presets keep using className only.
  style?: React.CSSProperties;
}

// Shared BannerBadge: the pill label on a banner (featured event,
// spotlight). The shape lives here; the colors come from the
// banner's theme via className, so the same pill works on every
// theme and on any future banner. The caller passes the text (already
// picked for the current language) as children.
export const BannerBadge: React.FC<BannerBadgeProps> = ({ children, className, style }) => {
  return (
    <div className={`${bannerBadgeStyles.base} ${className ?? ''}`} style={style}>
      <span className="truncate">{children}</span>
    </div>
  );
};
