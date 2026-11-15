// Shared validation + normalization for member registration.
// The same rules are mirrored on the frontend (utils/memberValidation.ts)
// so the form can reject bad input before it reaches the server —
// the server always re-validates, never trusts the client.

// Name: letters only (Unicode letters, so Vietnamese diacritics count),
// plus spaces, hyphens and apostrophes for multi-part names.
// Returns the trimmed name, or null when invalid.
export function normalizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < 1 || name.length > 50) return null;
  if (!/^[\p{L}\s'-]+$/u.test(name)) return null;
  // Must contain at least one letter (not only spaces / punctuation).
  if (!/\p{L}/u.test(name)) return null;
  return name;
}

// Phone: US only. Accepts 10 digits, 11 digits starting with 1, or an
// E.164 +1 number. Returns the E.164 form (+1XXXXXXXXXX), or null.
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

// Email: trimmed + lowercased. Basic shape check only — deliverability
// is proven by the verification code, not by the regex.
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}
