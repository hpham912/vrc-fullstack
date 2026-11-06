import React, { useState } from 'react';
import { HeartHandshake, Send, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../utils/api.ts';
import { Modal, Button } from '../../common-component/index.ts';
import { prayerRequestModalStyles as s } from './PrayerRequestModal.styles.ts';

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
      <div className={s.body}>
        {submitted ? (
          <div className={s.successWrapper}>
            <CheckCircle2 className={s.successIcon} />
            <h4 className={s.successTitle}>
              {language === 'vi' ? 'Đã Gửi Lời Cầu Nguyện' : 'Prayer Request Received'}
            </h4>
            <p className={s.successSub}>
              {language === 'vi'
                ? 'Hội Thánh và ban mục vụ sẽ hiệp ý cầu nguyện cho bạn.'
                : 'Our pastoral team and church family will be praying with you.'}
            </p>
            <button
              onClick={handleClose}
              className={s.successCloseBtn}
            >
              {language === 'vi' ? 'Đóng' : 'Close'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={s.form}>
            {error && (
              <div className={s.errorBox}>
                {error}
              </div>
            )}

            <div>
              <label className={s.label}>
                {language === 'vi' ? 'Tên của bạn (Không bắt buộc)' : 'Your Name (Optional)'}
              </label>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Để trống nếu muốn ẩn danh...' : 'Leave blank to remain anonymous...'}
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className={s.input}
              />
            </div>

            <div>
              <label className={s.label}>
                {language === 'vi' ? 'Nội Dung Cầu Nguyện *' : 'Prayer Request *'}
              </label>
              <textarea
                rows={4}
                required
                placeholder={language === 'vi' ? 'Chia sẻ điều bạn muốn Hội Thánh cầu nguyện...' : 'Share what you would like us to pray for...'}
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                className={s.textarea}
              />
            </div>

            <div className={s.footerRow}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                variant="dark"
                disabled={submitting || !requestText.trim()}
                leftIcon={<Send className="w-3.5 h-3.5 text-amber-400" />}
              >
                <span>
                  {submitting
                    ? (language === 'vi' ? 'Đang gửi...' : 'Sending...')
                    : (language === 'vi' ? 'Gửi Cầu Nguyện' : 'Send Prayer')}
                </span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
