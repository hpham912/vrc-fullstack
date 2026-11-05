/**
 * No-op hook: all dynamic content is now stored bilingually in the database
 * and selected directly based on the active language.
 */
export function useAutoTranslate(_texts: (string | null | undefined)[], _language: string) {
  const tr = (text: string | null | undefined): string => {
    return text || '';
  };

  return { tr, isTranslating: false };
}
