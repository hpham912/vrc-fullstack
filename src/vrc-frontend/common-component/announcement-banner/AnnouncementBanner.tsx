import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { Announcement } from '../../types/index.ts';
import { isAnnouncementShowing } from '../../utils/announcement.ts';
import { announcementBannerStyles } from './AnnouncementBanner.styles.ts';

export interface AnnouncementBannerProps {
  announcements: Announcement[];
  // Extra inline style for the shell, e.g. the pull-to-refresh
  // translateY the app passes to the content below the header, so the
  // banner slides down with the rest of the page while pulling.
  style?: React.CSSProperties;
}

// Pixels per second the ticker travels — one speed for every length,
// so a long message takes longer to cross and a short one is quick,
// instead of every message taking the same fixed time.
const TICKER_SPEED_PX_PER_SECOND = 60;
const MIN_TICKER_DURATION_MS = 8000;

// The global red announcement strip under the header. Shows the
// newest announcement that is switched on AND inside its start/end
// window; renders nothing when none is showing. Short text sits still
// and centered. Long text scrolls across the banner and loops (Web
// Animations API — no CSS keyframes file to keep in sync, and the
// duration is computed from the measured text width). Hovering pauses
// the scroll on desktop. With reduced motion on, the text wraps
// instead of scrolling.
export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcements,
  style,
}) => {
  const { language } = useLanguage();
  const activeAnnouncement = announcements.find((announcement) =>
    isAnnouncementShowing(announcement),
  );
  const displayText = activeAnnouncement
    ? language === 'en'
      ? activeAnnouncement.contentEn?.trim() || activeAnnouncement.content
      : activeAnnouncement.content
    : '';

  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [isMarquee, setIsMarquee] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<Animation | null>(null);

  // Does the text overflow the banner? Measured against a hidden
  // single-copy span in the same font, so the answer is exact at any
  // font size (including large-text mode) and after any resize or
  // font load. Never a marquee under reduced motion.
  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure || prefersReducedMotion) {
      setIsMarquee(false);
      return;
    }
    const checkOverflow = () => {
      setIsMarquee(measure.scrollWidth > container.clientWidth);
    };
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(container);
    const fontsReady = (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    if (fontsReady) {
      fontsReady.then(checkOverflow).catch(() => undefined);
    }
    return () => observer.disconnect();
  }, [displayText, prefersReducedMotion]);

  // Start the scroll when the text overflows; stop it the moment it
  // fits again (resize, language change, shorter edit). The duration
  // comes from the measured track width, so the speed stays constant.
  useEffect(() => {
    const track = trackRef.current;
    if (!isMarquee || !track || prefersReducedMotion) {
      animationRef.current?.cancel();
      animationRef.current = null;
      return;
    }
    const oneCopyWidth = track.scrollWidth / 2;
    const duration = Math.max(
      MIN_TICKER_DURATION_MS,
      (oneCopyWidth / TICKER_SPEED_PX_PER_SECOND) * 1000,
    );
    const animation = track.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
      { duration, iterations: Infinity, easing: 'linear' },
    );
    animationRef.current = animation;
    return () => {
      animation.cancel();
      animationRef.current = null;
    };
  }, [isMarquee, displayText, prefersReducedMotion]);

  if (!activeAnnouncement) return null;

  return (
    <div
      ref={containerRef}
      style={style}
      className={announcementBannerStyles.banner}
      role="status"
      onMouseEnter={() => animationRef.current?.pause()}
      onMouseLeave={() => animationRef.current?.play()}
    >
      {/* Hidden single-copy span, only for the overflow measurement. */}
      <span ref={measureRef} aria-hidden="true" className={announcementBannerStyles.measureText}>
        {displayText}
      </span>
      {prefersReducedMotion || !isMarquee ? (
        <p className={prefersReducedMotion ? announcementBannerStyles.wrappedText : announcementBannerStyles.staticText}>
          {displayText}
        </p>
      ) : (
        <div ref={trackRef} className={announcementBannerStyles.track}>
          <span className={announcementBannerStyles.textCopy}>{displayText}</span>
          <span aria-hidden="true" className={announcementBannerStyles.textCopy}>
            {displayText}
          </span>
        </div>
      )}
    </div>
  );
};
