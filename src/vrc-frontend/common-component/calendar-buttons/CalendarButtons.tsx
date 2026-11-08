import React, { useState } from 'react';
import { CalendarPlus, ChevronDown, Download } from 'lucide-react';
import { ChurchEvent } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendar.ts';
import { calendarButtonsStyles as s } from './CalendarButtons.styles.ts';

interface CalendarButtonsProps {
  event: ChurchEvent;
  variant?: 'compact' | 'full' | 'menu';
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

  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  // Single combined button opening a small menu (Google / Apple).
  // The menu opens upward so it is never clipped by the card's bottom edge.
  if (variant === 'menu') {
    return (
      <div className={`${s.menuWrap} ${className}`.trim()}>
        <button
          type="button"
          onClick={(e) => {
            handleStop(e);
            setMenuOpen((o) => !o);
          }}
          className={s.menuBtn}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <CalendarPlus className={s.menuBtnIcon} />
          <span>{t('calCalendar')}</span>
          <ChevronDown className={`${s.menuBtnChevron} ${menuOpen ? s.menuBtnChevronOpen : ''}`} />
        </button>
        {menuOpen && (
          <>
            <div
              className={s.menuBackdrop}
              onClick={(e) => {
                handleStop(e);
                setMenuOpen(false);
              }}
              aria-hidden="true"
            />
            <div className={s.menu} role="menu">
              <a
                href={getGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  handleStop(e);
                  setMenuOpen(false);
                }}
                className={s.menuItem}
                role="menuitem"
              >
                <CalendarPlus className={s.menuItemGcalIcon} />
                <span>Google</span>
              </a>
              {showIcal && (
                <button
                  type="button"
                  onClick={(e) => {
                    handleStop(e);
                    downloadIcsFile(event);
                    setMenuOpen(false);
                  }}
                  className={s.menuItem}
                  role="menuitem"
                >
                  <Download className={s.menuItemIcalIcon} />
                  <span>Apple</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

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
          <span>{gcalLabel || 'Google'}</span>
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
            <span>{icalLabel || 'Apple'}</span>
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
