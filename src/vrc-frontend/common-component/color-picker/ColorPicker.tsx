import React from 'react';
import { colorPickerStyles as s } from './ColorPicker.styles.ts';

export interface ColorPickerProps {
  label?: string;
  // Hex color, e.g. '#991b1b'. The parent owns the value.
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// A color picker: a swatch (the browser's native color picker) plus a
// hex field so the admin can type or paste an exact code. Used by the
// custom banner theme creator (up to 5 colors per theme). When the
// hex text is not a valid color, the swatch keeps showing the last
// valid one instead of breaking.
export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  const isValidHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
  const swatchValue = isValidHex ? value.trim() : '#000000';
  return (
    <div className={s.field}>
      {label && <label className={s.label}>{label}</label>}
      <div className={s.row}>
        <label
          className={s.swatchWrap}
          style={{ background: swatchValue }}
          title={label ?? value}
        >
          <input
            type="color"
            value={swatchValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={s.swatchInput}
            aria-label={label ?? 'Color'}
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={s.hexInput}
          placeholder="#000000"
          maxLength={7}
          aria-label={label ? `${label} hex` : 'Hex color'}
          spellCheck={false}
        />
      </div>
    </div>
  );
};
