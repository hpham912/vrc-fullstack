import React, { useState } from 'react';
import { AppNotification } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { NotificationList } from '../notification-modal/NotificationList.tsx';
import { AdminAddButton } from '../../common-component/index.ts';
import { notificationsSectionStyles as s } from './NotificationsSection.styles.ts';

interface NotificationsSectionProps {
  notifications: AppNotification[];
  onSelectNotification?: (notif: AppNotification) => void;
  isAdmin?: boolean;
  onNotificationAdded?: () => void;
  isLoading?: boolean;
}

// Full-page Notifications tab (mobile only). On desktop the
// notifications stay a popup (NotificationModal) opened from the header
// bell; this page is what the bottom tab bar's bell opens on a phone.
// Tapping the bell while already here stays on this page — it never
// toggles closed — so tapping a notice leaves you on the Notifications
// tab instead of dropping back to Home.
export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  notifications,
  onSelectNotification,
  isAdmin,
  onNotificationAdded,
  isLoading = false,
}) => {
  const { t } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className={s.page}>
      <div className={s.headerRow}>
        <div className="min-w-0">
          <span className={s.headerSubtitle}>{t('notifSubtitle')}</span>
          <h1 className={s.headerTitle}>{t('notifTitle')}</h1>
        </div>
        {isAdmin && (
          <AdminAddButton
            onClick={() => setShowAddForm((prev) => !prev)}
            title={t('notifAddBtn')}
          />
        )}
      </div>

      <NotificationList
        notifications={notifications}
        onSelectNotification={onSelectNotification}
        isAdmin={isAdmin}
        onNotificationAdded={onNotificationAdded}
        isLoading={isLoading}
        showAddForm={showAddForm}
        onShowAddFormChange={setShowAddForm}
      />
    </div>
  );
};
