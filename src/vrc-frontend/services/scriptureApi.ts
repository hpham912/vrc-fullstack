import { apiFetch } from '../utils/api.ts';

// Shared frontend helper for the common Bible API.
//
// POST /api/ai/fetch-scripture is a backend endpoint any admin screen
// can call: give it a reference ("John 3:16" or "Giăng 3:16") and it
// returns the real verse text in both languages (NIV English +
// Kinh Thánh 1925 Vietnamese), plus both references and versions.
// Admin-only: pass the admin token from useAuth().getToken().
export interface ScriptureResult {
  reference: string;
  referenceEn: string;
  referenceVi: string;
  verseText: string;
  verseTextEn: string;
  verseTextVi: string;
  translation: string;
  translationEn: string;
  translationVi: string;
}

export async function fetchScripture(
  passage: string,
  token?: string | null
): Promise<ScriptureResult> {
  try {
    return await apiFetch<ScriptureResult>('/api/ai/fetch-scripture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ passage }),
    });
  } catch (err: any) {
    // apiFetch wraps failures as "[HTTP 400] <backend message>" — show
    // the backend's own message instead.
    throw new Error(
      err?.details?.error || err?.details?.message || err?.message || 'Failed to fetch scripture'
    );
  }
}
