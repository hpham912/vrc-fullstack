import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../../../utils/api.ts';
import { AdminUser } from '../../../../types/index.ts';
import { Button, ConfirmModal, Modal } from '../../../../common-component/index.ts';
import { adminAccountsTabStyles as s } from './AdminAccountsTab.styles.ts';

interface AdminAccount {
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

// Admin accounts: provision new admins, list existing ones, and change the
// logged-in admin's password. Owns its own list + form state and its own
// submitting flag. The parent only renders this tab when it is active, so
// loading on mount is the same as loading when the tab is opened.
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

      showFeedback('success', t('adminCreated', { username: newAdminUsername }));
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminDisplayName('');
      setNewAdminEmail('');
      loadAdminAccounts();
    } catch (err: any) {
      showFeedback('error', err.message);
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
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      showFeedback('error', err.message);
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
      {/* Provision New Admin Account Form */}
      <form onSubmit={handleCreateAdmin} className={s.createForm}>
        <div>
          <h3 className={s.formTitle}>
            <UserPlus className={s.titleIconAmber} />
            {t('newAdminTitle')}
          </h3>
          <p className={s.formDesc}>
            {t('newAdminDesc')}
          </p>
        </div>

        <div className={s.formGrid}>
          <div>
            <label className={s.label}>
              {t('usernameLabel')} *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. pastor_david"
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
              className={s.input}
            />
          </div>

          <div>
            <label className={s.label}>
              {t('passwordLabel')} *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              className={s.input}
            />
          </div>

          <div>
            <label className={s.label}>
              {t('displayNameLabel')} *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mục sư David Nguyễn"
              value={newAdminDisplayName}
              onChange={(e) => setNewAdminDisplayName(e.target.value)}
              className={s.input}
            />
          </div>

          <div>
            <label className={s.label}>
              {t('emailLabel')} (Optional)
            </label>
            <input
              type="email"
              placeholder="pastor@vrcfamily.org"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className={s.input}
            />
          </div>
        </div>

        <div className={s.submitRow}>
          <button
            type="submit"
            disabled={submitting || !isCreateDirty}
            className={s.createBtn}
          >
            {submitting ? t('commonCreating') : t('createAdminBtn')}
          </button>
        </div>
      </form>

      {/* Existing Admin Accounts List */}
      <div className={s.listSection}>
        <h4 className={s.sectionTitle}>
          <ShieldCheck className={s.titleIcon} />
          {t('existingAdminsTitle')} ({adminList.length})
        </h4>

        <div className={s.list}>
          {adminList.map((adm) => {
            const isSelf = adminUser?.id === adm.id;
            return (
              <div key={adm.id} className={s.item}>
                <div>
                  <div className={s.itemMeta}>
                    <span className={s.displayName}>
                      {adm.displayName}
                    </span>
                    <span className={s.usernameBadge}>
                      @{adm.username}
                    </span>
                    {isSelf && (
                      <span className={s.selfBadge}>
                        {t('commonYourAccount')}
                      </span>
                    )}
                  </div>
                  <p className={s.email}>{adm.email}</p>
                </div>

                {!isSelf && (
                  <div className={s.itemActions}>
                    <button
                      onClick={() => setResetTarget(adm)}
                      className={s.resetBtn}
                      title={t('resetPasswordBtn')}
                    >
                      <KeyRound className={s.resetIcon} />
                    </button>
                    <button
                      onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                      className={s.deleteBtn}
                      title={t('deleteAdminBtn')}
                    >
                      <Trash2 className={s.deleteIcon} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Change Password for Currently Logged-in Admin */}
      <form onSubmit={handleChangePassword} className={s.passwordForm}>
        <h4 className={s.sectionTitle}>
          <KeyRound className={s.titleIconMuted} />
          {t('changePasswordTitle')} ({adminUser?.username})
        </h4>

        <div className={s.formGrid}>
          <div>
            <label className={s.labelSemibold}>
              {t('oldPasswordLabel')} *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className={s.inputSm}
            />
          </div>

          <div>
            <label className={s.labelSemibold}>
              {t('newPasswordLabel')} *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={s.inputSm}
            />
          </div>
        </div>

        <div className={s.submitRowRight}>
          <button
            type="submit"
            disabled={submitting || !isPasswordDirty}
            className={s.updateBtn}
          >
            {t('updatePasswordBtn')}
          </button>
        </div>
      </form>

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
