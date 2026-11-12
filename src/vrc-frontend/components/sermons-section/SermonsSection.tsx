import React, { useState } from 'react';
import { Video, Play, Calendar } from 'lucide-react';
import { Sermon } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiFetch } from '../../utils/api.ts';
import { Card, LoadingShimmer, AdminAddButton, AdminActionButtons, ConfirmModal, YouTubePlayer, FacebookPlayer } from '../../common-component/index.ts';
import { getYouTubeThumbnailUrl } from '../../../vrc-shared/utils/youtube.ts';
import { formatDateLocale } from '../../utils/dateFormatter.ts';
import { sermonsSectionStyles as s } from './SermonsSection.styles.ts';

interface SermonsSectionProps {
  sermons: Sermon[];
  isLoading?: boolean;
  isAdmin?: boolean;
  onOpenAdminPortal?: (tab?: string, sermon?: Sermon | null) => void;
  onRefresh?: () => void;
}

// Full-page Sermons tab (Bài Giảng): a list of Sunday worship sermon
// videos. The videos live on YouTube or Facebook — the app stores only
// the link, so each card shows YouTube's thumbnail (or a Facebook
// placeholder, since Facebook gives no free thumbnail) and tapping it
// opens the matching embedded player in a modal, inside the app.
export const SermonsSection: React.FC<SermonsSectionProps> = ({
  sermons,
  isLoading = false,
  isAdmin = false,
  onOpenAdminPortal,
  onRefresh,
}) => {
  const { language, t } = useLanguage();
  const { getToken } = useAuth();
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [deleteTargetSermon, setDeleteTargetSermon] = useState<Sermon | null>(null);
  const [deletingSermon, setDeletingSermon] = useState(false);

  // Delete from the card, same as the Events page: a confirm modal,
  // then DELETE /api/sermons/:id, then reload the list. The sermon
  // stays visible if the delete fails, so the failure is obvious.
  const handleConfirmDelete = async () => {
    if (!deleteTargetSermon) return;
    try {
      setDeletingSermon(true);
      const token = getToken();
      await apiFetch(`/api/sermons/${deleteTargetSermon.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTargetSermon(null);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete sermon:', err);
      setDeleteTargetSermon(null);
    } finally {
      setDeletingSermon(false);
    }
  };

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
            // Rows saved before the Facebook column existed have no
            // platform — they are YouTube sermons.
            const platform = sermon.platform || 'youtube';
            const isFacebook = platform === 'facebook';
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
                  {isFacebook ? (
                    <div className={s.fbThumb} aria-label={title}>
                      <span className={s.fbThumbIcon}>f</span>
                      <span className={s.fbThumbLabel}>Facebook</span>
                    </div>
                  ) : (
                    <img
                      src={sermon.videoId ? getYouTubeThumbnailUrl(sermon.videoId) : ''}
                      alt={title}
                      loading="lazy"
                      className={s.thumbImg}
                    />
                  )}
                  <span
                    className={`${s.platformBadge} ${
                      isFacebook ? s.platformBadgeFb : s.platformBadgeYt
                    }`}
                  >
                    {isFacebook ? 'Facebook' : 'YouTube'}
                  </span>
                  <span className={s.playBadge}>
                    <Play className={s.playIcon} />
                  </span>
                </div>

                <div className={s.cardBody}>
                  <div className={s.cardHeaderRow}>
                    <h3 className={s.cardTitle}>{title}</h3>
                    {isAdmin && (
                      <span
                        className={s.adminActionRow}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AdminActionButtons
                          onEdit={() => onOpenAdminPortal?.('sermons', sermon)}
                          onDelete={() => setDeleteTargetSermon(sermon)}
                        />
                      </span>
                    )}
                  </div>
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

      {/* Video player: the shared YouTubePlayer or FacebookPlayer modal,
          matching the sermon's platform. The video streams from its
          platform, so the app never downloads or stores it. */}
      {selectedSermon &&
        (selectedSermon.platform || 'youtube') === 'facebook' ? (
          <FacebookPlayer
            isOpen={Boolean(selectedSermon)}
            onClose={() => setSelectedSermon(null)}
            videoUrl={selectedSermon.videoUrl}
            title={getSermonTitle(selectedSermon)}
            description={getSermonDescription(selectedSermon)}
            date={selectedSermon.date}
          />
        ) : (
          selectedSermon &&
          selectedSermon.videoId && (
            <YouTubePlayer
              isOpen={Boolean(selectedSermon)}
              onClose={() => setSelectedSermon(null)}
              videoId={selectedSermon.videoId}
              title={getSermonTitle(selectedSermon)}
              description={getSermonDescription(selectedSermon)}
              date={selectedSermon.date}
            />
          )
        )}
      {/* Common Confirmation Modal for Delete (same as the Events page) */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetSermon)}
        title={t('adminSermonDeleteTitle')}
        message={
          deleteTargetSermon
            ? t('adminSermonDeleteConfirm', {
                title:
                  (language === 'vi'
                    ? deleteTargetSermon.titleVi
                    : deleteTargetSermon.titleEn) || '',
              })
            : ''
        }
        confirmText={t('commonDelete')}
        loading={deletingSermon}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetSermon(null)}
      />
    </div>
  );
};
