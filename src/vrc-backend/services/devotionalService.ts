import { TranslationService } from './translationService.ts';

const VI_TO_EN_BOOKS: Record<string, string> = {
  'sáng thế ký': 'Genesis',
  'xuất ê-díp-tô ký': 'Exodus',
  'lê-vi ký': 'Leviticus',
  'dân-số ký': 'Numbers',
  'phục-truyền luật-lệ ký': 'Deuteronomy',
  'giô-suê': 'Joshua',
  'các quan xét': 'Judges',
  'ru-tơ': 'Ruth',
  '1 sa-mu-ên': '1 Samuel',
  '2 sa-mu-ên': '2 Samuel',
  '1 các vua': '1 Kings',
  '2 các vua': '2 Kings',
  '1 sử ký': '1 Chronicles',
  '2 sử ký': '2 Chronicles',
  'e-xơ-ra': 'Ezra',
  'nê-hê-mi': 'Nehemiah',
  'ê-xơ-tê': 'Esther',
  'gióp': 'Job',
  'thi thiên': 'Psalms',
  'thi-thiên': 'Psalms',
  'châm ngôn': 'Proverbs',
  'châm-ngôn': 'Proverbs',
  'truyền đạo': 'Ecclesiastes',
  'nhã ca': 'Song of Solomon',
  'ê-sai': 'Isaiah',
  'giê-rê-mi': 'Jeremiah',
  'ca thương': 'Lamentations',
  'ê-xê-chi-ên': 'Ezekiel',
  'đa-ni-ên': 'Daniel',
  'ô-sê': 'Hosea',
  'giô-ên': 'Joel',
  'a-mốt': 'Amos',
  'áp-đia': 'Obadiah',
  'giô-na': 'Jonah',
  'mi-chê': 'Micah',
  'na-hum': 'Nahum',
  'ha-ba-cúc': 'Habakkuk',
  'sô-phô-ni': 'Zephaniah',
  'a-ghê': 'Haggai',
  'xa-cha-ri': 'Zechariah',
  'ma-la-chi': 'Malachi',
  'ma-thi-ơ': 'Matthew',
  'mác': 'Mark',
  'lu-ca': 'Luke',
  'giăng': 'John',
  'công vụ': 'Acts',
  'công-vụ': 'Acts',
  'rô-ma': 'Romans',
  '1 cô-rinh-tô': '1 Corinthians',
  '2 cô-rinh-tô': '2 Corinthians',
  'ga-la-ti': 'Galatians',
  'ê-phê-sô': 'Ephesians',
  'phi-líp': 'Philippians',
  'cô-lô-se': 'Colossians',
  '1 tê-sa-lô-ni-ca': '1 Thessalonians',
  '2 tê-sa-lô-ni-ca': '2 Thessalonians',
  '1 ti-mô-thê': '1 Timothy',
  '2 ti-mô-thê': '2 Timothy',
  'tít': 'Titus',
  'phi-lê-môn': 'Philemon',
  'hê-bơ-rơ': 'Hebrews',
  'gia-cơ': 'James',
  '1 phi-e-rơ': '1 Peter',
  '2 phi-e-rơ': '2 Peter',
  '1 giăng': '1 John',
  '2 giăng': '2 John',
  '3 giăng': '3 John',
  'giu-đe': 'Jude',
  'khải huyền': 'Revelation',
  'khải-huyền': 'Revelation',
};

function normalizePassageToEnglish(passage: string): { englishPassage: string; isVietnamese: boolean } {
  const lower = passage.trim().toLowerCase();
  let isVietnamese = false;
  let englishPassage = passage.trim();

  for (const [viBook, enBook] of Object.entries(VI_TO_EN_BOOKS)) {
    if (lower.startsWith(viBook)) {
      isVietnamese = true;
      englishPassage = enBook + passage.trim().slice(viBook.length);
      break;
    }
  }

  return { englishPassage, isVietnamese };
}

export const DevotionalService = {
  async fetchScripture(passage: string) {
    const { englishPassage, isVietnamese } = normalizePassageToEnglish(passage);
    const url = `https://bible-api.com/${encodeURIComponent(englishPassage)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Scripture not found for "${passage}". Try e.g. "John 3:16" or "Giăng 3:16".`);
    }

    const data = await res.json();
    let verseText = (data.text || '').replace(/\s+/g, ' ').trim();
    if (!verseText) {
      throw new Error(`No verse text returned for "${passage}".`);
    }

    if (isVietnamese) {
      const translated = await TranslationService.translate({
        text: verseText,
        sourceLang: 'en',
        targetLang: 'vi',
        context: 'scripture',
      });
      verseText = translated.translated;
    }

    return {
      reference: data.reference || passage,
      verseText,
      translation: data.translation_name || 'WEB',
    };
  },
};
