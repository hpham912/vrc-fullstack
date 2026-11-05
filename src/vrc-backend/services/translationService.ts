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
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  if (!res.ok) {
    throw new Error(`Google Translate error: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0].map((item: any) => item[0]).join('');
  }
  return text;
}

// In-memory translation cache to make repeated translations instant
const translationCache = new Map<string, string>();

// Detect Vietnamese diacritics
function isLikelyVietnamese(text: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(text);
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

    const hasVi = isLikelyVietnamese(cleanText);
    // If already in target language, no need to translate
    if ((targetLang === 'en' && !hasVi) || (targetLang === 'vi' && hasVi)) {
      return {
        original: cleanText,
        translated: cleanText,
        bilingual: cleanText,
        sourceLang: hasVi ? 'vi' : 'en',
        targetLang,
      };
    }

    const cacheKey = `${targetLang}:${cleanText}`;
    const cached = translationCache.get(cacheKey);
    if (cached) {
      return {
        original: cleanText,
        translated: cached,
        bilingual: `${cleanText} • ${cached}`,
        sourceLang,
        targetLang,
      };
    }

    // Use Google Translate, then MyMemory fallback
    try {
      const translated = await googleTranslateFallback(cleanText, targetLang);
      const translatedStr = translated.trim();
      if (translatedStr && translatedStr !== cleanText) {
        translationCache.set(cacheKey, translatedStr);
        return {
          original: cleanText,
          translated: translatedStr,
          bilingual: `${cleanText} • ${translatedStr}`,
          sourceLang,
          targetLang,
        };
      }
    } catch (fallbackErr) {
      console.warn('Google Translate failed, trying MyMemory:', fallbackErr);
    }

    try {
      const sl = hasVi ? 'vi' : 'en';
      const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${sl}|${targetLang}`;
      const mmRes = await fetch(mmUrl);
      if (mmRes.ok) {
        const mmData = await mmRes.json();
        const mmText = mmData?.responseData?.translatedText?.trim();
        if (mmText && mmText !== cleanText) {
          translationCache.set(cacheKey, mmText);
          return {
            original: cleanText,
            translated: mmText,
            bilingual: `${cleanText} • ${mmText}`,
            sourceLang: sl,
            targetLang,
          };
        }
      }
    } catch (mmErr) {
      console.error('All translation providers failed:', mmErr);
    }

    return {
      original: cleanText,
      translated: cleanText,
      bilingual: cleanText,
      sourceLang,
      targetLang,
    };
  },

  // Batch translate multiple strings for public UI language switching
  async translateBatch(texts: string[], targetLang: 'vi' | 'en'): Promise<Record<string, string>> {
    const uniqueTexts = Array.from(new Set(texts.map((t) => (t || '').trim()).filter(Boolean)));
    const result: Record<string, string> = {};
    const missing: string[] = [];

    for (const t of uniqueTexts) {
      const cached = translationCache.get(`${targetLang}:${t}`);
      if (cached) {
        result[t] = cached;
      } else {
        missing.push(t);
      }
    }

    if (missing.length === 0) {
      return result;
    }

    // Try single batched Gemini call for all missing strings
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const targetName = targetLang === 'en' ? 'English' : 'Vietnamese';
        const prompt = `You are an expert bilingual translator for Vietnamese Revival Church (Hội Thánh Phục Hưng Việt Nam).
Translate each string in the JSON array below into ${targetName}.
Preserve Christian church terminology ("thờ phượng" = "worship", "thông công" = "fellowship", "bồi linh" = "revival", "Lời Chúa" = "God's Word", "Mục sư" = "Pastor", "Hội Thánh" = "Church").
Return a JSON object mapping each exact original string to its ${targetName} translation:
{
  "translations": {
    "original string 1": "translated string 1"
  }
}

Strings to translate:
${JSON.stringify(missing)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = (response.text || '{}').replace(/```json\s*|```/g, '').trim();
        const parsed = JSON.parse(rawText);
        if (parsed.translations && typeof parsed.translations === 'object') {
          for (const orig of missing) {
            const trans = parsed.translations[orig];
            if (typeof trans === 'string' && trans.trim()) {
              const cleanTrans = trans.trim();
              translationCache.set(`${targetLang}:${orig}`, cleanTrans);
              result[orig] = cleanTrans;
            }
          }
          if (Object.keys(result).length === uniqueTexts.length) {
            return result;
          }
        }
      } catch (err) {
        console.warn('Batch Gemini translation failed, falling back to per-item:', err);
      }
    }

    // Fallback for any remaining untranslated items in parallel
    const remaining = missing.filter((m) => !result[m]);
    if (remaining.length > 0) {
      await Promise.all(
        remaining.map(async (item) => {
          const res = await this.translate({ text: item, targetLang, context: 'church' });
          result[item] = res.translated;
        })
      );
    }

    return result;
  },

  // Translate a map of fields into both Vietnamese and English in parallel
  async translateBilingualFields(
    fields: Record<string, string | null | undefined>,
    context: 'church' | 'event' | 'scripture' | 'general' = 'church'
  ): Promise<Record<string, { vi: string | null; en: string | null }>> {
    const out: Record<string, { vi: string | null; en: string | null }> = {};
    const entries = Object.entries(fields);
    console.log(`[TranslationService] translateBilingualFields (${context}) input:`, fields);

    await Promise.all(
      entries.map(async ([key, rawVal]) => {
        const val = (rawVal || '').trim();
        if (!val) {
          out[key] = { vi: null, en: null };
          return;
        }
        const hasVi = isLikelyVietnamese(val);
        if (hasVi) {
          const enRes = await this.translate({ text: val, sourceLang: 'vi', targetLang: 'en', context });
          out[key] = { vi: val, en: enRes.translated || val };
        } else {
          const viRes = await this.translate({ text: val, sourceLang: 'en', targetLang: 'vi', context });
          out[key] = { vi: viRes.translated || val, en: val };
        }
      })
    );

    console.log(`[TranslationService] translateBilingualFields (${context}) output:`, out);
    return out;
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
