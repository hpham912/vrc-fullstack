import React from 'react';
import { CustomTheme, CustomThemeStyle } from '../../types/index.ts';
import { useLanguage, type TranslationKey } from '../../context/LanguageContext.tsx';
import { CHURCH_NAME } from '../../constants/church.ts';
import { buildCustomGradient, getCustomBannerStyles, isValidHexColor } from '../../utils/customTheme.ts';
import { Plus, X } from 'lucide-react';
import { Button, TextField, ColorPicker, useIsDarkMode } from '../../common-component/index.ts';
import { customThemeCreatorStyles } from './CustomThemeCreator.styles.ts';

// A color slot in the creator: a stable id (the list key — the list
// can grow/shrink, so the index must not be the key) + the hex value.
export interface CustomColorSlot {
  id: string;
  value: string;
}

export const MAX_CUSTOM_COLORS = 5;

// How a custom theme's colors are arranged. The style picker shows a
// live swatch for each one, built from the colors the admin picked.
const CUSTOM_THEME_STYLE_KEYS: CustomThemeStyle[] = ['diagonal', 'horizontal', 'vertical', 'radial', 'bands'];
const CUSTOM_THEME_STYLE_LABEL_KEYS: Record<CustomThemeStyle, TranslationKey> = {
  diagonal: 'spotCustomStyleDiagonal',
  horizontal: 'spotCustomStyleHorizontal',
  vertical: 'spotCustomStyleVertical',
  radial: 'spotCustomStyleRadial',
  bands: 'spotCustomStyleBands',
};

interface CustomThemeCreatorProps {
  editingCustomId: string | null;
  name: string;
  onNameChange: (value: string) => void;
  style: CustomThemeStyle;
  onStyleChange: (style: CustomThemeStyle) => void;
  colors: CustomColorSlot[];
  onColorChange: (id: string, value: string) => void;
  onAddColor: () => void;
  onRemoveColor: (id: string) => void;
  buttonColor: string | null;
  onButtonColorChange: (value: string | null) => void;
  badgeColor: string | null;
  onBadgeColorChange: (value: string | null) => void;
  borderColor: string | null;
  onBorderColorChange: (value: string | null) => void;
  // The pill badge text for the live preview (the Vietnamese badge).
  badgeText: string;
  onCancel: () => void;
  onUse: () => void;
}

// The custom theme creator panel: name, style, up to 5 colors,
// button/pill/border overrides, and a live mini-banner preview.
// The parent owns all draft state; this component only renders it.
export const CustomThemeCreator: React.FC<CustomThemeCreatorProps> = ({
  editingCustomId,
  name,
  onNameChange,
  style,
  onStyleChange,
  colors,
  onColorChange,
  onAddColor,
  onRemoveColor,
  buttonColor,
  onButtonColorChange,
  badgeColor,
  onBadgeColorChange,
  borderColor,
  onBorderColorChange,
  badgeText,
  onCancel,
  onUse,
}) => {
  const { language, t } = useLanguage();
  // Dark mode, for the live preview (same darkening as the real banner).
  const isDark = useIsDarkMode();

  // The draft theme for the live preview (name + style + colors as
  // the admin is editing them, plus the per-element overrides).
  // Invalid hex values fall back to the default navy so the preview
  // never breaks mid-typing.
  const draftCustomTheme: CustomTheme = {
    id: editingCustomId ?? 'draft',
    name: name.trim() || t('spotCustomUntitled'),
    colors: colors.map((slot) => (isValidHexColor(slot.value) ? slot.value.trim() : '#0d2d64')),
    style,
    buttonColor,
    badgeColor,
    borderColor,
  };
  const draftPreviewStyles = getCustomBannerStyles(draftCustomTheme, isDark);

  // The three per-element colors: each is an override (null = auto,
  // derived from the first theme color). The picker shows the
  // effective color; picking a color sets the override, and Auto
  // clears it back to the derived color.
  const derivedElementColor = draftCustomTheme.colors[0] ?? '#0d2d64';
  const elementColorRows: {
    key: 'button' | 'badge' | 'border';
    labelKey: TranslationKey;
    value: string | null;
    onChange: (value: string | null) => void;
  }[] = [
    { key: 'button', labelKey: 'spotCustomButtonColor', value: buttonColor, onChange: onButtonColorChange },
    { key: 'badge', labelKey: 'spotCustomBadgeColor', value: badgeColor, onChange: onBadgeColorChange },
    { key: 'border', labelKey: 'spotCustomBorderColor', value: borderColor, onChange: onBorderColorChange },
  ];

  return (
    <div className={customThemeCreatorStyles.creatorPanel}>
      <div className={customThemeCreatorStyles.creatorHeader}>
        <span className={customThemeCreatorStyles.creatorTitle}>
          {editingCustomId ? t('spotCustomEditTitle') : t('spotCustomCreateTitle')}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className={customThemeCreatorStyles.customActionBtn}
          aria-label={t('commonClose')}
        >
          <X className={customThemeCreatorStyles.customActionIcon} />
        </button>
      </div>

      <TextField
        label={t('spotCustomName')}
        value={name}
        onChange={onNameChange}
        placeholder={t('spotCustomNamePlaceholder')}
      />

      {/* Style: how the colors are arranged. Each option shows
          a live swatch built from the draft colors. */}
      <div className={customThemeCreatorStyles.creatorFieldGroup}>
        <span className={customThemeCreatorStyles.creatorFieldLabel}>{t('spotCustomStyle')}</span>
        <div className={customThemeCreatorStyles.styleGrid}>
          {CUSTOM_THEME_STYLE_KEYS.map((styleKey) => {
            const isSelected = style === styleKey;
            return (
              <button
                key={styleKey}
                type="button"
                onClick={() => onStyleChange(styleKey)}
                className={`${customThemeCreatorStyles.styleBtnBase} ${
                  isSelected ? customThemeCreatorStyles.styleBtnSelected : customThemeCreatorStyles.styleBtnIdle
                }`}
              >
                <span
                  className={customThemeCreatorStyles.styleSwatch}
                  style={{
                    background: buildCustomGradient(draftCustomTheme.colors, styleKey),
                  }}
                />
                <span className={customThemeCreatorStyles.styleBtnText}>
                  {t(CUSTOM_THEME_STYLE_LABEL_KEYS[styleKey])}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors: up to 5, each a swatch + hex field. */}
      <div className={customThemeCreatorStyles.creatorFieldGroup}>
        <span className={customThemeCreatorStyles.creatorFieldLabel}>
          {t('spotCustomColors')} ({colors.length}/{MAX_CUSTOM_COLORS})
        </span>
        <div className={customThemeCreatorStyles.colorList}>
          {colors.map((slot, slotIndex) => (
            <div key={slot.id} className={customThemeCreatorStyles.colorRow}>
              <ColorPicker
                label={`${t('spotCustomColor')} ${slotIndex + 1}`}
                value={slot.value}
                onChange={(value) => onColorChange(slot.id, value)}
              />
              {colors.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveColor(slot.id)}
                  className={customThemeCreatorStyles.customActionBtn}
                  title={t('spotCustomRemoveColor')}
                  aria-label={`${t('spotCustomRemoveColor')} ${slotIndex + 1}`}
                >
                  <X className={customThemeCreatorStyles.customActionIcon} />
                </button>
              )}
            </div>
          ))}
        </div>
        {colors.length < MAX_CUSTOM_COLORS && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAddColor}
            leftIcon={<Plus className={customThemeCreatorStyles.saveIcon} />}
          >
            {t('spotCustomAddColor')}
          </Button>
        )}
      </div>

      {/* Button, pill & border colors: each has its own picker.
          Auto (unset) means the element follows the theme
          colors; picking a color overrides just that element. */}
      <div className={customThemeCreatorStyles.creatorFieldGroup}>
        <span className={customThemeCreatorStyles.creatorFieldLabel}>{t('spotCustomElements')}</span>
        <div className={customThemeCreatorStyles.colorList}>
          {elementColorRows.map((row) => {
            const isAuto = row.value === null;
            const effectiveColor = row.value ?? derivedElementColor;
            return (
              <div key={row.key} className={customThemeCreatorStyles.colorRow}>
                <ColorPicker
                  label={t(row.labelKey)}
                  value={effectiveColor}
                  onChange={(value) => row.onChange(value)}
                />
                {!isAuto && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => row.onChange(null)}
                    title={t('spotCustomAutoHint')}
                  >
                    {t('spotCustomAuto')}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <p className={customThemeCreatorStyles.fieldHint}>{t('spotCustomElementsHint')}</p>
      </div>

      {/* Live preview: a mini banner in the draft theme. */}
      <div className={customThemeCreatorStyles.creatorFieldGroup}>
        <span className={customThemeCreatorStyles.creatorFieldLabel}>{t('spotCustomPreview')}</span>
        <div
          className={customThemeCreatorStyles.previewBanner}
          style={{
            background: draftPreviewStyles.wrapperBackground,
            borderColor: draftPreviewStyles.borderColor,
          }}
        >
          <span
            className={customThemeCreatorStyles.previewBadge}
            style={{
              background: draftPreviewStyles.badgeBackground,
              color: draftPreviewStyles.badgeTextColor,
              borderColor: draftPreviewStyles.badgeBorderColor,
            }}
          >
            {badgeText || t('spotCustomPreviewBadge')}
          </span>
          <span className={customThemeCreatorStyles.previewTitle}>
            {CHURCH_NAME[language]}
          </span>
          <span className={customThemeCreatorStyles.previewSubtitle}>
            {draftCustomTheme.name}
          </span>
          <span
            className={customThemeCreatorStyles.previewBtn}
            style={{
              background: draftPreviewStyles.btnBackground,
              color: draftPreviewStyles.btnTextColor,
            }}
          >
            {t('spotCustomPreviewBtn')}
          </span>
        </div>
      </div>

      <div className={customThemeCreatorStyles.creatorActions}>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {t('commonCancel')}
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={onUse}>
          {t('spotCustomUse')}
        </Button>
      </div>
    </div>
  );
};
