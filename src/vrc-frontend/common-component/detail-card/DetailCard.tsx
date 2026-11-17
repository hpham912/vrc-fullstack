import React from 'react';
import { detailCardStyles } from './DetailCard.styles.ts';

export interface DetailCardProps {
  // Leading visual in the main row: a date box, a thumbnail, an icon —
  // whatever identifies the item at a glance.
  leading?: React.ReactNode;
  // Badges in the top row: category pill, featured pill, status pill.
  badges?: React.ReactNode;
  // Actions in the top row (right side): admin edit/delete, etc.
  // Taps on them do not trigger the card's onClick.
  actions?: React.ReactNode;
  // The title element, rendered as-is in the content column (the caller
  // styles it — e.g. an event card uses a muted title for past events).
  title: React.ReactNode;
  // Meta rows under the title: time, location, presenter, etc.
  meta?: React.ReactNode;
  // Optional longer text under the meta rows.
  description?: React.ReactNode;
  // Action buttons in the footer row: Zoom, calendar, etc.
  // Hidden when muted.
  footer?: React.ReactNode;
  // Opens a detail view when the card is tapped. When absent, the card
  // is not clickable. Ignored when muted.
  onClick?: () => void;
  // Muted look (past / concluded): greyed card, no footer, not clickable.
  muted?: boolean;
  // Extra classes for the card shell — e.g. the Design B category tint
  // an event card passes in.
  className?: string;
}

// The generic card shell: top row (badges + actions), main row (leading
// visual + title/meta/description), footer row (action buttons). It owns
// the shell styling, the muted look, and the tap + keyboard handling, so
// any item — an event, a video, an announcement — can use it by filling
// the slots. EventCard is the event-specific wrapper around it.
export const DetailCard: React.FC<DetailCardProps> = ({
  leading,
  badges,
  actions,
  title,
  meta,
  description,
  footer,
  onClick,
  muted = false,
  className = '',
}) => {
  const isClickable = !muted && Boolean(onClick);

  const handleKeyDown = (keyEvent: React.KeyboardEvent) => {
    if (!isClickable) return;
    if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
      keyEvent.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      className={
        muted
          ? detailCardStyles.pastCard
          : isClickable
            ? `${detailCardStyles.cardBase} ${className}`
            : `${detailCardStyles.cardStatic} ${className}`
      }
    >
      {/* Top Row: Badges + Actions */}
      {(badges || actions) && (
        <div className={detailCardStyles.topRow}>
          <div className={detailCardStyles.badgeGroup}>{badges}</div>
          {actions && (
            <div className={detailCardStyles.actionRow} onClick={(clickEvent) => clickEvent.stopPropagation()}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area: Leading visual + Title & Meta & Description */}
      <div className={detailCardStyles.mainRow}>
        {leading}
        <div className={detailCardStyles.contentCol}>
          {title}
          {meta}
          {description}
        </div>
      </div>

      {/* Footer row: action buttons (current only) */}
      {!muted && footer && <div className={detailCardStyles.footerRow}>{footer}</div>}
    </div>
  );
};
