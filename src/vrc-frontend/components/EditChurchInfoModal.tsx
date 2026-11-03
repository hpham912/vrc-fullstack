import React, { useState } from 'react';
import { ChurchInfo, WeeklyService, DEFAULT_CHURCH_INFO } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { apiUrl } from '../utils/api.ts';
import { CrossIcon } from './CrossIcon.tsx';
import {
  X,
  Save,
  MapPin,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Building2,
  Plus,
  Trash2,
} from 'lucide-react';

interface EditChurchInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchInfo?: ChurchInfo | null;
  onSaved: (updated: ChurchInfo) => void;
}

export const EditChurchInfoModal: React.FC<EditChurchInfoModalProps> = ({
  isOpen,
  onClose,
  churchInfo,
  onSaved,
}) => {
  const { getToken } = useAuth();
  const { language } = useLanguage();

  const safeInfo = churchInfo || DEFAULT_CHURCH_INFO;

  const [sanctuaryName, setSanctuaryName] = useState(safeInfo.sanctuaryName || 'Hội Thánh Phục Hưng Việt Nam • Tempe Sanctuary');
  const [address, setAddress] = useState(safeInfo.address || 'Tempe, Arizona');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    safeInfo.googleMapsUrl || 'https://maps.google.com/?q=Tempe+Arizona'
  );
  const [phone, setPhone] = useState(safeInfo.phone || '(480) 555-0199');
  const [email, setEmail] = useState(safeInfo.email || 'contact@vnrevivalchurch.org');
  const [regionDescVi, setRegionDescVi] = useState(
    safeInfo.regionDescVi || 'Phục vụ cộng đồng người Việt tại Tempe, Phoenix, Mesa, Chandler & Gilbert'
  );
  const [regionDescEn, setRegionDescEn] = useState(
    safeInfo.regionDescEn || 'Serving Vietnamese communities across Phoenix East Valley'
  );

  const [services, setServices] = useState<WeeklyService[]>(
    safeInfo.services ? [...safeInfo.services] : [...DEFAULT_CHURCH_INFO.services]
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state whenever modal is opened or churchInfo prop changes
  React.useEffect(() => {
    if (isOpen) {
      const current = churchInfo || DEFAULT_CHURCH_INFO;
      setSanctuaryName(current.sanctuaryName || 'Hội Thánh Phục Hưng Việt Nam • Tempe Sanctuary');
      setAddress(current.address || 'Tempe, Arizona');
      setGoogleMapsUrl(current.googleMapsUrl || 'https://maps.google.com/?q=Tempe+Arizona');
      setPhone(current.phone || '(480) 555-0199');
      setEmail(current.email || 'contact@vnrevivalchurch.org');
      setRegionDescVi(current.regionDescVi || 'Phục vụ cộng đồng người Việt tại Tempe, Phoenix, Mesa, Chandler & Gilbert');
      setRegionDescEn(current.regionDescEn || 'Serving Vietnamese communities across Phoenix East Valley');
      setServices(current.services ? JSON.parse(JSON.stringify(current.services)) : [...DEFAULT_CHURCH_INFO.services]);
    }
  }, [isOpen, churchInfo]);

  if (!isOpen) return null;

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    setGoogleMapsUrl(`https://maps.google.com/?q=${encodeURIComponent(newAddress.trim())}`);
  };

  const handleAddService = () => {
    setServices((prev) => [
      ...prev,
      {
        id: `service-${Date.now()}`,
        titleVi: '',
        titleEn: '',
        time: '',
        timeEn: '',
        descVi: '',
        descEn: '',
      },
    ]);
  };

  const handleDeleteService = (index: number) => {
    setServices((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Convert Vietnamese day string to English
  const translateVietnameseDayToEnglish = (timeStr: string) => {
    const parts = timeStr.split('•');
    const day = (parts[0] || '').trim();
    const time = parts.slice(1).join('•').trim();
    let engDay = day;
    const lower = day.toLowerCase();
    if (lower.includes('chúa nhật') || lower.includes('chua nhat')) engDay = 'Sunday';
    else if (lower.includes('thứ hai') || lower.includes('thu hai')) engDay = 'Monday';
    else if (lower.includes('thứ ba') || lower.includes('thu ba')) engDay = 'Tuesday';
    else if (lower.includes('thứ tư') || lower.includes('thu tu')) engDay = 'Wednesday';
    else if (lower.includes('thứ năm') || lower.includes('thu nam')) engDay = 'Thursday';
    else if (lower.includes('thứ sáu') || lower.includes('thu sau')) engDay = 'Friday';
    else if (lower.includes('thứ bảy') || lower.includes('thu bay')) engDay = 'Saturday';
    return time ? `${engDay} • ${time}` : engDay;
  };

  const updateServiceField = (index: number, field: keyof WeeklyService, value: string) => {
    setServices((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // If updating 'time' in Vietnamese and 'timeEn' is empty, auto-populate timeEn with English day
      if (field === 'time' && !updated[index].timeEn) {
        updated[index].timeEn = translateVietnameseDayToEnglish(value);
      }
      return updated;
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanctuaryName.trim() || !address.trim()) {
      setFeedback({
        type: 'error',
        message: language === 'vi' ? 'Vui lòng nhập tên nhà nguyện và địa chỉ' : 'Please provide sanctuary name and address',
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const token = getToken();

      // Ensure all services have valid English day/times populated
      const processedServices = services.map((s) => ({
        ...s,
        titleEn: s.titleEn?.trim() || s.titleVi.trim(),
        timeEn: (s.timeEn && s.timeEn.trim() && !s.timeEn.toLowerCase().includes('thứ') && !s.timeEn.toLowerCase().includes('chúa nhật'))
          ? s.timeEn.trim()
          : translateVietnameseDayToEnglish(s.time),
        descEn: s.descEn?.trim() || s.descVi.trim(),
      }));

      const payload: Partial<ChurchInfo> = {
        sanctuaryName: sanctuaryName.trim(),
        address: address.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        phone: phone.trim(),
        email: email.trim(),
        regionDescVi: regionDescVi.trim(),
        regionDescEn: regionDescEn.trim(),
        services: processedServices,
      };

      const res = await fetch(apiUrl('/api/church-info'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update church information');
      }

      const savedData: ChurchInfo = await res.json();
      try {
        localStorage.setItem('vrc_cached_church_info', JSON.stringify(savedData));
      } catch (e) {
        console.warn('Could not write church info to localStorage:', e);
      }
      setFeedback({
        type: 'success',
        message: language === 'vi' ? 'Đã lưu thông tin nhà nguyện & lịch nhóm thành công!' : 'Sanctuary & worship schedule saved successfully!',
      });
      onSaved(savedData);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving church info:', err);
      setFeedback({
        type: 'error',
        message: err.message || (language === 'vi' ? 'Lỗi khi lưu thông tin' : 'Error saving details'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg">
                {language === 'vi' ? 'Cập Nhật Địa Điểm & Lịch Thờ Phượng' : 'Sanctuary Location & Worship Times'}
              </h3>
              <p className="text-stone-400 text-xs">
                {language === 'vi' ? 'Chỉnh sửa thông tin xuất hiện trên trang chủ' : 'Customize sanctuary location and service times on Home'}
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

        {/* Feedback alert */}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-stone-700">
          {/* Section 1: Sanctuary Location & Directions */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-3">
            <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-700" />
              <span>{language === 'vi' ? 'Địa Điểm Nhà Nguyện (Sanctuary)' : 'Sanctuary Location'}</span>
            </h4>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-600">
                {language === 'vi' ? 'Tên Nhà Nguyện / Tiêu Đề' : 'Sanctuary Name'}
              </label>
              <input
                type="text"
                value={sanctuaryName}
                onChange={(e) => setSanctuaryName(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                placeholder="Hội Thánh Phục Hưng Việt Nam • Tempe Sanctuary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-600">
                  {language === 'vi' ? 'Địa Chỉ / Thành Phố' : 'Street Address / City, State'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  placeholder="Tempe, Arizona"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-600 flex items-center justify-between">
                  <span>{language === 'vi' ? 'Đường Dẫn Google Maps' : 'Google Maps URL'}</span>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:underline flex items-center gap-0.5 text-[10px]"
                  >
                    <span>{language === 'vi' ? 'Thử mở' : 'Test'}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <input
                  type="text"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="https://maps.google.com/?q=Tempe+Arizona"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-600">
                  {language === 'vi' ? 'Số Điện Thoại Liên Lạc' : 'Contact Phone'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="(480) 555-0199"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-600">
                  {language === 'vi' ? 'Email Hội Thánh' : 'Church Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="contact@vnrevivalchurch.org"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Weekly Service Times (Dynamic Add / Delete List) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>{language === 'vi' ? 'Lịch Nhóm & Thờ Phượng Hàng Tuần' : 'Weekly Worship Services & Gatherings'}</span>
              </h4>
              <button
                type="button"
                onClick={handleAddService}
                className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold border border-amber-200 transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === 'vi' ? '+ Thêm Buổi Nhóm' : '+ Add Service'}</span>
              </button>
            </div>

            {services.length === 0 ? (
              <div className="p-6 rounded-2xl bg-stone-50 border border-dashed border-stone-300 text-center space-y-2">
                <p className="text-xs font-medium text-stone-600">
                  {language === 'vi'
                    ? 'Chưa có buổi nhóm nào. Thẻ lịch thờ phượng trên Trang Chủ sẽ tự động ẩn.'
                    : 'No weekly services added. The schedule card on Home will be hidden.'}
                </p>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Thêm Buổi Nhóm Mới' : 'Add New Service'}</span>
                </button>
              </div>
            ) : (
              services.map((svc, idx) => (
                <div key={svc.id || idx} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                      <CrossIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>#{idx + 1}: {svc.titleVi || (language === 'vi' ? 'Buổi nhóm mới' : 'New Service')}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(idx)}
                      className="px-2 py-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      title="Xoá buổi nhóm này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Xoá' : 'Delete'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-stone-500">
                        {language === 'vi' ? 'Tên buổi nhóm (Tiếng Việt)' : 'Service Name (Vietnamese)'}
                      </label>
                      <input
                        type="text"
                        value={svc.titleVi}
                        onChange={(e) => updateServiceField(idx, 'titleVi', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs font-semibold"
                        placeholder="Lễ Thờ Phượng Chúa Nhật"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-stone-500">
                          {language === 'vi' ? 'Thời gian (Ví dụ: Chúa Nhật • 3:00 PM – 5:00 PM)' : 'Day & Time (Vietnamese)'}
                        </label>
                      </div>
                      <input
                        type="text"
                        value={svc.time}
                        onChange={(e) => updateServiceField(idx, 'time', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs font-semibold text-amber-800"
                        placeholder="Chúa Nhật • 3:00 PM – 5:00 PM"
                      />
                    </div>
                  </div>

                  {/* English Translation row for Service */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-stone-500">
                        {language === 'vi' ? 'Tên buổi nhóm (Tiếng Anh - English)' : 'Service Name (English)'}
                      </label>
                      <input
                        type="text"
                        value={svc.titleEn || ''}
                        onChange={(e) => updateServiceField(idx, 'titleEn', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs"
                        placeholder="Sunday Worship Service"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-stone-500">
                        {language === 'vi' ? 'Thời gian Tiếng Anh (English Day & Time)' : 'Day & Time in English'}
                      </label>
                      <input
                        type="text"
                        value={svc.timeEn || ''}
                        onChange={(e) => updateServiceField(idx, 'timeEn', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs font-semibold text-indigo-700"
                        placeholder="Sunday • 3:00 PM – 5:00 PM"
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-stone-500">
                      {language === 'vi' ? 'Mô tả tóm tắt' : 'Description'}
                    </label>
                    <textarea
                      rows={2}
                      value={svc.descVi}
                      onChange={(e) => updateServiceField(idx, 'descVi', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs leading-relaxed"
                      placeholder="Tôn vinh Chúa, cầu nguyện và lắng nghe Lời Chúa..."
                    />
                  </div>
                </div>
              ))
            )}
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
              <span>{saving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
