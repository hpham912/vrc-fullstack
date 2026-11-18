import React, { useEffect, useState } from 'react';
import { KeyRound, Trash2, Users } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../../../utils/api.ts';
import { formatDateLocale } from '../../../../utils/dateFormatter.ts';
import { Member } from '../../../../types/index.ts';
import { Button, Banner, ConfirmModal, Loading, Modal } from '../../../../common-component/index.ts';
import { membersTabStyles as s } from './MembersTab.styles.ts';

interface MembersTabProps {
  getToken: () => string | null;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  // Which tab the parent is showing. The child stays mounted for the
  // whole portal session (returning null when its tab isn't active) and
  // reloads whenever its tab is opened.
  activeTab: string;
}

// Members: the list of registered app users. Shows the total count, and
// per member: reset password (a fresh 6-digit temp code, shown once
// big/centered) and delete. Members self-register — there is no create
// form here.
export const MembersTab: React.FC<MembersTabProps> = ({ getToken, showFeedback, activeTab }) => {
  const { t, language } = useLanguage();
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetTarget, setResetTarget] = useState<Member | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // True while the list is being fetched — the tab shows a spinner
  // instead of the empty text, so a slow load never reads as "no
  // members". Only matters while the list is empty; a reload over
  // existing rows keeps showing them.
  const [loadingList, setLoadingList] = useState(false);

  const loadMembers = async () => {
    const token = getToken();
    if (!token) return;
    setLoadingList(true);
    try {
      const res = await fetch(apiUrl('/api/admin/members'), {
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setMemberList(data);
        setLoadError(null);
      } else {
        setLoadError(t('membersLoadFailed'));
      }
    } catch (err) {
      console.error('Failed to load members:', err);
      setLoadError(t('membersLoadFailed'));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'members') loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (activeTab !== 'members') return null;

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    const token = getToken();
    if (!token) return;
    try {
      setResetting(true);
      const res = await fetch(apiUrl(`/api/admin/members/${resetTarget.id}/reset-password`), {
        method: 'POST',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setResetCode(data.tempCode);
    } catch (err: any) {
      showFeedback('error', err.message || t('membersResetFailed'));
      setResetTarget(null);
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = getToken();
    if (!token) return;
    try {
      setDeleting(true);
      const res = await fetch(apiUrl(`/api/admin/members/${deleteTarget.id}`), {
        method: 'DELETE',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete member');
      showFeedback('success', t('membersDeleted'));
      setDeleteTarget(null);
      loadMembers();
    } catch (err: any) {
      showFeedback('error', err.message || t('membersDeleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    const formatted = formatDateLocale(iso, language);
    return formatted === '' ? '—' : formatted;
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.headerIconBox}>
          <Users className="w-5 h-5 text-stone-950" />
        </div>
        <div>
          <h3 className={s.headerTitle}>{t('membersTitle')}</h3>
          <p className={s.headerSub}>
            {t('membersTotal', { count: memberList.length })}
          </p>
        </div>
      </div>

      {loadError && <Banner type="error" message={loadError} />}

      {loadingList && memberList.length === 0 ? (
        <Loading text={t('loading')} />
      ) : memberList.length === 0 && !loadError ? (
        <p className={s.empty}>{t('membersEmpty')}</p>
      ) : (
        <ul className={s.list}>
          {memberList.map((member) => (
            <li key={member.id} className={s.item}>
              <div className={s.itemMain}>
                <p className={s.itemName}>
                  {member.firstName} {member.lastName}
                </p>
                <p className={s.itemMeta}>{member.phone}</p>
                {member.email ? <p className={s.itemMeta}>{member.email}</p> : null}
                <p className={s.itemMeta}>
                  {t('membersJoined', { date: formatDate(member.createdAt) })}
                  {' • '}
                  {member.phoneVerified ? t('membersVerified') : t('membersUnverified')}
                </p>
              </div>
              <div className={s.itemActions}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setResetTarget(member)}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {t('membersResetPassword')}
                </Button>
                <Button
                  type="button"
                  variant="dangerLight"
                  size="sm"
                  onClick={() => setDeleteTarget(member)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('commonDelete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Reset password confirm */}
      <ConfirmModal
        isOpen={resetTarget !== null && resetCode === null}
        title={t('membersResetTitle', { name: resetTarget ? `${resetTarget.firstName} ${resetTarget.lastName}` : '' })}
        message={t('membersResetConfirm')}
        confirmText={t('membersResetPassword')}
        cancelText={t('commonCancel')}
        loading={resetting}
        onConfirm={handleResetPassword}
        onCancel={() => setResetTarget(null)}
      />

      {/* Temp code — shown once, big and centered */}
      <Modal
        isOpen={resetCode !== null}
        onClose={() => {
          setResetCode(null);
          setResetTarget(null);
        }}
        maxWidthClass="max-w-sm"
        title={t('membersTempCodeTitle')}
        subtitle={t('membersTempCodeSub')}
      >
        <div className={s.codeWrap}>
          <div className={s.codeBox}>{resetCode}</div>
          <p className={s.codeHint}>{t('membersTempCodeHint')}</p>
          <Button
            type="button"
            variant="dark"
            fullWidth
            onClick={() => {
              setResetCode(null);
              setResetTarget(null);
            }}
          >
            {t('commonDone')}
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title={t('membersDeleteTitle', { name: deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : '' })}
        message={t('membersDeleteConfirm')}
        confirmText={t('commonDelete')}
        cancelText={t('commonCancel')}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
