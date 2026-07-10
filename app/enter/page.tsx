import Link from "next/link";

import { EnterForm } from "./enter-form";

export const metadata = { title: "Enter — Harness Moat Assessor" };

export default function EnterPage() {
  return (
    <main className="flex-1 w-full max-w-md mx-auto px-6 py-24">
      <p className="eyebrow">Harness Moat Assessor</p>
      <h1 className="mt-4 font-serif text-3xl leading-tight text-ink">Enter workspace</h1>
      <p className="mt-3 text-ink-soft leading-relaxed">
        Enter the shared team access code. No email required.
      </p>

      <EnterForm />

      <p className="mt-8 text-sm text-ink-soft">
        Prefer a personal sign-in link?{" "}
        <Link href="/login" className="text-accent underline underline-offset-4 focus-ink">
          Email me a magic link
        </Link>
        .
      </p>
    </main>
  );
}
