import { useState, useEffect, useCallback } from 'react';
import { Language } from '../context/LanguageContext.tsx';
import { apiUrl } from '../utils/api.ts';

const STORAGE_KEY = 'vrc_dynamic_translations_v2';

// Global in-memory cache: `${targetLang}:${text}` -> translatedText
const memoryCache = new Map<string, string>();

// Hydrate from localStorage once
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') {
          memoryCache.set(k, v);
        }
      }
    }
  }
} catch {
  // Ignore storage errors
}

function persistCache() {
  try {
    const obj: Record<string, string> = {};
    // Keep up to 300 most recent entries
    const entries = Array.from(memoryCache.entries()).slice(-300);
    for (const [k, v] of entries) {
      obj[k] = v;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage quota errors
  }
}

function isLikelyVietnamese(text: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(text);
}

function needsTranslation(text: string, targetLang: Language): boolean {
  const hasVi = isLikelyVietnamese(text);
  if (targetLang === 'en' && !hasVi) return false;
  if (targetLang === 'vi' && hasVi) return false;
  return true;
}

/**
 * Automatically translates an array of dynamic DB strings into `language` ('vi' | 'en')
 * using `/api/ai/translate-batch`, caching results in memory & localStorage.
 */
export function useAutoTranslate(texts: (string | null | undefined)[], language: Language) {
  const [, setTick] = useState(0);

  const cleanTexts = Array.from(
    new Set(
      texts
        .map((t) => (t || '').trim())
        .filter((t) => t.length > 0 && needsTranslation(t, language))
    )
  );

  const missingKey = cleanTexts
    .filter((t) => !memoryCache.has(`${language}:${t}`))
    .join('||');

  useEffect(() => {
    if (!missingKey) return;
    const missing = missingKey.split('||').filter(Boolean);
    if (missing.length === 0) return;

    let cancelled = false;

    fetch(apiUrl('/api/ai/translate-batch'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: missing, targetLang: language }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.translations) return;
        let updated = false;
        for (const [orig, trans] of Object.entries(data.translations)) {
          if (typeof trans === 'string' && trans.trim() && trans.trim() !== orig) {
            memoryCache.set(`${language}:${orig}`, trans.trim());
            updated = true;
          }
        }
        if (updated) {
          persistCache();
          setTick((n) => n + 1);
        }
      })
      .catch(() => {
        // Silently fall back to original text on network error
      });

    return () => {
      cancelled = true;
    };
  }, [missingKey, language]);

  const tr = useCallback(
    (text?: string | null): string => {
      if (!text) return '';
      const trimmed = text.trim();
      if (!trimmed) return '';
      return memoryCache.get(`${language}:${trimmed}`) || trimmed;
    },
    [language]
  );

  return { tr };
}
