import React, { useState } from 'react';
import { DailyVerse } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAutoTranslate } from '../hooks/useAutoTranslate.ts';
import { CHURCH_NAME } from '../constants/church.ts';
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
import { ConfirmModal } from './ConfirmModal.tsx';
import { apiUrl } from '../utils/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface DailyVerseCardProps {
  todayVerse: DailyVerse | null;
  allVerses: DailyVerse[];
  isAdmin: boolean;
  onRefresh?: () => void;
  onOpenAdminPortal?: (tab?: string, eventToEdit?: any, verseToEdit?: DailyVerse | null) => void;
}

export const DailyVerseCard: React.FC<DailyVerseCardProps> = ({
  todayVerse,
  allVerses,
  isAdmin,
  onRefresh,
  onOpenAdminPortal,
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [vDate, setVDate] = useState('');
  const [vRef, setVRef] = useState('');
  const [vText, setVText] = useState('');
  const [vTrans, setVTrans] = useState('NIV');
  const [vReflection, setVReflection] = useState('');
  const [vPrayer, setVPrayer] = useState('');
  const [fetchingScripture, setFetchingScripture] = useState(false);
  const [savingVerse, setSavingVerse] = useState(false);

  const openCreateVerseModal = () => {
    setVDate(new Date().toISOString().split('T')[0]);
    setVRef('');
    setVText('');
    setVTrans('NIV');
    setVReflection('');
    setVPrayer('');
    setEditModalOpen(true);
  };

  const openEditVerseModal = (v: DailyVerse) => {
    setVDate(v.date);
    setVRef(v.reference);
    setVText(v.verseText);
    setVTrans(v.translation || 'NIV');
    setVReflection(v.reflection);
    setVPrayer(v.prayer || '');
    setEditModalOpen(true);
  };

  const handleFetchScripture = async () => {
    if (!vRef.trim()) return;
    try {
      setFetchingScripture(true);
      const token = getToken();
      const res = await fetch(apiUrl('/api/ai/fetch-scripture'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ passage: vRef.trim() }),
      });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
      if (res.ok && data.verseText) {
        setVText(data.verseText);
        if (data.translation) setVTrans(data.translation);
      }
    } catch {
      // Ignore
    } finally {
      setFetchingScripture(false);
    }
  };

  const handleSaveVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vDate || !vRef.trim() || !vText.trim() || !vReflection.trim()) return;
    try {
      setSavingVerse(true);
      const token = getToken();
      const res = await fetch(apiUrl('/api/verses'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: vDate,
          reference: vRef.trim(),
          verseText: vText.trim(),
          translation: vTrans.trim() || 'NIV',
          reflection: vReflection.trim(),
          prayer: vPrayer.trim() || null,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setSelectedVerse(saved);
        setEditModalOpen(false);
        onRefresh?.();
      }
    } finally {
      setSavingVerse(false);
    }
  };

  const handleConfirmDeleteVerse = async () => {
    if (!deleteTargetVerse) return;
    try {
      setDeletingVerse(true);
      const token = getToken();
      const res = await fetch(apiUrl(`/api/verses/${deleteTargetVerse.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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

  React.useEffect(() => {
    if (todayVerse && !selectedVerse) {
      setSelectedVerse(todayVerse);
    }
  }, [todayVerse, selectedVerse]);

  const toggleSpeech = () => {
    if (!verse) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToRead = `${verse.reference}. ${verse.verseText}. ${verse.reflection}`;
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
    const shareText = `"${verse.verseText}" — ${verse.reference} (${verse.translation})\n\n${CHURCH_NAME.en} / ${CHURCH_NAME.vi}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!verse) return;
    if (navigator.share) {
      navigator.share({
        title: `Daily Scripture: ${verse.reference}`,
        text: `"${verse.verseText}" — ${verse.reference} (${verse.translation})`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      copyToClipboard();
    }
  };

  if (!verse) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
        <p className="mt-3 text-stone-500 text-sm">{t('loadingScripture')}</p>
      </div>
    );
  }

  const verseDateFormatted = new Date(verse.date + 'T00:00:00').toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section className="py-6 sm:py-12 px-3.5 sm:px-6 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-amber-700 block mb-1">
              {t('verseTag')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {t('verseTitle')}
            </h2>
          </div>
          {isAdmin && onOpenAdminPortal && (
            <button
              onClick={() => onOpenAdminPortal('verses')}
              className="sm:hidden w-8 h-8 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-400 flex items-center justify-center shadow-2xs active:scale-95 transition-all flex-shrink-0"
              title={language === 'vi' ? 'Thêm Câu Kinh Thánh' : 'Add Scripture'}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              isSpeaking
                ? 'bg-amber-600 text-white border-amber-600 animate-pulse'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
            title={isSpeaking ? 'Stop audio' : 'Listen to scripture'}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-700" />}
            <span>{isSpeaking ? t('pauseAudio') : t('listenAudio')}</span>
          </button>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
            <span>{copied ? t('copied') : t('copyVerse')}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-stone-400" />
            <span>{t('shareVerse')}</span>
          </button>

          {isAdmin && onOpenAdminPortal && (
            <button
              onClick={() => onOpenAdminPortal('verses')}
              className="hidden sm:flex w-8 h-8 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-400 items-center justify-center shadow-2xs active:scale-95 transition-all flex-shrink-0"
              title={language === 'vi' ? 'Thêm Câu Kinh Thánh' : 'Add Scripture'}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Scripture Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-12 shadow-xs space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between text-xs text-stone-500 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>{verseDateFormatted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-md text-[11px]">
              {verse.translation}
            </span>
            {isAdmin && onOpenAdminPortal && (
              <button
                onClick={() => onOpenAdminPortal('verses', null, verse)}
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                title={language === 'vi' ? 'Sửa' : 'Edit'}
              >
                <Pencil className="w-3.5 h-3.5 text-amber-700" />
              </button>
            )}
            {isAdmin && verse.id > 0 && (
              <button
                onClick={() => setDeleteTargetVerse(verse)}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                title={language === 'vi' ? 'Xóa' : 'Delete'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <blockquote className="my-4 sm:my-6">
          <p className="font-serif text-xl sm:text-3xl text-stone-900 leading-relaxed tracking-normal font-normal">
            “{pick(verse.verseTextVi, verse.verseTextEn, verse.verseText)}”
          </p>
          <footer className="mt-4 text-right">
            <cite className="font-serif text-base sm:text-lg font-bold text-amber-800 not-italic">
              — {pick(verse.referenceVi, verse.referenceEn, verse.reference)}
            </cite>
          </footer>
        </blockquote>

        <div className="pt-4 sm:pt-6 border-t border-stone-100 space-y-2.5 sm:space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            {t('reflectionTitle')}
          </h3>
          <p className="text-stone-700 text-xs sm:text-base leading-relaxed whitespace-pre-line">
            {pick(verse.reflectionVi, verse.reflectionEn, verse.reflection)}
          </p>

          {verse.prayer && (
            <div className="mt-4 sm:mt-6 p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/60">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                {t('prayerTitle')}
              </span>
              <p className="font-serif italic text-stone-800 text-xs sm:text-sm leading-relaxed">
                "{pick(verse.prayerVi, verse.prayerEn, verse.prayer)}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Past Devotionals Archive */}
      {allVerses.length > 1 && (
        <div className="mt-6 sm:mt-8">
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center justify-between w-full p-4 bg-white hover:bg-stone-50 border border-stone-200 rounded-2xl text-stone-700 text-xs font-semibold transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>{t('browseArchive')} ({allVerses.length})</span>
            </span>
            {showArchive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showArchive && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className={`p-4 rounded-xl cursor-pointer border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                      <span>{item.date}</span>
                      <span className="font-medium text-amber-700">{item.translation}</span>
                    </div>
                    <p className="font-serif font-bold text-stone-900 text-sm">{pick(item.referenceVi, item.referenceEn, item.reference)}</p>
                    <p className="text-stone-600 text-xs line-clamp-2 mt-1">"{pick(item.verseTextVi, item.verseTextEn, item.verseText)}"</p>
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
        title={language === 'vi' ? 'Xóa Câu Kinh Thánh?' : 'Delete Scripture?'}
        message={
          language === 'vi'
            ? `Bạn có chắc chắn muốn xóa câu Kinh Thánh "${deleteTargetVerse?.reference}"?`
            : `Are you sure you want to delete "${deleteTargetVerse?.reference}"?`
        }
        confirmText={language === 'vi' ? 'Xóa' : 'Delete'}
        loading={deletingVerse}
        onConfirm={handleConfirmDeleteVerse}
        onCancel={() => setDeleteTargetVerse(null)}
      />
    </section>
  );
};
