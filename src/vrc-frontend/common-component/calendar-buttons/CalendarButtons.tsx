import React from 'react';
import { CalendarPlus, Download } from 'lucide-react';
import { ChurchEvent } from '../../types/index.ts';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendar.ts';
import { calendarButtonsStyles as s } from './CalendarButtons.styles.ts';

interface CalendarButtonsProps {
  event: ChurchEvent;
  variant?: 'compact' | 'full';
  showIcal?: boolean;
  gcalLabel?: string;
  icalLabel?: string;
  stopPropagation?: boolean;
  className?: string;
}

export const CalendarButtons: React.FC<CalendarButtonsProps> = ({
  event,
  variant = 'compact',
  showIcal = true,
  gcalLabel,
  icalLabel,
  stopPropagation = false,
  className = '',
}) => {
  const handleStop = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  if (variant === 'full') {
    return (
      <div className={`${s.fullGrid} ${className}`.trim()}>
        <a
          href={getGoogleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleStop}
          className={s.fullGcalBtn}
        >
          <CalendarPlus className={s.fullGcalIcon} />
          <span>{gcalLabel || 'Google Calendar'}</span>
        </a>
        {showIcal && (
          <button
            type="button"
            onClick={(e) => {
              handleStop(e);
              downloadIcsFile(event);
            }}
            className={s.fullIcalBtn}
          >
            <Download className={s.fullIcalIcon} />
            <span>{icalLabel || 'Apple / iCal'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${s.compactRow} ${className}`.trim()}>
      <a
        href={getGoogleCalendarUrl(event)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleStop}
        className={s.compactGcalBtn}
      >
        <CalendarPlus className={s.compactGcalIcon} />
        <span>{gcalLabel || 'GCal'}</span>
      </a>
      {showIcal && (
        <button
          type="button"
          onClick={(e) => {
            handleStop(e);
            downloadIcsFile(event);
          }}
          className={s.compactIcalBtn}
        >
          <Download className={s.compactIcalIcon} />
          <span>{icalLabel || 'iCal'}</span>
        </button>
      )}
    </div>
  );
};
