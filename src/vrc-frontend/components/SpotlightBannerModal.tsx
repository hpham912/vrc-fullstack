import React, { useState, useEffect } from 'react';
import { ChurchEvent, ChurchInfo, SpotlightBannerConfig, SpotlightTheme } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { apiUrl } from '../utils/api.ts';
import { CrossIcon } from './CrossIcon.tsx';
import {
  Sparkles,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Palette,
  Zap,
  Check,
} from 'lucide-react';

interface SpotlightBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: SpotlightBannerConfig | null;
  events?: ChurchEvent[];
  churchInfo?: ChurchInfo | null;
  onSaved: (updated: SpotlightBannerConfig) => void;
}

interface ThemeOption {
  key: SpotlightTheme;
  labelVi: string;
  labelEn: string;
  icon: string;
  colorDot: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { key: 'thanksgiving', labelVi: 'Lễ Tạ Ơn (Thanksgiving)', labelEn: 'Thanksgiving', icon: '🍂', colorDot: 'bg-amber-500' },
  { key: 'christmas', labelVi: 'Lễ Giáng Sinh (Christmas)', labelEn: 'Christmas', icon: '🎄', colorDot: 'bg-red-600' },
  { key: 'easter', labelVi: 'Đại Lễ Phục Sinh (Easter)', labelEn: 'Easter', icon: '✝️', colorDot: 'bg-purple-600' },
  { key: 'revival', labelVi: 'Đại Hội Bồi Linh (Revival)', labelEn: 'Revival', icon: '🔥', colorDot: 'bg-blue-600' },
  { key: 'special', labelVi: 'Giới Trẻ (Youth)', labelEn: 'Youth', icon: '✨', colorDot: 'bg-emerald-600' },
  { key: 'default', labelVi: 'Cổ Điển (Classic)', labelEn: 'Classic', icon: '🏛️', colorDot: 'bg-stone-700' },
];

export const SpotlightBannerModal: React.FC<SpotlightBannerModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
  events = [],
  churchInfo,
  onSaved,
}) => {
  const { getToken } = useAuth();
  const { language } = useLanguage();

  const [theme, setTheme] = useState<SpotlightTheme>(initialConfig?.theme || 'thanksgiving');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    initialConfig?.selectedEventId ?? null
  );
  const [badgeText, setBadgeText] = useState(initialConfig?.badge || '');
  const [subtitle, setSubtitle] = useState(
    initialConfig?.subtitle || 'Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"'
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Current local date in YYYY-MM-DD
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Upcoming events only: past events must NEVER show in the feature banner selector
  const upcomingEvents = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  // Sync state with incoming props on modal open or config update
  useEffect(() => {
    if (isOpen) {
      setTheme(initialConfig?.theme || 'thanksgiving');
      const existingId = initialConfig?.selectedEventId ?? null;
      // If previously selected event has passed, reset to auto-next
      const isPast = existingId ? events.some((e) => e.id === existingId && e.date < todayStr) : false;
      setSelectedEventId(isPast ? null : existingId);
      setBadgeText(initialConfig?.badge || '');
      setSubtitle(initialConfig?.subtitle || 'Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"');
    }
  }, [isOpen, initialConfig, events, todayStr]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setFeedback(null);
      const token = getToken();

      const isAuto = selectedEventId === null;
      // Find selected event to pull details (only valid if upcoming)
      const pickedEvt = !isAuto
        ? upcomingEvents.find((e) => e.id === selectedEventId)
        : null;

      const defaultChurchAddress = (churchInfo?.address || 'Tempe, Arizona').trim();
      const defaultChurchMapsUrl = churchInfo?.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(defaultChurchAddress)}`;

      const eventHasCustomAddress = Boolean(pickedEvt?.address?.trim()) &&
        pickedEvt!.address!.trim().toLowerCase() !== defaultChurchAddress.toLowerCase();

      const cleanAddress = eventHasCustomAddress ? pickedEvt!.address!.trim() : defaultChurchAddress;
      const cleanDirectionsUrl = eventHasCustomAddress
        ? `https://maps.google.com/?q=${encodeURIComponent(cleanAddress)}`
        : defaultChurchMapsUrl;

      const cleanBadge = (badgeText || '').trim();

      const payload: SpotlightBannerConfig = {
        mode: isAuto ? 'auto' : 'event',
        selectedEventId: isAuto ? null : selectedEventId,
        isActive: true,
        theme,
        badge: cleanBadge,
        subtitle: (subtitle || '').trim(),
        title: isAuto ? '' : (pickedEvt ? pickedEvt.title : ''),
        description: isAuto ? '' : (pickedEvt ? pickedEvt.description : ''),
        dateTag: isAuto ? '' : (pickedEvt ? `${pickedEvt.date} • ${pickedEvt.startTime}` : ''),
        locationTag: isAuto ? '' : (pickedEvt ? (pickedEvt.location || defaultChurchAddress) : defaultChurchAddress),
        customAddress: cleanAddress,
        primaryBtnText: 'Xem Sự Kiện',
        primaryBtnAction: 'events',
        secondaryBtnText: 'Chỉ Đường',
        secondaryBtnUrl: cleanDirectionsUrl,
        updatedAt: new Date().toISOString(),
      };

      // Always save optimistically to localStorage immediately so choice is never lost
      try {
        localStorage.setItem('vrc_cached_spotlight', JSON.stringify(payload));
      } catch (cacheErr) {
        console.warn('Local cache warning:', cacheErr);
      }

      if (!token) {
        setFeedback({
          type: 'error',
          message: language === 'vi'
            ? 'Vui lòng đăng nhập tài khoản quản trị (Admin) để lưu banner lên máy chủ.'
            : 'Please log in as an administrator first to sync banner to server.',
        });
        onSaved(payload);
        return;
      }

      const res = await fetch(apiUrl('/api/spotlight'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || (language === 'vi' ? 'Không thể cập nhật banner' : 'Failed to update spotlight banner'));
      }

      const updated: SpotlightBannerConfig = await res.json();
      try {
        localStorage.setItem('vrc_cached_spotlight', JSON.stringify(updated));
      } catch (e) {}

      setFeedback({
        type: 'success',
        message: language === 'vi' ? 'Đã lưu cấu hình banner thành công!' : 'Banner updated successfully!',
      });
      onSaved(updated);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Error saving spotlight:', err);
      const isNetworkLoadFailed = String(err?.message || '').toLowerCase().includes('load failed') || String(err?.message || '').toLowerCase().includes('failed to fetch');
      const friendlyMsg = isNetworkLoadFailed
        ? (language === 'vi' ? 'Không thể kết nối máy chủ. Thay đổi đã được lưu tạm trên thiết bị này.' : 'Network connection issue. Changes saved locally on this device.')
        : (err.message || (language === 'vi' ? 'Lỗi khi lưu banner' : 'Failed to save banner'));

      setFeedback({
        type: 'error',
        message: friendlyMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg">
                {language === 'vi' ? 'Tuỳ Chỉnh Sự Kiện Nổi Bật Trang Chủ' : 'Customize Home Feature Banner'}
              </h3>
              <p className="text-stone-400 text-xs">
                {language === 'vi'
                  ? 'Chọn giao diện màu sắc và chọn sự kiện từ lịch để làm nổi bật'
                  : 'Select visual theme & pick which event to feature'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-stone-700">
          {/* STEP 1: Select Theme - Simplified, Clean Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-serif font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-700" />
                <span>{language === 'vi' ? '1. Chọn Giao Diện Màu Sắc (Theme):' : '1. Select Theme:'}</span>
              </label>
            </div>

            {/* Simpler, compact theme buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = theme === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTheme(opt.key)}
                    className={`px-3 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'border-amber-600 ring-2 ring-amber-500 bg-amber-50/90 text-amber-950 font-bold shadow-xs'
                        : 'border-stone-200 bg-stone-50/80 hover:bg-white text-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base flex-shrink-0">{opt.icon}</span>
                      <span className="text-xs truncate">
                        {language === 'vi' ? opt.labelVi : opt.labelEn}
                      </span>
                    </div>
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${opt.colorDot} ${
                        isSelected ? 'ring-2 ring-white shadow-xs' : 'opacity-60'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Pick Event to Feature */}
          <div className="space-y-2.5 pt-1 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="font-serif font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>{language === 'vi' ? '2. Chọn Sự Kiện Làm Nổi Bật:' : '2. Choose Event to Feature:'}</span>
              </label>
              <span className="text-[10px] text-stone-400 font-medium">
                {language === 'vi' ? 'Chi tiết lấy tự động từ sự kiện' : 'Details come from event'}
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Option: Auto Next Upcoming Event */}
              <div
                onClick={() => setSelectedEventId(null)}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  selectedEventId === null
                    ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-400'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      <Zap className="w-3 h-3 text-amber-700" />
                      <span>{language === 'vi' ? 'Tự Động (Khuyên Dùng)' : 'Auto-Next (Recommended)'}</span>
                    </span>
                  </div>
                  <p className="font-bold text-xs text-stone-900">
                    {language === 'vi'
                      ? 'Luôn tự động hiển thị sự kiện sắp tới gần nhất'
                      : 'Always show the next upcoming event automatically'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {language === 'vi'
                      ? 'Khi sự kiện kết thúc, hệ thống sẽ tự động chuyển sang sự kiện kế tiếp.'
                      : 'When the event ends, automatically updates to the next one.'}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    selectedEventId === null
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'border-stone-300 bg-white'
                  }`}
                >
                  {selectedEventId === null && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              {/* Upcoming Church Events List (Excludes all past events) */}
              {upcomingEvents.length === 0 ? (
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-center space-y-1">
                  <p className="text-xs font-semibold text-stone-700">
                    {language === 'vi' ? 'Hiện chưa có sự kiện sắp tới nào' : 'No upcoming events currently scheduled'}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {language === 'vi'
                      ? 'Hệ thống dùng chế độ "Tự Động" để hiển thị giờ thờ phượng và sinh hoạt thường lệ.'
                      : 'Auto-Next will display weekly Sunday worship and prayer services.'}
                  </p>
                </div>
              ) : (
                upcomingEvents.map((evt) => {
                  const isSelected = selectedEventId === evt.id;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEventId(evt.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-400'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                            {evt.category}
                          </span>
                          <span className="text-[11px] font-bold text-stone-800">
                            {evt.date} • {evt.startTime}
                          </span>
                        </div>
                        <p className="font-serif font-bold text-xs sm:text-sm text-stone-950 truncate">
                          {evt.title}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400 flex-shrink-0" />
                          <span>{evt.location} {evt.address ? `• ${evt.address}` : ''}</span>
                        </p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-amber-600 border-amber-600 text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* STEP 3: Customizable Pill Tag Text */}
          <div className="space-y-1.5 pt-1 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-stone-700">
                {language === 'vi'
                  ? '3. Nội Dung Thẻ Tròn / Pill Badge Text (Tuỳ Chọn):'
                  : '3. Custom Pill Badge Text (Optional):'}
              </label>
              <span className="text-[10px] text-stone-400">
                {language === 'vi' ? 'Hiển thị ở góc trên banner' : 'Top badge on banner'}
              </span>
            </div>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              placeholder={language === 'vi' ? 'e.g. Sự Kiện Nổi Bật, Sunday Worship, Lễ Nhóm Đặc Biệt...' : 'e.g. Featured Event, Sunday Worship, Special Service...'}
            />
            <p className="text-[10px] text-stone-400">
              {language === 'vi'
                ? 'Bạn có thể tuỳ ý kết hợp phong cách màu (theme) với bất kỳ chữ nào trong thẻ pill này.'
                : 'You can freely combine the color theme with any custom pill text.'}
            </p>
          </div>

          {/* STEP 4: Optional Scripture Quote / Subtitle */}
          <div className="space-y-1.5 pt-1 border-t border-stone-100">
            <label className="block text-[11px] font-bold text-stone-700">
              {language === 'vi'
                ? '4. Câu Kinh Thánh Trích Dẫn / Lời Chúc (Tuỳ Chọn):'
                : '4. Optional Scripture Quote or Greeting:'}
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 italic font-serif"
              placeholder='Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"'
            />
            <p className="text-[10px] text-stone-400">
              {language === 'vi'
                ? 'Tiêu đề, mô tả, ngày giờ và nút chỉ đường sẽ lấy trực tiếp từ sự kiện bạn đã chọn ở trên.'
                : 'Title, description, date/time and directions link are automatically populated from the chosen event.'}
            </p>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors"
            >
              {language === 'vi' ? 'Huỷ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu & Áp Dụng' : 'Save & Apply')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
