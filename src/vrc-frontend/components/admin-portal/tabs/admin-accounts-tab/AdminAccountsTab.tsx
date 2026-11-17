import React, { useEffect, useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../../../utils/api.ts';
import { AdminUser } from '../../../../types/index.ts';
import { Button, ConfirmModal, Modal } from '../../../../common-component/index.ts';
import { ProvisionAdminForm } from './ProvisionAdminForm.tsx';
import { AdminAccountsList } from './AdminAccountsList.tsx';
import { ChangePasswordForm } from './ChangePasswordForm.tsx';
import { adminAccountsTabStyles as s } from './AdminAccountsTab.styles.ts';

export interface AdminAccount {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
}

interface AdminAccountsTabProps {
  getToken: () => string | null;
  adminUser: AdminUser | null;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  // Which tab the parent is showing. The child stays mounted for the
  // whole portal session (returning null when its tab isn't active) and
  // reloads whenever its tab is opened, exactly as before the split.
  activeTab: string;
}

// Admin accounts shell: owns ALL state and API logic (provision, list,
// reset, delete, change password) and passes props down to the three
// child components. The reset-confirm and temporary-code modals stay
// here because they are driven by the shell's reset state.
export const AdminAccountsTab: React.FC<AdminAccountsTabProps> = ({ getToken, adminUser, showFeedback, activeTab }) => {
  const { t } = useLanguage();
  const [adminList, setAdminList] = useState<AdminAccount[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminDisplayName, setNewAdminDisplayName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Success messages shown below each save button (mobile only) after
  // the action completes. One per form — the two forms share the
  // submitting flag but are separate actions. Clears after 4s.
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  // Error messages shown below each save button (mobile only) when the
  // action fails. Unlike success, they do NOT auto-hide.
  const [createError, setCreateError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const saveSuccessTimeout = useRef<number | null>(null);

  // Dirty-check: the Create and Change Password buttons stay disabled
  // until the admin has typed something (these are creation/change
  // forms, so the baseline is an empty form).
  const isCreateDirty =
    newAdminUsername.trim() !== '' ||
    newAdminPassword.trim() !== '' ||
    newAdminDisplayName.trim() !== '' ||
    newAdminEmail.trim() !== '';
  const isPasswordDirty = oldPassword !== '' || newPassword !== '';
  const [resetTarget, setResetTarget] = useState<AdminAccount | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetCode, setResetCode] = useState<string | null>(null);

  const loadAdminAccounts = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/auth/admins'), {
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setAdminList(data);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername.trim() || !newAdminPassword.trim() || !newAdminDisplayName.trim()) {
      showFeedback('error', t('adminFillFields'));
      return;
    }

    try {
      setSubmitting(true);
      setCreateSuccess(null);
      setCreateError(null);
      if (saveSuccessTimeout.current) {
        window.clearTimeout(saveSuccessTimeout.current);
        saveSuccessTimeout.current = null;
      }
      const token = getToken();
      const res = await fetch(apiUrl('/api/auth/create-admin'), {
        method: 'POST',
        headers: apiHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify({
          username: newAdminUsername.trim(),
          password: newAdminPassword.trim(),
          displayName: newAdminDisplayName.trim(),
          email: newAdminEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin');

      const createdMessage = t('adminCreated', { username: newAdminUsername });
      showFeedback('success', createdMessage);
      setCreateSuccess(createdMessage);
      saveSuccessTimeout.current = window.setTimeout(() => setCreateSuccess(null), 4000);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminDisplayName('');
      setNewAdminEmail('');
      loadAdminAccounts();
    } catch (err: any) {
      showFeedback('error', err.message);
      setCreateError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Admin Account handler
  const handleDeleteAdmin = async (id: number, username: string) => {
    if (!window.confirm(t('adminDeleteConfirm', { username }))) return;

    try {
      const token = getToken();
      const res = await fetch(apiUrl(`/api/auth/admins/${id}`), {
        method: 'DELETE',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete admin');

      showFeedback('success', t('adminDeleted'));
      loadAdminAccounts();
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // Reset another admin's password to a random 6-digit temporary code.
  // On success the code is shown in a modal (stays open until closed)
  // so the resetting admin can share it with the reset admin.
  const handleResetPassword = async () => {
    if (!resetTarget) return;

    try {
      setResetting(true);
      const token = getToken();
      const res = await fetch(apiUrl(`/api/auth/admins/${resetTarget.id}/reset-password`), {
        method: 'POST',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setResetCode(data.tempCode);
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setResetting(false);
    }
  };

  // Close the temporary-code modal after a reset.
  const closeResetCode = () => {
    setResetCode(null);
    setResetTarget(null);
  };

  // Change Password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    try {
      setSubmitting(true);
      setPasswordSuccess(null);
      setPasswordError(null);
      if (saveSuccessTimeout.current) {
        window.clearTimeout(saveSuccessTimeout.current);
        saveSuccessTimeout.current = null;
      }
      const token = getToken();
      const res = await fetch(apiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: apiHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed');

      showFeedback('success', t('adminPasswordUpdated'));
      setPasswordSuccess(t('adminPasswordUpdated'));
      saveSuccessTimeout.current = window.setTimeout(() => setPasswordSuccess(null), 4000);
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      showFeedback('error', err.message);
      setPasswordError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin-accounts') {
      loadAdminAccounts();
    }
  }, [activeTab]);

  if (activeTab !== 'admin-accounts') return null;

  return (
    <div className={s.container}>
      <ProvisionAdminForm
        username={newAdminUsername}
        password={newAdminPassword}
        displayName={newAdminDisplayName}
        email={newAdminEmail}
        onUsernameChange={setNewAdminUsername}
        onPasswordChange={setNewAdminPassword}
        onDisplayNameChange={setNewAdminDisplayName}
        onEmailChange={setNewAdminEmail}
        submitting={submitting}
        isDirty={isCreateDirty}
        createSuccess={createSuccess}
        createError={createError}
        onDismissCreateError={() => setCreateError(null)}
        onSubmit={handleCreateAdmin}
      />

      <AdminAccountsList
        adminList={adminList}
        adminUser={adminUser}
        onReset={setResetTarget}
        onDelete={handleDeleteAdmin}
      />

      <ChangePasswordForm
        adminUsername={adminUser?.username}
        oldPassword={oldPassword}
        newPassword={newPassword}
        onOldPasswordChange={setOldPassword}
        onNewPasswordChange={setNewPassword}
        submitting={submitting}
        isDirty={isPasswordDirty}
        passwordSuccess={passwordSuccess}
        passwordError={passwordError}
        onDismissPasswordError={() => setPasswordError(null)}
        onSubmit={handleChangePassword}
      />

      {/* Confirm resetting another admin's password to a random code */}
      <ConfirmModal
        isOpen={resetTarget !== null && resetCode === null}
        title={t('adminResetPasswordTitle')}
        message={
          resetTarget
            ? t('adminResetPasswordMessage', { username: resetTarget.username })
            : ''
        }
        confirmText={t('resetPasswordBtn')}
        isDanger
        loading={resetting}
        onConfirm={handleResetPassword}
        onCancel={() => setResetTarget(null)}
      />

      {/* Temporary code shown after a reset — stays open until closed
          so the resetting admin can share it with the reset admin */}
      <Modal
        isOpen={resetCode !== null}
        onClose={closeResetCode}
        maxWidthClass="max-w-sm"
        icon={<KeyRound className={s.resetIcon} />}
        title={t('adminResetPasswordCodeTitle')}
      >
        <div className={s.codeBody}>
          <p className={s.codeMessage}>
            {resetTarget
              ? t('adminResetPasswordCodeMessage', { username: resetTarget.username })
              : ''}
          </p>
          <div className={s.codeBox}>{resetCode}</div>
          <div className={s.codeFooter}>
            <Button type="button" variant="dark" onClick={closeResetCode}>
              {t('commonClose')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
