import React from 'react';
import { useLanguage } from '../../vrc-frontend/context/LanguageContext.tsx';
import { CHURCH_NAME } from '../../vrc-frontend/constants/church.ts';
import { APP_VERSION, APP_BUILD_DATE } from '../../vrc-frontend/constants/version.ts';
import { CrossIcon } from '../../vrc-frontend/components/cross-icon/CrossIcon.tsx';
import { appFooterStyles as s } from './AppFooter.styles.ts';

interface AppFooterProps {
  onNavigateTab: (tab: string) => void;
}

// The desktop footer (brand, tab links, copyright, version) plus the
// mobile version bar shown below the content on phones.
export const AppFooter: React.FC<AppFooterProps> = ({ onNavigateTab }) => {
  const { t } = useLanguage();

  return (
    <>
      <footer className={s.desktopFooter}>
        <div className={s.footerTopRow}>
          <div className={s.footerBrandGroup}>
            <span className={s.footerBrandEn}>
              <CrossIcon className={s.locationIcon} />
              <span>{CHURCH_NAME.en}</span>
            </span>
            <span className={s.footerBrandDivider}>|</span>
            <span className={s.footerBrandVi}>{CHURCH_NAME.vi}</span>
          </div>

          <div className={s.footerLinksGroup}>
            <button onClick={() => onNavigateTab('home')} className={s.footerLinkBtn}>
              {t('navHome')}
            </button>
            <button onClick={() => onNavigateTab('events')} className={s.footerLinkBtn}>
              {t('navEvents')}
            </button>
            <button onClick={() => onNavigateTab('verse')} className={s.footerLinkBtn}>
              {t('navVerse')}
            </button>
            <button onClick={() => onNavigateTab('videos')} className={s.footerLinkBtn}>
              {t('navVideos')}
            </button>
          </div>
        </div>

        <div className={s.footerBottomRow}>
          <p>© {new Date().getFullYear()} {CHURCH_NAME.en} • Tempe, Arizona</p>
          <div className={s.footerMetaRight}>
            <span className={s.footerVersion}>v{APP_VERSION} ({APP_BUILD_DATE})</span>
          </div>
        </div>
      </footer>

      <div className={s.mobileVersionBar}>
        v{APP_VERSION} • {APP_BUILD_DATE}
      </div>
    </>
  );
};
