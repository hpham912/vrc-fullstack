// YouTube helpers for videos (Video tab): extract the 11-char video ID
// from any YouTube link shape, and build embed / thumbnail / watch URLs.
// The video itself is never stored — it streams from YouTube, so the app
// only ever keeps the link, the video ID, and the bilingual title +
// description.
//
// SHARED by the frontend and the backend (vrc-shared): the phone app uses
// these to show the thumbnail preview when an admin pastes a link and to
// build the thumbnail / embed URLs for the video cards and player; the
// server uses extractYouTubeVideoId to validate a link on save and store
// the video ID. One copy here — both sides import it — so the regex and
// URL shapes can never drift apart.

export function extractYouTubeVideoId(url: string): string | null {
  const clean = (url || '').trim();
  if (!clean) return null;
  // A bare 11-char video ID pasted on its own is fine too.
  if (/^[A-Za-z0-9_-]{11}$/.test(clean)) return clean;
  const patterns = [
    /(?:[?&]v=)([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`;
}

export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
