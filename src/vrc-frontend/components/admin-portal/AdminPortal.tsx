import React, { useState, useEffect, useRef } from 'react';
import { ChurchEvent, ChurchInfo, DailyVerse, Announcement } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders, apiFetch } from '../../utils/api.ts';
import { getErrorMessage } from '../../utils/errors.ts';
import { APP_VERSION } from '../../constants/version.ts';
import { NotificationClient } from '../../services/notificationClient.ts';
import { fetchScripture } from '../../services/scriptureApi.ts';
import { Modal } from '../../common-component/modal/Modal.tsx';
import { Button } from '../../common-component/index.ts';
import { adminPortalStyles as s } from './AdminPortal.styles.ts';
import {
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  KeyRound,
  UserPlus,
  ShieldCheck,
  Sliders,
  Languages,
  Clock,
  MapPin,
  Eye,
  Flame,
  Star,
  HeartHandshake,
} from 'lucide-react';

interface AdminAccount {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
}

interface AdminPortalProps {
  events: ChurchEvent[];
  allVerses: DailyVerse[];
  announcements: Announcement[];
  churchInfo?: ChurchInfo | null;
  initialTab?: string;
  focusedMode?: boolean;
  initialEvent?: ChurchEvent | null;
  initialVerse?: DailyVerse | null;
  onClose: () => void;
  onRefreshData: () => void;
  onOpenSpotlightEditor?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  events,
  allVerses,
  announcements,
  churchInfo,
  initialTab = 'create-event',
  focusedMode = false,
  initialEvent,
  initialVerse,
  onClose,
  onRefreshData,
  onOpenSpotlightEditor,
}) => {
  const { adminUser, getToken } = useAuth();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Event Form State
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventTitleVi, setEventTitleVi] = useState('');
  const [eventTitleEn, setEventTitleEn] = useState('');
  const [eventDescriptionVi, setEventDescriptionVi] = useState('');
  const [eventDescriptionEn, setEventDescriptionEn] = useState('');
  const [eventCategory, setEventCategory] = useState('Worship');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventStartTime, setEventStartTime] = useState('03:00 PM');
  const [eventEndTime, setEventEndTime] = useState('05:00 PM');
  const [eventLocation, setEventLocation] = useState('Main Sanctuary');
  const [eventAddress, setEventAddress] = useState('Tempe, Arizona');
  const [eventIsFeatured, setEventIsFeatured] = useState(false);
  const [eventOrganizer, setEventOrganizer] = useState(adminUser?.displayName || 'Pastoral Ministry Team');
  const [eventOrganizerEmail, setEventOrganizerEmail] = useState(adminUser?.email || 'contact@vnrevivalchurch.org');

  // Daily Verse Form State
  const [editingVerseId, setEditingVerseId] = useState<number | null>(null);
  const [verseDate, setVerseDate] = useState(new Date().toISOString().split('T')[0]);
  const [verseReferenceVi, setVerseReferenceVi] = useState('');
  const [verseReferenceEn, setVerseReferenceEn] = useState('');
  const [verseTranslationVi, setVerseTranslationVi] = useState('1925');
  const [verseTranslationEn, setVerseTranslationEn] = useState('NIV');
  const [verseTextVi, setVerseTextVi] = useState('');
  const [verseTextEn, setVerseTextEn] = useState('');
  const [verseReflectionVi, setVerseReflectionVi] = useState('');
  const [verseReflectionEn, setVerseReflectionEn] = useState('');
  const [versePrayerVi, setVersePrayerVi] = useState('');
  const [versePrayerEn, setVersePrayerEn] = useState('');
  const [verseTheme, setVerseTheme] = useState('Revival & Faith');
  const [fetchingScripture, setFetchingScripture] = useState(false);
  // Reference the last successful "Fetch from Bible" was for, as
  // "referenceEn|referenceVi". While the form still shows that exact
  // reference the button stays disabled; editing either reference
  // changes the key and re-enables it.
  const [fetchedScriptureKey, setFetchedScriptureKey] = useState<string | null>(null);
  const isScriptureFetchedForCurrentRef =
    fetchedScriptureKey !== null &&
    fetchedScriptureKey === `${verseReferenceEn.trim()}|${verseReferenceVi.trim()}`;
  const [editingEventAudit, setEditingEventAudit] = useState<{
    createdBy?: string | null;
    createdAt?: string;
    updatedBy?: string | null;
    updatedAt?: string | null;
  } | null>(null);
  const [editingVerseAudit, setEditingVerseAudit] = useState<{
    createdBy?: string | null;
    createdAt?: string;
    updatedBy?: string | null;
    updatedAt?: string | null;
  } | null>(null);

  // Prayer Requests State
  const [prayerList, setPrayerList] = useState<Array<{
    id: number;
    title: string;
    request: string;
    requesterName: string;
    createdAt?: string;
  }>>([]);
  const [expandedPrayerIds, setExpandedPrayerIds] = useState<Set<number>>(new Set());

  // Admin Accounts Management State
  const [adminList, setAdminList] = useState<AdminAccount[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminDisplayName, setNewAdminDisplayName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Errors stay on screen until dismissed — a vanished error looks
  // like nothing happened. Success messages still auto-hide.
  const feedbackTimeout = useRef<number | null>(null);
  const showFeedback = (type: 'success' | 'error', message: string) => {
    if (feedbackTimeout.current) {
      window.clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = null;
    }
    setFeedback({ type, message });
    if (type === 'success') {
      feedbackTimeout.current = window.setTimeout(() => setFeedback(null), 4000);
    }
  };

  const loadAdminAccounts = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/auth/admins'), {
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setAdminList(data);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  const loadPrayerRequests = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/prayers'), {
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrayerList(data);
      }
    } catch (err) {
      console.error('Failed to load prayer requests:', err);
    }
  };

  const handleDeletePrayer = async (id: number) => {
    try {
      const token = getToken();
      const res = await fetch(apiUrl(`/api/prayers/${id}`), {
        method: 'DELETE',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (res.ok) {
        setPrayerList((prev) => prev.filter((p) => p.id !== id));
        showFeedback('success', language === 'vi' ? 'Đã xóa lời cầu nguyện.' : 'Prayer request deleted.');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting prayer request');
    }
  };

  useEffect(() => {
    if (activeTab === 'admin-accounts') {
      loadAdminAccounts();
    } else if (activeTab === 'prayer-requests') {
      loadPrayerRequests();
    }
  }, [activeTab]);

  const resetVerseForm = () => {
    setEditingVerseId(null);
    setVerseDate(new Date().toISOString().split('T')[0]);
    setVerseReferenceVi('');
    setVerseReferenceEn('');
    setVerseTranslationVi('1925');
    setVerseTranslationEn('NIV');
    setVerseTextVi('');
    setVerseTextEn('');
    setVerseReflectionVi('');
    setVerseReflectionEn('');
    setVersePrayerVi('');
    setVersePrayerEn('');
    setVerseTheme('Revival & Faith');
    setFetchedScriptureKey(null);
    setEditingVerseAudit(null);
  };

  const handleEditVerse = (v: DailyVerse) => {
    // id 0 is the built-in fallback verse shown when the DB is empty —
    // it is not a DB row, so editing it starts a NEW verse (null id
    // makes the save POST instead of PUT /api/verses/0, which would
    // 404). Don't rely on 0 being falsy here.
    setEditingVerseId(v.id > 0 ? v.id : null);
    setVerseDate(v.date);
    setVerseReferenceVi(v.referenceVi || v.reference || '');
    setVerseReferenceEn(v.referenceEn || v.reference || '');
    setVerseTranslationVi(v.translationVi || '1925');
    setVerseTranslationEn(v.translationEn || v.translation || 'NIV');
    setVerseTextVi(v.verseTextVi || v.verseText || '');
    setVerseTextEn(v.verseTextEn || v.verseText || '');
    setVerseReflectionVi(v.reflectionVi || v.reflection || '');
    setVerseReflectionEn(v.reflectionEn || v.reflection || '');
    setVersePrayerVi(v.prayerVi || v.prayer || '');
    setVersePrayerEn(v.prayerEn || v.prayer || '');
    setVerseTheme(v.theme || 'Revival & Faith');
    setFetchedScriptureKey(null);
    setEditingVerseAudit({
      createdBy: v.createdBy,
      createdAt: v.createdAt,
      updatedBy: v.updatedBy,
      updatedAt: v.updatedAt,
    });
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventTitleVi('');
    setEventTitleEn('');
    setEventDescriptionVi('');
    setEventDescriptionEn('');
    setEventCategory('Worship');
    setEventDate(new Date().toISOString().split('T')[0]);
    setEventStartTime('03:00 PM');
    setEventEndTime('05:00 PM');
    setEventLocation('Main Sanctuary');
    setEventAddress(churchInfo?.address || 'Tempe, Arizona');
    setEventIsFeatured(false);
    setEditingEventAudit(null);
  };

  const handleEditEvent = (evt: ChurchEvent) => {
    setEditingEventId(evt.id);
    setEventTitleVi(evt.titleVi || evt.title || '');
    setEventTitleEn(evt.titleEn || evt.title || '');
    setEventDescriptionVi(evt.descriptionVi || evt.description || '');
    setEventDescriptionEn(evt.descriptionEn || evt.description || '');
    setEventCategory(evt.category);
    setEventDate(evt.date);
    setEventStartTime(evt.startTime);
    setEventEndTime(evt.endTime || '');
    setEventLocation(evt.location);
    setEventAddress(evt.address || churchInfo?.address || 'Tempe, Arizona');
    setEventIsFeatured(evt.isFeatured);
    setEventOrganizer(evt.organizerName || '');
    setEventOrganizerEmail(evt.organizerEmail || '');
    setEditingEventAudit({
      createdBy: evt.createdBy,
      createdAt: evt.createdAt,
      updatedBy: evt.updatedBy,
      updatedAt: evt.updatedAt,
    });
    setActiveTab('create-event');
  };

  useEffect(() => {
    if (initialEvent) {
      handleEditEvent(initialEvent);
    }
  }, [initialEvent]);

  useEffect(() => {
    if (initialVerse) {
      handleEditVerse(initialVerse);
    }
  }, [initialVerse]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitleVi.trim() || !eventTitleEn.trim() || !eventDescriptionVi.trim() || !eventDescriptionEn.trim() || !eventDate || !eventStartTime || !eventLocation) {
      showFeedback('error', language === 'vi' ? 'Vui lòng điền đầy đủ tên và mô tả sự kiện bằng cả tiếng Việt và tiếng Anh.' : 'Please fill in both Vietnamese and English event titles and descriptions.');
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      const defaultChurchAddr = (churchInfo?.address || 'Tempe, Arizona').trim();
      const payload = {
        title: eventTitleEn.trim(),
        titleVi: eventTitleVi.trim(),
        titleEn: eventTitleEn.trim(),
        description: eventDescriptionEn.trim(),
        descriptionVi: eventDescriptionVi.trim(),
        descriptionEn: eventDescriptionEn.trim(),
        category: eventCategory,
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime || null,
        location: eventLocation.trim(),
        address: eventAddress.trim() || defaultChurchAddr,
        isFeatured: eventIsFeatured,
        organizerName: eventOrganizer.trim(),
        organizerEmail: eventOrganizerEmail.trim(),
      };

      const url = editingEventId ? apiUrl(`/api/events/${editingEventId}`) : apiUrl('/api/events');
      const method = editingEventId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: apiHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errData: any = {};
        try { errData = await res.json(); } catch {}
        throw new Error(errData?.error || `Failed to save event (HTTP ${res.status})`);
      }

      showFeedback('success', editingEventId 
        ? (language === 'vi' ? 'Cập nhật sự kiện thành công!' : 'Event updated successfully!') 
        : (language === 'vi' ? 'Đã thêm sự kiện vào lịch hội thánh!' : 'New event published successfully!'));

      // Dispatch local/push notification
      NotificationClient.triggerNotification(
        `New Church Event: ${eventTitleEn.trim()}`,
        `${eventDate} • ${eventStartTime} at ${eventLocation.trim()}`
      );

      resetEventForm();
      onRefreshData();
      setActiveTab('manage-events');
    } catch (err: any) {
      showFeedback('error', err.message || 'Error saving event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa sự kiện này?' : 'Delete this gathering from the calendar?')) return;
    try {
      const token = getToken();
      const res = await fetch(apiUrl(`/api/events/${id}`), {
        method: 'DELETE',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (!res.ok) {
        let errData: any = {};
        try { errData = await res.json(); } catch {}
        throw new Error(errData?.error || `Failed to delete event (HTTP ${res.status})`);
      }
      showFeedback('success', language === 'vi' ? 'Đã xóa sự kiện.' : 'Event removed.');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting event');
    }
  };

  // Fetch real EN + VI scripture text from POST /api/ai/fetch-scripture
  // (apibible: NIV English + Kinh Thánh 1925 Vietnamese) and fill both
  // sides of the form. Never machine-translate scripture here — both
  // texts come from the Bible API, verse-for-verse.
  const handleFetchScriptureForVerse = async () => {
    const passage = verseReferenceEn.trim() || verseReferenceVi.trim();
    if (!passage) {
      showFeedback('error', language === 'vi'
        ? 'Vui lòng nhập câu Kinh Thánh trước, ví dụ: Giăng 3:16 hoặc John 3:16.'
        : 'Enter a scripture reference first, e.g. John 3:16 or Giăng 3:16.');
      return;
    }
    try {
      setFetchingScripture(true);
      const data = await fetchScripture(passage, getToken());
      if (!data.verseTextEn || !data.verseTextVi) {
        throw new Error('Failed to fetch scripture');
      }
      const fetchedRefEn = data.referenceEn || data.reference || passage;
      const fetchedRefVi = data.referenceVi || data.reference || passage;
      setVerseReferenceEn(fetchedRefEn);
      setVerseReferenceVi(fetchedRefVi);
      setVerseTextEn(data.verseTextEn);
      setVerseTextVi(data.verseTextVi);
      // Bible versions come from the API response (NIV + 1925), so the
      // version fields fill themselves — no typing needed.
      setVerseTranslationEn(data.translationEn || data.translation || 'NIV');
      setVerseTranslationVi(data.translationVi || '1925');
      setFetchedScriptureKey(`${fetchedRefEn.trim()}|${fetchedRefVi.trim()}`);
      showFeedback('success', language === 'vi'
        ? `Đã lấy ${data.referenceEn || passage} (NIV + 1925).`
        : `Fetched ${data.referenceEn || passage} (NIV + 1925).`);
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, language === 'vi' ? 'Lỗi khi lấy Lời Chúa' : 'Error fetching scripture'));
    } finally {
      setFetchingScripture(false);
    }
  };

  const handleSaveVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verseDate || !verseReferenceVi.trim() || !verseReferenceEn.trim() || !verseTextVi.trim() || !verseTextEn.trim()) {
      showFeedback('error', language === 'vi' ? 'Vui lòng điền ngày, câu gốc và nội dung Kinh Thánh bằng cả tiếng Việt và tiếng Anh.' : 'Please fill in date, Vietnamese & English references, and verse texts.');
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      const endpoint = editingVerseId ? `/api/verses/${editingVerseId}` : '/api/verses';
      const method = editingVerseId ? 'PUT' : 'POST';
      // apiFetch throws a structured ApiError (status + backend code) on
      // failure, so the catch below can turn it into an accurate message
      // via getErrorMessage instead of showing raw text.
      await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: verseDate,
          reference: verseReferenceEn.trim(),
          referenceVi: verseReferenceVi.trim(),
          referenceEn: verseReferenceEn.trim(),
          translation: verseTranslationEn.trim() || 'NIV',
          translationVi: verseTranslationVi.trim() || '1925',
          translationEn: verseTranslationEn.trim() || 'NIV',
          verseText: verseTextEn.trim(),
          verseTextVi: verseTextVi.trim(),
          verseTextEn: verseTextEn.trim(),
          reflection: verseReflectionEn.trim() || verseTextEn.trim(),
          reflectionVi: verseReflectionVi.trim() || verseTextVi.trim(),
          reflectionEn: verseReflectionEn.trim() || verseTextEn.trim(),
          prayer: versePrayerEn.trim() || null,
          prayerVi: versePrayerVi.trim() || null,
          prayerEn: versePrayerEn.trim() || null,
          theme: verseTheme.trim() || 'Daily Scripture',
        }),
      });

      showFeedback('success', language === 'vi'
        ? (editingVerseId ? 'Đã cập nhật Lời Chúa!' : 'Đã lưu Lời Chúa hằng ngày!')
        : (editingVerseId ? 'Daily scripture updated!' : 'Daily scripture saved successfully!'));

      if (!editingVerseId) {
        NotificationClient.triggerNotification(
          `Scripture of the Day: ${verseReferenceEn.trim()}`,
          `"${verseTextEn.slice(0, 100)}..."`
        );
      }

      resetVerseForm();
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, language === 'vi' ? 'Lỗi khi lưu Lời Chúa' : 'Error saving daily verse'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVerse = async (id: number) => {
    if (!window.confirm(language === 'vi' ? 'Xóa câu Lời Chúa này?' : 'Delete this daily devotional?')) return;
    try {
      const token = getToken();
      await apiFetch(`/api/verses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showFeedback('success', language === 'vi' ? 'Đã xóa Lời Chúa.' : 'Verse deleted.');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, language === 'vi' ? 'Lỗi khi xóa Lời Chúa' : 'Error deleting verse'));
    }
  };

  // Create new Admin Account handler
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername.trim() || !newAdminPassword.trim() || !newAdminDisplayName.trim()) {
      showFeedback('error', language === 'vi' ? 'Vui lòng điền tên đăng nhập, mật khẩu và tên hiển thị' : 'Please fill in username, password, and display name');
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      const res = await fetch(apiUrl('/api/auth/create-admin'), {
        method: 'POST',
        headers: apiHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify({
          username: newAdminUsername.trim(),
          password: newAdminPassword.trim(),
          displayName: newAdminDisplayName.trim(),
          email: newAdminEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin');

      showFeedback('success', language === 'vi' ? `Tạo tài khoản quản trị [${newAdminUsername}] thành công!` : `Admin account [${newAdminUsername}] created!`);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminDisplayName('');
      setNewAdminEmail('');
      loadAdminAccounts();
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Admin Account handler
  const handleDeleteAdmin = async (id: number, username: string) => {
    if (!window.confirm(language === 'vi' ? `Bạn có chắc chắn muốn xóa tài khoản quản trị [${username}]?` : `Are you sure you want to delete admin account [${username}]?`)) return;

    try {
      const token = getToken();
      const res = await fetch(apiUrl(`/api/auth/admins/${id}`), {
        method: 'DELETE',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete admin');

      showFeedback('success', language === 'vi' ? 'Đã xóa tài khoản quản trị.' : 'Admin account deleted.');
      loadAdminAccounts();
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // Change Password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    try {
      setSubmitting(true);
      const token = getToken();
      const res = await fetch(apiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: apiHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed');

      showFeedback('success', language === 'vi' ? 'Đổi mật khẩu thành công!' : 'Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} maxWidthClass="max-w-3xl">
      <div className={s.modalContainer}>
        {/* Header */}
        <div className={s.header}>
          <div>
            <h2 className={s.headerTitle}>
              {focusedMode
                ? activeTab === 'create-event'
                  ? editingEventId
                    ? language === 'vi'
                      ? 'Chỉnh Sửa Sự Kiện'
                      : 'Edit Event'
                    : language === 'vi'
                    ? 'Thêm Sự Kiện Mới'
                    : 'Add New Event'
                  : activeTab === 'verses'
                  ? editingVerseId
                    ? language === 'vi'
                      ? 'Chỉnh Sửa Câu Kinh Thánh'
                      : 'Edit Daily Scripture'
                    : language === 'vi'
                    ? 'Thêm Câu Kinh Thánh'
                    : 'Add Daily Scripture'
                  : t('adminDashboardTitle')
                : t('adminDashboardTitle')}
            </h2>
            <p className={s.headerSubtitle}>
              <span>
                {language === 'vi' ? 'Đăng nhập với tư cách: ' : 'Logged in as: '}
                <span className={s.adminName}>{adminUser?.displayName} (@{adminUser?.username})</span>
              </span>
              <span className={s.separator}>•</span>
              <span className={s.versionText}>v{APP_VERSION}</span>
            </p>
          </div>

          <div className={s.headerActions}>
            <button
              onClick={onRefreshData}
              className={s.iconBtn}
              title="Refresh Data"
            >
              <RefreshCw className={s.refreshIcon} />
            </button>
            <button
              onClick={onClose}
              className={s.iconBtn}
              aria-label="Close Admin Portal"
            >
              <X className={s.closeIcon} />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`${s.alertBase} ${
              feedback.type === 'success' ? s.alertSuccess : s.alertError
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className={s.alertIconSuccess} />
            ) : (
              <AlertCircle className={s.alertIconError} />
            )}
            <span className="flex-1">{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5"
              aria-label="Dismiss"
              title={language === 'vi' ? 'Đóng' : 'Dismiss'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Controls - Mobile Grid (no horizontal scroll needed) */}
        {!focusedMode && (
        <div className={s.mobileTabSection}>
          <div className={s.mobileTabGrid}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('create-event');
                if (!editingEventId) resetEventForm();
              }}
              className={`${s.mobileTabBtnBase} ${
                activeTab === 'create-event' ? s.mobileTabActiveDark : s.mobileTabIdle
              }`}
            >
              <Plus className={s.tabIcon} />
              <span className="truncate">{editingEventId ? (language === 'vi' ? 'Sửa Sự Kiện' : 'Edit Event') : t('tabAddEvent')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manage-events')}
              className={`${s.mobileTabBtnBase} ${
                activeTab === 'manage-events' ? s.mobileTabActiveDark : s.mobileTabIdle
              }`}
            >
              <Calendar className={s.tabIcon} />
              <span className="truncate">{t('tabManageEvents')} ({events.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('verses')}
              className={`${s.mobileTabBtnBase} ${
                activeTab === 'verses' ? s.mobileTabActiveDark : s.mobileTabIdle
              }`}
            >
              <BookOpen className={s.tabIcon} />
              <span className="truncate">{t('tabVerses')} ({allVerses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin-accounts')}
              className={`${s.mobileTabBtnBase} ${
                activeTab === 'admin-accounts' ? s.mobileTabActiveAmber : s.mobileTabIdle
              }`}
            >
              <Users className={s.tabIconAmber} />
              <span className="truncate">{t('tabAdminAccounts')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prayer-requests')}
              className={`${s.mobileTabBtnBase} ${
                activeTab === 'prayer-requests' ? s.mobileTabActiveAmber : s.mobileTabIdle
              }`}
            >
              <HeartHandshake className={s.tabIconAmber} />
              <span className="truncate">{language === 'vi' ? 'Cầu Nguyện' : 'Prayers'}</span>
            </button>
          </div>

          {onOpenSpotlightEditor && (
            <button
              type="button"
              onClick={onOpenSpotlightEditor}
              className={s.mobileSpotlightBtn}
            >
              <Sliders className={s.tabIcon} />
              <span>{language === 'vi' ? 'Tuỳ Chỉnh Banner Trang Chủ' : 'Customize Home Banner'}</span>
            </button>
          )}
        </div>
        )}

        {/* Tab Controls - Desktop Horizontal Bar */}
        {!focusedMode && (
        <div className={s.desktopTabBar}>
          <button
            onClick={() => {
              setActiveTab('create-event');
              if (!editingEventId) resetEventForm();
            }}
            className={`${s.desktopTabBtnBase} ${
              activeTab === 'create-event' ? s.desktopTabActiveDark : s.desktopTabIdle
            }`}
          >
            <Plus className={s.tabIcon} />
            {editingEventId ? (language === 'vi' ? 'Sửa Sự Kiện' : 'Edit Event') : t('tabAddEvent')}
          </button>

          <button
            onClick={() => setActiveTab('manage-events')}
            className={`${s.desktopTabBtnBase} ${
              activeTab === 'manage-events' ? s.desktopTabActiveDark : s.desktopTabIdle
            }`}
          >
            <Calendar className={s.tabIcon} />
            {t('tabManageEvents')} ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('verses')}
            className={`${s.desktopTabBtnBase} ${
              activeTab === 'verses' ? s.desktopTabActiveDark : s.desktopTabIdle
            }`}
          >
            <BookOpen className={s.tabIcon} />
            {t('tabVerses')} ({allVerses.length})
          </button>

          <button
            onClick={() => setActiveTab('admin-accounts')}
            className={`${s.desktopTabBtnBase} ${
              activeTab === 'admin-accounts' ? s.desktopTabActiveAmber : s.desktopTabIdleAmber
            }`}
          >
            <Users className={s.tabIconAmber600} />
            <span>{t('tabAdminAccounts')}</span>
          </button>

          {onOpenSpotlightEditor && (
            <button
              type="button"
              onClick={onOpenSpotlightEditor}
              className={s.desktopSpotlightBtn}
              title="Tuỳ chỉnh banner trang chủ"
            >
              <Sliders className={s.tabIcon} />
              <span>{language === 'vi' ? 'Tuỳ Chỉnh Banner' : 'Customize Banner'}</span>
            </button>
          )}
        </div>
        )}

        {/* Content Body */}
        <div className={s.contentBody}>
          {/* TAB 1: ADD / EDIT EVENT - EXACT SAME DESIGN AS DAILY VERSES */}
          {activeTab === 'create-event' && (
            (() => {
              const previewTheme = (() => {
                const lower = (eventCategory || '').toLowerCase();
                if (lower.includes('youth') || lower.includes('giới trẻ')) {
                  return {
                    cardBg: 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/35 border-emerald-200/90 shadow-xs',
                    dateBox: 'bg-emerald-100/90 text-emerald-950 border-emerald-200/90',
                    monthText: 'text-emerald-800',
                    badge: 'bg-emerald-100/80 text-emerald-900 border-emerald-200/80',
                    icon: Users,
                  };
                }
                if (lower.includes('worship') || lower.includes('thờ phượng')) {
                  return {
                    cardBg: 'bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/35 border-indigo-200/90 shadow-xs',
                    dateBox: 'bg-indigo-100/90 text-indigo-950 border-indigo-200/90',
                    monthText: 'text-indigo-800',
                    badge: 'bg-indigo-100/80 text-indigo-900 border-indigo-200/80',
                    icon: Flame,
                  };
                }
                if (lower.includes('bible') || lower.includes('kinh thánh')) {
                  return {
                    cardBg: 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/35 border-amber-200/90 shadow-xs',
                    dateBox: 'bg-amber-100/90 text-amber-950 border-amber-200/90',
                    monthText: 'text-amber-800',
                    badge: 'bg-amber-100/80 text-amber-900 border-amber-200/80',
                    icon: BookOpen,
                  };
                }
                return {
                  cardBg: 'bg-gradient-to-br from-purple-50/90 via-white to-purple-50/35 border-purple-200/90 shadow-xs',
                  dateBox: 'bg-purple-100/90 text-purple-950 border-purple-200/90',
                  monthText: 'text-purple-800',
                  badge: 'bg-purple-100/80 text-purple-900 border-purple-200/80',
                  icon: Star,
                };
              })();
              const PreviewCategoryIcon = previewTheme.icon;

              const previewDateObj = eventDate ? new Date(eventDate + 'T00:00:00') : new Date();
              const previewMonth = isNaN(previewDateObj.getTime())
                ? 'VRC'
                : previewDateObj.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short' });
              const previewDay = isNaN(previewDateObj.getTime())
                ? '01'
                : previewDateObj.getDate();
              const previewWeekday = isNaN(previewDateObj.getTime())
                ? (language === 'vi' ? 'Chúa Nhật' : 'Sunday')
                : previewDateObj.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });

              return (
                <div className="space-y-6 max-w-2xl mx-auto w-full min-w-0">
                  {/* Event Form Card (Exact same design as Daily Verses) */}
                  <form onSubmit={handleSaveEvent} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3.5 w-full min-w-0 box-border">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-stone-900 text-sm">
                          {editingEventId
                            ? (language === 'vi' ? 'Sửa Thông Tin Sự Kiện' : 'Edit Event')
                            : (language === 'vi' ? 'Thêm Sự Kiện Mới Vào Lịch' : 'Add New Event to Calendar')}
                        </h3>
                        {editingEventId && (
                          <button
                            type="button"
                            onClick={resetEventForm}
                            className="text-xs text-stone-500 hover:text-stone-800 underline"
                          >
                            {language === 'vi' ? 'Hủy Sửa' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>

                    {editingEventId && editingEventAudit && (
                      <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-stone-700 flex flex-wrap gap-x-4 gap-y-1">
                        {editingEventAudit.createdBy && (
                          <span>
                            <strong>{language === 'vi' ? 'Người tạo:' : 'Created by:'}</strong> {editingEventAudit.createdBy}
                            {editingEventAudit.createdAt ? ` (${new Date(editingEventAudit.createdAt).toLocaleString()})` : ''}
                          </span>
                        )}
                        {editingEventAudit.updatedBy && (
                          <span>
                            <strong>{language === 'vi' ? 'Sửa lần cuối:' : 'Last modified by:'}</strong> {editingEventAudit.updatedBy}
                            {editingEventAudit.updatedAt ? ` (${new Date(editingEventAudit.updatedAt).toLocaleString()})` : ''}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                      <div className="w-full min-w-0">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {language === 'vi' ? 'Tên Sự Kiện (Tiếng Việt) *' : 'Event Title (Vietnamese) *'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Lễ Thờ Phượng Chúa Nhật"
                          value={eventTitleVi}
                          onChange={(e) => setEventTitleVi(e.target.value)}
                          className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {language === 'vi' ? 'Tên Sự Kiện (Tiếng Anh) *' : 'Event Title (English) *'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sunday Worship Celebration"
                          value={eventTitleEn}
                          onChange={(e) => setEventTitleEn(e.target.value)}
                          className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                      <div className="w-full min-w-0">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {language === 'vi' ? 'Mô Tả Chi Tiết (Tiếng Việt) *' : 'Description (Vietnamese) *'}
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Chủ đề bài giảng, diễn giả, thông tin sinh hoạt..."
                          value={eventDescriptionVi}
                          onChange={(e) => setEventDescriptionVi(e.target.value)}
                          className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {language === 'vi' ? 'Mô Tả Chi Tiết (Tiếng Anh) *' : 'Description (English) *'}
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Event details, sermon theme, speaker..."
                          value={eventDescriptionEn}
                          onChange={(e) => setEventDescriptionEn(e.target.value)}
                          className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full min-w-0">
                      <div className="w-full min-w-0">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {language === 'vi' ? 'Phân Loại' : 'Category'}
                        </label>
                        <select
                          value={eventCategory}
                          onChange={(e) => setEventCategory(e.target.value)}
                          className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                        >
                          <option value="Worship">Worship (Thờ Phượng)</option>
                          <option value="Bible Study">Bible Study (Kinh Thánh)</option>
                          <option value="Youth">Youth (Giới Trẻ)</option>
                          <option value="Special Gathering">Special Gathering</option>
                        </select>
                      </div>

                      <div className="w-full min-w-0 overflow-hidden">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {language === 'vi' ? 'Ngày Diễn Ra *' : 'Date *'}
                        </label>
                        <input
                          type="date"
                          required
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full max-w-full box-border min-w-0 appearance-none px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {language === 'vi' ? 'Giờ Bắt Đầu *' : 'Start Time *'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="03:00 PM"
                          value={eventStartTime}
                          onChange={(e) => setEventStartTime(e.target.value)}
                          className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                      <div className="w-full min-w-0">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {language === 'vi' ? 'Giờ Kết Thúc' : 'End Time'}
                        </label>
                        <input
                          type="text"
                          placeholder="05:00 PM"
                          value={eventEndTime}
                          onChange={(e) => setEventEndTime(e.target.value)}
                          className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {language === 'vi' ? 'Phòng Nhóm / Nơi Chốn *' : 'Location / Room *'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Main Sanctuary, Fellowship Hall..."
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                          className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="w-full min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-stone-700">
                          {language === 'vi' ? 'Địa Chỉ Cụ Thể (Chỉ Đường Google Maps)' : 'Venue Address (Google Maps Directions)'}
                        </label>
                        <span className="text-[10px] text-stone-400">
                          {language === 'vi' ? 'Để trống = Địa chỉ Hội Thánh' : 'Blank = Church Address'}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder={churchInfo?.address || 'Tempe, Arizona'}
                        value={eventAddress}
                        onChange={(e) => setEventAddress(e.target.value)}
                        className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                      />
                      <p className="text-[11px] text-stone-500 mt-1">
                        {language === 'vi'
                          ? `Nếu để trống hoặc không đổi, nút Chỉ Đường sẽ dẫn tới địa chỉ Hội Thánh thiết lập trong Lịch Sinh Hoạt (${churchInfo?.address || 'Tempe, Arizona'}). Nếu là địa điểm dã ngoại hay ngoài nhà thờ, hãy nhập địa chỉ tại đây.`
                          : `If left blank, the Directions button routes to the church sanctuary address (${churchInfo?.address || 'Tempe, Arizona'}). For retreats or offsite gatherings, enter the address here.`}
                      </p>
                    </div>

                    <div className="flex items-center pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                        <input
                          type="checkbox"
                          checked={eventIsFeatured}
                          onChange={(e) => setEventIsFeatured(e.target.checked)}
                          className="rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                        />
                        <span>{language === 'vi' ? 'Đánh dấu là sự kiện nổi bật (Featured)' : 'Mark as Featured Event'}</span>
                      </label>
                    </div>

                    <div className="text-right pt-2 border-t border-stone-200">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>
                          {submitting
                            ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                            : editingEventId
                            ? (language === 'vi' ? 'Cập Nhật Sự Kiện' : 'Update Event')
                            : (language === 'vi' ? 'Lưu Sự Kiện' : 'Save Event')}
                        </span>
                      </button>
                    </div>
                  </form>

                  {/* Live Event Preview Card (Rendered cleanly directly below in same width) */}
                  <div className="space-y-2 w-full min-w-0">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-amber-600" />
                        <span>{language === 'vi' ? 'Xem Trước Thẻ Sự Kiện' : 'Event Card Preview'}</span>
                      </span>
                      <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
                        {language === 'vi' ? 'Tự động cập nhật' : 'Live preview'}
                      </span>
                    </div>

                    <div className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 space-y-3 w-full min-w-0 box-border ${previewTheme.cardBg}`}>
                      {/* Top Row: Category Pill + Featured Pill + Date */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${previewTheme.badge}`}
                          >
                            <PreviewCategoryIcon className="w-3 h-3" />
                            <span>{eventCategory || 'Worship'}</span>
                          </span>
                          {eventIsFeatured && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                              <span>{language === 'vi' ? 'NỔI BẬT' : 'FEATURED'}</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-semibold text-stone-500">
                          {previewWeekday}{eventDate ? `, ${eventDate}` : ''}
                        </span>
                      </div>

                      {/* Main Content Area */}
                      <div className="flex items-start gap-3.5">
                        {/* Distinct Calendar Date Card */}
                        <div className={`flex-shrink-0 w-14 text-center rounded-xl border p-2 shadow-2xs ${previewTheme.dateBox}`}>
                          <span className={`block text-[10px] font-bold uppercase tracking-wider ${previewTheme.monthText}`}>
                            {previewMonth}
                          </span>
                          <span className="block text-xl font-serif font-bold text-stone-950 leading-tight">
                            {previewDay}
                          </span>
                        </div>

                        {/* Title, Time, Location */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="text-sm sm:text-base font-serif font-bold text-stone-950 leading-snug line-clamp-2">
                            {(language === 'vi' ? (eventTitleVi || eventTitleEn) : (eventTitleEn || eventTitleVi)) || (language === 'vi' ? 'Tiêu Đề Sự Kiện (Đang nhập...)' : 'Event Title (Type in form...)')}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-700 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-700 flex-shrink-0" />
                              <span>{eventStartTime || '03:00 PM'}{eventEndTime ? ` - ${eventEndTime}` : ''}</span>
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-700 flex-shrink-0" />
                              <span className="truncate max-w-[240px]">
                                {eventLocation || 'Main Sanctuary'} • {eventAddress.trim() || churchInfo?.address || 'Tempe, AZ'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description Preview */}
                      <p className="text-xs text-stone-800 leading-relaxed bg-white/90 p-2.5 rounded-xl border border-stone-200 line-clamp-3 font-normal">
                        {(language === 'vi' ? (eventDescriptionVi || eventDescriptionEn) : (eventDescriptionEn || eventDescriptionVi)) || (language === 'vi' ? 'Mô tả chi tiết sự kiện sẽ hiển thị tại đây khi bạn nhập vào biểu mẫu bên trên...' : 'Event details and description will appear here as you type in the form above...')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* TAB 2: MANAGE EVENTS */}
          {activeTab === 'manage-events' && (
            <div className="space-y-3 max-w-2xl mx-auto">
              {events.length === 0 ? (
                <p className="text-stone-500 text-sm py-8 text-center">{language === 'vi' ? 'Chưa có sự kiện nào trong cơ sở dữ liệu.' : 'No events in database.'}</p>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {events.map((evt) => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isPast = evt.date < todayStr;
                    return (
                      <div key={evt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif font-bold text-stone-900 text-sm truncate">{evt.title}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                              {evt.category}
                            </span>
                            {isPast ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                                {language === 'vi' ? 'Đã diễn ra' : 'Past (Archive)'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {language === 'vi' ? 'Sắp diễn ra' : 'Upcoming'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 truncate">
                            {evt.date} • {evt.startTime} • {evt.location}{evt.address && evt.address !== evt.location ? ` • ${evt.address}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditEvent(evt)}
                            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DAILY VERSES */}
          {activeTab === 'verses' && (
            <div className="space-y-6 max-w-2xl mx-auto w-full min-w-0">
              <form onSubmit={handleSaveVerse} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3.5 w-full min-w-0 box-border">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-stone-900 text-sm">
                      {editingVerseId
                        ? (language === 'vi' ? 'Sửa Lời Chúa Hôm Nay' : 'Edit Daily Scripture')
                        : (language === 'vi' ? 'Đăng Lời Chúa Hôm Nay' : 'Post Daily Scripture')}
                    </h3>
                    {editingVerseId && (
                      <button
                        type="button"
                        onClick={resetVerseForm}
                        className="text-xs text-stone-500 hover:text-stone-800 underline"
                      >
                        {language === 'vi' ? 'Hủy Sửa' : 'Cancel'}
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleFetchScriptureForVerse}
                    disabled={fetchingScripture || isScriptureFetchedForCurrentRef || (!verseReferenceEn.trim() && !verseReferenceVi.trim())}
                    title={
                      isScriptureFetchedForCurrentRef
                        ? (language === 'vi' ? 'Đã lấy câu này rồi. Đổi câu Kinh Thánh để lấy lại.' : 'Already fetched for this reference. Change the reference to fetch again.')
                        : (language === 'vi' ? 'Nhập câu Kinh Thánh ở trên rồi bấm để lấy nội dung thật (NIV + 1925)' : 'Enter a reference above, then fetch the real text (NIV + 1925)')
                    }
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    <span>
                      {fetchingScripture
                        ? (language === 'vi' ? 'Đang lấy...' : 'Fetching...')
                        : isScriptureFetchedForCurrentRef
                          ? (language === 'vi' ? 'Đã lấy ✓' : 'Fetched ✓')
                          : (language === 'vi' ? 'Lấy từ Kinh Thánh' : 'Fetch from Bible')}
                    </span>
                  </Button>
                </div>

                {editingVerseId && editingVerseAudit && (
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-stone-700 flex flex-wrap gap-x-4 gap-y-1">
                    {editingVerseAudit.createdBy && (
                      <span>
                        <strong>{language === 'vi' ? 'Người tạo:' : 'Created by:'}</strong> {editingVerseAudit.createdBy}
                        {editingVerseAudit.createdAt ? ` (${new Date(editingVerseAudit.createdAt).toLocaleString()})` : ''}
                      </span>
                    )}
                    {editingVerseAudit.updatedBy && (
                      <span>
                        <strong>{language === 'vi' ? 'Sửa lần cuối:' : 'Last modified by:'}</strong> {editingVerseAudit.updatedBy}
                        {editingVerseAudit.updatedAt ? ` (${new Date(editingVerseAudit.updatedAt).toLocaleString()})` : ''}
                      </span>
                    )}
                  </div>
                )}

                <div className="w-full sm:w-1/3 min-w-0">
                  <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Ngày *' : 'Date *'}</label>
                  <input
                    type="date"
                    required
                    value={verseDate}
                    onChange={(e) => setVerseDate(e.target.value)}
                    className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Câu Kinh Thánh (Tiếng Việt) *' : 'Scripture Reference (Vietnamese) *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Giăng 3:16"
                      value={verseReferenceVi}
                      onChange={(e) => setVerseReferenceVi(e.target.value)}
                      className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Câu Kinh Thánh (Tiếng Anh) *' : 'Scripture Reference (English) *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John 3:16"
                      value={verseReferenceEn}
                      onChange={(e) => setVerseReferenceEn(e.target.value)}
                      className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Bản Dịch Kinh Thánh (Tiếng Việt) *' : 'Bible Version (Vietnamese) *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="1925"
                      value={verseTranslationVi}
                      onChange={(e) => setVerseTranslationVi(e.target.value)}
                      className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Bản Dịch Kinh Thánh (Tiếng Anh) *' : 'Bible Version (English) *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NIV, ESV, KJV"
                      value={verseTranslationEn}
                      onChange={(e) => setVerseTranslationEn(e.target.value)}
                      className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Nội Dung Lời Chúa (Tiếng Việt) *' : 'Scripture Text (Vietnamese) *'}</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Nhập câu gốc Lời Chúa bằng tiếng Việt..."
                      value={verseTextVi}
                      onChange={(e) => setVerseTextVi(e.target.value)}
                      className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Nội Dung Lời Chúa (Tiếng Anh) *' : 'Scripture Text (English) *'}</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Enter the scripture verse text in English..."
                      value={verseTextEn}
                      onChange={(e) => setVerseTextEn(e.target.value)}
                      className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Suy Gẫm (Tiếng Việt)' : 'Reflection (Vietnamese, Optional)'}</label>
                    <textarea
                      rows={2}
                      placeholder="Nội dung suy gẫm..."
                      value={verseReflectionVi}
                      onChange={(e) => setVerseReflectionVi(e.target.value)}
                      className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Suy Gẫm (Tiếng Anh)' : 'Reflection (English, Optional)'}</label>
                    <textarea
                      rows={2}
                      placeholder="Pastoral reflection in English..."
                      value={verseReflectionEn}
                      onChange={(e) => setVerseReflectionEn(e.target.value)}
                      className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Lời Cầu Nguyện (Tiếng Việt)' : 'Prayer (Vietnamese, Optional)'}</label>
                    <input
                      type="text"
                      placeholder="Lạy Chúa, xin dẫn dắt chúng con..."
                      value={versePrayerVi}
                      onChange={(e) => setVersePrayerVi(e.target.value)}
                      className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Lời Cầu Nguyện (Tiếng Anh)' : 'Prayer (English, Optional)'}</label>
                    <input
                      type="text"
                      placeholder="Lord, guide our steps..."
                      value={versePrayerEn}
                      onChange={(e) => setVersePrayerEn(e.target.value)}
                      className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="text-right pt-2 border-t border-stone-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {submitting
                        ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                        : editingVerseId
                        ? (language === 'vi' ? 'Cập Nhật Lời Chúa' : 'Update Scripture')
                        : (language === 'vi' ? 'Lưu Lời Chúa' : 'Save Daily Scripture')}
                    </span>
                  </button>
                </div>
              </form>

              {/* Published verses list */}
              <div className="space-y-2 w-full min-w-0">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {language === 'vi' ? 'Lời Chúa Đã Đăng' : 'Published Daily Verses'} ({allVerses.length})
                </h4>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
                  {allVerses.map((v) => (
                    <div key={v.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="font-serif font-bold text-stone-950">{v.reference}</span>
                        <span className="text-stone-600 font-semibold ml-2">{v.date}</span>
                        <p className="text-stone-700 line-clamp-1 mt-0.5 font-medium">"{v.verseText}"</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditVerse(v)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVerse(v.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN ACCOUNTS MANAGEMENT */}
          {activeTab === 'admin-accounts' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Provision New Admin Account Form */}
              <form onSubmit={handleCreateAdmin} className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-4">
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-amber-700" />
                    {t('newAdminTitle')}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {t('newAdminDesc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t('usernameLabel')} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. pastor_david"
                      value={newAdminUsername}
                      onChange={(e) => setNewAdminUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t('passwordLabel')} *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t('displayNameLabel')} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mục sư David Nguyễn"
                      value={newAdminDisplayName}
                      onChange={(e) => setNewAdminDisplayName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t('emailLabel')} (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="pastor@vnrevivalchurch.org"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="pt-1 text-right">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    {submitting ? (language === 'vi' ? 'Đang tạo...' : 'Creating...') : t('createAdminBtn')}
                  </button>
                </div>
              </form>

              {/* Existing Admin Accounts List */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-stone-700" />
                  {t('existingAdminsTitle')} ({adminList.length})
                </h4>

                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {adminList.map((adm) => {
                    const isSelf = adminUser?.id === adm.id;
                    return (
                      <div key={adm.id} className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-xs sm:text-sm">
                              {adm.displayName}
                            </span>
                            <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                              @{adm.username}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                                {language === 'vi' ? 'Tài khoản của bạn' : 'Your Account'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">{adm.email}</p>
                        </div>

                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={t('deleteAdminBtn')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Change Password for Currently Logged-in Admin */}
              <form onSubmit={handleChangePassword} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-stone-600" />
                  {t('changePasswordTitle')} ({adminUser?.username})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {t('oldPasswordLabel')} *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {t('newPasswordLabel')} *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="text-right pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    {t('updatePasswordBtn')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'prayer-requests' && (
            <div className="space-y-4 max-w-2xl mx-auto w-full min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  {language === 'vi' ? 'Danh Sách Lời Cầu Nguyện' : 'Prayer Requests'} ({prayerList.length})
                </h3>
                <button
                  type="button"
                  onClick={loadPrayerRequests}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Làm mới' : 'Refresh'}</span>
                </button>
              </div>

              {prayerList.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500">
                  {language === 'vi' ? 'Chưa có lời cầu nguyện nào.' : 'No prayer requests submitted yet.'}
                </div>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {prayerList.map((p) => {
                    const isExpanded = expandedPrayerIds.has(p.id);
                    const firstSentenceMatch = p.request.match(/^.*?[.!?](?:\s|$)/);
                    const firstSentence = firstSentenceMatch ? firstSentenceMatch[0].trim() : p.request.slice(0, 100);
                    const isLong = p.request.length > firstSentence.length + 3;

                    return (
                      <div key={p.id} className="p-4 flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif font-bold text-stone-900 text-sm">
                              {p.requesterName || (language === 'vi' ? 'Ẩn danh' : 'Anonymous')}
                            </span>
                            {p.createdAt && (
                              <span className="text-xs text-stone-500">
                                • {new Date(p.createdAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-stone-700 whitespace-pre-line leading-relaxed">
                            {isExpanded || !isLong ? p.request : `${firstSentence}...`}
                          </p>
                          {isLong && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPrayerIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(p.id)) next.delete(p.id);
                                  else next.add(p.id);
                                  return next;
                                })
                              }
                              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline"
                            >
                              {isExpanded
                                ? (language === 'vi' ? 'Thu gọn' : 'Show less')
                                : (language === 'vi' ? 'Xem thêm' : 'Read more')}
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePrayer(p.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors flex-shrink-0"
                          title={language === 'vi' ? 'Xóa' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
