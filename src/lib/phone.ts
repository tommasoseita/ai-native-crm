/**
 * Lightweight phone-number normalisation so we can match webhook digits
 * against contacts we already have. We don't ship a full libphonenumber on
 * Vercel — the matching is fuzzy by design and the canonical number lives on
 * the Aircall side anyway.
 */

const SPACES = /[\s\-().]/g;

/** Strip everything except + and digits. */
export function digitsOnly(input: string): string {
  return input.replace(SPACES, "").replace(/[^\d+]/g, "");
}

/**
 * Best-effort E.164 normalisation. If the input already starts with "+", we
 * trust the country code; otherwise we leave it as-is (callers should pre-
 * format). For matching purposes we strip everything that isn't a digit.
 */
export function toE164(input: string): string {
  const cleaned = digitsOnly(input);
  if (!cleaned) return "";
  return cleaned.startsWith("+") ? cleaned : cleaned;
}

/**
 * Reduce a phone number to its trailing-digits form for matching. Aircall
 * `raw_digits` is "+39 347 837 6677" or "+393478376677"; a CRM record might
 * have either. Comparing the last 9 digits is enough to match within a
 * country and avoid prefix mismatches.
 */
export function matchKey(input: string | null | undefined): string {
  if (!input) return "";
  const d = input.replace(/\D/g, "");
  return d.length > 9 ? d.slice(-9) : d;
}
