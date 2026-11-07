import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../../utils/api.ts';
import { AdminUser } from '../../../types/index.ts';

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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Provision New Admin Account Form */}
      <form onSubmit={handleCreateAdmin} className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-4">
        <div>
          <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-700" />
            {t('newAdminTitle')}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {t('newAdminDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('usernameLabel')} *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. pastor_david"
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('passwordLabel')} *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('displayNameLabel')} *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mục sư David Nguyễn"
              value={newAdminDisplayName}
              onChange={(e) => setNewAdminDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('emailLabel')} (Optional)
            </label>
            <input
              type="email"
              placeholder="pastor@vnrevivalchurch.org"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
            />
          </div>
        </div>

        <div className="pt-1 text-right">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            {submitting ? t('commonCreating') : t('createAdminBtn')}
          </button>
        </div>
      </form>

      {/* Existing Admin Accounts List */}
      <div className="space-y-3">
        <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-stone-700" />
          {t('existingAdminsTitle')} ({adminList.length})
        </h4>

        <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
          {adminList.map((adm) => {
            const isSelf = adminUser?.id === adm.id;
            return (
              <div key={adm.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-xs sm:text-sm">
                      {adm.displayName}
                    </span>
                    <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                      @{adm.username}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        {t('commonYourAccount')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">{adm.email}</p>
                </div>

                {!isSelf && (
                  <button
                    onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title={t('deleteAdminBtn')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Change Password for Currently Logged-in Admin */}
      <form onSubmit={handleChangePassword} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
        <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-stone-600" />
          {t('changePasswordTitle')} ({adminUser?.username})
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {t('oldPasswordLabel')} *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {t('newPasswordLabel')} *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>
        </div>

        <div className="text-right pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            {t('updatePasswordBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};
