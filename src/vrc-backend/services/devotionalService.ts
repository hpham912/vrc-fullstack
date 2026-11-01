import { GoogleGenAI } from '@google/genai';

export const DevotionalService = {
  async generateDevotional(passage: string, theme = 'Faith & Revival') {
    const ai = new GoogleGenAI();
    const prompt = `You are a pastor at Vietnamese Revival Church (Hội Thánh Phục Hưng Việt Nam) in Tempe, Arizona.
Draft an uplifting daily devotional reading and pastoral reflection based on this scripture: "${passage}".
Theme: ${theme}.

Requirements:
1. Provide the exact scripture text in a concise form.
2. Provide an inspiring pastoral reflection (2-3 short, deeply encouraging paragraphs).
3. Provide a heartfelt closing prayer.
4. Output must be valid JSON strictly matching this schema:
{
  "verseText": "The actual verse scripture text",
  "reflection": "The pastoral devotional reflection text",
  "prayer": "A brief heartfelt closing prayer",
  "theme": "The core theme"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text || '{}');
  },
};
