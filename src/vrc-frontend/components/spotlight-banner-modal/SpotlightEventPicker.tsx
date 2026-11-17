import React from 'react';
import { ChurchEvent } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Calendar, Check, MapPin, Zap } from 'lucide-react';
import { spotlightEventPickerStyles } from './SpotlightEventPicker.styles.ts';

interface SpotlightEventPickerProps {
  // Upcoming events, already filtered + sorted by the parent.
  events: ChurchEvent[];
  selectedEventId: number | null;
  onSelect: (id: number | null) => void;
}

// STEP 2: Pick Event to Feature — the Auto-Next option plus the list
// of upcoming events. The parent owns the selection; this component
// only renders it.
export const SpotlightEventPicker: React.FC<SpotlightEventPickerProps> = ({
  events,
  selectedEventId,
  onSelect,
}) => {
  const { t } = useLanguage();

  return (
    <div className={spotlightEventPickerStyles.stepBlockDivider}>
      <div className={spotlightEventPickerStyles.stepHeader}>
        <label className={spotlightEventPickerStyles.stepLabel}>
          <Calendar className={spotlightEventPickerStyles.calendarIcon} />
          <span>{t('spotEventStep')}</span>
        </label>
        <span className={spotlightEventPickerStyles.stepHint}>
          {t('spotEventAuto')}
        </span>
      </div>

      <div className={spotlightEventPickerStyles.eventList}>
        {/* Option: Auto Next Upcoming Event */}
        <div
          onClick={() => onSelect(null)}
          className={`${spotlightEventPickerStyles.eventOptionBase} ${
            selectedEventId === null ? spotlightEventPickerStyles.eventOptionSelected : spotlightEventPickerStyles.eventOptionIdle
          }`}
        >
          <div className={spotlightEventPickerStyles.autoInfoGroup}>
            <div className={spotlightEventPickerStyles.autoBadgeWrap}>
              <span className={spotlightEventPickerStyles.autoBadge}>
                <Zap className={spotlightEventPickerStyles.zapIcon} />
                <span>{t('spotAuto')}</span>
              </span>
            </div>
            <p className={spotlightEventPickerStyles.autoTitle}>
              {t('spotAutoTitle')}
            </p>
            <p className={spotlightEventPickerStyles.autoSubtitle}>
              {t('spotAutoSub')}
            </p>
          </div>
          <div
            className={`${spotlightEventPickerStyles.radioCircleBase} ${
              selectedEventId === null ? spotlightEventPickerStyles.radioCircleSelected : spotlightEventPickerStyles.radioCircleIdle
            }`}
          >
            {selectedEventId === null && <Check className={spotlightEventPickerStyles.checkIcon} />}
          </div>
        </div>

        {events.length === 0 ? (
          <div className={spotlightEventPickerStyles.emptyEventsBox}>
            <p className={spotlightEventPickerStyles.emptyEventsTitle}>
              {t('spotNoEvents')}
            </p>
            <p className={spotlightEventPickerStyles.emptyEventsSubtitle}>
              {t('spotNoEventsSub')}
            </p>
          </div>
        ) : (
          events.map((evt) => {
            const isSelected = selectedEventId === evt.id;
            return (
              <div
                key={evt.id}
                onClick={() => onSelect(evt.id)}
                className={`${spotlightEventPickerStyles.eventOptionBase} ${
                  isSelected ? spotlightEventPickerStyles.eventOptionSelected : spotlightEventPickerStyles.eventOptionIdle
                }`}
              >
                <div className={spotlightEventPickerStyles.eventItemLeft}>
                  <div className={spotlightEventPickerStyles.eventMetaRow}>
                    <span className={spotlightEventPickerStyles.eventCategoryBadge}>
                      {evt.category}
                    </span>
                    <span className={spotlightEventPickerStyles.eventDateTime}>
                      {evt.date} • {evt.startTime}
                    </span>
                  </div>
                  <p className={spotlightEventPickerStyles.eventItemTitle}>{evt.title}</p>
                  <p className={spotlightEventPickerStyles.eventItemLocation}>
                    <MapPin className={spotlightEventPickerStyles.mapPinSm} />
                    <span>{evt.location} {evt.address ? `• ${evt.address}` : ''}</span>
                  </p>
                </div>

                <div
                  className={`${spotlightEventPickerStyles.radioCircleBase} ${
                    isSelected ? spotlightEventPickerStyles.radioCircleSelected : spotlightEventPickerStyles.radioCircleIdle
                  }`}
                >
                  {isSelected && <Check className={spotlightEventPickerStyles.checkIcon} />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
