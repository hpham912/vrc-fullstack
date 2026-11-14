import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { loadingStyles as s } from './Loading.styles.ts';

export interface LoadingProps {
  // Text shown with the spinner. Defaults to the translated "Loading...".
  text?: string;
  // Full-screen overlay (fixed, covers the whole screen). Default false (inline).
  fullscreen?: boolean;
  // Blur the background behind the overlay. Only applies when fullscreen is true.
  // Default false (a dim background, no blur).
  blur?: boolean;
  // Spinner size. Default 'md'.
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Shared loading indicator — the one spinner the whole app uses.
// Inline: a compact spinner + text that sits in place (cards, pull-to-refresh).
// Fullscreen: a fixed overlay covering the screen; pass blur to blur the
// background behind it, or leave it off for a plain dim background.
export const Loading: React.FC<LoadingProps> = ({
  text,
  fullscreen = false,
  blur = false,
  size = 'md',
  className = '',
}) => {
  const { t } = useLanguage();
  const label = text ?? t('loading');
  const spinnerSize = size === 'sm' ? s.spinnerSm : size === 'lg' ? s.spinnerLg : s.spinnerMd;

  if (fullscreen) {
    return (
      <div
        className={`${s.fullscreenWrap} ${blur ? s.fullscreenBlur : s.fullscreenDim} ${className}`.trim()}
        role="status"
        aria-label={label}
      >
        <Loader2 className={`${spinnerSize} animate-spin ${s.fullscreenSpinner}`} />
        <span className={s.fullscreenText}>{label}</span>
      </div>
    );
  }

  return (
    <div className={`${s.inlineWrap} ${className}`.trim()} role="status" aria-label={label}>
      <Loader2 className={`${spinnerSize} animate-spin ${s.inlineSpinner}`} />
      <span className={s.inlineText}>{label}</span>
    </div>
  );
};
