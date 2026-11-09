import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppNotification } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { CHURCH_NAME } from '../../constants/church.ts';
import { CrossIcon } from '../cross-icon/CrossIcon.tsx';
import { Bell, X } from 'lucide-react';
import { Button } from '../../common-component/index.ts';
import { NotificationList } from './NotificationList.tsx';
import { notificationModalStyles as s } from './NotificationModal.styles.ts';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onRequestPermission?: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
  isAdmin?: boolean;
  onNotificationAdded?: () => void;
  isLoading?: boolean;
  // Measured height of the iOS tab bar (px). The panel and its backdrop
  // end exactly above the tab bar on mobile, so the tab is never covered.
  tabBarHeight?: number;
  // Ref to the header bell button. On desktop the popup anchors directly
  // below it (measured position, not a guessed offset).
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

// Desktop popup for notifications. On mobile the notifications live on
// their own tab page (NotificationsSection) instead; this popup only
// opens from the desktop header bell.
export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
  isAdmin,
  onNotificationAdded,
  isLoading = false,
  tabBarHeight = 0,
  anchorRef,
}) => {
  const { t } = useLanguage();
  // Desktop anchor position, measured from the bell button: the popup
  // sits directly below the bell, right edge aligned with the bell's
  // right edge. Null on mobile (full-screen panel) and whenever the
  // bell is not measurable — then the CSS fallback position applies.
  const [anchorPos, setAnchorPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setAnchorPos(null);
      return;
    }
    const measure = () => {
      // Desktop only (md breakpoint = 768px). The bell is hidden below sm.
      if (window.innerWidth < 768) {
        setAnchorPos(null);
        return;
      }
      const el = anchorRef?.current;
      if (!el) {
        setAnchorPos(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setAnchorPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen, anchorRef]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // Bottom offset for the panel + backdrop on mobile, so both end exactly
  // at the top of the iOS tab bar instead of covering it. On desktop the
  // measured anchor position overrides the CSS fallback top/right, so
  // the popup opens directly below the bell.
  const notifBottomStyle = {
    '--notif-bottom': `${tabBarHeight}px`,
  } as React.CSSProperties;
  const dialogStyle: React.CSSProperties = {
    ...notifBottomStyle,
    ...(anchorPos
      ? { top: anchorPos.top, right: anchorPos.right, left: 'auto', bottom: 'auto' }
      : {}),
  } as React.CSSProperties;

  return createPortal(
    <>
      {/* Transparent full-screen click catcher */}
      <div
        onClick={onClose}
        className={s.backdrop}
        style={notifBottomStyle}
      />

      {/* Popup Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('notifTitle')}
        className={s.dialog}
        style={dialogStyle}
      >
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <div className={s.headerIconBox}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className={s.headerTitle}>{t('notifTitle')}</h3>
              <p className={s.headerSub}>{t('notifSubtitle')}</p>
            </div>
          </div>
          <div className={s.headerActions}>
            <button
              onClick={onClose}
              className={s.closeIconBtn}
              title="Đóng / Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <NotificationList
          notifications={notifications}
          onSelectNotification={onSelectNotification}
          isAdmin={isAdmin}
          onNotificationAdded={onNotificationAdded}
          isLoading={isLoading}
        />

        {/* Footer */}
        <div className={s.footer}>
          <span className={s.footerBrand}>
            <CrossIcon className="w-3 h-3 text-amber-600" />
            <span>{CHURCH_NAME.en}</span>
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            {t('commonClose')}
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
};
