import React from 'react';
import { KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { AdminUser } from '../../../../types/index.ts';
import type { AdminAccount } from './AdminAccountsTab.tsx';
import { adminAccountsListStyles } from './AdminAccountsList.styles.ts';

interface AdminAccountsListProps {
  adminList: AdminAccount[];
  adminUser: AdminUser | null;
  onReset: (account: AdminAccount) => void;
  onDelete: (id: number, username: string) => void;
}

// Existing admin accounts: display name, username, email, and a badge
// for the logged-in admin's own row. Reset and delete actions only
// show on other admins' rows. Pure presentational — the parent owns
// the list and the reset/delete API calls.
export const AdminAccountsList: React.FC<AdminAccountsListProps> = ({
  adminList,
  adminUser,
  onReset,
  onDelete,
}) => {
  const { t } = useLanguage();

  return (
    <div className={adminAccountsListStyles.listSection}>
      <h4 className={adminAccountsListStyles.sectionTitle}>
        <ShieldCheck className={adminAccountsListStyles.titleIcon} />
        {t('existingAdminsTitle')} ({adminList.length})
      </h4>

      <div className={adminAccountsListStyles.list}>
        {adminList.map((adm) => {
          const isSelf = adminUser?.id === adm.id;
          return (
            <div key={adm.id} className={adminAccountsListStyles.item}>
              <div>
                <div className={adminAccountsListStyles.itemMeta}>
                  <span className={adminAccountsListStyles.displayName}>
                    {adm.displayName}
                  </span>
                  <span className={adminAccountsListStyles.usernameBadge}>
                    @{adm.username}
                  </span>
                  {isSelf && (
                    <span className={adminAccountsListStyles.selfBadge}>
                      {t('commonYourAccount')}
                    </span>
                  )}
                </div>
                <p className={adminAccountsListStyles.email}>{adm.email}</p>
              </div>

              {!isSelf && (
                <div className={adminAccountsListStyles.itemActions}>
                  <button
                    onClick={() => onReset(adm)}
                    className={adminAccountsListStyles.resetBtn}
                    title={t('resetPasswordBtn')}
                  >
                    <KeyRound className={adminAccountsListStyles.resetIcon} />
                  </button>
                  <button
                    onClick={() => onDelete(adm.id, adm.username)}
                    className={adminAccountsListStyles.deleteBtn}
                    title={t('deleteAdminBtn')}
                  >
                    <Trash2 className={adminAccountsListStyles.deleteIcon} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
