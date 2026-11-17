import React from 'react';
import { Clock, PenTool } from 'lucide-react';
import { WeeklyService } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Button, Card } from '../../common-component/index.ts';
import { CrossIcon } from '../cross-icon/CrossIcon.tsx';
import { worshipScheduleCardStyles } from './WorshipScheduleCard.styles.ts';

export interface WorshipScheduleCardProps {
  services: WeeklyService[];
  isAdmin: boolean;
  onOpenChurchInfoEditor?: () => void;
}

// The "Weekly Worship Services & Gatherings" card on Home: one row per
// service with its day badge, time, title, and description. Admins get
// an Edit button that opens the church info editor.
export const WorshipScheduleCard: React.FC<WorshipScheduleCardProps> = ({
  services,
  isAdmin,
  onOpenChurchInfoEditor,
}) => {
  const { language, t } = useLanguage();

  if (!services || services.length === 0) return null;

  return (
    <Card as="section" variant="default" padding="md" className="space-y-3.5">
      <div className={worshipScheduleCardStyles.servicesCardHeader}>
        <h2 className={worshipScheduleCardStyles.sectionHeading}>
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className={worshipScheduleCardStyles.labelFull}>{t('homeWeeklyServices')}</span>
          <span className={worshipScheduleCardStyles.labelShort}>{t('homeWeeklyServicesShort')}</span>
        </h2>
        {isAdmin && onOpenChurchInfoEditor && (
          <Button
            type="button"
            variant="amberLight"
            size="xs"
            onClick={onOpenChurchInfoEditor}
            leftIcon={<PenTool className="w-3 h-3" />}
          >
            <span className="hidden sm:inline">{t('homeEditSchedule')}</span>
          </Button>
        )}
      </div>

      <div className={worshipScheduleCardStyles.servicesUnifiedList}>
        {services.map((svc, idx) => {
          const { dayPart, hourPart } = getServiceTimeParts(svc, language);
          const serviceTitle =
            language === 'vi'
              ? svc.titleVi
              : svc.titleEn?.trim() || (svc.titleVi || '');
          const serviceDesc =
            language === 'vi'
              ? svc.descVi
              : svc.descEn?.trim() || (svc.descVi || '');

          return (
            <div key={svc.id || idx} className={worshipScheduleCardStyles.serviceItemCol}>
              <div className={worshipScheduleCardStyles.serviceCardTopRow}>
                <span className={worshipScheduleCardStyles.serviceDayBadge}>
                  <CrossIcon className="w-2.5 h-2.5 text-amber-700" />
                  <span>{dayPart}</span>
                </span>
                {hourPart && (
                  <span className={worshipScheduleCardStyles.serviceHourText}>{hourPart}</span>
                )}
              </div>
              <h3 className={worshipScheduleCardStyles.serviceTitle}>{serviceTitle}</h3>
              {serviceDesc && (
                <p className={worshipScheduleCardStyles.serviceDesc}>{serviceDesc}</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Helper function to format service day & hours bilingually
function getServiceTimeParts(
  svc: { time: string; timeEn?: string; titleVi: string; titleEn?: string },
  lang: 'vi' | 'en'
) {
  const rawTime = (lang === 'en' && svc.timeEn?.trim()) ? svc.timeEn : svc.time;
  if (!rawTime) return { dayPart: '', hourPart: '' };

  let dayPart = '';
  let hourPart = '';

  if (rawTime.includes('•')) {
    const parts = rawTime.split('•');
    dayPart = (parts[0] || '').trim();
    hourPart = (parts.slice(1).join('•') || '').trim();
  } else if (rawTime.includes(' - ') && (rawTime.includes('AM') || rawTime.includes('PM'))) {
    // Split on day vs time range
    const match = rawTime.match(/^([^\d]+)([\d\s:–\-APMapm]+)$/);
    if (match) {
      dayPart = match[1].trim();
      hourPart = match[2].trim();
    } else {
      dayPart = rawTime.trim();
      hourPart = '';
    }
  } else {
    dayPart = rawTime.trim();
    hourPart = '';
  }

  if (lang === 'en') {
    const dayLower = dayPart.toLowerCase();
    if (dayLower.includes('chúa nhật') || dayLower.includes('chua nhat') || dayLower.includes('cn')) {
      dayPart = 'Sunday';
    } else if (dayLower.includes('thứ sáu') || dayLower.includes('thu sau') || dayLower.includes('thứ 6') || dayLower.includes('thu 6') || dayLower.includes('friday')) {
      dayPart = 'Friday';
    } else if (dayLower.includes('thứ tư') || dayLower.includes('thu tu') || dayLower.includes('thứ 4') || dayLower.includes('thu 4') || dayLower.includes('wednesday')) {
      dayPart = 'Wednesday';
    } else if (dayLower.includes('thứ hai') || dayLower.includes('thu hai') || dayLower.includes('thứ 2') || dayLower.includes('thu 2') || dayLower.includes('monday')) {
      dayPart = 'Monday';
    } else if (dayLower.includes('thứ ba') || dayLower.includes('thu ba') || dayLower.includes('thứ 3') || dayLower.includes('thu 3') || dayLower.includes('tuesday')) {
      dayPart = 'Tuesday';
    } else if (dayLower.includes('thứ năm') || dayLower.includes('thu nam') || dayLower.includes('thứ 5') || dayLower.includes('thu 5') || dayLower.includes('thursday')) {
      dayPart = 'Thursday';
    } else if (dayLower.includes('thứ bảy') || dayLower.includes('thu bay') || dayLower.includes('thứ 7') || dayLower.includes('thu 7') || dayLower.includes('saturday')) {
      dayPart = 'Saturday';
    }
  } else {
    const dayLower = dayPart.toLowerCase();
    if (dayLower.includes('sunday')) dayPart = 'Chúa Nhật';
    else if (dayLower.includes('friday')) dayPart = 'Thứ Sáu';
    else if (dayLower.includes('wednesday')) dayPart = 'Thứ Tư';
    else if (dayLower.includes('monday')) dayPart = 'Thứ Hai';
    else if (dayLower.includes('tuesday')) dayPart = 'Thứ Ba';
    else if (dayLower.includes('thursday')) dayPart = 'Thứ Năm';
    else if (dayLower.includes('saturday')) dayPart = 'Thứ Bảy';
  }

  return {
    dayPart: dayPart || (lang === 'vi' ? svc.titleVi : (svc.titleEn || svc.titleVi)),
    hourPart: hourPart || rawTime,
  };
}
