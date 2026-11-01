import React from 'react';
import { Announcement } from '../types/index.ts';
import { Megaphone, ExternalLink } from 'lucide-react';

interface AnnouncementBarProps {
  announcements: Announcement[];
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ announcements }) => {
  const activeAnnouncements = announcements.filter((a) => a.active);
  if (activeAnnouncements.length === 0) return null;

  const latest = activeAnnouncements[0];

  return (
    <div className="bg-stone-900 text-stone-100 text-xs py-2 px-4 border-b border-stone-800">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <Megaphone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="font-semibold text-amber-300">{latest.title}:</span>
          <span className="truncate text-stone-300">{latest.content}</span>
        </div>

        {latest.linkUrl && (
          <a
            href={latest.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold flex-shrink-0"
          >
            <span>{latest.linkText || 'Learn More'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
