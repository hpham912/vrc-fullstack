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
  HeartHandshake,
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

  // Sync if todayVerse loads later
  React.useEffect(() => {
    if (todayVerse && !selectedVerse) {
      setSelectedVerse(todayVerse);
    }
  }, [todayVerse, selectedVerse]);

  const verse = selectedVerse || todayVerse;

  // Text to speech
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
      utterance.rate = 0.88;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = () => {
    if (!verse) return;
    const shareText = `"${verse.verseText}" — ${verse.reference} (${verse.translation})\n\nDaily Devotional from Grace & Truth Church`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
      <div className="py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <p className="mt-2 text-stone-500 text-sm">Loading daily scripture...</p>
      </div>
    );
  }

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Daily Scripture & Devotional
            </span>
            {verse.theme && (
              <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-md">
                Theme: {verse.theme}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
            Word of Encouragement
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              isSpeaking
                ? 'bg-amber-600 text-white border-amber-600 animate-pulse'
                : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-sm'
            }`}
            title={isSpeaking ? 'Stop Audio' : 'Listen to Scripture'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
            <span>{isSpeaking ? 'Pause Audio' : 'Listen'}</span>
          </button>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-sm transition-colors"
            title="Copy to Clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-sm transition-colors"
            title="Share Scripture"
          >
            <Share2 className="w-4 h-4 text-stone-500" />
            <span>Share</span>
          </button>

          {isAdmin && onOpenAdminPortal && (
            <button
              onClick={() => onOpenAdminPortal('verses')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors shadow-sm"
              title="Post or Edit Verses"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Manage</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Scripture Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/80 via-stone-50 to-orange-50/40 border border-amber-200/80 p-6 sm:p-10 shadow-lg shadow-amber-950/5">
        {/* Subtle decorative cross background watermark */}
        <div className="absolute -right-8 -bottom-8 pointer-events-none opacity-5 text-amber-950">
          <BookOpen className="w-64 h-64" />
        </div>

        {/* Date indicator */}
        <div className="flex items-center justify-between text-xs text-stone-500 pb-4 border-b border-amber-200/60 mb-6">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span className="font-medium text-stone-700">
              {new Date(verse.date + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-amber-100/90 text-amber-800 font-semibold px-2 py-0.5 rounded text-[11px]">
              {verse.translation}
            </span>
          </div>
        </div>

        {/* Verse text */}
        <blockquote className="my-4">
          <p className="font-serif text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed sm:leading-snug text-stone-900 tracking-wide">
            “{verse.verseText}”
          </p>
          <footer className="mt-4 flex items-center justify-end">
            <cite className="font-serif text-lg sm:text-xl font-bold not-italic text-amber-800 tracking-wide">
              — {verse.reference}
            </cite>
          </footer>
        </blockquote>

        {/* Devotional Reflection */}
        <div className="mt-8 pt-6 border-t border-amber-200/60">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-3">
            <BookOpen className="w-4 h-4 text-amber-700" />
            Pastoral Reflection
          </h2>
          <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal">
            {verse.reflection}
          </p>

          {verse.prayer && (
            <div className="mt-6 p-4 rounded-xl bg-amber-100/60 border border-amber-200/70">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
                Today's Prayer
              </h3>
              <p className="text-stone-800 text-sm italic font-serif leading-relaxed">
                "{verse.prayer}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Archive / Browse past days */}
      {allVerses.length > 1 && (
        <div className="mt-6">
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center justify-between w-full p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-sm font-medium transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Browse Past Daily Devotionals ({allVerses.length} available)
            </span>
            {showArchive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showArchive && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allVerses.map((item) => {
                const isCurrent = verse.id === item.id;
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
                    className={`p-4 rounded-xl cursor-pointer border transition-all text-left ${
                      isCurrent
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                      <span>{item.date}</span>
                      <span className="font-semibold text-amber-700">{item.translation}</span>
                    </div>
                    <p className="font-serif font-bold text-stone-900 text-sm truncate">
                      {item.reference}
                    </p>
                    <p className="text-stone-600 text-xs line-clamp-2 mt-1">
                      "{item.verseText}"
                    </p>
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
