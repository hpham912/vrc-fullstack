// Weekly worship services editor — the list of weekly services with
// add/delete/edit. Extracted from ChurchInfoForm so the form stays a
// shell: the parent owns the services state and the handlers, and this
// component only renders the section. The service rows are bilingual
// (Vietnamese then English) for name and time; the description is
// Vietnamese-only (English falls back to it on save).
import React from 'react';
import { WeeklyService } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { CrossIcon } from '../cross-icon/CrossIcon.tsx';
import { Clock, Plus } from 'lucide-react';
import { Card, Button, AdminActionButtons, AdminAddButton, TextField } from '../../common-component/index.ts';
import { weeklyServicesEditorStyles } from './WeeklyServicesEditor.styles.ts';

interface WeeklyServicesEditorProps {
  services: WeeklyService[];
  onAdd: () => void;
  onDelete: (index: number) => void;
  onUpdateField: (index: number, field: keyof WeeklyService, value: string) => void;
}

export const WeeklyServicesEditor: React.FC<WeeklyServicesEditorProps> = ({
  services,
  onAdd,
  onDelete,
  onUpdateField,
}) => {
  const { t } = useLanguage();

  return (
    <div className={weeklyServicesEditorStyles.servicesSection}>
      <div className={weeklyServicesEditorStyles.servicesHeader}>
        <h4 className={weeklyServicesEditorStyles.sectionTitle}>
          <Clock className={weeklyServicesEditorStyles.clockIcon} />
          <span>{t('churchInfoSchedule')}</span>
        </h4>
        <AdminAddButton
          onClick={onAdd}
          title={t('churchInfoAddService')}
        />
      </div>

      {services.length === 0 ? (
        <Card variant="subtle" padding="lg" className="border-dashed text-center space-y-2">
          <p className={weeklyServicesEditorStyles.emptyServicesText}>
            {t('churchInfoNoServices')}
          </p>
          <Button
            type="button"
            variant="dark"
            size="sm"
            onClick={onAdd}
            leftIcon={<Plus className={weeklyServicesEditorStyles.plusIconSm} />}
          >
            <span>{t('churchInfoAddServiceNew')}</span>
          </Button>
        </Card>
      ) : (
        services.map((svc, idx) => (
          <Card key={svc.id || idx} variant="subtle" padding="sm" className="space-y-2.5">
            <div className={weeklyServicesEditorStyles.serviceCardHeader}>
              <span className={weeklyServicesEditorStyles.serviceCardTitle}>
                <CrossIcon className={weeklyServicesEditorStyles.serviceCrossIcon} />
                <span>#{idx + 1}: {svc.titleVi || t('churchInfoNewService')}</span>
              </span>
              <AdminActionButtons
                onDelete={() => onDelete(idx)}
              />
            </div>

            <div className={weeklyServicesEditorStyles.fieldGroup}>
              <span className={weeklyServicesEditorStyles.fieldLabel}>{t('churchInfoServiceNameLabel')}</span>
              <TextField
                label={t('commonLangVi')}
                value={svc.titleVi}
                onChange={(value) => onUpdateField(idx, 'titleVi', value)}
                placeholder="Lễ Thờ Phượng Chúa Nhật"
              />
              <TextField
                label={t('commonLangEn')}
                value={svc.titleEn || ''}
                onChange={(value) => onUpdateField(idx, 'titleEn', value)}
                placeholder="Sunday Worship Service"
              />
            </div>

            <div className={weeklyServicesEditorStyles.fieldGroup}>
              <span className={weeklyServicesEditorStyles.fieldLabel}>{t('churchInfoServiceTimeLabel')}</span>
              <TextField
                label={t('commonLangVi')}
                value={svc.time}
                onChange={(value) => onUpdateField(idx, 'time', value)}
                placeholder="Chúa Nhật • 3:00 PM – 5:00 PM"
              />
              <TextField
                label={t('commonLangEn')}
                value={svc.timeEn || ''}
                onChange={(value) => onUpdateField(idx, 'timeEn', value)}
                placeholder="Sunday • 3:00 PM – 5:00 PM"
              />
            </div>

            <div className={weeklyServicesEditorStyles.subFieldGroup}>
              <label className={weeklyServicesEditorStyles.subLabel}>
                {t('churchInfoDesc')}
              </label>
              <textarea
                rows={2}
                value={svc.descVi}
                onChange={(e) => onUpdateField(idx, 'descVi', e.target.value)}
                className={weeklyServicesEditorStyles.serviceTextarea}
                placeholder="Tôn vinh Chúa, cầu nguyện và lắng nghe Lời Chúa..."
              />
            </div>
          </Card>
        ))
      )}
    </div>
  );
};
