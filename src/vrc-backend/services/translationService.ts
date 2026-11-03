import { GoogleGenAI } from '@google/genai';

export interface TranslateRequest {
  text: string;
  sourceLang?: 'auto' | 'vi' | 'en';
  targetLang?: 'vi' | 'en';
  context?: 'church' | 'event' | 'scripture' | 'general';
}

export interface TranslateResult {
  original: string;
  translated: string;
  bilingual: string;
  sourceLang: string;
  targetLang: string;
}

// Fallback to public Google Translate endpoint (gtx)
async function googleTranslateFallback(text: string, targetLang: 'vi' | 'en'): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Translate error: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0].map((item: any) => item[0]).join('');
  }
  return text;
}

export const TranslationService = {
  async translate({ text, sourceLang = 'auto', targetLang = 'en', context = 'church' }: TranslateRequest): Promise<TranslateResult> {
    const cleanText = text.trim();
    if (!cleanText) {
      return {
        original: '',
        translated: '',
        bilingual: '',
        sourceLang,
        targetLang,
      };
    }

    // Try Gemini first if API key is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI();
        const prompt = `You are an expert bilingual translator for Vietnamese Revival Church (Hội Thánh Phục Hưng Việt Nam).
Translate the following church ministry text from ${sourceLang === 'auto' ? 'detect language (Vietnamese or English)' : sourceLang} to ${targetLang}.
Context: ${context}.
Preserve sacred Christian church terminology (e.g., "thờ phượng" = "worship", "thông công" = "fellowship", "bồi linh" = "revival", "Lời Chúa" = "God's Word", "Mục sư" = "Pastor", "Hội Thánh" = "Church").
Keep the tone welcoming, pastoral, and clear.

Text to translate:
"""
${cleanText}
"""

Return strictly valid JSON:
{
  "sourceLang": "detected source language code ('vi' or 'en')",
  "targetLang": "${targetLang}",
  "translated": "translated text only",
  "bilingual": "natural combined bilingual format if title/short sentence (e.g. 'Vietnamese Title • English Title')"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.translated) {
          return {
            original: cleanText,
            translated: parsed.translated.trim(),
            bilingual: parsed.bilingual?.trim() || `${cleanText} • ${parsed.translated.trim()}`,
            sourceLang: parsed.sourceLang || sourceLang,
            targetLang,
          };
        }
      } catch (geminiErr) {
        console.warn('Gemini translation failed, falling back to Google Translate:', geminiErr);
      }
    }

    // Fallback using Google Translate
    try {
      const translated = await googleTranslateFallback(cleanText, targetLang);
      return {
        original: cleanText,
        translated: translated.trim(),
        bilingual: `${cleanText} • ${translated.trim()}`,
        sourceLang,
        targetLang,
      };
    } catch (fallbackErr) {
      console.error('All translation providers failed:', fallbackErr);
      return {
        original: cleanText,
        translated: cleanText,
        bilingual: cleanText,
        sourceLang,
        targetLang,
      };
    }
  },

  // Translate full scripture devotional package
  async translateDevotional(fields: { reference?: string; verseText?: string; reflection?: string; prayer?: string }, targetLang: 'vi' | 'en') {
    const results: Record<string, string> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val && typeof val === 'string' && val.trim()) {
        const res = await this.translate({ text: val, targetLang, context: 'scripture' });
        results[key] = res.translated;
      }
    }
    return results;
  },
};
