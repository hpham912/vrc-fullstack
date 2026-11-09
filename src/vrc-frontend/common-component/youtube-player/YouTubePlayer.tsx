import React from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import { Modal } from '../modal/Modal.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '../../../vrc-shared/utils/youtube.ts';
import { formatDateLocale } from '../../utils/dateFormatter.ts';
import { youtubePlayerStyles } from './YouTubePlayer.styles.ts';

export interface YouTubePlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  title: string;
  description?: string;
  date?: string | null;
}

// Shared YouTube video player: a modal with the embedded YouTube player
// (autoplay), an optional description, and a meta row with an optional
// date and a "Watch on YouTube" link. The video streams from YouTube —
// the app never downloads or stores the video itself. Any screen can
// show a video by passing a video ID (use extractYouTubeVideoId from
// vrc-shared to get one from a link).
export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  isOpen,
  onClose,
  videoId,
  title,
  description,
  date,
}) => {
  const { language, t } = useLanguage();
  const formattedDate = date ? formatDateLocale(date, language) : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClass="max-w-2xl">
      <div className={youtubePlayerStyles.body}>
        <iframe
          src={getYouTubeEmbedUrl(videoId)}
          title={title}
          className={youtubePlayerStyles.frame}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        {description && <p className={youtubePlayerStyles.desc}>{description}</p>}
        <div className={youtubePlayerStyles.meta}>
          {formattedDate && (
            <span className={youtubePlayerStyles.dateRow}>
              <Calendar className={youtubePlayerStyles.dateIcon} />
              <span>{formattedDate}</span>
            </span>
          )}
          <a
            href={getYouTubeWatchUrl(videoId)}
            target="_blank"
            rel="noopener noreferrer"
            className={youtubePlayerStyles.watchLink}
          >
            <ExternalLink className={youtubePlayerStyles.watchIcon} />
            <span>{t('videoWatchOnYoutube')}</span>
          </a>
        </div>
      </div>
    </Modal>
  );
};
