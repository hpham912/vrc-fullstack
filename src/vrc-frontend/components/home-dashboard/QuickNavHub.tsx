import React from 'react';
import { BookOpen, Calendar, MapPin, Sparkles } from 'lucide-react';
import { DailyVerse } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Card } from '../../common-component/index.ts';
import { quickNavHubStyles } from './QuickNavHub.styles.ts';

export interface QuickNavHubProps {
  upcomingCount: number;
  todayVerse: DailyVerse | null;
  onNavigateTab: (tab: string) => void;
  churchName: { vi: string; en: string };
  churchAddress: string;
  onOpenDirections: (target: { name: string; address: string; location?: string }) => void;
}

// The three quick-nav cards on Home: Events, Scripture, Sanctuary &
// Directions. Tapping a card jumps to that tab (or scrolls to the
// contact card / opens directions for the sanctuary).
export const QuickNavHub: React.FC<QuickNavHubProps> = ({
  upcomingCount,
  todayVerse,
  onNavigateTab,
  churchName,
  churchAddress,
  onOpenDirections,
}) => {
  const { language, t } = useLanguage();

  return (
    <section className={quickNavHubStyles.quickHubSection}>
      <div className={quickNavHubStyles.sectionHeaderRow}>
        <h2 className={quickNavHubStyles.sectionHeading}>
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>{t('quickAccessTitle')}</span>
        </h2>
        <span className={quickNavHubStyles.sectionSubHint}>{t('homeTapNavigate')}</span>
      </div>

      <div className={quickNavHubStyles.quickGrid}>
        {/* Card 1: Events */}
        <Card as="button" variant="quickNav" onClick={() => onNavigateTab('events')}>
          <div className={quickNavHubStyles.quickIconEvents}>
            <Calendar className="w-5 h-5" />
          </div>
          <span className={quickNavHubStyles.quickCardTitle}>{t('navEvents')}</span>
          <span className={quickNavHubStyles.quickCardSub}>
            {upcomingCount}{' '}
            <span className={quickNavHubStyles.labelFull}>{t('upcomingEventsUnit')}</span>
            <span className={quickNavHubStyles.labelShort}>{t('upcomingEventsUnitShort')}</span>
          </span>
        </Card>

        {/* Card 2: Scripture */}
        <Card as="button" variant="quickNav" onClick={() => onNavigateTab('verse')}>
          <div className={quickNavHubStyles.quickIconVerse}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className={quickNavHubStyles.quickCardTitle}>{t('navVerse')}</span>
          <span className={quickNavHubStyles.quickCardSub}>
            {(language === 'vi'
              ? todayVerse?.referenceVi || todayVerse?.reference
              : todayVerse?.referenceEn || todayVerse?.reference) || t('homeToday')}
          </span>
        </Card>

        {/* Card 3: Sanctuary & Directions */}
        <Card
          as="button"
          variant="quickNav"
          onClick={() => {
            const el = document.getElementById('sanctuary-location');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              onOpenDirections({
                name: language === 'vi' ? churchName.vi : churchName.en,
                address: churchAddress,
              });
            }
          }}
        >
          <div className={quickNavHubStyles.quickIconSanctuary}>
            <MapPin className="w-5 h-5" />
          </div>
          <span className={quickNavHubStyles.quickCardTitle}>{t('homeSanctuary')}</span>
          <span className={quickNavHubStyles.quickCardSub}>
            <span className={quickNavHubStyles.labelFull}>Tempe, Arizona</span>
            <span className={quickNavHubStyles.labelShort}>Tempe, AZ</span>
          </span>
        </Card>
      </div>
    </section>
  );
};
