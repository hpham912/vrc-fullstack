import React from 'react';
import { useLanguage } from '../../vrc-frontend/context/LanguageContext.tsx';
import { Bell, X } from 'lucide-react';
import { notificationToastStyles as s } from './NotificationToast.styles.ts';

export interface ToastNotification {
  id?: any;
  title: string;
  body: string;
}

interface NotificationToastProps {
  notification: ToastNotification | null;
  onDismiss: () => void;
}

// Real-time in-app notification toast for web/browser. Renders
// nothing when there is no notification to show.
export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  const { t } = useLanguage();

  if (!notification) return null;

  return (
    <div className={s.toastWrapper}>
      <div className={s.toastIconBox}>
        <Bell className={s.toastIcon} />
      </div>
      <div className={s.toastBody}>
        <div className={s.toastHeaderRow}>
          <span className={s.toastKicker}>
            {t('notifReminderTitle')}
          </span>
          <span className={s.toastSource}>VRC</span>
        </div>
        <h4 className={s.toastTitle}>
          {notification.title}
        </h4>
        <p className={s.toastText}>
          {notification.body}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className={s.toastDismissBtn}
        title="Đóng / Dismiss"
      >
        <X className={s.toastDismissIcon} />
      </button>
    </div>
  );
};
