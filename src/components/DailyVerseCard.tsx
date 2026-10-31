import React, { useState } from 'react';
import { DailyVerse } from '../types.ts';
import {
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check,
  Calendar,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  PenTool,
} from 'lucide-react';

interface DailyVerseCardProps {
  todayVerse: DailyVerse | null;
  allVerses: DailyVerse[];
  isAdmin: boolean;
  onOpenAdminPortal?: (tab?: string) => void;
}

export const DailyVerseCard: React.FC<DailyVerseCardProps> = ({
  todayVerse,
  allVerses,
  isAdmin,
  onOpenAdminPortal,
}) => {
  const [selectedVerse, setSelectedVerse] = useState<DailyVerse | null>(todayVerse);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  React.useEffect(() => {
    if (todayVerse && !selectedVerse) {
      setSelectedVerse(todayVerse);
    }
  }, [todayVerse, selectedVerse]);

  const verse = selectedVerse || todayVerse;

  const toggleSpeech = () => {
    if (!verse) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToRead = `${verse.reference}. ${verse.verseText}. Reflection: ${verse.reflection}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = () => {
    if (!verse) return;
    const shareText = `"${verse.verseText}" — ${verse.reference} (${verse.translation})\n\nVietnamese Revival Church Daily Verse`;
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
        <p className="mt-3 text-stone-500 text-sm">Loading scripture...</p>
      </div>
    );
  }

  const verseDateFormatted = new Date(verse.date + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 block mb-1">
            Lời Chúa Mỗi Ngày • Daily Bread
          </span>
          <h2 className="text-3xl font-serif font-bold text-stone-900">
            Scripture & Devotional
          </h2>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSpeech}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              isSpeaking
                ? 'bg-amber-600 text-white border-amber-600 animate-pulse'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
            title={isSpeaking ? 'Stop audio' : 'Listen to scripture'}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-700" />}
            <span>{isSpeaking ? 'Pause' : 'Listen'}</span>
          </button>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-stone-400" />
            <span>Share</span>
          </button>

          {isAdmin && onOpenAdminPortal && (
            <button
              onClick={() => onOpenAdminPortal('verses')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium shadow-xs"
            >
              <PenTool className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Verse</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Scripture Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-8 sm:p-12 shadow-xs space-y-8">
        {/* Date & Translation */}
        <div className="flex items-center justify-between text-xs text-stone-500 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>{verseDateFormatted}</span>
          </div>
          <span className="font-semibold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-md text-[11px]">
            {verse.translation}
          </span>
        </div>

        {/* The Scripture Passage */}
        <blockquote className="my-6">
          <p className="font-serif text-2xl sm:text-3xl text-stone-900 leading-relaxed tracking-normal font-normal">
            “{verse.verseText}”
          </p>
          <footer className="mt-4 text-right">
            <cite className="font-serif text-lg font-bold text-amber-800 not-italic">
              — {verse.reference}
            </cite>
          </footer>
        </blockquote>

        {/* Reflection */}
        <div className="pt-6 border-t border-stone-100 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Pastoral Reflection
          </h3>
          <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {verse.reflection}
          </p>

          {verse.prayer && (
            <div className="mt-6 p-5 rounded-2xl bg-amber-50/70 border border-amber-200/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                Lời Cầu Nguyện • Today's Prayer
              </span>
              <p className="font-serif italic text-stone-800 text-sm leading-relaxed">
                "{verse.prayer}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Past Devotionals Archive */}
      {allVerses.length > 1 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center justify-between w-full p-4 bg-white hover:bg-stone-50 border border-stone-200 rounded-2xl text-stone-700 text-xs font-semibold transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-700" />
              Browse Past Scripture Readings ({allVerses.length} available)
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
                    <p className="font-serif font-bold text-stone-900 text-sm">{item.reference}</p>
                    <p className="text-stone-600 text-xs line-clamp-2 mt-1">"{item.verseText}"</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
