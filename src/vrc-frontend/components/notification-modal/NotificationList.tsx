import React, { useState } from 'react';
import { AppNotification } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatNotificationDate } from '../../utils/dateFormatter.ts';
import { NotificationClient } from '../../services/notificationClient.ts';
import { Calendar, BookOpen, Megaphone, Trash2, Save } from 'lucide-react';
import { Button, LoadingShimmer, ConfirmModal, AdminActionButtons } from '../../common-component/index.ts';
import { notificationModalStyles as s } from './NotificationModal.styles.ts';

interface NotificationListProps {
  notifications: AppNotification[];
  onSelectNotification?: (notif: AppNotification) => void;
  isAdmin?: boolean;
  onNotificationAdded?: () => void;
  isLoading?: boolean;
  // The add-notice form is owned by the parent (the tab page header or
  // the popup header holds the AdminAddButton next to the title, like
  // the other tab pages). The list only renders the form itself.
  showAddForm?: boolean;
  onShowAddFormChange?: (show: boolean) => void;
}

// Shared notification list content, used by both the desktop popup
// (NotificationModal) and the mobile Notifications tab page
// (NotificationsSection). Owns the admin add-notice form and the
// clear-all confirm, so neither container duplicates them.
export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onSelectNotification,
  isAdmin,
  onNotificationAdded,
  isLoading = false,
  showAddForm = false,
  onShowAddFormChange,
}) => {
  const { language, t } = useLanguage();
  const { getToken } = useAuth();
  const [addTitle, setAddTitle] = useState('');
  const [addBody, setAddBody] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppNotification | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    onShowAddFormChange?.(false);
    onNotificationAdded?.();
  };

  const handleClearAll = async () => {
    setClearing(true);
    const ok = await NotificationClient.clearAll(getToken());
    setClearing(false);
    setShowClearConfirm(false);
    if (ok) {
      onNotificationAdded?.();
    }
  };

  const handleDeleteOne = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await NotificationClient.deleteOne(deleteTarget.id, getToken());
    setDeleting(false);
    setDeleteTarget(null);
    if (ok) {
      onNotificationAdded?.();
    }
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

  return (
    <>
      {/* Admin: post a notice for all users. The AdminAddButton lives in
          the parent's header, next to the title (like the other tab
          pages) — the list only renders the form itself. */}
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
          {addError && <p className={s.addError}>{addError}</p>}
          <div className={s.addFormActions}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                onShowAddFormChange?.(false);
                setAddTitle('');
                setAddBody('');
                setAddError('');
              }}
            >
              {t('commonCancel')}
            </Button>
            <Button
              type="button"
              variant="dark"
              size="sm"
              onClick={handleAddNotification}
              disabled={addSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              {addSaving ? t('commonSaving') : t('commonSave')}
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
              <Megaphone className="w-5 h-5" />
            </div>
            <p className={s.emptyTitle}>{t('notifEmpty')}</p>
            <p className={s.emptySub}>{t('notifEmptySub')}</p>
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
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className={s.notifItemIconBox}>{getIconForType(item.type)}</div>
                    <span className={`${s.notifTypeBadgeBase} ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className={s.notifItemTopRight}>
                    <span className={s.notifDateText}>{formattedDate}</span>
                    {isAdmin && (
                      <AdminActionButtons onDelete={() => setDeleteTarget(item)} />
                    )}
                  </div>
                </div>

                <h4 className={s.notifTitle}>{item.title}</h4>

                <p className={s.notifBody}>{item.body}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Admin: clear all — a distinct centered text button below the
          list, not an icon in the toolbar. It must not look like the
          per-item delete on each notification. */}
      {isAdmin && notifications.length > 0 && (
        <div className={s.clearAllRow}>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            {t('notifClearAll')}
          </Button>
        </div>
      )}

      {/* Admin: confirm deleting one notification */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title={t('notifDeleteTitle')}
        message={t('notifDeleteMessage')}
        confirmText={t('commonDelete')}
        isDanger
        loading={deleting}
        onConfirm={handleDeleteOne}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Admin: confirm clearing all notifications */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title={t('notifClearTitle')}
        message={t('notifClearMessage')}
        confirmText={t('notifClearAll')}
        isDanger
        loading={clearing}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
};
