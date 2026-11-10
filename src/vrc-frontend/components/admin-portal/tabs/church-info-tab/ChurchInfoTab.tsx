import React from 'react';
import { ChurchInfo } from '../../../../types/index.ts';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { Building2 } from 'lucide-react';
import { ChurchInfoForm } from '../../../church-info-form/ChurchInfoForm.tsx';
import { churchInfoTabStyles as s } from './ChurchInfoTab.styles.ts';

interface ChurchInfoTabProps {
  // Which tab the parent is showing. The child stays mounted for the
  // whole portal session (returning null when its tab isn't active).
  activeTab: string;
  churchInfo?: ChurchInfo | null;
  onRefreshData: () => void;
}

// Church Info (sanctuary) tab — the main info of the church:
// sanctuary name, address, contact, Zoom, and the weekly worship
// schedule. The form is the shared ChurchInfoForm, also used by the
// Edit Church Info modal on Home.
export const ChurchInfoTab: React.FC<ChurchInfoTabProps> = ({
  activeTab,
  churchInfo,
  onRefreshData,
}) => {
  const { t } = useLanguage();

  if (activeTab !== 'church-info') return null;

  const handleSaved = (_saved: ChurchInfo) => {
    // Reload the app data so Home (and the Zoom button) pick up the
    // new church info right away.
    onRefreshData();
  };

  return (
    <div className={s.container}>
      <div className={s.headerRow}>
        <h3 className={s.title}>
          <Building2 className={s.titleIcon} />
          <span>{t('tabChurchInfo')}</span>
        </h3>
      </div>
      <p className={s.subtitle}>{t('churchInfoSubtitle')}</p>

      <ChurchInfoForm churchInfo={churchInfo} onSaved={handleSaved} />
    </div>
  );
};
