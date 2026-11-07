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
  const { language, t } = useLanguage();
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
        setError(t('prayerWait', { seconds: secondsLeft }));
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
      title={t('prayerRequestTitle')}
      maxWidthClass="max-w-md"
    >
      <div className={s.body}>
        {submitted ? (
          <div className={s.successWrapper}>
            <CheckCircle2 className={s.successIcon} />
            <h4 className={s.successTitle}>
              {t('prayerReceived')}
            </h4>
            <p className={s.successSub}>
              {t('prayerReceivedSub')}
            </p>
            <button
              onClick={handleClose}
              className={s.successCloseBtn}
            >
              {t('commonClose')}
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
                {t('prayerNameLabel')}
              </label>
              <input
                type="text"
                placeholder={t('prayerNamePlaceholder')}
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className={s.input}
              />
            </div>

            <div>
              <label className={s.label}>
                {t('prayerContentLabel')}
              </label>
              <textarea
                rows={4}
                required
                placeholder={t('prayerContentPlaceholder')}
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
                {t('commonCancel')}
              </Button>
              <Button
                type="submit"
                variant="dark"
                disabled={submitting || !requestText.trim()}
                leftIcon={<Send className="w-3.5 h-3.5 text-amber-400" />}
              >
                <span>
                  {submitting
                    ? t('prayerSending')
                    : t('prayerSend')}
                </span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
