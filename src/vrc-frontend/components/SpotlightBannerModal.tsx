import React, { useState } from 'react';
import { ChurchEvent, SpotlightBannerConfig, SpotlightTheme } from '../types/index.ts';
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
  onSaved: (updated: SpotlightBannerConfig) => void;
}

interface ThemeOption {
  key: SpotlightTheme;
  labelVi: string;
  labelEn: string;
  icon: string;
  descVi: string;
  descEn: string;
  swatchClasses: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    key: 'thanksgiving',
    labelVi: 'Lễ Tạ Ơn (Thanksgiving)',
    labelEn: 'Thanksgiving',
    icon: '🍂',
    descVi: 'Sắc vàng hổ phách ấm áp & tri ân',
    descEn: 'Warm amber & golden glow',
    swatchClasses: 'from-amber-600 via-orange-600 to-amber-900 border-amber-400',
  },
  {
    key: 'christmas',
    labelVi: 'Lễ Giáng Sinh (Christmas)',
    labelEn: 'Christmas',
    icon: '🎄',
    descVi: 'Đỏ thẫm, xanh thông & ánh sáng Giáng Sinh',
    descEn: 'Crimson, pine emerald & golden light',
    swatchClasses: 'from-red-600 via-rose-700 to-emerald-900 border-red-400',
  },
  {
    key: 'easter',
    labelVi: 'Đại Lễ Phục Sinh (Easter)',
    labelEn: 'Easter',
    icon: '✝️',
    descVi: 'Tím hoàng gia & ánh bình minh vinh hiển',
    descEn: 'Royal purple & dawn radiance',
    swatchClasses: 'from-purple-700 via-indigo-800 to-amber-700 border-purple-400',
  },
  {
    key: 'revival',
    labelVi: 'Đại Hội Bồi Linh (Revival)',
    labelEn: 'Revival',
    icon: '🔥',
    descVi: 'Ngọn lửa Thánh Linh & xanh thẳm quyền năng',
    descEn: 'Holy Spirit flame & deep cobalt',
    swatchClasses: 'from-blue-700 via-indigo-900 to-rose-600 border-blue-400',
  },
  {
    key: 'special',
    labelVi: 'Giới Trẻ (Youth & Young Adults)',
    labelEn: 'Youth',
    icon: '🌿',
    descVi: 'Xanh ngọc lục bảo trẻ trung & năng động',
    descEn: 'Vibrant emerald & youthful energy',
    swatchClasses: 'from-emerald-600 via-teal-800 to-amber-700 border-emerald-400',
  },
  {
    key: 'default',
    labelVi: 'Cổ Điển Hội Thánh (Classic)',
    labelEn: 'Classic',
    icon: '🏛️',
    descVi: 'Phong cách tối giản sang trọng, truyền thống',
    descEn: 'Timeless dark slate & warm amber',
    swatchClasses: 'from-stone-900 via-stone-800 to-amber-900 border-stone-600',
  },
];

export const SpotlightBannerModal: React.FC<SpotlightBannerModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
  events = [],
  onSaved,
}) => {
  const { getToken } = useAuth();
  const { language } = useLanguage();

  const [theme, setTheme] = useState<SpotlightTheme>(initialConfig?.theme || 'thanksgiving');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    initialConfig?.selectedEventId ?? null
  );
  const [subtitle, setSubtitle] = useState(
    initialConfig?.subtitle || 'Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"'
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setFeedback(null);
      const token = getToken();

      // Find selected event to pull details
      const pickedEvt = selectedEventId
        ? events.find((e) => e.id === selectedEventId)
        : null;

      const payload: Partial<SpotlightBannerConfig> = {
        mode: selectedEventId ? 'event' : 'auto',
        selectedEventId: selectedEventId || null,
        isActive: true,
        theme,
        subtitle: subtitle.trim(),
        title: pickedEvt ? pickedEvt.title : (initialConfig?.title || 'Hội Thánh Phục Hưng Việt Nam'),
        description: pickedEvt ? pickedEvt.description : (initialConfig?.description || 'Thân mời quý tôi con Chúa cùng gia quyến đến thờ phượng Chúa.'),
        dateTag: pickedEvt ? `${pickedEvt.date} • ${pickedEvt.startTime}` : (initialConfig?.dateTag || 'Chúa Nhật Hàng Tuần • 3:00 PM'),
        locationTag: pickedEvt ? (pickedEvt.location || 'Tempe, Arizona') : (initialConfig?.locationTag || 'Tempe, Arizona • Main Sanctuary'),
        customAddress: pickedEvt ? (pickedEvt.address || pickedEvt.location || 'Tempe, Arizona') : (initialConfig?.customAddress || 'Tempe, Arizona'),
        primaryBtnText: 'Xem Sự Kiện',
        primaryBtnAction: 'events',
        secondaryBtnText: 'Chỉ Đường',
        secondaryBtnUrl: `https://maps.google.com/?q=${encodeURIComponent(
          pickedEvt?.address || pickedEvt?.location || initialConfig?.customAddress || 'Tempe Arizona'
        )}`,
      };

      const res = await fetch(apiUrl('/api/spotlight'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update spotlight banner');
      }

      const updated: SpotlightBannerConfig = await res.json();
      setFeedback({
        type: 'success',
        message: language === 'vi' ? 'Đã lưu cấu hình banner thành công!' : 'Banner updated successfully!',
      });
      onSaved(updated);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving spotlight:', err);
      setFeedback({
        type: 'error',
        message: err.message || (language === 'vi' ? 'Lỗi khi lưu banner' : 'Failed to save banner'),
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
          {/* STEP 1: Select Theme / Visual Style (Combined Theme & Gradient) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-serif font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-700" />
                <span>{language === 'vi' ? '1. Chọn Giao Diện Màu Sắc (Theme):' : '1. Select Visual Theme:'}</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-0.5">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = theme === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTheme(opt.key)}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'border-amber-600 ring-2 ring-amber-500 bg-amber-50/80 shadow-xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{opt.icon}</span>
                      <div
                        className={`w-4 h-4 rounded-full bg-gradient-to-br ${opt.swatchClasses} border shadow-2xs`}
                      />
                    </div>
                    <p className={`font-bold text-xs leading-snug ${isSelected ? 'text-amber-950' : 'text-stone-900'}`}>
                      {language === 'vi' ? opt.labelVi : opt.labelEn}
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                      {language === 'vi' ? opt.descVi : opt.descEn}
                    </p>
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

              {/* Church Events List */}
              {events.map((evt) => {
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
                    <div className="space-y-1 min-w-0">
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
              })}
            </div>
          </div>

          {/* STEP 3: Optional Scripture Quote / Subtitle */}
          <div className="space-y-1.5 pt-1 border-t border-stone-100">
            <label className="block text-[11px] font-bold text-stone-700">
              {language === 'vi'
                ? '3. Câu Kinh Thánh Trích Dẫn / Lời Chúc (Tuỳ Chọn):'
                : '3. Optional Scripture Quote or Greeting:'}
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
