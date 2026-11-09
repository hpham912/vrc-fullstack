import React from 'react';
import { AppNotification } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { NotificationList } from '../notification-modal/NotificationList.tsx';
import { notificationsScreenStyles as s } from './NotificationsScreen.styles.ts';

interface NotificationsScreenProps {
  notifications: AppNotification[];
  onSelectNotification?: (notif: AppNotification) => void;
  isAdmin?: boolean;
  onNotificationAdded?: () => void;
  isLoading?: boolean;
}

// Full-page Notifications tab (mobile). On desktop the notifications
// stay a popup (NotificationModal); this screen is what the bottom
// tab bar's bell opens on a phone, so tapping a notice leaves you on
// the Notifications tab instead of dropping back to Home.
export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  onSelectNotification,
  isAdmin,
  onNotificationAdded,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  return (
    <div className={s.page}>
      <div className={s.header}>
        <span className={s.headerSubtitle}>{t('notifSubtitle')}</span>
        <h1 className={s.headerTitle}>{t('notifTitle')}</h1>
      </div>

      <NotificationList
        notifications={notifications}
        onSelectNotification={onSelectNotification}
        isAdmin={isAdmin}
        onNotificationAdded={onNotificationAdded}
        isLoading={isLoading}
      />
    </div>
  );
};
