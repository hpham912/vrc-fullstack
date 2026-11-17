import React from 'react';
import { UserPlus } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { Button, Banner } from '../../../../common-component/index.ts';
import { provisionAdminFormStyles } from './ProvisionAdminForm.styles.ts';

interface ProvisionAdminFormProps {
  username: string;
  password: string;
  displayName: string;
  email: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  submitting: boolean;
  isDirty: boolean;
  createSuccess: string | null;
  createError: string | null;
  onDismissCreateError: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

// Provision a new admin account: username, password, email (optional),
// and display name. Pure presentational — the parent owns the field
// state and the create-admin API call.
export const ProvisionAdminForm: React.FC<ProvisionAdminFormProps> = ({
  username,
  password,
  displayName,
  email,
  onUsernameChange,
  onPasswordChange,
  onDisplayNameChange,
  onEmailChange,
  submitting,
  isDirty,
  createSuccess,
  createError,
  onDismissCreateError,
  onSubmit,
}) => {
  const { t } = useLanguage();

  return (
    <form onSubmit={onSubmit} className={provisionAdminFormStyles.createForm}>
      <div>
        <h3 className={provisionAdminFormStyles.formTitle}>
          <UserPlus className={provisionAdminFormStyles.titleIconAmber} />
          {t('newAdminTitle')}
        </h3>
        <p className={provisionAdminFormStyles.formDesc}>
          {t('newAdminDesc')}
        </p>
      </div>

      <div className={provisionAdminFormStyles.formGrid}>
        <div>
          <label className={provisionAdminFormStyles.label}>
            {t('usernameLabel')} *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. pastor_david"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className={provisionAdminFormStyles.input}
          />
        </div>

        <div>
          <label className={provisionAdminFormStyles.label}>
            {t('passwordLabel')} *
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={provisionAdminFormStyles.input}
          />
        </div>

        <div>
          <label className={provisionAdminFormStyles.label}>
            {t('displayNameLabel')} *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Mục sư David Nguyễn"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            className={provisionAdminFormStyles.input}
          />
        </div>

        <div>
          <label className={provisionAdminFormStyles.label}>
            {t('emailLabel')} (Optional)
          </label>
          <input
            type="email"
            placeholder="pastor@vrcfamily.org"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={provisionAdminFormStyles.input}
          />
        </div>
      </div>

      <div className={provisionAdminFormStyles.submitRow}>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={submitting}
          disabled={submitting || !isDirty}
        >
          {submitting ? t('commonCreating') : t('createAdminBtn')}
        </Button>
        {createSuccess && (
          <Banner type="success" message={createSuccess} className="md:hidden mt-2" />
        )}
        {createError && (
          <Banner
            type="error"
            message={createError}
            className="md:hidden mt-2"
            onDismiss={onDismissCreateError}
          />
        )}
      </div>
    </form>
  );
};
