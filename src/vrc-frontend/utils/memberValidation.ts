// Client-side mirror of the backend member validation
// (src/vrc-backend/utils/memberValidation.ts). The form rejects bad
// input before it reaches the server — the server always re-validates.

// Name: letters only (Unicode letters, so Vietnamese diacritics count),
// plus spaces, hyphens and apostrophes for multi-part names.
export function isValidName(raw: string): boolean {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < 1 || name.length > 50) return false;
  if (!/^[\p{L}\s'-]+$/u.test(name)) return false;
  return /\p{L}/u.test(name);
}

// Phone: US only. Accepts 10 digits, 11 digits starting with 1, or an
// E.164 +1 number. Returns the E.164 form (+1XXXXXXXXXX), or null.
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

// Email: basic shape check only — deliverability is proven by the
// verification code, not by the regex.
export function isValidEmail(raw: string): boolean {
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
