// Shared unread-count badge (replaces the old red dot). The bubble
// itself is the shared look; the caller passes the positioning
// (absolute + top/right) via className, because the tab bar and the
// header bell sit in different places.
export const notificationBadgeStyles = {
  badge:
    'flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-amber-600 text-white text-[10px] font-bold leading-none ring-2 ring-white',
};
