import React, { useState } from 'react';
import { Video } from 'lucide-react';
import { ChurchEvent } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Modal, Button } from '../index.ts';
import { getEventStartDate, getEventEndDate } from '../../utils/calendar.ts';
import { formatDateLocale } from '../../utils/dateFormatter.ts';
import { zoomButtonStyles } from './ZoomButton.styles.ts';

export interface ZoomButtonProps {
  event: ChurchEvent;
  // Church default Zoom meeting ID (from church info). The button
  // renders nothing without it — the meeting ID is never shown in
  // the app, but the passcode IS shown in the join popup below, so
  // the user knows what to type when Zoom asks for it.
  meetingId?: string | null;
  passcode?: string | null;
  stopPropagation?: boolean;
  className?: string;
}

// How early the Zoom room opens before the event starts.
const JOIN_OPEN_MINUTES = 30;

// Formats the time the Zoom room opens. Same-day: time only ("2:30 PM" /
// "14:30"). Another day: date + time ("11-22-2026 • 2:30 PM").
function formatJoinTime(joinAt: Date, language: 'vi' | 'en'): string {
  const timeText = joinAt.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: language !== 'vi',
  });
  const today = new Date();
  const isToday =
    joinAt.getFullYear() === today.getFullYear() &&
    joinAt.getMonth() === today.getMonth() &&
    joinAt.getDate() === today.getDate();
  if (isToday) return timeText;
  return `${formatDateLocale(joinAt, language)} • ${timeText}`;
}

// Shared Zoom button for events. The parent renders it whenever the
// event has Zoom on; this component decides whether it shows and what
// a tap does:
//  - No Zoom on the event, or no church Zoom meeting configured:
//    renders nothing.
//  - Event already ended: renders nothing (past events never show it).
//  - Tap more than 30 minutes before the start: an info popup says
//    the event has not started yet and what time the room opens.
//  - Tap in the 30 minutes before the start, up to the end: a join
//    popup shows the Zoom passcode (so the user knows what to type
//    when Zoom asks for it) with a Join button that opens the meeting.
//    When no passcode is configured, the tap opens Zoom directly.
//  - Tap after the end (the event ended while the page was open):
//    an info popup says the event has ended.
export const ZoomButton: React.FC<ZoomButtonProps> = ({
  event,
  meetingId,
  passcode,
  stopPropagation = false,
  className = '',
}) => {
  const { language, t } = useLanguage();
  const [infoKind, setInfoKind] = useState<'not-started' | 'ended' | 'join' | null>(null);

  const start = getEventStartDate(event);
  const end = getEventEndDate(event);
  const now = new Date();
  if (!event.hasZoom || !meetingId || !start || !end) return null;
  if (now.getTime() > end.getTime()) return null;

  const joinOpenAt = new Date(start.getTime() - JOIN_OPEN_MINUTES * 60 * 1000);
  const joinTimeText = formatJoinTime(joinOpenAt, language);
  const joinUrl = `https://zoom.us/j/${meetingId.replace(/\D/g, '')}`;

  const handleClick = (clickEvent: React.MouseEvent) => {
    if (stopPropagation) clickEvent.stopPropagation();
    // Re-check the time at tap time, not render time: the event may
    // have started or ended since this button was drawn.
    const clickNow = new Date();
    if (clickNow.getTime() < joinOpenAt.getTime()) {
      setInfoKind('not-started');
      return;
    }
    if (clickNow.getTime() > end.getTime()) {
      setInfoKind('ended');
      return;
    }
    // In the join window: show the passcode first (the user types it
    // in Zoom), unless none is configured — then open Zoom directly.
    if (passcode) {
      setInfoKind('join');
      return;
    }
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
  };

  const handleJoinConfirm = () => {
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
    setInfoKind(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${zoomButtonStyles.zoomBtn} ${className}`.trim()}
      >
        <Video className={zoomButtonStyles.zoomIcon} />
        <span className={zoomButtonStyles.labelFull}>{t('zoomJoin')}</span>
        <span className={zoomButtonStyles.labelShort}>{t('zoomJoinShort')}</span>
      </button>

      <Modal
        isOpen={infoKind !== null}
        onClose={() => setInfoKind(null)}
        maxWidthClass="max-w-sm"
        icon={<Video className={zoomButtonStyles.modalIcon} />}
        title={
          infoKind === 'join'
            ? t('zoomJoin')
            : infoKind === 'ended'
            ? t('zoomEndedTitle')
            : t('zoomNotStartedTitle')
        }
      >
        <div className={zoomButtonStyles.infoBody}>
          {infoKind === 'join' ? (
            <>
              <p className={zoomButtonStyles.infoMessage}>{t('zoomPasscodeHint')}</p>
              <div className={zoomButtonStyles.codeBox}>
                <span className={zoomButtonStyles.codeLabel}>{t('zoomPasscodeLabel')}</span>
                <span className={zoomButtonStyles.codeValue}>{passcode}</span>
              </div>
              <div className={zoomButtonStyles.joinFooter}>
                <Button type="button" variant="secondary" onClick={() => setInfoKind(null)}>
                  {t('commonCancel')}
                </Button>
                <Button type="button" variant="dark" onClick={handleJoinConfirm}>
                  {t('zoomJoin')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className={zoomButtonStyles.infoMessage}>
                {infoKind === 'ended'
                  ? t('zoomEndedMessage')
                  : t('zoomNotStartedMessage', { joinTime: joinTimeText })}
              </p>
              <div className={zoomButtonStyles.infoFooter}>
                <Button type="button" variant="dark" onClick={() => setInfoKind(null)}>
                  {t('commonClose')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};
