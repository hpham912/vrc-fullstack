// Shared BannerBadge: the pill label on a banner (featured event,
// spotlight). The shape is fixed here; the colors come from the
// banner's theme, passed in via className (e.g. the banner theme's
// badgeText), so one component serves every theme and any future
// banner that needs the same pill. The text is the caller's job —
// pass the already language-picked string as children.
export const bannerBadgeStyles = {
  base: 'inline-flex items-center px-3 max-sm:[.large-font_&]:px-2.5 py-1 rounded-full backdrop-blur-md border text-label font-semibold max-w-[calc(100%-80px)] sm:max-w-none truncate',
};
