import React, { useState, useEffect } from 'react';
import { ChurchEvent, ChurchInfo, SpotlightBannerConfig, SpotlightTheme } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../utils/api.ts';
import {
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Palette,
  Zap,
  Check,
} from 'lucide-react';
import { Modal, Button } from '../../common-component/index.ts';
import { spotlightBannerModalStyles as s } from './SpotlightBannerModal.styles.ts';

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

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const upcomingEvents = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  useEffect(() => {
    if (isOpen) {
      setTheme(initialConfig?.theme || 'thanksgiving');
      const existingId = initialConfig?.selectedEventId ?? null;
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
        headers: apiHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-xl"
      icon={<Sparkles className={s.headerIcon} />}
      subtitle={
        language === 'vi'
          ? 'Chọn giao diện màu sắc và chọn sự kiện từ lịch để làm nổi bật'
          : 'Select visual theme & pick which event to feature'
      }
      title={language === 'vi' ? 'Tuỳ Chỉnh Sự Kiện Nổi Bật Trang Chủ' : 'Customize Home Feature Banner'}
    >
      {/* Feedback message */}
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
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className={s.form}>
          {/* STEP 1: Select Theme */}
          <div className={s.stepBlock}>
            <div className={s.stepHeader}>
              <label className={s.stepLabel}>
                <Palette className={s.paletteIcon} />
                <span>{language === 'vi' ? '1. Chọn Giao Diện Màu Sắc (Theme):' : '1. Select Theme:'}</span>
              </label>
            </div>

            <div className={s.themeGrid}>
              {THEME_OPTIONS.map((opt) => {
                const isSelected = theme === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTheme(opt.key)}
                    className={`${s.themeBtnBase} ${
                      isSelected ? s.themeBtnSelected : s.themeBtnIdle
                    }`}
                  >
                    <div className={s.themeBtnContent}>
                      <span className={s.themeBtnIcon}>{opt.icon}</span>
                      <span className={s.themeBtnText}>
                        {language === 'vi' ? opt.labelVi : opt.labelEn}
                      </span>
                    </div>
                    <div
                      className={`${s.colorDotBase} ${opt.colorDot} ${
                        isSelected ? s.colorDotSelected : s.colorDotIdle
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Pick Event to Feature */}
          <div className={s.stepBlockDivider}>
            <div className={s.stepHeader}>
              <label className={s.stepLabel}>
                <Calendar className={s.calendarIcon} />
                <span>{language === 'vi' ? '2. Chọn Sự Kiện Làm Nổi Bật:' : '2. Choose Event to Feature:'}</span>
              </label>
              <span className={s.stepHint}>
                {language === 'vi' ? 'Chi tiết lấy tự động từ sự kiện' : 'Details come from event'}
              </span>
            </div>

            <div className={s.eventList}>
              {/* Option: Auto Next Upcoming Event */}
              <div
                onClick={() => setSelectedEventId(null)}
                className={`${s.eventOptionBase} ${
                  selectedEventId === null ? s.eventOptionSelected : s.eventOptionIdle
                }`}
              >
                <div className={s.autoInfoGroup}>
                  <div className={s.autoBadgeWrap}>
                    <span className={s.autoBadge}>
                      <Zap className={s.zapIcon} />
                      <span>{language === 'vi' ? 'Tự Động (Khuyên Dùng)' : 'Auto-Next (Recommended)'}</span>
                    </span>
                  </div>
                  <p className={s.autoTitle}>
                    {language === 'vi'
                      ? 'Luôn tự động hiển thị sự kiện sắp tới gần nhất'
                      : 'Always show the next upcoming event automatically'}
                  </p>
                  <p className={s.autoSubtitle}>
                    {language === 'vi'
                      ? 'Khi sự kiện kết thúc, hệ thống sẽ tự động chuyển sang sự kiện kế tiếp.'
                      : 'When the event ends, automatically updates to the next one.'}
                  </p>
                </div>
                <div
                  className={`${s.radioCircleBase} ${
                    selectedEventId === null ? s.radioCircleSelected : s.radioCircleIdle
                  }`}
                >
                  {selectedEventId === null && <Check className={s.checkIcon} />}
                </div>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className={s.emptyEventsBox}>
                  <p className={s.emptyEventsTitle}>
                    {language === 'vi' ? 'Hiện chưa có sự kiện sắp tới nào' : 'No upcoming events currently scheduled'}
                  </p>
                  <p className={s.emptyEventsSubtitle}>
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
                      className={`${s.eventOptionBase} ${
                        isSelected ? s.eventOptionSelected : s.eventOptionIdle
                      }`}
                    >
                      <div className={s.eventItemLeft}>
                        <div className={s.eventMetaRow}>
                          <span className={s.eventCategoryBadge}>
                            {evt.category}
                          </span>
                          <span className={s.eventDateTime}>
                            {evt.date} • {evt.startTime}
                          </span>
                        </div>
                        <p className={s.eventItemTitle}>{evt.title}</p>
                        <p className={s.eventItemLocation}>
                          <MapPin className={s.mapPinSm} />
                          <span>{evt.location} {evt.address ? `• ${evt.address}` : ''}</span>
                        </p>
                      </div>

                      <div
                        className={`${s.radioCircleBase} ${
                          isSelected ? s.radioCircleSelected : s.radioCircleIdle
                        }`}
                      >
                        {isSelected && <Check className={s.checkIcon} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* STEP 3: Customizable Pill Tag Text */}
          <div className={s.inputSectionDivider}>
            <div className={s.stepHeader}>
              <label className={s.fieldLabel}>
                {language === 'vi'
                  ? '3. Nội Dung Thẻ Tròn / Pill Badge Text (Tuỳ Chọn):'
                  : '3. Custom Pill Badge Text (Optional):'}
              </label>
              <span className={s.fieldHint}>
                {language === 'vi' ? 'Hiển thị ở góc trên banner' : 'Top badge on banner'}
              </span>
            </div>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              className={s.inputMedium}
              placeholder={language === 'vi' ? 'e.g. Sự Kiện Nổi Bật, Sunday Worship, Lễ Nhóm Đặc Biệt...' : 'e.g. Featured Event, Sunday Worship, Special Service...'}
            />
            <p className={s.fieldHint}>
              {language === 'vi'
                ? 'Bạn có thể tuỳ ý kết hợp phong cách màu (theme) với bất kỳ chữ nào trong thẻ pill này.'
                : 'You can freely combine the color theme with any custom pill text.'}
            </p>
          </div>

          {/* STEP 4: Optional Scripture Quote / Subtitle */}
          <div className={s.inputSectionDivider}>
            <label className={s.fieldLabel}>
              {language === 'vi'
                ? '4. Câu Kinh Thánh Trích Dẫn / Lời Chúc (Tuỳ Chọn):'
                : '4. Optional Scripture Quote or Greeting:'}
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={s.inputItalicSerif}
              placeholder='Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"'
            />
            <p className={s.fieldHint}>
              {language === 'vi'
                ? 'Tiêu đề, mô tả, ngày giờ và nút chỉ đường sẽ lấy trực tiếp từ sự kiện bạn đã chọn ở trên.'
                : 'Title, description, date/time and directions link are automatically populated from the chosen event.'}
            </p>
          </div>

          {/* Footer Submit Buttons */}
          <div className={s.footer}>
            <Button type="button" variant="secondary" onClick={onClose}>
              {language === 'vi' ? 'Huỷ' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              leftIcon={<Save className={s.saveIcon} />}
            >
              <span>{saving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu & Áp Dụng' : 'Save & Apply')}</span>
            </Button>
          </div>
        </form>
    </Modal>
  );
};
