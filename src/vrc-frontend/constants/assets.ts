import type { Language } from '../context/translations.ts';

// Brand image assets served from /public. Every church logo and home
// banner filename lives here and nowhere else, so renaming or replacing
// an image only needs one edit in this file — no hunting through
// components for hardcoded paths.

export const CHURCH_LOGO = {
  light: { en: '/church-logo.png', vi: '/church-logo-vi.png' },
  dark: { en: '/church-logo-dark.png', vi: '/church-logo-vi-dark.png' },
} as const;

export const HOME_BANNER = {
  light: { en: '/home-banner-en.png', vi: '/home-banner-vi.png' },
  dark: { en: '/home-banner-en-dark.png', vi: '/home-banner-vi-dark.png' },
} as const;

export type ColorTheme = 'light' | 'dark';

export function getChurchLogoSrc(language: Language, theme: ColorTheme): string {
  return CHURCH_LOGO[theme][language];
}

export function getHomeBannerSrc(language: Language, theme: ColorTheme): string {
  return HOME_BANNER[theme][language];
}
