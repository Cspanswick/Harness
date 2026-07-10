/**
 * Supabase environment. Validated lazily at call time rather than at import,
 * so a missing key surfaces as a clear runtime error on the pages that need
 * Supabase instead of breaking the build of pages that don't.
 */

export interface SupabaseEnv {
  readonly url: string;
  readonly anonKey: string;
}

export function supabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Missing Supabase environment: ${missing.join(", ")}. ` +
        `Copy .env.example to .env.local and fill it in.`,
    );
  }

  return { url: url as string, anonKey: anonKey as string };
}
