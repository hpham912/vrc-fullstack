// Facebook helpers for sermons (Bài Giảng): validate a Facebook video
// link and build the embed URL. The video itself is never stored — it
// streams from Facebook, so the app only ever keeps the link, the
// bilingual title + description, and the Sunday date.
//
// Unlike YouTube there is no free public thumbnail URL for a Facebook
// video (that needs the Graph API + an access token), so sermon cards
// show a Facebook placeholder thumbnail instead of the video's own
// image. The player itself is Facebook's official video embed, which
// works for any public video.
//
// SHARED by the frontend and the backend (vrc-shared): the phone app
// uses these to validate a pasted link and build the embed URL for the
// player; the server uses extractFacebookVideoUrl to validate a link
// on save and store it. One copy here — both sides import it — so the
// URL shapes can never drift apart.

export function extractFacebookVideoUrl(url: string): string | null {
  const clean = (url || '').trim();
  if (!clean) return null;
  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const path = parsed.pathname;
  // fb.watch short links resolve to a video on Facebook's side, and the
  // embed accepts them as-is.
  if (host === 'fb.watch') {
    return clean;
  }
  if (host !== 'facebook.com' && host !== 'm.facebook.com') return null;
  // A watch page needs a video id (?v=...); the other shapes carry the
  // id in the path. A post link may hold a video, so it is accepted too.
  if (path === '/watch' || path.startsWith('/watch/')) {
    return parsed.searchParams.get('v') ? clean : null;
  }
  if (
    /\/videos\/\d+/.test(path) ||
    /^\/reel\/\d+/.test(path) ||
    /^\/share\/[vr]\/[\w-]+/.test(path) ||
    /\/posts\/\d+/.test(path)
  ) {
    return clean;
  }
  return null;
}

export function getFacebookEmbedUrl(videoUrl: string): string {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    videoUrl,
  )}&show_text=false&width=560`;
}

export function getFacebookWatchUrl(videoUrl: string): string {
  return videoUrl;
}
