import React, { useState } from 'react';
import { HeartHandshake, Send, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../utils/api.ts';
import { Modal } from '../common-component/Modal.tsx';

interface PrayerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrayerRequestModal: React.FC<PrayerRequestModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [requesterName, setRequesterName] = useState('');
  const [requestText, setRequestText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) return;

    try {
      const lastSent = Number(localStorage.getItem('vrc_last_prayer_at') || '0');
      const secondsLeft = Math.ceil((60_000 - (Date.now() - lastSent)) / 1000);
      if (secondsLeft > 0) {
        setError(
          language === 'vi'
            ? `Vui lòng đợi ${secondsLeft} giây trước khi gửi lời cầu nguyện tiếp theo.`
            : `Please wait ${secondsLeft} seconds before submitting another prayer request.`
        );
        return;
      }
    } catch {}

    try {
      setSubmitting(true);
      setError('');
      const res = await fetch(apiUrl('/api/prayers'), {
        method: 'POST',
        headers: apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          requesterName: requesterName.trim() || undefined,
          request: requestText.trim(),
        }),
      });

      const raw = await res.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { error: raw || res.statusText };
      }

      if (!res.ok) {
        const detail = data.error || res.statusText || 'Unknown error';
        throw new Error(`Failed to submit prayer request. [HTTP ${res.status}] ${detail}`);
      }

      try {
        localStorage.setItem('vrc_last_prayer_at', String(Date.now()));
      } catch {}

      setSubmitted(true);
      setRequesterName('');
      setRequestText('');
    } catch (err: any) {
      setError(err.message || 'Error submitting prayer request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={<HeartHandshake className="w-5 h-5 text-amber-400" />}
      title={language === 'vi' ? 'Gửi Lời Cầu Nguyện' : 'Submit a Prayer Request'}
      maxWidthClass="max-w-md"
    >
      <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-serif font-bold text-lg text-stone-900">
                {language === 'vi' ? 'Đã Gửi Lời Cầu Nguyện' : 'Prayer Request Received'}
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {language === 'vi'
                  ? 'Hội Thánh và ban mục vụ sẽ hiệp ý cầu nguyện cho bạn.'
                  : 'Our pastoral team and church family will be praying with you.'}
              </p>
              <button
                onClick={handleClose}
                className="mt-2 px-5 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  {language === 'vi' ? 'Tên của bạn (Không bắt buộc)' : 'Your Name (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Để trống nếu muốn ẩn danh...' : 'Leave blank to remain anonymous...'}
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm bg-white text-stone-950 placeholder:text-stone-500 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  {language === 'vi' ? 'Nội Dung Cầu Nguyện *' : 'Prayer Request *'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={language === 'vi' ? 'Chia sẻ điều bạn muốn Hội Thánh cầu nguyện...' : 'Share what you would like us to pray for...'}
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm bg-white text-stone-950 placeholder:text-stone-500 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !requestText.trim()}
                  className="px-5 py-2 bg-stone-950 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {submitting
                      ? (language === 'vi' ? 'Đang gửi...' : 'Sending...')
                      : (language === 'vi' ? 'Gửi Cầu Nguyện' : 'Send Prayer')}
                  </span>
                </button>
              </div>
            </form>
          )}
      </div>
    </Modal>
  );
};
