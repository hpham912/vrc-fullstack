import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppNotification } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatNotificationDate } from '../../utils/dateFormatter.ts';
import { CHURCH_NAME } from '../../constants/church.ts';
import { CrossIcon } from '../cross-icon/CrossIcon.tsx';
import { NotificationClient } from '../../services/notificationClient.ts';
import {
  Bell,
  X,
  Calendar,
  BookOpen,
  Megaphone,
  Plus,
} from 'lucide-react';
import { Button, LoadingShimmer } from '../../common-component/index.ts';
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
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
  isAdmin,
  onNotificationAdded,
  isLoading = false,
}) => {
  const { language, t } = useLanguage();
  const { getToken } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addBody, setAddBody] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset the add form whenever the panel closes, so it never reopens half-filled.
  useEffect(() => {
    if (!isOpen) {
      setShowAddForm(false);
      setAddTitle('');
      setAddBody('');
      setAddError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleAddNotification = async () => {
    const title = addTitle.trim();
    const body = addBody.trim();
    if (!title || !body) {
      setAddError(t('notifAddError'));
      return;
    }
    setAddError('');
    setAddSaving(true);
    const created = await NotificationClient.createAnnouncement(title, body, getToken());
    setAddSaving(false);
    if (!created) {
      setAddError(t('notifAddFailed'));
      return;
    }
    setAddTitle('');
    setAddBody('');
    setShowAddForm(false);
    onNotificationAdded?.();
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'verse':
        return <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />;
      default:
        return <Megaphone className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'event':
        return {
          label: t('notifTypeEvent'),
          classes: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
        };
      case 'verse':
        return {
          label: t('notifTypeVerse'),
          classes: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
        };
      default:
        return {
          label: t('notifTypeNotice'),
          classes: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
        };
    }
  };

  return createPortal(
    <>
      {/* Transparent full-screen click catcher */}
      <div
        onClick={onClose}
        className={s.backdrop}
      />

      {/* Popup Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('notifTitle')}
        className={s.dialog}
      >
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <div className={s.headerIconBox}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className={s.headerTitle}>
                {t('notifTitle')}
              </h3>
              <p className={s.headerSub}>
                {t('notifSubtitle')}
              </p>
            </div>
          </div>
          <div className={s.headerActions}>
            {isAdmin && (
              <button
                onClick={() => setShowAddForm((prev) => !prev)}
                className={s.addBtn}
                title={t('notifAddBtn')}
                aria-label={t('notifAddBtn')}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className={s.closeIconBtn}
              title="Đóng / Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin: post a notice for all users */}
        {isAdmin && showAddForm && (
          <div className={s.addForm}>
            <input
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder={t('notifAddTitlePlaceholder')}
              className={s.addInput}
            />
            <textarea
              value={addBody}
              onChange={(e) => setAddBody(e.target.value)}
              placeholder={t('notifAddBodyPlaceholder')}
              className={s.addTextarea}
            />
            {addError && (
              <p className={s.addError}>{addError}</p>
            )}
            <div className={s.addFormActions}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setAddTitle('');
                  setAddBody('');
                  setAddError('');
                }}
              >
                {t('commonCancel')}
              </Button>
              <Button
                type="button"
                variant="darkAmber"
                size="sm"
                onClick={handleAddNotification}
                disabled={addSaving}
              >
                {addSaving ? t('commonSaving') : t('notifAddPost')}
              </Button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className={s.listContainer}>
          {isLoading ? (
            <LoadingShimmer variant="card" count={3} />
          ) : notifications.length === 0 ? (
            <div className={s.emptyBox}>
              <div className={s.emptyIconBox}>
                <Bell className="w-5 h-5" />
              </div>
              <p className={s.emptyTitle}>
                {t('notifEmpty')}
              </p>
              <p className={s.emptySub}>
                {t('notifEmptySub')}
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const badge = getTypeBadge(item.type);
              const formattedDate = formatNotificationDate(item.createdAt, language);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectNotification?.(item)}
                  className={s.notifItem}
                >
                  <div className={s.notifItemTopRow}>
                    <div className="flex items-center gap-1.5">
                      <div className={s.notifItemIconBox}>
                        {getIconForType(item.type)}
                      </div>
                      <span className={`${s.notifTypeBadgeBase} ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className={s.notifDateText}>
                      {formattedDate}
                    </span>
                  </div>

                  <h4 className={s.notifTitle}>
                    {item.title}
                  </h4>

                  <p className={s.notifBody}>
                    {item.body}
                  </p>
                </div>
              );
            })
          )}
        </div>

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
