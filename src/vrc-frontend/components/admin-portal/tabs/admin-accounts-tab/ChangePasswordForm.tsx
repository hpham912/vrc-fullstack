import React from 'react';
import { KeyRound } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { Button, Banner } from '../../../../common-component/index.ts';
import { changePasswordFormStyles } from './ChangePasswordForm.styles.ts';

interface ChangePasswordFormProps {
  adminUsername: string | undefined;
  oldPassword: string;
  newPassword: string;
  onOldPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  submitting: boolean;
  isDirty: boolean;
  passwordSuccess: string | null;
  passwordError: string | null;
  onDismissPasswordError: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

// Change the logged-in admin's own password: current password, new
// password, and a save button. Pure presentational — the parent owns
// the field state and the change-password API call.
export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  adminUsername,
  oldPassword,
  newPassword,
  onOldPasswordChange,
  onNewPasswordChange,
  submitting,
  isDirty,
  passwordSuccess,
  passwordError,
  onDismissPasswordError,
  onSubmit,
}) => {
  const { t } = useLanguage();

  return (
    <form onSubmit={onSubmit} className={changePasswordFormStyles.passwordForm}>
      <h4 className={changePasswordFormStyles.sectionTitle}>
        <KeyRound className={changePasswordFormStyles.titleIconMuted} />
        {t('changePasswordTitle')} ({adminUsername})
      </h4>

      <div className={changePasswordFormStyles.formGrid}>
        <div>
          <label className={changePasswordFormStyles.labelSemibold}>
            {t('oldPasswordLabel')} *
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={oldPassword}
            onChange={(e) => onOldPasswordChange(e.target.value)}
            className={changePasswordFormStyles.inputSm}
          />
        </div>

        <div>
          <label className={changePasswordFormStyles.labelSemibold}>
            {t('newPasswordLabel')} *
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            className={changePasswordFormStyles.inputSm}
          />
        </div>
      </div>

      <div className={changePasswordFormStyles.submitRowRight}>
        <Button
          type="submit"
          variant="dark"
          size="md"
          loading={submitting}
          disabled={submitting || !isDirty}
        >
          {submitting ? t('commonSaving') : t('updatePasswordBtn')}
        </Button>
        {passwordSuccess && (
          <Banner type="success" message={passwordSuccess} className="md:hidden mt-2" />
        )}
        {passwordError && (
          <Banner
            type="error"
            message={passwordError}
            className="md:hidden mt-2"
            onDismiss={onDismissPasswordError}
          />
        )}
      </div>
    </form>
  );
};
