import React, { useEffect, useState } from 'react';
import { DailyVerse } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { apiFetch } from '../../utils/api.ts';
import { formatDateLocale } from '../../utils/dateFormatter.ts';
import { Accordion, Loading } from '../../common-component/index.ts';
import { verseHistorySectionStyles } from './VerseHistorySection.styles.ts';

interface VerseHistorySectionProps {
  // Whether the Scripture tab is showing. The history is fetched when
  // the tab opens, so it is fresh after the admin changes the pool.
  isActive: boolean;
  // Today's verse — excluded from the history (it is already shown
  // in the DailyVerseCard above). Its date changing also means a new
  // verse-day started, so the history is refetched.
  todayVerse: DailyVerse | null;
}

const EN_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMonthTitle(month: string, language: 'vi' | 'en'): string {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  if (!year || !monthNumber) return month;
  if (language === 'vi') return `Tháng ${monthNumber}, ${year}`;
  return `${EN_MONTH_NAMES[monthNumber - 1]} ${year}`;
}

// Member verse history — past daily verses for the current month and
// the previous month (GET /api/verses/history), newest first. On the
// 1st, when the new month has nothing yet, the previous month's
// verses still show. Tap a verse to read its text, reflection and
// prayer again.
export const VerseHistorySection: React.FC<VerseHistorySectionProps> = ({
  isActive,
  todayVerse,
}) => {
  const { t, language } = useLanguage();
  const [history, setHistory] = useState<DailyVerse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const todayDate = todayVerse?.date || '';

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<DailyVerse[]>('/api/verses/history')
      .then((data) => {
        if (!cancelled) setHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isActive, todayDate]);

  if (!isActive) return null;

  const pick = (vi?: string | null, en?: string | null, fallback?: string | null) => {
    const direct = language === 'vi' ? vi : en;
    if (direct && direct.trim()) return direct.trim();
    return fallback || '';
  };

  // Past verses only — today's verse is already on the card above.
  const pastVerses = (history ?? []).filter((verse) => verse.date !== todayDate);
  // Group by month (YYYY-MM), newest month first. The endpoint
  // already returns newest-first, so the groups keep that order.
  const months: string[] = [];
  const byMonth = new Map<string, DailyVerse[]>();
  for (const verse of pastVerses) {
    const month = verse.date.slice(0, 7);
    if (!byMonth.has(month)) {
      byMonth.set(month, []);
      months.push(month);
    }
    byMonth.get(month)!.push(verse);
  }
  const currentMonth = todayDate ? todayDate.slice(0, 7) : months[0] || '';

  return (
    <div className={verseHistorySectionStyles.container}>
      <h2 className={verseHistorySectionStyles.title}>{t('verseHistoryTitle')}</h2>
      {loading ? (
        <Loading text={t('loading')} />
      ) : pastVerses.length === 0 ? (
        <p className={verseHistorySectionStyles.emptyText}>{t('verseHistoryEmpty')}</p>
      ) : (
        months.map((month) => (
          <div key={month} className="space-y-2">
            <h3 className={verseHistorySectionStyles.monthTitle}>
              {month === currentMonth ? t('verseHistoryThisMonth') : t('verseHistoryPrevMonth')}
              {' • '}
              {formatMonthTitle(month, language)}
            </h3>
            <Accordion
              openId={expandedId === null ? null : String(expandedId)}
              onToggle={(id) =>
                setExpandedId(expandedId === Number(id) ? null : Number(id))
              }
              items={(byMonth.get(month) || []).map((verse) => {
                const verseText = pick(verse.verseTextVi, verse.verseTextEn, verse.verseText);
                const reflection = pick(verse.reflectionVi, verse.reflectionEn, verse.reflection);
                const prayer = pick(verse.prayerVi, verse.prayerEn, verse.prayer);
                return {
                  id: String(verse.id),
                  header: (
                    <span className={verseHistorySectionStyles.rowHead}>
                      <span className={verseHistorySectionStyles.rowRef}>
                        {pick(verse.referenceVi, verse.referenceEn, verse.reference)}
                      </span>
                      <span className={verseHistorySectionStyles.rowDate}>
                        {formatDateLocale(verse.date, language)}
                      </span>
                    </span>
                  ),
                  children: (
                    <>
                      <span className={verseHistorySectionStyles.rowText}>“{verseText}”</span>
                      {reflection && (
                        <>
                          <span className={verseHistorySectionStyles.rowExtraLabel}>{t('reflectionTitle')}</span>
                          <span className={verseHistorySectionStyles.rowExtraText}>{reflection}</span>
                        </>
                      )}
                      {prayer && (
                        <>
                          <span className={verseHistorySectionStyles.rowExtraLabel}>{t('prayerTitle')}</span>
                          <span className={verseHistorySectionStyles.rowExtraText}>{prayer}</span>
                        </>
                      )}
                    </>
                  ),
                };
              })}
            />
          </div>
        ))
      )}
    </div>
  );
};
