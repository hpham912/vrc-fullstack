import React, { useState } from 'react';
import { DailyVerse } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAutoTranslate } from '../../hooks/useAutoTranslate.ts';
import { CHURCH_NAME } from '../../constants/church.ts';
import {
  Volume2,
  VolumeX,
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
} from '../../common-component/index.ts';
import { apiUrl, apiHeaders } from '../../utils/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
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
  const [isSpeaking, setIsSpeaking] = useState(false);
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
    return tr(fallback);
  };

  const { tr } = useAutoTranslate(
    [
      !(language === 'vi' ? verse?.referenceVi : verse?.referenceEn) ? verse?.reference : null,
      !(language === 'vi' ? verse?.verseTextVi : verse?.verseTextEn) ? verse?.verseText : null,
      !(language === 'vi' ? verse?.reflectionVi : verse?.reflectionEn) ? verse?.reflection : null,
      !(language === 'vi' ? verse?.prayerVi : verse?.prayerEn) ? verse?.prayer : null,
      ...(showArchive
        ? allVerses.flatMap((v) => [
            !(language === 'vi' ? v.referenceVi : v.referenceEn) ? v.reference : null,
            !(language === 'vi' ? v.verseTextVi : v.verseTextEn) ? v.verseText : null,
          ])
        : []),
    ],
    language
  );

  // A newly saved (or edited) verse always replaces the card — no
  // tapping needed. Archive taps still work: they only change the
  // selection until the next today-verse change arrives.
  React.useEffect(() => {
    if (todayVerse) {
      setSelectedVerse(todayVerse);
    }
  }, [todayVerse?.id, todayVerse?.updatedAt]);

  const toggleSpeech = () => {
    if (!verse) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToRead = `${pick(verse.referenceVi, verse.referenceEn, verse.reference)}. ${pick(verse.verseTextVi, verse.verseTextEn, verse.verseText)}. ${pick(verse.reflectionVi, verse.reflectionEn, verse.reflection)}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = language === 'vi' ? 'vi-VN' : 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = () => {
    if (!verse) return;
    const shareText = `"${pick(verse.verseTextVi, verse.verseTextEn, verse.verseText)}" — ${pick(verse.referenceVi, verse.referenceEn, verse.reference)} (${pick(verse.translationVi, verse.translationEn, verse.translation)})\n\n${CHURCH_NAME.en} / ${CHURCH_NAME.vi}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!verse) return;
    if (navigator.share) {
      navigator.share({
        title: `Daily Scripture: ${pick(verse.referenceVi, verse.referenceEn, verse.reference)}`,
        text: `"${pick(verse.verseTextVi, verse.verseTextEn, verse.verseText)}" — ${pick(verse.referenceVi, verse.referenceEn, verse.reference)} (${pick(verse.translationVi, verse.translationEn, verse.translation)})`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      copyToClipboard();
    }
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
          <button
            onClick={toggleSpeech}
            className={`${s.audioBtnBase} ${isSpeaking ? s.audioBtnActive : s.audioBtnInactive}`}
            title={isSpeaking ? 'Stop audio' : 'Listen to scripture'}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-700" />}
            <span>{isSpeaking ? t('pauseAudio') : t('listenAudio')}</span>
          </button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
          >
            <span>{copied ? t('copied') : t('copyVerse')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShare}
            leftIcon={<Share2 className="w-3.5 h-3.5 text-stone-400" />}
          >
            <span>{t('shareVerse')}</span>
          </Button>

          {isAdmin && onOpenAdminPortal && (
            <AdminAddButton
              onClick={() => onOpenAdminPortal('verses')}
              className="hidden sm:flex"
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
            <Calendar className="w-4 h-4 text-amber-700" />
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
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>{t('browseArchive')} ({allVerses.length})</span>
            </span>
            {showArchive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                      if (isSpeaking) {
                        window.speechSynthesis.cancel();
                        setIsSpeaking(false);
                      }
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
