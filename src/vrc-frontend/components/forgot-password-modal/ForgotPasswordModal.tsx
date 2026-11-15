import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { KeyRound, MailCheck } from 'lucide-react';
import { Modal, Button, Banner, TextField } from '../../common-component/index.ts';
import { apiUrl } from '../../utils/api.ts';
import { isValidEmail } from '../../utils/memberValidation.ts';
import { forgotPasswordModalStyles as s } from './ForgotPasswordModal.styles.ts';

// Member self-service password reset (2 steps). Step 1: the member's
// email — a 6-digit code is sent to it. Step 2: the code + a new
// password. On success the member logs in again from the login screen
// (the reset does not log them in by itself).
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
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setStep(1);
    setEmail('');
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

    if (!isValidEmail(email)) {
      setError(t('registerEmailInvalid'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/members/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
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

    if (!/^\d{6}$/.test(code.trim())) {
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
          email: email.trim().toLowerCase(),
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
          {step === 1 ? <KeyRound className="w-5 h-5 text-stone-950" /> : <MailCheck className="w-5 h-5 text-stone-950" />}
        </div>
      }
      subtitle={step === 1 ? t('forgotSub') : t('forgotVerifySub')}
      title={t('forgotTitle')}
    >
      {step === 1 ? (
        <form onSubmit={handleSendCode} className={s.form}>
          {error && <Banner type="error" message={error} />}

          <TextField
            label={t('registerEmail')}
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
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
            {t('registerCodeSentTo')} <strong>{email.trim().toLowerCase()}</strong>
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
