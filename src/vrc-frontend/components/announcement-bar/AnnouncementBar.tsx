import React from 'react';
import { Announcement } from '../../types/index.ts';
import { Megaphone, ExternalLink } from 'lucide-react';
import { announcementBarStyles as s } from './AnnouncementBar.styles.ts';

interface AnnouncementBarProps {
  announcements: Announcement[];
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ announcements }) => {
  const activeAnnouncements = announcements.filter((a) => a.active);
  if (activeAnnouncements.length === 0) return null;

  const latest = activeAnnouncements[0];

  return (
    <div className={s.bar}>
      <div className={s.container}>
        <div className={s.contentRow}>
          <Megaphone className={s.icon} />
          <span className={s.title}>{latest.title}:</span>
          <span className={s.message}>{latest.content}</span>
        </div>

        {latest.linkUrl && (
          <a
            href={latest.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.link}
          >
            <span>{latest.linkText || 'Learn More'}</span>
            <ExternalLink className={s.linkIcon} />
          </a>
        )}
      </div>
    </div>
  );
};
