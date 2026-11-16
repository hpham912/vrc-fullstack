import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { UserPlus, MessageSquareText } from 'lucide-react';
import { Modal, Button, Banner, TextField } from '../../common-component/index.ts';
import { apiUrl } from '../../utils/api.ts';
import { isValidEmail, isValidName, normalizePhone } from '../../utils/memberValidation.ts';
import { registerModalStyles as s } from './RegisterModal.styles.ts';

// Member registration (2 steps). Step 1: first name, last name, phone,
// optional email, password — validated client-side (names letters only,
// US phone, email shape when provided, password 6+ chars) and again on
// the server. Step 2: the 6-digit code texted to the phone (Twilio SMS).
// On success the member is logged in directly (the verify endpoint
// returns a token).
interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
}) => {
  const { loginWithToken } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setStep(1);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setCode('');
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isValidName(firstName) || !isValidName(lastName)) {
      setError(t('registerNameLettersOnly'));
      return;
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setError(t('registerPhoneInvalid'));
      return;
    }
    // Email is optional: blank is fine, but a provided email must be valid.
    if (email.trim() !== '' && !isValidEmail(email)) {
      setError(t('registerEmailInvalid'));
      return;
    }
    if (password.length < 6) {
      setError(t('registerPasswordShort'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/members/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: normalizedPhone,
          email: email.trim() === '' ? null : email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('registerFailed'));
      setStep(2);
    } catch (err: any) {
      setError(err.message || t('registerFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || !/^\d{6}$/.test(code.trim())) {
      setError(t('registerCodeInvalid'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/members/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('registerFailed'));
      loginWithToken(data.token, data.user);
      onRegisterSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || t('registerFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setError(t('registerPhoneInvalid'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/members/resend-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('registerFailed'));
      setSuccess(data.message || t('registerCodeResent'));
    } catch (err: any) {
      setError(err.message || t('registerFailed'));
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
          {step === 1 ? <UserPlus className="w-5 h-5 text-stone-950" /> : <MessageSquareText className="w-5 h-5 text-stone-950" />}
        </div>
      }
      subtitle={step === 1 ? t('registerSub') : t('registerVerifySub')}
      title={t('registerTitle')}
    >
      {step === 1 ? (
        <form onSubmit={handleRegister} className={s.form}>
          {error && <Banner type="error" message={error} />}

          <div className={s.nameRow}>
            <TextField
              label={t('registerFirstName')}
              value={firstName}
              onChange={setFirstName}
              placeholder={t('registerFirstNamePlaceholder')}
            />
            <TextField
              label={t('registerLastName')}
              value={lastName}
              onChange={setLastName}
              placeholder={t('registerLastNamePlaceholder')}
            />
          </div>

          <TextField
            label={t('registerPhone')}
            value={phone}
            onChange={setPhone}
            placeholder="(480) 555-0199"
          />

          <TextField
            label={t('registerEmail')}
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
          />

          <TextField
            label={t('passwordLabel')}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          <p className={s.hint}>{t('registerHint')}</p>

          <div className={s.footerRow}>
            <Button type="button" variant="secondary" fullWidth onClick={handleClose}>
              {t('commonCancel')}
            </Button>
            <Button type="submit" variant="dark" fullWidth loading={submitting}>
              {submitting ? t('registerSending') : t('registerContinue')}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerify} className={s.form}>
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

          <div className={s.footerRow}>
            <Button type="button" variant="secondary" fullWidth onClick={() => setStep(1)}>
              {t('commonBack')}
            </Button>
            <Button type="submit" variant="dark" fullWidth loading={submitting}>
              {submitting ? t('registerVerifying') : t('registerVerifyBtn')}
            </Button>
          </div>

          <p className={s.resendRow}>
            {t('registerNoCode')}{' '}
            <button type="button" onClick={handleResend} disabled={submitting} className={s.linkBtnInline}>
              {t('registerResendCode')}
            </button>
          </p>
        </form>
      )}
    </Modal>
  );
};
