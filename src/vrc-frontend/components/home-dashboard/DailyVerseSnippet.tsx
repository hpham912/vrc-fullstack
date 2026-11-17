import React from 'react';
import { ChevronRight } from 'lucide-react';
import { DailyVerse } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Button, Card } from '../../common-component/index.ts';
import { CrossIcon } from '../cross-icon/CrossIcon.tsx';
import { dailyVerseSnippetStyles } from './DailyVerseSnippet.styles.ts';

export interface DailyVerseSnippetProps {
  todayVerse: DailyVerse | null;
  onNavigateTab: (tab: string) => void;
}

// The daily verse snippet card on Home: reference, verse text,
// translation, and a link to the full Scripture tab.
export const DailyVerseSnippet: React.FC<DailyVerseSnippetProps> = ({
  todayVerse,
  onNavigateTab,
}) => {
  const { language, t } = useLanguage();

  if (!todayVerse) return null;

  return (
    <Card as="section" variant="warm" padding="md" className="space-y-2.5">
      <div className={dailyVerseSnippetStyles.sectionHeaderRow}>
        <span className={dailyVerseSnippetStyles.verseLabel}>
          <CrossIcon className="w-3 h-3 text-amber-600" />
          <span>{t('heroScripture')}</span>
        </span>
        <span className={dailyVerseSnippetStyles.verseRef}>
          {language === 'vi'
            ? todayVerse.referenceVi || todayVerse.reference
            : todayVerse.referenceEn || todayVerse.reference}
        </span>
      </div>

      <blockquote className={dailyVerseSnippetStyles.verseQuote}>
        "
        {language === 'vi'
          ? todayVerse.verseTextVi || todayVerse.verseText
          : todayVerse.verseTextEn || todayVerse.verseText}
        "
      </blockquote>

      <div className={dailyVerseSnippetStyles.verseFooter}>
        <span className={dailyVerseSnippetStyles.verseTrans}>
          {language === 'vi'
            ? todayVerse.translationVi || todayVerse.translation
            : todayVerse.translationEn || todayVerse.translation}
        </span>
        <Button
          type="button"
          variant="linkAmber"
          size="none"
          onClick={() => onNavigateTab('verse')}
          className="text-xs font-semibold"
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          <span className={dailyVerseSnippetStyles.labelFull}>{t('readTodayVerse')}</span>
          <span className={dailyVerseSnippetStyles.labelShort}>{t('readTodayVerseShort')}</span>
        </Button>
      </div>
    </Card>
  );
};
