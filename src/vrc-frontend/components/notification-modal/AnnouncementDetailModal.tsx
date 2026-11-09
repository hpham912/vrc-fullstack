import React from 'react';
import { AppNotification } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Modal } from '../../common-component/index.ts';
import { formatNotificationDate } from '../../utils/dateFormatter.ts';
import { announcementDetailModalStyles as s } from './AnnouncementDetailModal.styles.ts';

interface AnnouncementDetailModalProps {
  notification: AppNotification | null;
  onClose: () => void;
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  notification,
  onClose,
}) => {
  const { language } = useLanguage();

  return (
    <Modal
      isOpen={Boolean(notification)}
      onClose={onClose}
      title={notification ? notification.title : undefined}
      subtitle={
        notification ? formatNotificationDate(notification.createdAt, language) : undefined
      }
      maxWidthClass="max-w-md"
    >
      {notification && <p className={s.bodyText}>{notification.body}</p>}
    </Modal>
  );
};
