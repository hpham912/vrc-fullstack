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
  // Only Reels are accepted (for now). fb.watch short links and
  // /share/v|/share/r links are accepted here so the admin can paste
  // them, but they do NOT play in Facebook's video embed — the server
  // resolves them to the real video URL (from the share page's og:url)
  // before storing, and rejects them if they do not resolve to a
  // Reel. Other Facebook video shapes (/watch, /videos, /posts) are
  // not accepted.
  if (host === 'fb.watch') {
    return clean;
  }
  if (host !== 'facebook.com' && host !== 'm.facebook.com') return null;
  if (
    /^\/reel\/\d+/.test(path) ||
    /^\/share\/[vr]\/[\w-]+/.test(path)
  ) {
    return clean;
  }
  return null;
}

// True only for a direct Reel link (facebook.com/reel/<id>). Used by
// the server to check that a share link resolved to a Reel, not to
// some other Facebook video shape.
export function isFacebookReelUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL((url || '').trim());
  } catch {
    return false;
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (host !== 'facebook.com' && host !== 'm.facebook.com') return false;
  return /^\/reel\/\d+/.test(parsed.pathname);
}

export function getFacebookEmbedUrl(videoUrl: string): string {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    videoUrl,
  )}&show_text=false&width=560`;
}

export function getFacebookWatchUrl(videoUrl: string): string {
  return videoUrl;
}
