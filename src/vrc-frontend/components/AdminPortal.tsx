import React, { useState, useEffect } from 'react';
import { ChurchEvent, DailyVerse, Announcement } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { apiUrl } from '../utils/api.ts';
import { NotificationClient } from '../services/notificationClient.ts';
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
  initialTab?: string;
  onClose: () => void;
  onRefreshData: () => void;
  onOpenSpotlightEditor?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  events,
  allVerses,
  announcements,
  initialTab = 'create-event',
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
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
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
  const [verseDate, setVerseDate] = useState(new Date().toISOString().split('T')[0]);
  const [verseReference, setVerseReference] = useState('');
  const [verseText, setVerseText] = useState('');
  const [verseTranslation, setVerseTranslation] = useState('NIV');
  const [verseReflection, setVerseReflection] = useState('');
  const [versePrayer, setVersePrayer] = useState('');
  const [verseTheme, setVerseTheme] = useState('Revival & Faith');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Admin Accounts Management State
  const [adminList, setAdminList] = useState<AdminAccount[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminDisplayName, setNewAdminDisplayName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadAdminAccounts = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/auth/admins'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminList(data);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin-accounts') {
      loadAdminAccounts();
    }
  }, [activeTab]);

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventDescription('');
    setEventCategory('Worship');
    setEventDate(new Date().toISOString().split('T')[0]);
    setEventStartTime('03:00 PM');
    setEventEndTime('05:00 PM');
    setEventLocation('Main Sanctuary');
    setEventAddress('Tempe, Arizona');
    setEventIsFeatured(false);
  };

  const handleEditEvent = (evt: ChurchEvent) => {
    setEditingEventId(evt.id);
    setEventTitle(evt.title);
    setEventDescription(evt.description);
    setEventCategory(evt.category);
    setEventDate(evt.date);
    setEventStartTime(evt.startTime);
    setEventEndTime(evt.endTime || '');
    setEventLocation(evt.location);
    setEventAddress(evt.address || 'Tempe, Arizona');
    setEventIsFeatured(evt.isFeatured);
    setEventOrganizer(evt.organizerName || '');
    setEventOrganizerEmail(evt.organizerEmail || '');
    setActiveTab('create-event');
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventStartTime || !eventLocation) {
      showFeedback('error', language === 'vi' ? 'Vui lòng điền đầy đủ các thông tin sự kiện bắt buộc.' : 'Please fill in all required event details.');
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      const payload = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        category: eventCategory,
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime || null,
        location: eventLocation.trim(),
        address: eventAddress.trim() || 'Tempe, Arizona',
        isFeatured: eventIsFeatured,
        organizerName: eventOrganizer.trim(),
        organizerEmail: eventOrganizerEmail.trim(),
      };

      const url = editingEventId ? apiUrl(`/api/events/${editingEventId}`) : apiUrl('/api/events');
      const method = editingEventId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save event');
      }

      showFeedback('success', editingEventId 
        ? (language === 'vi' ? 'Cập nhật sự kiện thành công!' : 'Event updated successfully!') 
        : (language === 'vi' ? 'Đã thêm sự kiện vào lịch hội thánh!' : 'New event published successfully!'));

      // Dispatch local/push notification
      NotificationClient.triggerNotification(
        `New Church Event: ${eventTitle.trim()}`,
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete event');
      showFeedback('success', language === 'vi' ? 'Đã xóa sự kiện.' : 'Event removed.');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting event');
    }
  };

  const handleAiDraftDevotional = async () => {
    if (!verseReference.trim()) {
      showFeedback('error', language === 'vi' ? 'Vui lòng nhập đoạn Kinh Thánh (ví dụ: "2 Sử Ký 7:14" hoặc "Giăng 3:16")' : 'Please enter a Scripture reference (e.g. "2 Chronicles 7:14" or "John 3:16") first.');
      return;
    }

    try {
      setGeneratingAi(true);
      const token = getToken();
      const res = await fetch(apiUrl('/api/ai/generate-devotional'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          passage: verseReference.trim(),
          theme: verseTheme || 'Revival & Hope',
        }),
      });

      if (!res.ok) throw new Error('AI generator failed');
      const generated = await res.json();
      if (generated.verseText) setVerseText(generated.verseText);
      if (generated.reflection) setVerseReflection(generated.reflection);
      if (generated.prayer) setVersePrayer(generated.prayer);
      if (generated.theme) setVerseTheme(generated.theme);

      showFeedback('success', language === 'vi' ? 'Bản thảo suy gẫm đã sẵn sàng!' : 'Devotional draft prepared! Review and save below.');
    } catch (err: any) {
      showFeedback('error', err.message || 'Error generating reflection');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSaveVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verseDate || !verseReference.trim() || !verseText.trim() || !verseReflection.trim()) {
      showFeedback('error', language === 'vi' ? 'Vui lòng điền ngày, câu gốc, nội dung và suy gẫm.' : 'Please fill in date, reference, verse text, and reflection.');
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      const res = await fetch(apiUrl('/api/verses'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: verseDate,
          reference: verseReference.trim(),
          verseText: verseText.trim(),
          translation: verseTranslation,
          reflection: verseReflection.trim(),
          prayer: versePrayer.trim() || null,
          theme: verseTheme.trim() || 'Daily Devotion',
        }),
      });

      if (!res.ok) throw new Error('Failed to save verse');
      showFeedback('success', language === 'vi' ? 'Đã lưu Lời Chúa hằng ngày!' : 'Daily scripture saved successfully!');

      NotificationClient.triggerNotification(
        `Scripture of the Day: ${verseReference.trim()}`,
        `"${verseText.slice(0, 100)}..."`
      );

      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error saving daily verse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVerse = async (id: number) => {
    if (!window.confirm(language === 'vi' ? 'Xóa câu Lời Chúa này?' : 'Delete this daily devotional?')) return;
    try {
      const token = getToken();
      await fetch(apiUrl(`/api/verses/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showFeedback('success', language === 'vi' ? 'Đã xóa Lời Chúa.' : 'Verse deleted.');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message);
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
        headers: { Authorization: `Bearer ${token}` },
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-stone-950 text-white flex items-center justify-between border-b border-stone-800 flex-shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-white">
              {t('adminDashboardTitle')}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {language === 'vi' ? 'Đăng nhập với tư cách: ' : 'Logged in as: '}
              <span className="text-amber-400 font-semibold">{adminUser?.displayName} (@{adminUser?.username})</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshData}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              aria-label="Close Admin Portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 text-xs font-medium flex items-center gap-2 px-6 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-stone-200 bg-stone-50/50 flex-shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setActiveTab('create-event');
              if (!editingEventId) resetEventForm();
            }}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'create-event'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {editingEventId ? (language === 'vi' ? 'Sửa Sự Kiện' : 'Edit Event') : t('tabAddEvent')}
          </button>

          <button
            onClick={() => setActiveTab('manage-events')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'manage-events'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {t('tabManageEvents')} ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('verses')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'verses'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t('tabVerses')} ({allVerses.length})
          </button>

          <button
            onClick={() => setActiveTab('admin-accounts')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'admin-accounts'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-xl font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('tabAdminAccounts')}</span>
          </button>

          {onOpenSpotlightEditor && (
            <button
              type="button"
              onClick={onOpenSpotlightEditor}
              className="px-3.5 py-1.5 mb-1.5 ml-auto bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap flex-shrink-0"
              title="Tuỳ chỉnh banner trang chủ"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Tuỳ Chỉnh Banner (Make It Pop)' : 'Customize Banner'}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: ADD / EDIT EVENT */}
          {activeTab === 'create-event' && (
            <form onSubmit={handleSaveEvent} className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h3 className="text-base font-serif font-bold text-stone-900">
                  {editingEventId ? (language === 'vi' ? 'Sửa Thông Tin Sự Kiện' : 'Edit Event') : (language === 'vi' ? 'Thêm Sự Kiện Mới Vào Lịch' : 'Add New Event to Calendar')}
                </h3>
                {editingEventId && (
                  <button
                    type="button"
                    onClick={resetEventForm}
                    className="text-xs text-stone-500 hover:text-stone-800 underline"
                  >
                    {language === 'vi' ? 'Hủy Sửa' : 'Cancel Editing'}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {language === 'vi' ? 'Tên Sự Kiện / Lễ Nhóm *' : 'Event Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunday Worship Celebration"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {language === 'vi' ? 'Mô Tả Chi Tiết *' : 'Description *'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={language === 'vi' ? 'Chủ đề bài giảng, diễn giả, thông tin sinh hoạt...' : 'Event details, sermon theme, speaker...'}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {language === 'vi' ? 'Phân Loại' : 'Category'}
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white"
                  >
                    <option value="Worship">Worship (Thờ Phượng)</option>
                    <option value="Bible Study">Bible Study (Kinh Thánh)</option>
                    <option value="Youth">Youth (Giới Trẻ)</option>
                    <option value="Special Gathering">Special Gathering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {language === 'vi' ? 'Ngày Diễn Ra *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {language === 'vi' ? 'Giờ Bắt Đầu *' : 'Start Time *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="03:00 PM"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {language === 'vi' ? 'Giờ Kết Thúc' : 'End Time'}
                  </label>
                  <input
                    type="text"
                    placeholder="05:00 PM"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {language === 'vi' ? 'Địa Điểm / Phòng Nhóm *' : 'Location *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Main Sanctuary, Tempe, Arizona"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={eventIsFeatured}
                    onChange={(e) => setEventIsFeatured(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                  />
                  {language === 'vi' ? 'Đánh dấu là sự kiện nổi bật' : 'Mark as Featured Event'}
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submitting ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : editingEventId ? (language === 'vi' ? 'Cập Nhật' : 'Update Event') : (language === 'vi' ? 'Đăng Sự Kiện' : 'Publish Event')}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MANAGE EVENTS */}
          {activeTab === 'manage-events' && (
            <div className="space-y-3 max-w-2xl mx-auto">
              {events.length === 0 ? (
                <p className="text-stone-500 text-sm py-8 text-center">{language === 'vi' ? 'Chưa có sự kiện nào trong cơ sở dữ liệu.' : 'No events in database.'}</p>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {events.map((evt) => (
                    <div key={evt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-stone-900 text-sm">{evt.title}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {evt.category}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          {evt.date} • {evt.startTime} • {evt.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DAILY VERSES */}
          {activeTab === 'verses' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <form onSubmit={handleSaveVerse} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <h3 className="font-serif font-bold text-stone-900 text-sm">
                    {language === 'vi' ? 'Đăng Lời Chúa & Suy Gẫm Hôm Nay' : 'Post Scripture & Devotional'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleAiDraftDevotional}
                    disabled={generatingAi}
                    className="flex items-center gap-1 px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{generatingAi ? (language === 'vi' ? 'Đang soạn thảo...' : 'Drafting...') : (language === 'vi' ? 'AI Soạn Thảo Suy Gẫm' : 'AI Devotional Assistant')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Ngày *' : 'Date *'}</label>
                    <input
                      type="date"
                      required
                      value={verseDate}
                      onChange={(e) => setVerseDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Câu Kinh Thánh *' : 'Scripture Reference *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2 Chronicles 7:14 / 2 Sử Ký 7:14"
                      value={verseReference}
                      onChange={(e) => setVerseReference(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Nội Dung Lời Chúa *' : 'Scripture Text *'}</label>
                  <textarea
                    rows={2}
                    required
                    placeholder={language === 'vi' ? 'Nhập câu gốc Lời Chúa...' : 'Enter the scripture verse text...'}
                    value={verseText}
                    onChange={(e) => setVerseText(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Suy Gẫm Mục Vụ *' : 'Pastoral Reflection *'}</label>
                  <textarea
                    rows={3}
                    required
                    placeholder={language === 'vi' ? 'Nội dung suy gẫm và khích lệ đức tin...' : 'Thoughtful pastoral reflection...'}
                    value={verseReflection}
                    onChange={(e) => setVerseReflection(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">{language === 'vi' ? 'Lời Cầu Nguyện' : 'Prayer (Optional)'}</label>
                  <input
                    type="text"
                    placeholder="Lạy Chúa, xin dẫn dắt từng bước đi của chúng con..."
                    value={versePrayer}
                    onChange={(e) => setVersePrayer(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="text-right pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold"
                  >
                    {submitting ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu Lời Chúa' : 'Save Daily Scripture')}
                  </button>
                </div>
              </form>

              {/* Published verses list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {language === 'vi' ? 'Lời Chúa Đã Đăng' : 'Published Daily Verses'} ({allVerses.length})
                </h4>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
                  {allVerses.map((v) => (
                    <div key={v.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-serif font-bold text-stone-900">{v.reference}</span>
                        <span className="text-stone-400 ml-2">{v.date}</span>
                        <p className="text-stone-500 line-clamp-1 mt-0.5">"{v.verseText}"</p>
                      </div>
                      <button
                        onClick={() => handleDeleteVerse(v.id)}
                        className="p-1 text-stone-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
        </div>
      </div>
    </div>
  );
};
