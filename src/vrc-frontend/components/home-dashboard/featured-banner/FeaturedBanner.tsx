import React from 'react';
import { ChurchEvent, SpotlightBannerConfig, SpotlightTheme } from '../../../types/index.ts';
import { useLanguage } from '../../../context/LanguageContext.tsx';
import {
  Calendar,
  MapPin,
  ArrowRight,
  Sliders,
  Navigation,
} from 'lucide-react';
import { Button, CountdownTimer, BannerBadge } from '../../../common-component/index.ts';
import { CHURCH_NAME } from '../../../constants/church.ts';
import {
  formatDateLocale,
  formatWeekdayAndDate,
} from '../../../utils/dateFormatter.ts';
import { getEventStartDate } from '../../../utils/calendar.ts';
import { featuredBannerStyles as s } from './FeaturedBanner.styles.ts';

interface FeaturedBannerProps {
  activeEvent: ChurchEvent | null;
  spotlightConfig: SpotlightBannerConfig;
  isAutoMode: boolean;
  churchAddress: string;
  isAdmin: boolean;
  onOpenSpotlightEditor?: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenDirections: (target: { name: string; address: string; location?: string }) => void;
}

// Compute theme background styling and iconic motifs for the spotlight / holiday banner.
// Every theme uses the same border design (Hoang's pick from Classic / Design E):
// a 2px solid border + a 4px ring halo, in that theme's own accent color.
// Dark mode gets a darker gradient (same hue, darker stops) so the banner
// reads darker when the app is dark; the border + text stay bright.
const getBannerThemeClasses = (theme: SpotlightTheme = 'thanksgiving') => {
  switch (theme) {
    case 'thanksgiving':
      // Redesigned (Hoang): more orange and a bit lighter so it is easier to see.
      return {
        wrapper: 'bg-gradient-to-br from-[#8a4a16] via-[#5c2e0b] to-[#9c5a1a] dark:from-[#5a2f0e] dark:via-[#3a1d06] dark:to-[#6b3d10] border-2 border-orange-400 ring-4 ring-orange-400/20 shadow-2xl',
        glow1: 'bg-orange-500/40',
        glow2: 'bg-amber-500/30',
        badgeText: 'text-amber-200 border-amber-400/50 bg-amber-950/70',
        btnPrimary: 'bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-stone-950 font-bold shadow-lg shadow-orange-500/20',
        highlightTag: 'text-amber-300',
      };
    case 'christmas':
      // Redesigned (Hoang): more green and red, and the two glow orbs are
      // stronger so they read as blurry Christmas lights (soft light
      // behind a mirror). The glows are the banner's two blurred circles
      // (top-right = glow1, bottom-left = glow2).
      return {
        wrapper: 'bg-gradient-to-br from-[#991b1b] via-[#166534] to-[#991b1b] dark:from-[#5f1414] dark:via-[#0f3d20] dark:to-[#5f1414] border-2 border-red-500 ring-4 ring-red-500/20 shadow-2xl shadow-[0_0_40px_rgba(220,38,38,0.2)]',
        glow1: 'bg-red-500/50',
        glow2: 'bg-emerald-500/50',
        badgeText: 'text-amber-200 border-amber-300/50 bg-red-950/75',
        btnPrimary: 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-bold shadow-lg shadow-amber-400/25',
        highlightTag: 'text-red-300',
      };
    case 'easter':
      return {
        wrapper: 'bg-gradient-to-br from-[#200d33] via-[#181124] to-[#2c131a] dark:from-[#150822] dark:via-[#0f0a18] dark:to-[#1d0c12] border-2 border-purple-400 ring-4 ring-purple-400/20 shadow-2xl',
        glow1: 'bg-purple-500/30',
        glow2: 'bg-amber-500/25',
        badgeText: 'text-amber-200 border-purple-400/50 bg-purple-950/70',
        btnPrimary: 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-stone-950 font-bold shadow-lg shadow-amber-400/20',
        highlightTag: 'text-purple-300',
      };
    case 'revival':
      return {
        wrapper: 'bg-gradient-to-br from-[#0c1833] via-[#131124] to-[#360e15] dark:from-[#081022] dark:via-[#0c0a18] dark:to-[#240910] border-2 border-cyan-400 ring-4 ring-cyan-400/20 shadow-2xl',
        glow1: 'bg-cyan-500/30',
        glow2: 'bg-rose-500/30',
        badgeText: 'text-cyan-200 border-cyan-400/50 bg-blue-950/70',
        btnPrimary: 'bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-stone-950 font-bold shadow-lg shadow-cyan-400/20',
        highlightTag: 'text-cyan-300',
      };
    case 'special':
      return {
        wrapper: 'bg-gradient-to-br from-[#092b23] via-[#101e2b] to-[#2a0e36] dark:from-[#061d17] dark:via-[#0a141d] dark:to-[#1c0924] border-2 border-teal-400 ring-4 ring-teal-400/20 shadow-2xl',
        glow1: 'bg-teal-500/35',
        glow2: 'bg-purple-500/30',
        badgeText: 'text-teal-200 border-teal-400/50 bg-teal-950/70',
        btnPrimary: 'bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-stone-950 font-bold shadow-lg shadow-teal-400/20',
        highlightTag: 'text-teal-300',
      };
    default:
      // Design E (Hoang's pick) — only the Classic theme gets the
      // bright navy + gold look. The holiday themes above keep their
      // own colors so each one still looks different.
      return {
        wrapper: 'bg-gradient-to-br from-[#143A75] via-[#0D2D64] to-[#081F47] dark:from-[#0c2347] dark:via-[#081a33] dark:to-[#040d1a] border-2 border-[#E3B93B] ring-4 ring-[#C9A227]/20 shadow-2xl',
        glow1: 'bg-[#E3B93B]/30',
        glow2: 'bg-[#4a8ac9]/25',
        badgeText: 'bg-[#E3B93B] text-[#0D2D64] border-[#E3B93B]',
        btnPrimary: 'bg-[#E3B93B] hover:bg-[#F0D060] text-[#0D2D64] font-bold shadow-lg shadow-[#E3B93B]/25',
        highlightTag: 'text-[#E3B93B]',
      };
  }
};

export const FeaturedBanner: React.FC<FeaturedBannerProps> = ({
  activeEvent,
  spotlightConfig,
  isAutoMode,
  churchAddress,
  isAdmin,
  onOpenSpotlightEditor,
  onNavigateTab,
  onOpenDirections,
}) => {
  const { language, t } = useLanguage();

  // Determine active theme: If theme is set to thanksgiving/christmas/easter/revival/special, ALWAYS honor it!
  const currentThemeKey: SpotlightTheme =
    spotlightConfig.theme && spotlightConfig.theme !== 'default'
      ? spotlightConfig.theme
      : (activeEvent?.category.toLowerCase().includes('youth')
          ? 'special'
          : activeEvent?.category.toLowerCase().includes('thanksgiving')
          ? 'thanksgiving'
          : activeEvent?.category.toLowerCase().includes('christmas')
          ? 'christmas'
          : activeEvent?.category.toLowerCase().includes('revival')
          ? 'revival'
          : (spotlightConfig.theme || 'default'));

  const bannerTheme = getBannerThemeClasses(currentThemeKey);

  // Default Church Address and Maps URL set in Schedule
  const defaultChurchAddress = churchAddress;

  // Check if active event specifies a custom address different from church schedule address
  const activeEventAddress = (activeEvent?.address || '').trim();
  const hasCustomEventAddress =
    Boolean(activeEventAddress) &&
    activeEventAddress.toLowerCase() !== defaultChurchAddress.toLowerCase();

  const displayAddress = hasCustomEventAddress
    ? activeEventAddress
    : defaultChurchAddress;

  // Compute displayed banner content (auto mode always dynamically derives from next upcoming event)
  const displayBadge = spotlightConfig.badge?.trim()
    ? spotlightConfig.badge.trim()
    : (activeEvent
        ? `${activeEvent.category} • ${formatDateLocale(activeEvent.date, language)}`
        : t('homeFeaturedEvent'));

  const displayTitle = isAutoMode
    ? (activeEvent ? activeEvent.title : CHURCH_NAME.vi)
    : (activeEvent ? activeEvent.title : (spotlightConfig.title || CHURCH_NAME.vi));

  const displaySubtitle = spotlightConfig.subtitle?.trim()
    ? spotlightConfig.subtitle.trim()
    : (activeEvent ? `Sự kiện: ${activeEvent.category} tại ${activeEvent.location}` : undefined);

  const displayDescription = isAutoMode
    ? (activeEvent ? activeEvent.description : (spotlightConfig.description || t('dashboardSub')))
    : (activeEvent ? activeEvent.description : (spotlightConfig.description || t('dashboardSub')));

  const displayDateTag = isAutoMode
    ? (activeEvent ? `${formatWeekdayAndDate(activeEvent.date, language)} • ${activeEvent.startTime}` : 'Chúa Nhật Hàng Tuần • 3:00 PM')
    : (activeEvent ? `${formatWeekdayAndDate(activeEvent.date, language)} • ${activeEvent.startTime}` : (spotlightConfig.dateTag || 'Chúa Nhật Hàng Tuần • 3:00 PM'));

  const displayLocationTag = isAutoMode
    ? (activeEvent ? (activeEvent.location || displayAddress) : displayAddress)
    : (activeEvent ? (activeEvent.location || displayAddress) : (spotlightConfig.locationTag || displayAddress));

  // The venue name in the current app language — the location chip
  // and the Directions button both use this, so they stay in sync.
  const displayLocation = language === 'vi'
    ? (activeEvent?.locationVi || spotlightConfig?.locationTagVi || (displayLocationTag || ''))
    : (activeEvent?.locationEn || spotlightConfig?.locationTagEn || (displayLocationTag || ''));

  // Countdown target for the flip-clock on the featured banner —
  // the featured event's start. Null when there is no featured
  // event (the countdown hides itself).
  const countdownTarget = activeEvent ? getEventStartDate(activeEvent) : null;

  return (
    <div className={`${s.heroBannerBase} ${bannerTheme.wrapper}`}>
      {/* Ambient Glows */}
      <div className={`${s.glowTopRight} ${bannerTheme.glow1}`} />
      <div className={`${s.glowBottomLeft} ${bannerTheme.glow2}`} />

      <div className={s.heroContent}>
        {/* Top Row: Clean Themed Badge Pill + Admin Customizer Button */}
        <div className={s.heroTopRow}>
          <BannerBadge className={bannerTheme.badgeText}>
            {language === 'vi' ? (spotlightConfig?.badgeVi || (displayBadge || '')) : (spotlightConfig?.badgeEn || (displayBadge || ''))}
          </BannerBadge>

          {isAdmin && onOpenSpotlightEditor && (
            <Button
              type="button"
              variant="glassDark"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenSpotlightEditor();
              }}
              leftIcon={<Sliders className="w-3.5 h-3.5 text-amber-300" />}
              title="Tuỳ chỉnh banner trang chủ (Thanksgiving, Christmas, Easter...)"
            >
              <span className="hidden sm:inline">{t('homeCustomizeBanner')}</span>
              <span className="sm:hidden">{t('commonEdit')}</span>
            </Button>
          )}
        </div>

        {/* Title & Subtitle */}
        <div className={s.heroTitleGroup}>
          <h1 className={s.heroTitle}>
            {language === 'vi' ? (activeEvent?.titleVi || spotlightConfig?.titleVi || (displayTitle || '')) : (activeEvent?.titleEn || spotlightConfig?.titleEn || (displayTitle || ''))}
          </h1>

          {displaySubtitle && (
            <div className={s.heroSubtitleBox}>
              {language === 'vi' ? (spotlightConfig?.subtitleVi || (displaySubtitle || '')) : (spotlightConfig?.subtitleEn || (displaySubtitle || ''))}
            </div>
          )}

          <p className={s.heroDesc}>
            {language === 'vi' ? (activeEvent?.descriptionVi || spotlightConfig?.descriptionVi || (displayDescription || '')) : (activeEvent?.descriptionEn || spotlightConfig?.descriptionEn || (displayDescription || ''))}
          </p>
        </div>

        {/* Date & Location Chips */}
        <div className={s.metaChipsRow}>
          {displayDateTag && (
            <span className={s.metaChip}>
              <Calendar className={s.metaChipIcon} />
              <span>{displayDateTag}</span>
            </span>
          )}
          <span className={s.metaChip}>
            <MapPin className={s.metaChipIcon} />
            <span>{displayLocation}</span>
          </span>
        </div>

        {/* Flip-clock countdown (Design F) to the featured event's start */}
        <CountdownTimer targetDate={countdownTarget} />

        {/* Action Buttons Row */}
        <div className={s.actionBtnsRow}>
          <Button
            type="button"
            size="lg"
            onClick={() => onNavigateTab('events')}
            className={bannerTheme.btnPrimary}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            <span className={s.labelFull}>{t('homeViewEvents')}</span>
            <span className={s.labelShort}>{t('homeViewEventsShort')}</span>
          </Button>
          <Button
            type="button"
            variant="glassDark"
            size="lg"
            onClick={() => {
              onOpenDirections({
                name: displayTitle,
                address: displayAddress,
                location: displayLocation || undefined,
              });
            }}
            leftIcon={<Navigation className="w-3.5 h-3.5 text-amber-300" />}
          >
            <span>{t('homeDirections')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
