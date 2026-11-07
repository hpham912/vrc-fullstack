import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Modal } from '../modal/Modal.tsx';
import { Button } from '../button/Button.tsx';
import { confirmModalStyles as s } from './ConfirmModal.styles.ts';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = true,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { language, t } = useLanguage();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidthClass="max-w-sm"
      icon={
        <div
          className={`${s.iconBase} ${isDanger ? s.iconDanger : s.iconWarning}`}
        >
          <AlertTriangle className={s.alertIcon} />
        </div>
      }
      title={title}
    >
      <div className={s.body}>
        <p className={s.message}>{message}</p>

        <div className={s.footer}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText || t('commonCancel')}
          </Button>
          <Button
            type="button"
            variant={isDanger ? 'danger' : 'dark'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t('commonProcessing') : confirmText || t('commonConfirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
