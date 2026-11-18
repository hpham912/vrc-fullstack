import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Banner } from '../banner/Banner.tsx';

interface OfflineBannerProps {
  isOnline: boolean;
  // Slides with the page content while pulling to refresh, like the
  // announcement banner below it.
  style?: React.CSSProperties;
}

// No-connection banner: a full-width amber strip under the header
// while the device reports no network. Renders nothing when online
// — it is persistent, not dismissible, because the state it reports
// (no connection) is still true until the connection returns. It
// reuses the shared Banner (strip variant, warn type) so it can
// never drift from the app's other banners. It has no retry button
// of its own: retrying while offline cannot work, the app reloads
// automatically the moment the connection returns, and the
// load-error view carries the manual Try again button.
export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, style }) => {
  const { t } = useLanguage();
  if (isOnline) return null;
  return (
    <div style={style}>
      <Banner type="warn" variant="strip" message={t('offlineMessage')} />
    </div>
  );
};
