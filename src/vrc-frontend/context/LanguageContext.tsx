import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { translations, type Language, type TranslationKey } from './translations.ts';

export type { Language, TranslationKey } from './translations.ts';

const LANGUAGE_STORAGE_KEY = 'vrc_church_lang';

// The one place that knows where the saved language lives. The provider
// and notificationClient both read through here.
export function getSavedLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'vi';
  } catch {
    return 'vi';
  }
}

// Plain (non-React) lookup for code outside components — services and
// utils that can't call the useLanguage hook. Components use t() instead.
// A missing key falls back to the key itself, never a crash.
export function translate(key: TranslationKey, language: Language, params?: Record<string, string | number>): string {
  const entry = translations[key];
  let text = entry ? entry[language] || entry.en : key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  // params fill {placeholders} in the string, e.g. t('adminCreated', { username: 'Hoang' })
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: TranslationKey) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getSavedLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Storage unavailable — the language still applies for this session.
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  }, [language, setLanguage]);

  // Memoized so switching language re-renders consumers once, and the
  // context value keeps its identity between renders.
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => translate(key, language, params),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
