/**
 * Constrains a `next` parameter to a same-origin path.
 *
 * The value reaches us from a query string, so an attacker could set it to
 * `https://evil.example` (or the protocol-relative `//evil.example`) and turn
 * the login redirect into an open redirect.
 */
export function safeRedirectPath(next: string | undefined, fallback = "/companies"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  // Backslashes are normalised to forward slashes by some user agents.
  if (next.startsWith("/\\")) return fallback;
  return next;
}
