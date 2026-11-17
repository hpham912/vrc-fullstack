import React from 'react';
import { useLanguage } from '../../vrc-frontend/context/LanguageContext.tsx';
import { CHURCH_NAME } from '../../vrc-frontend/constants/church.ts';
import { getHomeBannerSrc } from '../../vrc-frontend/constants/assets.ts';
import { DEFAULT_HEADER_VERSE } from '../../vrc-frontend/types/index.ts';
import type { ChurchInfo } from '../../vrc-frontend/types/index.ts';
import { CrossIcon } from '../../vrc-frontend/components/cross-icon/CrossIcon.tsx';
import { Button } from '../../vrc-frontend/common-component/index.ts';
import { Home, Calendar, BookOpen, Video as VideoIcon, ShieldCheck, Pencil } from 'lucide-react';
import { appHeroStyles as s } from './AppHero.styles.ts';

interface AppHeroProps {
  activeTab: string;
  isAdmin: boolean;
  churchInfo: ChurchInfo | null;
  pullContentStyle: React.CSSProperties;
  onOpenHeaderVerseEditor: () => void;
  onOpenAdminPortal: () => void;
  onTabChange: (tab: string) => void;
}

// The hero section under the fixed header: location pill, light/dark
// home banner, the admin-chosen header verse, the Admin Dashboard
// button, and the desktop segmented nav. On non-Home tabs for
// non-admins it is nav-only — just enough top padding to clear the
// fixed header on mobile (no empty gap, nothing cut off).
export const AppHero: React.FC<AppHeroProps> = ({
  activeTab,
  isAdmin,
  churchInfo,
  pullContentStyle,
  onOpenHeaderVerseEditor,
  onOpenAdminPortal,
  onTabChange,
}) => {
  const { language, t } = useLanguage();

  const desktopNavItems = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'events', label: t('navEvents'), icon: Calendar },
    { id: 'verse', label: t('navVerse'), icon: BookOpen },
    { id: 'videos', label: t('navVideos'), icon: VideoIcon },
  ];

  return (
    <div
      className={activeTab === 'home' || isAdmin ? s.heroSection : s.heroSectionNavOnly}
      style={pullContentStyle}
    >
      <div className={s.heroInner}>
        {activeTab === 'home' && (
          <>
            <div className={s.locationPill}>
              <CrossIcon className={s.locationIcon} />
              <span className={s.labelFull}>{t('heroLocation')}</span>
              <span className={s.labelShort}>{t('heroLocationShort')}</span>
            </div>

            <div className={s.titleWrapper}>
              <img
                src={getHomeBannerSrc(language, 'light')}
                alt={language === 'en' ? CHURCH_NAME.en : CHURCH_NAME.vi}
                className={`${s.homeBannerImg} dark:hidden`}
                onError={(e) => {
                  // If the banner file is missing from the deployed build,
                  // hide the broken image instead of showing a broken icon.
                  e.currentTarget.style.display = 'none';
                }}
              />
              <img
                src={getHomeBannerSrc(language, 'dark')}
                alt={language === 'en' ? CHURCH_NAME.en : CHURCH_NAME.vi}
                className={`${s.homeBannerImg} hidden dark:block`}
                onError={(e) => {
                  // If the dark banner file is missing from the deployed
                  // build, fall back to the light banner for this language
                  // instead of showing a broken image. Only swap once.
                  const img = e.currentTarget;
                  const fallback = getHomeBannerSrc(language, 'light');
                  if (!img.src.endsWith(fallback)) {
                    img.src = fallback;
                  } else {
                    img.style.display = 'none';
                  }
                }}
              />
            </div>

            {/* Subtitle Scripture Verse chosen by Admin */}
            {(() => {
              const currentHeaderVerse = churchInfo?.headerVerse || DEFAULT_HEADER_VERSE;
              const verseText = language === 'en'
                ? (currentHeaderVerse.verseTextEn || currentHeaderVerse.verseTextVi)
                : (currentHeaderVerse.verseTextVi || currentHeaderVerse.verseTextEn);
              const verseRef = language === 'en'
                ? (currentHeaderVerse.referenceEn || currentHeaderVerse.referenceVi)
                : (currentHeaderVerse.referenceVi || currentHeaderVerse.referenceEn);

              return (
                <div className={s.heroVerseWrapper}>
                  <p className={s.heroVerseQuote}>
                    "{verseText}"
                    <span className={s.heroVerseRef}>— {verseRef}</span>
                  </p>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={onOpenHeaderVerseEditor}
                      className={s.heroVerseEditBtn}
                      title={t('headerVerseEditBtn')}
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{t('headerVerseEditBtn')}</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </>
        )}

        {/* Admin Dashboard Action Button */}
        {isAdmin && (
          <div className={s.adminBtnWrapper}>
            <Button
              type="button"
              variant="darkAmber"
              size="pillSm"
              onClick={onOpenAdminPortal}
              leftIcon={<ShieldCheck className={s.adminBtnIcon} />}
              title="Admin Dashboard"
            >
              <span>Admin Dashboard</span>
            </Button>
          </div>
        )}

        {/* Quick Segmented Navigation Switcher */}
        <nav className={s.desktopNav}>
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`${s.desktopNavItemBase} ${
                  isActive ? s.desktopNavItemActive : s.desktopNavItemInactive
                }`}
              >
                <Icon className={s.desktopNavIcon} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
