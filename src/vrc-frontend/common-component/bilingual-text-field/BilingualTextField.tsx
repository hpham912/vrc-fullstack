// Shared bilingual text field — one topic in two languages, the
// Scripture Pool form's pattern (design v3): a topic heading, then a
// "Tiếng Việt" sub-label above the Vietnamese field and an "English"
// sub-label above the English field, stacked. It wraps the shared
// TextField (single-line or multiline) — it never builds its own
// inputs. The language sub-labels come from the commonLangVi /
// commonLangEn translation keys, so callers never pass them.
// The topic heading (label) is optional: most callers pass it, but
// the Spotlight banner modal already renders its own step heading
// (with a hint) above the fields, so it omits the label here to
// avoid rendering the heading twice.
import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { TextField } from '../text-field/TextField.tsx';
import { bilingualTextFieldStyles } from './BilingualTextField.styles.ts';

export interface BilingualTextFieldProps {
  // Topic heading, already translated by the caller (e.g. t('poolReflectionLabel')).
  // Omit it only when the caller already renders its own heading above the fields.
  label?: string;
  valueVi: string;
  onChangeVi: (value: string) => void;
  valueEn: string;
  onChangeEn: (value: string) => void;
  placeholderVi?: string;
  placeholderEn?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
}

export const BilingualTextField: React.FC<BilingualTextFieldProps> = ({
  label,
  valueVi,
  onChangeVi,
  valueEn,
  onChangeEn,
  placeholderVi,
  placeholderEn,
  multiline = false,
  rows = 3,
  disabled = false,
}) => {
  const { t } = useLanguage();
  return (
    <div className={bilingualTextFieldStyles.fieldGroup}>
      {label && <span className={bilingualTextFieldStyles.fieldLabel}>{label}</span>}
      <span className={bilingualTextFieldStyles.langLabel}>{t('commonLangVi')}</span>
      <TextField
        multiline={multiline}
        rows={rows}
        value={valueVi}
        onChange={onChangeVi}
        placeholder={placeholderVi}
        disabled={disabled}
      />
      <span className={bilingualTextFieldStyles.langLabel}>{t('commonLangEn')}</span>
      <TextField
        multiline={multiline}
        rows={rows}
        value={valueEn}
        onChange={onChangeEn}
        placeholder={placeholderEn}
        disabled={disabled}
      />
    </div>
  );
};
