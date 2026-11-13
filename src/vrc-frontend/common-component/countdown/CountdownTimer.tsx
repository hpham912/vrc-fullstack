import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { countdownTimerStyles as s } from './CountdownTimer.styles.ts';

// Pads a number to 2 digits ("4" -> "04").
const pad2 = (value: number) => String(value).padStart(2, '0');

// Remaining time until a target date, split into days / hours /
// minutes / seconds. Returns null once the target is reached.
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getTimeLeft = (target: Date): TimeLeft | null => {
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return null;
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export interface CountdownTimerProps {
  // The date/time to count down to (e.g. an event's start).
  // Null means there is nothing to count down to.
  targetDate: Date | null;
  // Extra classes on the outer container (layout, spacing).
  // The flip-clock tile look is the built-in default.
  className?: string;
}

// Shared flip-clock countdown (Design F). Counts down to the
// target date, ticking every second. Hides itself once the target
// is reached (or when there is no target). Any page or component
// can use it: <CountdownTimer targetDate={eventStartDate} />.
export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, className = '' }) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    targetDate ? getTimeLeft(targetDate) : null,
  );

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(getTimeLeft(targetDate));
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetDate]);

  if (!targetDate || !timeLeft) return null;

  const units = [
    { id: 'days', value: timeLeft.days, label: t('countdownDays') },
    { id: 'hours', value: timeLeft.hours, label: t('countdownHours') },
    { id: 'minutes', value: timeLeft.minutes, label: t('countdownMinutes') },
    { id: 'seconds', value: timeLeft.seconds, label: t('countdownSeconds') },
  ];

  return (
    <div className={`${s.container} ${className}`.trim()}>
      <div className={s.label}>{t('countdownStartsIn')}</div>
      <div className={s.row}>
        {units.map((unit, index) => (
          <React.Fragment key={unit.id}>
            {index > 0 && (
              <span className={s.colon} aria-hidden="true">
                :
              </span>
            )}
            <div className={s.tile}>
              <div className={s.tileSplit} aria-hidden="true" />
              <div className={s.tileNumber}>{pad2(unit.value)}</div>
              <div className={s.tileUnit}>{unit.label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
