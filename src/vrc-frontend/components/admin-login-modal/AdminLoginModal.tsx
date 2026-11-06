import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { User, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
import { Modal, Button } from '../../common-component/index.ts';
import { adminLoginModalStyles as s } from './AdminLoginModal.styles.ts';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { login, loading } = useAuth();
  const { t, language } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError(language === 'vi' ? 'Vui lòng nhập tên đăng nhập và mật khẩu' : 'Please enter your username and password');
      return;
    }

    try {
      await login(username.trim(), password.trim());
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || (language === 'vi' ? 'Đăng nhập không thành công' : 'Login failed'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-sm"
      icon={
        <div className={s.headerIconBox}>
          <ShieldCheck className="w-5 h-5 text-stone-950" />
        </div>
      }
      subtitle={t('loginSub')}
      title={t('loginTitle')}
    >
      {/* Form Body */}
      <form onSubmit={handleSubmit} className={s.form}>
        {error && (
          <div className={s.errorBox}>
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className={s.label}>
            {t('usernameLabel')}
          </label>
          <div className={s.inputWrapper}>
            <User className={s.inputIcon} />
            <input
              type="text"
              required
              placeholder="vrcadmin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={s.input}
            />
          </div>
        </div>

        <div>
          <label className={s.label}>
            {t('passwordLabel')}
          </label>
          <div className={s.inputWrapper}>
            <KeyRound className={s.inputIcon} />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={s.input}
            />
          </div>
        </div>

        <div className={s.footerRow}>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            {language === 'vi' ? 'Hủy' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            variant="dark"
            fullWidth
            disabled={loading}
          >
            {loading ? (language === 'vi' ? 'Đang xác thực...' : 'Authenticating...') : t('loginBtn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
