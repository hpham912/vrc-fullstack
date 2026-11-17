import type { CustomTheme, CustomThemeStyle } from '../types/index.ts';

// Color helpers + gradient builder for admin-created custom banner
// themes. The presets use fixed Tailwind classes, but a custom theme's
// colors are only known at runtime, so its gradient is built here as
// an inline CSS background and applied via the style prop.

// --- color helpers ---

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

// Normalize a hex color to #rrggbb (expands #rgb). Anything that is
// not a valid hex color falls back to the default navy, so a bad value
// can never reach a CSS string (defense in depth — callers validate
// first, but this makes the function safe for any future caller).
export function normalizeHex(hex: string): string {
  if (!isValidHexColor(hex)) return '#0d2d64';
  const h = hex.trim().replace('#', '');
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return `#${h}`.toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex).replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// Darken a hex color by mixing it toward black. amount 0 = unchanged,
// 1 = black. Used for the dark-mode stops of a custom theme.
export function darkenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - Math.max(0, Math.min(1, amount));
  return rgbToHex(r * f, g * f, b * f);
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Relative luminance (0 = black, 1 = white). Used to pick readable
// text on top of a custom color.
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// True when a color is light enough for dark text on top of it.
// The threshold (0.35) is where dark text starts to beat white text
// on contrast: gold (#d4af37, luminance ~0.45) reads far better with
// dark text, while red/green/navy stay white.
export function isLightColor(hex: string): boolean {
  return luminance(hex) > 0.35;
}

// --- gradient builder ---

// Build the banner background from the theme's colors and style.
// With 1 color, the gradient runs from that color to a darker shade
// of itself so it still has depth.
export function buildCustomGradient(colors: string[], style: CustomThemeStyle): string {
  const list = colors.length > 0 ? colors.map(normalizeHex) : ['#0d2d64'];
  if (list.length === 1) {
    const color = list[0];
    const dark = darkenHex(color, 0.35);
    if (style === 'radial') return `radial-gradient(ellipse at center, ${color}, ${dark})`;
    if (style === 'bands') return color;
    return `linear-gradient(135deg, ${color}, ${dark})`;
  }
  switch (style) {
    case 'horizontal':
      return `linear-gradient(90deg, ${list.join(', ')})`;
    case 'vertical':
      return `linear-gradient(180deg, ${list.join(', ')})`;
    case 'radial':
      return `radial-gradient(ellipse at center, ${list.join(', ')})`;
    case 'bands': {
      // Hard stops: each color gets an equal slice with no blending.
      const n = list.length;
      const step = 100 / n;
      const stops: string[] = [];
      list.forEach((color, i) => {
        const start = (i * step).toFixed(2);
        const end = ((i + 1) * step).toFixed(2);
        stops.push(`${color} ${start}%`, `${color} ${end}%`);
      });
      return `linear-gradient(135deg, ${stops.join(', ')})`;
    }
    case 'diagonal':
    default:
      return `linear-gradient(135deg, ${list.join(', ')})`;
  }
}

// --- full banner style set ---

export interface CustomBannerStyles {
  wrapperBackground: string;
  borderColor: string;
  ringColor: string; // rgba
  glow1Background: string; // rgba
  glow2Background: string; // rgba
  btnBackground: string;
  btnTextColor: string;
  badgeBackground: string; // rgba
  badgeTextColor: string;
  badgeBorderColor: string; // rgba
  highlightColor: string;
}

// Resolve one per-element override to its effective color (darkened
// in dark mode, like the theme colors), or null when it is unset or
// not a valid hex color (the element then uses its derived color).
function resolveOverrideColor(value: string | null | undefined, isDark: boolean): string | null {
  if (!value || !isValidHexColor(value)) return null;
  return isDark ? darkenHex(normalizeHex(value), 0.35) : normalizeHex(value);
}

// Everything the banner needs to render a custom theme, in one place.
// Dark mode darkens every color (same idea as the presets' darker
// stops), so the banner stays readable when the app is dark. The
// per-element overrides (button/pill/border) are darkened the same
// way; when one is unset, that element uses its derived color.
export function getCustomBannerStyles(
  customTheme: CustomTheme,
  isDark: boolean
): CustomBannerStyles {
  const rawColors = customTheme.colors.length > 0 ? customTheme.colors : ['#0d2d64'];
  const colors = rawColors.map((color) =>
    isDark ? darkenHex(normalizeHex(color), 0.35) : normalizeHex(color)
  );
  const first = colors[0];
  const second = colors.length > 1 ? colors[1] : darkenHex(first, 0.25);
  const last = colors[colors.length - 1];
  const wrapperBackground = buildCustomGradient(colors, customTheme.style);
  // Button: an override is a gradient from the picked color to a
  // darker shade of itself (so it keeps the presets' gradient look);
  // auto is a gradient of the first two theme colors.
  const overrideButton = resolveOverrideColor(customTheme.buttonColor, isDark);
  const btnBackground = overrideButton
    ? `linear-gradient(90deg, ${overrideButton}, ${darkenHex(overrideButton, 0.25)})`
    : `linear-gradient(90deg, ${first}, ${second})`;
  const btnTextColor = isLightColor(overrideButton ?? first) ? '#0f172a' : '#ffffff';
  // Pill/badge: an override is a solid background with auto-contrast
  // text; auto is the dark translucent chip with the first color as
  // its text and border.
  const overrideBadge = resolveOverrideColor(customTheme.badgeColor, isDark);
  const badgeBackground = overrideBadge ?? 'rgba(0, 0, 0, 0.35)';
  const badgeTextColor = overrideBadge
    ? isLightColor(overrideBadge)
      ? '#0f172a'
      : '#ffffff'
    : first;
  const badgeBorderColor = overrideBadge ?? hexToRgba(first, 0.5);
  // Border + ring: an override, or the first theme color.
  const border = resolveOverrideColor(customTheme.borderColor, isDark) ?? first;
  return {
    wrapperBackground,
    borderColor: border,
    ringColor: hexToRgba(border, 0.2),
    glow1Background: hexToRgba(first, 0.4),
    glow2Background: hexToRgba(last, 0.35),
    btnBackground,
    btnTextColor,
    badgeBackground,
    badgeTextColor,
    badgeBorderColor,
    highlightColor: first,
  };
}

// Resolve the active custom theme from a spotlight config: the one
// named by customThemeId, falling back to the first saved theme.
export function resolveCustomTheme(
  customThemes: CustomTheme[] | undefined,
  customThemeId: string | null | undefined
): CustomTheme | null {
  if (!customThemes || customThemes.length === 0) return null;
  return customThemes.find((customTheme) => customTheme.id === customThemeId) ?? customThemes[0] ?? null;
}
