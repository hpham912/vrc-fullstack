import React from 'react';
import { ChurchInfo } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Building2 } from 'lucide-react';
import { Modal } from '../../common-component/index.ts';
import { ChurchInfoForm } from '../church-info-form/ChurchInfoForm.tsx';
import { editChurchInfoModalStyles as s } from './EditChurchInfoModal.styles.ts';

interface EditChurchInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchInfo?: ChurchInfo | null;
  onSaved: (updated: ChurchInfo) => void;
}

// Thin wrapper: the form itself lives in the shared ChurchInfoForm,
// also used by the AdminPortal Church Info tab.
export const EditChurchInfoModal: React.FC<EditChurchInfoModalProps> = ({
  isOpen,
  onClose,
  churchInfo,
  onSaved,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleSaved = (saved: ChurchInfo) => {
    onSaved(saved);
    window.setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      icon={<Building2 className={s.headerIcon} />}
      subtitle={t('churchInfoSubtitle')}
      title={t('churchInfoTitle')}
    >
      <div className={s.body}>
        <ChurchInfoForm
          churchInfo={churchInfo}
          onSaved={handleSaved}
          onCancel={onClose}
        />
      </div>
    </Modal>
  );
};
