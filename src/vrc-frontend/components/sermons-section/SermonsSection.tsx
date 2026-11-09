import React, { useState } from 'react';
import { Video, Play, Calendar, ExternalLink } from 'lucide-react';
import { Sermon } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Modal, Card, LoadingShimmer, AdminAddButton } from '../../common-component/index.ts';
import {
  getYouTubeThumbnailUrl,
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
} from '../../../vrc-shared/utils/youtube.ts';
import { formatDateLocale } from '../../utils/dateFormatter.ts';
import { sermonsSectionStyles as s } from './SermonsSection.styles.ts';

interface SermonsSectionProps {
  sermons: Sermon[];
  isLoading?: boolean;
  isAdmin?: boolean;
  onOpenAdminPortal?: (tab?: string) => void;
}

// Full-page Sermons tab (Bài Giảng): a list of Sunday worship sermon
// videos. The videos live on YouTube — the app stores only the link,
// so each card shows YouTube's thumbnail and tapping it opens the
// embedded YouTube player in a modal, inside the app.
export const SermonsSection: React.FC<SermonsSectionProps> = ({
  sermons,
  isLoading = false,
  isAdmin = false,
  onOpenAdminPortal,
}) => {
  const { language, t } = useLanguage();
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);

  const getSermonTitle = (sermon: Sermon) =>
    language === 'vi' ? sermon.titleVi || sermon.titleEn : sermon.titleEn || sermon.titleVi;
  const getSermonDescription = (sermon: Sermon) =>
    language === 'vi'
      ? sermon.descriptionVi || sermon.descriptionEn || ''
      : sermon.descriptionEn || sermon.descriptionVi || '';

  return (
    <div className={s.page}>
      <div className={s.headerRow}>
        <div className="min-w-0">
          <span className={s.headerSubtitle}>{t('sermonSubtitle')}</span>
          <h1 className={s.headerTitle}>{t('sermonTitle')}</h1>
        </div>

        {isAdmin && onOpenAdminPortal && (
          <AdminAddButton
            onClick={() => onOpenAdminPortal('sermons')}
            title={t('adminSermonAddTitle')}
          />
        )}
      </div>

      {isLoading ? (
        <LoadingShimmer variant="card" count={3} />
      ) : sermons.length === 0 ? (
        <Card variant="empty" padding="empty">
          <Video className={s.emptyIcon} />
          <p className={s.emptyTitle}>{t('sermonEmpty')}</p>
          <p className={s.emptySub}>{t('sermonEmptySub')}</p>
        </Card>
      ) : (
        <div className={s.listContainer}>
          {sermons.map((sermon) => {
            const title = getSermonTitle(sermon);
            const description = getSermonDescription(sermon);
            return (
              <div
                key={sermon.id}
                onClick={() => setSelectedSermon(sermon)}
                className={s.sermonCard}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedSermon(sermon);
                }}
              >
                <div className={s.thumbWrap}>
                  <img
                    src={getYouTubeThumbnailUrl(sermon.videoId)}
                    alt={title}
                    loading="lazy"
                    className={s.thumbImg}
                  />
                  <span className={s.playBadge}>
                    <Play className={s.playIcon} />
                  </span>
                </div>

                <div className={s.cardBody}>
                  <h3 className={s.cardTitle}>{title}</h3>
                  {description && <p className={s.cardDesc}>{description}</p>}
                  <div className={s.cardDateRow}>
                    <Calendar className={s.cardDateIcon} />
                    <span>{formatDateLocale(sermon.date, language)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video player: the YouTube embed streams from YouTube, so the
          app never downloads or stores the video itself. */}
      <Modal
        isOpen={Boolean(selectedSermon)}
        onClose={() => setSelectedSermon(null)}
        title={selectedSermon ? getSermonTitle(selectedSermon) : ''}
        maxWidthClass="max-w-2xl"
      >
        {selectedSermon && (
          <div className={s.playerBody}>
            <iframe
              src={getYouTubeEmbedUrl(selectedSermon.videoId)}
              title={getSermonTitle(selectedSermon)}
              className={s.playerFrame}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            {getSermonDescription(selectedSermon) && (
              <p className={s.playerDesc}>{getSermonDescription(selectedSermon)}</p>
            )}
            <div className={s.playerMeta}>
              <span className={s.playerDateRow}>
                <Calendar className={s.cardDateIcon} />
                <span>{formatDateLocale(selectedSermon.date, language)}</span>
              </span>
              <a
                href={getYouTubeWatchUrl(selectedSermon.videoId)}
                target="_blank"
                rel="noopener noreferrer"
                className={s.playerWatchLink}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t('sermonWatchOnYoutube')}</span>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
