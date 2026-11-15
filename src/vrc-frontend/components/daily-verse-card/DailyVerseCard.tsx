import React, { useState } from 'react';
import { DailyVerse } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { CHURCH_NAME } from '../../constants/church.ts';
import { Share2, Copy, Check, Calendar, BookOpen } from 'lucide-react';
import {
  AdminAddButton,
  Card,
  Button,
  LoadingShimmer,
  ReadAloudButton,
} from '../../common-component/index.ts';
import { formatReferenceForSpeech } from '../../utils/referenceSpeech.ts';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { formatWeekdayAndDate } from '../../utils/dateFormatter.ts';
import { dailyVerseStyles as s } from './DailyVerseCard.styles.ts';

interface DailyVerseCardProps {
  todayVerse: DailyVerse | null;
  isAdmin: boolean;
  onOpenAdminPortal?: (tab?: string, eventToEdit?: any) => void;
  isLoading?: boolean;
}

// The Scripture tab shows only the current verse — there is no
// history/archive UI (picked verses stay in daily_verses, but only
// today's is displayed). Verse creation/editing lives in AdminPortal
// (the scripture pool), which has separate Vietnamese + English
// fields. This card used to carry its own dead single-language
// create/edit modal (never rendered, and its save only posted one
// `verseText`, so the backend copied English into the Vietnamese
// field). It was removed — do not re-add a single-text verse form
// here. Admins manage verses via onOpenAdminPortal('verses').
export const DailyVerseCard: React.FC<DailyVerseCardProps> = ({
  todayVerse,
  isAdmin,
  onOpenAdminPortal,
  isLoading = false,
}) => {
  const { language, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const verse = todayVerse;

  const pick = (vi?: string | null, en?: string | null, fallback?: string | null) => {
    const direct = language === 'vi' ? vi : en;
    if (direct && direct.trim()) return direct.trim();
    return fallback || '';
  };

  const copyToClipboard = () => {
    if (!verse) return;
    const shareText = `"${pick(verse.verseTextVi, verse.verseTextEn, verse.verseText)}" — ${pick(verse.referenceVi, verse.referenceEn, verse.reference)} (${pick(verse.translationVi, verse.translationEn, verse.translation)})\n\n${CHURCH_NAME.en} / ${CHURCH_NAME.vi}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!verse) return;
    const shareText = `"${pick(verse.verseTextVi, verse.verseTextEn, verse.verseText)}" — ${pick(verse.referenceVi, verse.referenceEn, verse.reference)} (${pick(verse.translationVi, verse.translationEn, verse.translation)})`;
    const shareTitle = `Daily Scripture: ${pick(verse.referenceVi, verse.referenceEn, verse.reference)}`;
    // Native app: the Capacitor Share plugin opens the system share
    // sheet. navigator.share is not available in the app's WebView,
    // which is why Share used to fall back to copying.
    // (Hoang will need `npx cap sync` on his Mac so the native plugin
    // registers before the next app build; until then this falls
    // through to the Web Share API / copy below.)
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
          dialogTitle: shareTitle,
        });
        return;
      } catch {
        // Plugin not synced yet or share failed — fall through to copy.
      }
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled the web share sheet — do nothing, don't copy.
        return;
      }
    }
    copyToClipboard();
  };

  if (!verse) {
    return (
      <section className={s.section}>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <span className={s.tagText}>
              {t('verseTag')}
            </span>
            <h2 className={s.heading}>
              {t('verseTitle')}
            </h2>
          </div>
          {isAdmin && onOpenAdminPortal && (
            <AdminAddButton
              onClick={() => onOpenAdminPortal('verses')}
              title={t('verseAddTitle')}
            />
          )}
        </div>

        <Card variant="empty" padding="empty">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="font-serif font-bold text-stone-900 text-base">
            {t('verseEmpty')}
          </p>
        </Card>
      </section>
    );
  }

  const verseDateFormatted = formatWeekdayAndDate(verse.date, language);
  // Pool verses may have no reflection or prayer — hide the whole
  // section (reflection and prayer alike) when both are empty.
  const reflectionText = pick(verse.reflectionVi, verse.reflectionEn, verse.reflection);
  const prayerText = pick(verse.prayerVi, verse.prayerEn, verse.prayer);

  return (
    <section className={s.section}>
      {/* Header bar */}
      <div className={s.headerBar}>
        <div className={s.titleGroup}>
          <div>
            <span className={s.tagText}>
              {t('verseTag')}
            </span>
            <h2 className={s.heading}>
              {t('verseTitle')}
            </h2>
          </div>
          {isAdmin && onOpenAdminPortal && (
            <AdminAddButton
              onClick={() => onOpenAdminPortal('verses')}
              className="sm:hidden"
              title={t('verseAddTitle')}
            />
          )}
        </div>

        {/* Action icons */}
        <div className={s.actionsRow}>
          {/* Shared ReadAloudButton — reads the verse aloud in the app's
              current language (English when English is selected,
              Vietnamese when Vietnamese is selected). The key remounts
              it when the verse changes, which stops any reading in
              progress for the old verse. */}
          <ReadAloudButton
            key={verse.id}
            text={`${formatReferenceForSpeech(pick(verse.referenceVi, verse.referenceEn, verse.reference), language)}. ${pick(verse.verseTextVi, verse.verseTextEn, verse.verseText)}. ${reflectionText}`}
            className="flex-shrink-0"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex-shrink-0"
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
          >
            <span>{copied ? t('copied') : t('copyVerse')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex-shrink-0"
            leftIcon={<Share2 className="w-3.5 h-3.5 text-stone-400" />}
          >
            <span>{t('shareVerse')}</span>
          </Button>

          {isAdmin && onOpenAdminPortal && (
            <AdminAddButton
              onClick={() => onOpenAdminPortal('verses')}
              className="hidden sm:flex flex-shrink-0"
              title={t('verseAddTitle')}
            />
          )}
        </div>
      </div>

      {/* Main Scripture Card */}
      {isLoading ? (
        <LoadingShimmer variant="verse" />
      ) : (
      <Card variant="warmElevated" padding="lg" className="space-y-6">
        <div className={s.cardMetaRow}>
          <div className={s.dateGroup}>
            <Calendar className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>{verseDateFormatted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={s.translationBadge}>
              {pick(verse.translationVi, verse.translationEn, verse.translation)}
            </span>
          </div>
        </div>

        <blockquote className={s.blockquote}>
          <p className={s.verseText}>
            “{pick(verse.verseTextVi, verse.verseTextEn, verse.verseText)}”
          </p>
          <footer className={s.verseCiteFooter}>
            <cite className={s.verseCite}>
              — {pick(verse.referenceVi, verse.referenceEn, verse.reference)}
            </cite>
          </footer>
        </blockquote>

        {(reflectionText || prayerText) && (
          <div className={s.reflectionSection}>
            {reflectionText && (
              <>
                <h3 className={s.reflectionLabel}>
                  {t('reflectionTitle')}
                </h3>
                <p className={s.reflectionText}>
                  {reflectionText}
                </p>
              </>
            )}

            {prayerText && (
              <div className={s.prayerBox}>
                <span className={s.prayerLabel}>
                  {t('prayerTitle')}
                </span>
                <p className={s.prayerText}>
                  "{prayerText}"
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
      )}
    </section>
  );
};
