import React from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import { Modal } from '../modal/Modal.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getFacebookEmbedUrl, getFacebookWatchUrl } from '../../../vrc-shared/utils/facebook.ts';
import { formatDateLocale } from '../../utils/dateFormatter.ts';
import { facebookPlayerStyles } from './FacebookPlayer.styles.ts';

export interface FacebookPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  description?: string;
  date?: string | null;
}

// Shared Facebook video player: a modal with the embedded Facebook
// player, an optional description, and a meta row with an optional
// date and a "Watch on Facebook" link. The video streams from
// Facebook — the app never downloads or stores the video itself. Any
// screen can show a video by passing a Facebook video URL (use
// extractFacebookVideoUrl from vrc-shared to validate one from a link).
// The video must be public on Facebook, or the embed shows nothing.
export const FacebookPlayer: React.FC<FacebookPlayerProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  description,
  date,
}) => {
  const { language, t } = useLanguage();
  const formattedDate = date ? formatDateLocale(date, language) : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClass="max-w-4xl">
      <div className={facebookPlayerStyles.body}>
        <iframe
          src={getFacebookEmbedUrl(videoUrl)}
          title={title}
          className={facebookPlayerStyles.frame}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
        {description && <p className={facebookPlayerStyles.desc}>{description}</p>}
        <div className={facebookPlayerStyles.meta}>
          {formattedDate && (
            <span className={facebookPlayerStyles.dateRow}>
              <Calendar className={facebookPlayerStyles.dateIcon} />
              <span>{formattedDate}</span>
            </span>
          )}
          <a
            href={getFacebookWatchUrl(videoUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className={facebookPlayerStyles.watchLink}
          >
            <ExternalLink className={facebookPlayerStyles.watchIcon} />
            <span>{t('videoWatchOnFacebook')}</span>
          </a>
        </div>
      </div>
    </Modal>
  );
};
