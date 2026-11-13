import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage, type Language } from '../../context/LanguageContext.tsx';
import { useReadAloud } from './useReadAloud.ts';
import { readAloudButtonStyles } from './ReadAloudButton.styles.ts';

export interface ReadAloudButtonProps {
  // The text to read aloud.
  text: string;
  // Language to read in. Defaults to the app's current language, so it
  // reads English when English is selected and Vietnamese when
  // Vietnamese is selected. Pass it explicitly to read a fixed
  // language regardless of the app language.
  language?: Language;
  // Extra classes (e.g. to hide on desktop).
  className?: string;
  disabled?: boolean;
}

// Shared "Listen" button — read any text aloud. Drop it anywhere:
//   <ReadAloudButton text={verseText} />
//   <ReadAloudButton text={announcementBody} language="vi" />
// Tap once to read, tap again to stop. On the phone it uses the
// native text-to-speech engine (reliable in the app, plays even with
// the silent switch on); in the browser it uses Web Speech.
export const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({
  text,
  language,
  className = '',
  disabled = false,
}) => {
  const { language: appLanguage, t } = useLanguage();
  const { isSpeaking, speak, stop } = useReadAloud();
  const readLanguage = language || appLanguage;

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, readLanguage);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !text.trim()}
      className={`${readAloudButtonStyles.base} ${
        isSpeaking ? readAloudButtonStyles.active : readAloudButtonStyles.inactive
      } ${className}`.trim()}
      title={isSpeaking ? t('pauseAudio') : t('listenAudio')}
      aria-pressed={isSpeaking}
    >
      {isSpeaking ? (
        <VolumeX className={readAloudButtonStyles.icon} />
      ) : (
        <Volume2 className={readAloudButtonStyles.iconIdle} />
      )}
      <span>{isSpeaking ? t('pauseAudio') : t('listenAudio')}</span>
    </button>
  );
};
