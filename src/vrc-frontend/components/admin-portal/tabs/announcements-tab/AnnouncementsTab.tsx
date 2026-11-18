import React, { useRef, useState } from 'react';
import { Save } from 'lucide-react';
import { Announcement } from '../../../../types/index.ts';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiFetch } from '../../../../utils/api.ts';
import { getErrorMessage } from '../../../../utils/errors.ts';
import { formatDateLocale } from '../../../../utils/dateFormatter.ts';
import {
  isAnnouncementShowing,
  isAnnouncementScheduled,
  formatAnnouncementWindow,
} from '../../../../utils/announcement.ts';
import {
  AdminActionButtons,
  Badge,
  Banner,
  Button,
  ConfirmModal,
  DatePicker,
  TextField,
} from '../../../../common-component/index.ts';
import { announcementsTabStyles } from './AnnouncementsTab.styles.ts';

interface AnnouncementsTabProps {
  announcements: Announcement[];
  // Which tab the parent is showing. The child stays mounted for the
  // whole portal session (returning null when its tab isn't active) so
  // a half-typed form survives switching to another tab and back,
  // exactly as the other tabs do.
  activeTab: string;
  getToken: () => string | null;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  onRefreshData: () => void;
}

interface AnnouncementFormValues {
  title: string;
  content: string;
  contentEn: string;
  active: boolean;
  // ISO strings for the DatePicker (datetime mode). Null start means
  // "from now"; null end means "until turned off".
  startsAt: string | null;
  endsAt: string | null;
}

const getDefaultValues = (): AnnouncementFormValues => ({
  title: '',
  content: '',
  contentEn: '',
  active: true,
  startsAt: new Date().toISOString(),
  endsAt: null,
});

// Announcements: add/edit form on top, list below. Owns its form
// state and save/delete calls; the list itself comes from the parent
// (useAppData via AdminPortal), so a save only needs onRefreshData to
// show the new row — and the banner picks it up through the same
// refresh. The banner shows the newest row that is switched on AND
// inside its start/end window, so turning everything off (or waiting
// out every window) hides the banner entirely.
export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({
  announcements,
  activeTab,
  getToken,
  showFeedback,
  onRefreshData,
}) => {
  const { language, t } = useLanguage();
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formContentEn, setFormContentEn] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formStartsAt, setFormStartsAt] = useState<string | null>(() => new Date().toISOString());
  const [formEndsAt, setFormEndsAt] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Success message shown below the save button (mobile only) after a
  // save completes. Clears after 4s, matching the feedback banner.
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  // Error message shown below the save button (mobile only) when a save
  // fails. Unlike success, it does NOT auto-hide.
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveSuccessTimeout = useRef<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Last saved values — the Save button is enabled only while the form
  // differs from them (dirty-aware save, like every other admin form).
  const baselineRef = useRef<AnnouncementFormValues>(getDefaultValues());
  const baseline = baselineRef.current;
  const isDirty =
    formTitle !== baseline.title ||
    formContent !== baseline.content ||
    formContentEn !== baseline.contentEn ||
    formActive !== baseline.active ||
    formStartsAt !== baseline.startsAt ||
    formEndsAt !== baseline.endsAt;
  // The end must stay after the start, or the row could never show.
  // It must also stay in the future: an end already past would make
  // the GET prune delete the row right after saving, so the admin
  // would see a success and then no announcement.
  const scheduleValid =
    formEndsAt === null ||
    (new Date(formEndsAt).getTime() > Date.now() &&
      (formStartsAt === null ||
        new Date(formEndsAt).getTime() > new Date(formStartsAt).getTime()));
  const canSave =
    isDirty && scheduleValid && formTitle.trim() !== '' && formContent.trim() !== '';

  // The row the banner is showing right now: newest row that is
  // switched on AND inside its start/end window (the list arrives
  // newest-first from the backend).
  const showingId =
    announcements.find((announcement) => isAnnouncementShowing(announcement))?.id ?? null;

  const resetForm = () => {
    const defaults = getDefaultValues();
    setFormTitle(defaults.title);
    setFormContent(defaults.content);
    setFormContentEn(defaults.contentEn);
    setFormActive(defaults.active);
    setFormStartsAt(defaults.startsAt);
    setFormEndsAt(defaults.endsAt);
    setEditingId(null);
    baselineRef.current = defaults;
  };

  const startEdit = (announcement: Announcement) => {
    const values: AnnouncementFormValues = {
      title: announcement.title,
      content: announcement.content,
      contentEn: announcement.contentEn || '',
      active: announcement.active,
      startsAt: announcement.startsAt ?? null,
      endsAt: announcement.endsAt ?? null,
    };
    setFormTitle(values.title);
    setFormContent(values.content);
    setFormContentEn(values.contentEn);
    setFormActive(values.active);
    setFormStartsAt(values.startsAt);
    setFormEndsAt(values.endsAt);
    setEditingId(announcement.id);
    baselineRef.current = values;
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = getToken();
    if (!token || !canSave) return;
    try {
      setSubmitting(true);
      setSaveSuccess(null);
      setSaveError(null);
      if (saveSuccessTimeout.current) {
        window.clearTimeout(saveSuccessTimeout.current);
        saveSuccessTimeout.current = null;
      }
      const endpoint = editingId ? `/api/announcements/${editingId}` : '/api/announcements';
      const method = editingId ? 'PUT' : 'POST';
      await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          content: formContent.trim(),
          contentEn: formContentEn.trim(),
          active: formActive,
          startsAt: formStartsAt,
          endsAt: formEndsAt,
        }),
      });
      const savedMessage = editingId ? t('announceUpdated') : t('announceSaved');
      showFeedback('success', savedMessage);
      setSaveSuccess(savedMessage);
      saveSuccessTimeout.current = window.setTimeout(() => setSaveSuccess(null), 4000);
      resetForm();
      onRefreshData();
    } catch (err) {
      const saveErrorMessage = getErrorMessage(err, language, t('errSaveAnnouncement'));
      showFeedback('error', saveErrorMessage);
      setSaveError(saveErrorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick on/off from the list, without opening the edit form — the
  // common case is turning a notice on, then off again when it ends.
  // If this row is the one open in the edit form, the form's switch
  // follows the toggle too, or a later Save would flip it back.
  const handleToggleActive = async (announcement: Announcement) => {
    const token = getToken();
    if (!token || togglingId !== null) return;
    try {
      setTogglingId(announcement.id);
      await apiFetch(`/api/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !announcement.active }),
      });
      if (announcement.id === editingId) {
        setFormActive(!announcement.active);
        baselineRef.current = { ...baselineRef.current, active: !announcement.active };
      }
      onRefreshData();
    } catch (err) {
      showFeedback('error', getErrorMessage(err, language, t('errSaveAnnouncement')));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    const token = getToken();
    if (!token || !deleteTarget) return;
    try {
      setDeleting(true);
      await apiFetch(`/api/announcements/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      showFeedback('success', t('announceDeleted'));
      onRefreshData();
    } catch (err) {
      showFeedback('error', getErrorMessage(err, language, t('errSaveAnnouncement')));
    } finally {
      setDeleting(false);
    }
  };

  if (activeTab !== 'announcements') return null;

  return (
    <div className={announcementsTabStyles.container}>
      <form onSubmit={handleSave} className={announcementsTabStyles.form}>
        <h3 className={announcementsTabStyles.formTitle}>
          {editingId ? t('announceFormEditTitle') : t('announceFormAddTitle')}
        </h3>
        <TextField
          label={t('announceNameLabel')}
          value={formTitle}
          onChange={setFormTitle}
          required
        />
        <TextField
          label={t('announceMessageViLabel')}
          value={formContent}
          onChange={setFormContent}
          multiline
          rows={3}
          required
        />
        <TextField
          label={t('announceMessageEnLabel')}
          value={formContentEn}
          onChange={setFormContentEn}
          multiline
          rows={3}
        />
        <p className={announcementsTabStyles.switchHint}>{t('announceMessageEnHint')}</p>
        <DatePicker
          label={t('announceStartLabel')}
          timeLabel={t('announceTimeLabel')}
          mode="datetime"
          value={formStartsAt}
          onChange={setFormStartsAt}
        />
        <DatePicker
          label={t('announceEndLabel')}
          timeLabel={t('announceTimeLabel')}
          mode="datetime"
          value={formEndsAt}
          onChange={setFormEndsAt}
          min={formStartsAt}
          error={!scheduleValid ? t('announceEndBeforeStart') : undefined}
        />
        <p className={announcementsTabStyles.switchHint}>{t('announceEndHint')}</p>
        <div className={announcementsTabStyles.switchRow}>
          <span className={announcementsTabStyles.switchLabel}>{t('announceActiveLabel')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={formActive}
            aria-label={t('announceActiveLabel')}
            onClick={() => setFormActive((prev) => !prev)}
            className={`${announcementsTabStyles.switchBtn} ${
              formActive ? announcementsTabStyles.switchOn : announcementsTabStyles.switchOff
            }`}
          >
            <span
              className={`${announcementsTabStyles.switchKnob} ${
                formActive ? announcementsTabStyles.switchKnobOn : ''
              }`}
            />
          </button>
        </div>
        <p className={announcementsTabStyles.switchHint}>{t('announceActiveHint')}</p>
        <div className={announcementsTabStyles.submitRow}>
          <Button
            type="submit"
            variant="dark"
            size="md"
            loading={submitting}
            disabled={submitting || !canSave}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            <span>
              {submitting
                ? t('commonSaving')
                : editingId
                ? t('commonSaveChanges')
                : t('commonSave')}
            </span>
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={resetForm}
              disabled={submitting}
            >
              {t('commonCancel')}
            </Button>
          )}
          {saveSuccess && (
            <Banner type="success" message={saveSuccess} className="md:hidden mt-2" />
          )}
          {saveError && (
            <Banner
              type="error"
              message={saveError}
              className="md:hidden mt-2"
              onDismiss={() => setSaveError(null)}
            />
          )}
        </div>
      </form>

      <div className={announcementsTabStyles.listSection}>
        <h3 className={announcementsTabStyles.listTitle}>
          {t('tabAnnouncements')} ({announcements.length})
        </h3>
        {announcements.length === 0 ? (
          <div className={announcementsTabStyles.emptyState}>{t('announceEmpty')}</div>
        ) : (
          <div className={announcementsTabStyles.list}>
            {announcements.map((announcement) => {
              const isShowing = announcement.id === showingId;
              const isScheduled = isAnnouncementScheduled(announcement);
              const windowText = formatAnnouncementWindow(announcement, language);
              const previewText =
                language === 'en'
                  ? announcement.contentEn?.trim() || announcement.content
                  : announcement.content;
              return (
                <div key={announcement.id} className={announcementsTabStyles.item}>
                  <div className={announcementsTabStyles.itemBody}>
                    <div className={announcementsTabStyles.itemTitleRow}>
                      <span className={announcementsTabStyles.itemTitle}>
                        {announcement.title}
                      </span>
                      <Badge
                        tone={
                          isShowing
                            ? 'emerald'
                            : isScheduled
                            ? 'amber'
                            : announcement.active
                            ? 'blue'
                            : 'stone'
                        }
                      >
                        {isShowing
                          ? t('announceShowing')
                          : isScheduled
                          ? t('announceScheduled')
                          : announcement.active
                          ? t('announceOn')
                          : t('announceOff')}
                      </Badge>
                    </div>
                    <p className={announcementsTabStyles.itemText}>{previewText}</p>
                    {windowText !== '' && (
                      <p className={announcementsTabStyles.itemDate}>{windowText}</p>
                    )}
                    {announcement.createdAt && (
                      <p className={announcementsTabStyles.itemDate}>
                        {formatDateLocale(announcement.createdAt, language)}
                      </p>
                    )}
                  </div>
                  <div className={announcementsTabStyles.itemActions}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={announcement.active}
                      aria-label={t('announceActiveLabel')}
                      disabled={togglingId === announcement.id}
                      onClick={() => handleToggleActive(announcement)}
                      className={`${announcementsTabStyles.switchBtn} ${
                        announcement.active
                          ? announcementsTabStyles.switchOn
                          : announcementsTabStyles.switchOff
                      }`}
                    >
                      <span
                        className={`${announcementsTabStyles.switchKnob} ${
                          announcement.active ? announcementsTabStyles.switchKnobOn : ''
                        }`}
                      />
                    </button>
                    <AdminActionButtons
                      onEdit={() => startEdit(announcement)}
                      onDelete={() => setDeleteTarget(announcement)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shared confirmation modal for delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={t('announceDeleteTitle')}
        message={
          deleteTarget
            ? t('announceDeleteConfirm', { title: deleteTarget.title })
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};
