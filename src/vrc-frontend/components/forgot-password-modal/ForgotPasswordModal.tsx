import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { KeyRound, MessageSquareText } from 'lucide-react';
import { Modal, Button, Banner, TextField } from '../../common-component/index.ts';
import { apiUrl } from '../../utils/api.ts';
import { normalizePhone } from '../../utils/memberValidation.ts';
import { forgotPasswordModalStyles as s } from './ForgotPasswordModal.styles.ts';

// Member self-service password reset (2 steps). Step 1: the member's
// phone number — a 6-digit code is texted to it (Twilio SMS). Step 2:
// the code + a new password. On success the member logs in again from
// the login screen (the reset does not log them in by itself).
interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setStep(1);
    setPhone('');
    setCode('');
    setNewPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setError(t('registerPhoneInvalid'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/members/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('forgotFailed'));
      setStep(2);
    } catch (err: any) {
      setError(err.message || t('forgotFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || !/^\d{6}$/.test(code.trim())) {
      setError(t('registerCodeInvalid'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('registerPasswordShort'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/members/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          code: code.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('forgotFailed'));
      setSuccess(data.message || t('forgotSuccess'));
      // Give the member a moment to read the success message, then
      // close back to the login screen.
      window.setTimeout(handleClose, 1500);
    } catch (err: any) {
      setError(err.message || t('forgotFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidthClass="max-w-sm"
      icon={
        <div className={s.headerIconBox}>
          {step === 1 ? <KeyRound className="w-5 h-5 text-stone-950" /> : <MessageSquareText className="w-5 h-5 text-stone-950" />}
        </div>
      }
      subtitle={step === 1 ? t('forgotSub') : t('forgotVerifySub')}
      title={t('forgotTitle')}
    >
      {step === 1 ? (
        <form onSubmit={handleSendCode} className={s.form}>
          {error && <Banner type="error" message={error} />}

          <TextField
            label={t('registerPhone')}
            value={phone}
            onChange={setPhone}
            placeholder="(480) 555-0199"
          />

          <div className={s.footerRow}>
            <Button type="button" variant="secondary" fullWidth onClick={handleClose}>
              {t('commonCancel')}
            </Button>
            <Button type="submit" variant="dark" fullWidth loading={submitting}>
              {submitting ? t('forgotSending') : t('forgotSendCode')}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleReset} className={s.form}>
          {error && <Banner type="error" message={error} />}
          {success && <Banner type="success" message={success} />}

          <p className={s.codeHint}>
            {t('registerCodeSentTo')} <strong>{phone}</strong>
          </p>

          <TextField
            label={t('registerCode')}
            value={code}
            onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
          />

          <TextField
            label={t('forgotNewPassword')}
            value={newPassword}
            onChange={setNewPassword}
            placeholder="••••••••"
          />

          <div className={s.footerRow}>
            <Button type="button" variant="secondary" fullWidth onClick={() => setStep(1)}>
              {t('commonBack')}
            </Button>
            <Button type="submit" variant="dark" fullWidth loading={submitting}>
              {submitting ? t('forgotResetting') : t('forgotResetBtn')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
