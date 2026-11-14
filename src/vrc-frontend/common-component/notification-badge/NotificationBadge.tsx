import React from 'react';
import { notificationBadgeStyles as s } from './NotificationBadge.styles.ts';

export interface NotificationBadgeProps {
  // Number of unread notifications. Hidden when 0 (or not provided).
  count?: number;
  // Positioning (e.g. "absolute top-0.5 right-0.5") — the caller
  // places the bubble on its own icon/button.
  className?: string;
}

// Shared unread-count badge (replaces the old red dot). Shows the
// number of unread notifications; caps at "9+" so it never gets wide.
// Hidden when there is nothing unread.
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count = 0, className = '' }) => {
  if (count <= 0) return null;
  const label = count > 9 ? '9+' : String(count);
  return (
    <span className={`${s.badge} ${className}`.trim()} aria-label={`${count} unread notifications`}>
      {label}
    </span>
  );
};
