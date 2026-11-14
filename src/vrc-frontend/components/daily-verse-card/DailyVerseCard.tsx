import React, { useState } from 'react';
import { DailyVerse } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { CHURCH_NAME } from '../../constants/church.ts';
import {
  Share2,
  Copy,
  Check,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  ConfirmModal,
  AdminActionButtons,
  AdminAddButton,
  Card,
  Button,
  LoadingShimmer,
  ReadAloudButton,
} from '../../common-component/index.ts';
import { apiUrl, apiHeaders } from '../../utils/api.ts';
import { formatReferenceForSpeech } from '../../utils/referenceSpeech.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { formatDateLocale, formatWeekdayAndDate } from '../../utils/dateFormatter.ts';
import { dailyVerseStyles as s } from './DailyVerseCard.styles.ts';

interface DailyVerseCardProps {
  todayVerse: DailyVerse | null;
  allVerses: DailyVerse[];
  isAdmin: boolean;
  onRefresh?: () => void;
  onOpenAdminPortal?: (tab?: string, eventToEdit?: any, verseToEdit?: DailyVerse | null) => void;
  isLoading?: boolean;
}

export const DailyVerseCard: React.FC<DailyVerseCardProps> = ({
  todayVerse,
  allVerses,
  isAdmin,
  onRefresh,
  onOpenAdminPortal,
  isLoading = false,
}) => {
  const { language, t } = useLanguage();
  const { getToken } = useAuth();
  const [selectedVerse, setSelectedVerse] = useState<DailyVerse | null>(todayVerse);
  const [copied, setCopied] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [deleteTargetVerse, setDeleteTargetVerse] = useState<DailyVerse | null>(null);
  const [deletingVerse, setDeletingVerse] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());

  // NOTE: Verse creation/editing lives in AdminPortal, which has separate
  // Vietnamese + English fields. This card used to carry its own dead
  // single-language create/edit modal (never rendered, and its save only
  // posted one `verseText`, so the backend copied English into the
  // Vietnamese field). It was removed — do not re-add a single-text
  // verse form here. Admins add verses via onOpenAdminPortal('verses'),
  // and that form has a "Fetch from Bible" button backed by
  // POST /api/ai/fetch-scripture, which returns real EN + VI text.

  const handleConfirmDeleteVerse = async () => {
    if (!deleteTargetVerse) return;
    try {
      setDeletingVerse(true);
      const token = getToken();
      const res = await fetch(apiUrl(`/api/verses/${deleteTargetVerse.id}`), {
        method: 'DELETE',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (res.ok) {
        const deletedId = deleteTargetVerse.id;
        setDeletedIds((prev) => new Set(prev).add(deletedId));
        if (selectedVerse?.id === deletedId) {
          const nextVerse = allVerses.find((v) => v.id !== deletedId && !deletedIds.has(v.id)) || null;
          setSelectedVerse(nextVerse);
        }
        setDeleteTargetVerse(null);
        onRefresh?.();
      }
    } finally {
      setDeletingVerse(false);
    }
  };

  const verse = selectedVerse || todayVerse;

  const pick = (vi?: string | null, en?: string | null, fallback?: string | null) => {
    const direct = language === 'vi' ? vi : en;
    if (direct && direct.trim()) return direct.trim();
    return fallback || '';
  };

  // A newly saved (or edited) verse always replaces the card — no
  // tapping needed. Archive taps still work: they only change the
  // selection until the next today-verse change arrives.
  React.useEffect(() => {
    if (todayVerse) {
      setSelectedVerse(todayVerse);
    }
  }, [todayVerse?.id, todayVerse?.updatedAt]);

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
            text={`${formatReferenceForSpeech(pick(verse.referenceVi, verse.referenceEn, verse.reference), language)}. ${pick(verse.verseTextVi, verse.verseTextEn, verse.verseText)}. ${pick(verse.reflectionVi, verse.reflectionEn, verse.reflection)}`}
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
            {isAdmin && (
              <AdminActionButtons
                onEdit={onOpenAdminPortal ? () => onOpenAdminPortal('verses', null, verse) : undefined}
                onDelete={verse.id > 0 ? () => setDeleteTargetVerse(verse) : undefined}
              />
            )}
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

        <div className={s.reflectionSection}>
          <h3 className={s.reflectionLabel}>
            {t('reflectionTitle')}
          </h3>
          <p className={s.reflectionText}>
            {pick(verse.reflectionVi, verse.reflectionEn, verse.reflection)}
          </p>

          {verse.prayer && (
            <div className={s.prayerBox}>
              <span className={s.prayerLabel}>
                {t('prayerTitle')}
              </span>
              <p className={s.prayerText}>
                "{pick(verse.prayerVi, verse.prayerEn, verse.prayer)}"
              </p>
            </div>
          )}
        </div>
      </Card>
      )}

      {/* Past Devotionals Archive */}
      {allVerses.length > 1 && (
        <div className={s.archiveWrapper}>
          <button
            onClick={() => setShowArchive(!showArchive)}
            className={s.archiveToggleBtn}
          >
            <span className="flex items-center gap-2 min-w-0">
              <BookOpen className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>
                <span className={s.labelFull}>{t('browseArchive')}</span>
                <span className={s.labelShort}>{t('browseArchiveShort')}</span> ({allVerses.length})
              </span>
            </span>
            {showArchive ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
          </button>

          {showArchive && (
            <div className={s.archiveGrid}>
              {allVerses.map((item) => {
                const isSelected = verse.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedVerse(item);
                    }}
                    className={`${s.archiveItemBase} ${
                      isSelected ? s.archiveItemSelected : s.archiveItemUnselected
                    }`}
                  >
                    <div className={s.archiveItemMeta}>
                      <span>{formatDateLocale(item.date, language)}</span>
                      <span className="font-bold text-amber-800">{pick(item.translationVi, item.translationEn, item.translation)}</span>
                    </div>
                    <p className={s.archiveItemRef}>{pick(item.referenceVi, item.referenceEn, item.reference)}</p>
                    <p className={s.archiveItemSnippet}>"{pick(item.verseTextVi, item.verseTextEn, item.verseText)}"</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* Common Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetVerse)}
        title={t('verseDeleteTitle')}
        message={t('verseDeleteConfirm', { reference: deleteTargetVerse?.reference ?? '' })}
        confirmText={t('commonDelete')}
        loading={deletingVerse}
        onConfirm={handleConfirmDeleteVerse}
        onCancel={() => setDeleteTargetVerse(null)}
      />
    </section>
  );
};
