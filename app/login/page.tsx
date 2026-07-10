import { safeRedirectPath } from "@/lib/safe-redirect";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Harness Moat Assessor" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main className="flex-1 w-full max-w-md mx-auto px-6 py-24">
      <p className="eyebrow">Harness Moat Assessor</p>
      <h1 className="mt-4 font-serif text-3xl leading-tight text-ink">Sign in</h1>
      <p className="mt-3 text-ink-soft leading-relaxed">
        We&rsquo;ll email you a magic link. No password to remember.
      </p>

      {error && (
        <p role="alert" className="mt-6 text-sm text-layer-1">
          {error}
        </p>
      )}

      <LoginForm next={safeRedirectPath(next)} />
    </main>
  );
}
