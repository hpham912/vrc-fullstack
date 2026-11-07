import React from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { adminActionButtonsStyles as s } from './AdminActionButtons.styles.ts';

interface AdminActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  stopPropagation?: boolean;
  className?: string;
}

export const AdminActionButtons: React.FC<AdminActionButtonsProps> = ({
  onEdit,
  onDelete,
  stopPropagation = true,
  className = '',
}) => {
  const { language, t } = useLanguage();

  return (
    <div className={`${s.group} ${className}`.trim()}>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            if (stopPropagation) e.stopPropagation();
            onEdit();
          }}
          className={s.editBtn}
          title={t('commonEdit')}
        >
          <Pencil className={s.editIcon} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            if (stopPropagation) e.stopPropagation();
            onDelete();
          }}
          className={s.deleteBtn}
          title={t('commonDelete')}
        >
          <Trash2 className={s.deleteIcon} />
        </button>
      )}
    </div>
  );
};

interface AdminAddButtonProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export const AdminAddButton: React.FC<AdminAddButtonProps> = ({
  onClick,
  title,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${s.addBtn} ${className}`.trim()}
      title={title}
    >
      <Plus className={s.addIcon} />
    </button>
  );
};
