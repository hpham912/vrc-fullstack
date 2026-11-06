/**
 * Directions routing utilities for Google Maps and Apple Maps.
 *
 * Omitting origin/saddr ensures both map providers automatically use the user's
 * current GPS location as the starting point, enabling instant turn-by-turn navigation.
 */

export function getGoogleMapsDirectionsUrl(destination: string): string {
  const clean = destination?.trim() || 'Tempe, Arizona';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clean)}&travelmode=driving&dir_action=navigate`;
}

export function getAppleMapsDirectionsUrl(destination: string): string {
  const clean = destination?.trim() || 'Tempe, Arizona';
  return `https://maps.apple.com/?daddr=${encodeURIComponent(clean)}&dirflg=d`;
}

export function openDirections(destination: string, provider: 'google' | 'apple'): void {
  const url = provider === 'apple' ? getAppleMapsDirectionsUrl(destination) : getGoogleMapsDirectionsUrl(destination);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
