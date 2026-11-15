import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { User, KeyRound } from 'lucide-react';
import { Modal, Button, Banner, TextField } from '../../common-component/index.ts';
import { loginModalStyles as s } from './LoginModal.styles.ts';

// Shared login for admins and members. The identifier may be an admin
// username, an email, or a US phone number — the server checks the
// right table. Admins see the admin view; members only view.
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onOpenRegister: () => void;
  onOpenForgotPassword: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenRegister,
  onOpenForgotPassword,
}) => {
  const { login, loading } = useAuth();
  const { t } = useLanguage();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!identifier.trim() || !password.trim()) {
      setError(t('loginFillBoth'));
      return;
    }

    try {
      await login(identifier.trim(), password.trim());
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || t('loginFailed'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-sm"
      icon={
        <div className={s.headerIconBox}>
          <User className="w-5 h-5 text-stone-950" />
        </div>
      }
      subtitle={t('loginSub')}
      title={t('loginTitle')}
    >
      {/* Form Body */}
      <form onSubmit={handleSubmit} className={s.form}>
        {error && (
          <Banner type="error" message={error} />
        )}

        <TextField
          label={t('loginIdentifierLabel')}
          icon={User}
          value={identifier}
          onChange={setIdentifier}
          placeholder={t('loginIdentifierPlaceholder')}
          required
          autoComplete="username"
        />

        <TextField
          label={t('passwordLabel')}
          icon={KeyRound}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        <button type="button" onClick={onOpenForgotPassword} className={s.linkBtn}>
          {t('loginForgotPassword')}
        </button>

        <div className={s.footerRow}>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            {t('commonCancel')}
          </Button>
          <Button
            type="submit"
            variant="dark"
            fullWidth
            loading={loading}
          >
            {loading ? t('loginAuthenticating') : t('loginBtn')}
          </Button>
        </div>

        <p className={s.registerRow}>
          {t('loginNoAccount')}{' '}
          <button type="button" onClick={onOpenRegister} className={s.linkBtnInline}>
            {t('loginRegisterLink')}
          </button>
        </p>
      </form>
    </Modal>
  );
};
