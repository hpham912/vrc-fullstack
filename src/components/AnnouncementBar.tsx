import React from 'react';
import { Announcement } from '../types.ts';
import { Bell, ArrowRight, X } from 'lucide-react';

interface AnnouncementBarProps {
  announcements: Announcement[];
  onSelectEvent?: (eventId?: number) => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ announcements }) => {
  const [dismissed, setDismissed] = React.useState<number[]>([]);

  const activeAnnouncements = announcements.filter((a) => !dismissed.includes(a.id));
  if (activeAnnouncements.length === 0) return null;

  const current = activeAnnouncements[0];

  return (
    <aside aria-label="Church Announcements" className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm py-2.5 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="flex-shrink-0 bg-amber-800/60 p-1 rounded-full">
            <Bell className="w-4 h-4 text-amber-200" />
          </span>
          <span className="font-semibold text-amber-100 flex-shrink-0">{current.title}:</span>
          <p className="truncate text-amber-50">{current.content}</p>
          {current.linkUrl && (
            <a
              href={current.linkUrl}
              className="inline-flex items-center gap-1 font-medium underline hover:text-amber-200 flex-shrink-0 ml-2"
            >
              {current.linkText || 'Learn More'}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <button
          onClick={() => setDismissed([...dismissed, current.id])}
          className="text-amber-200 hover:text-white p-1 rounded transition-colors"
          title="Dismiss"
          aria-label="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
