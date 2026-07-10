import Link from "next/link";

import { Wizard } from "./wizard";

export const metadata = { title: "New assessment — Harness Moat Assessor" };

export default function NewAssessmentPage() {
  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">New assessment</p>
        <Link
          href="/companies"
          className="text-sm text-ink-soft underline underline-offset-4 focus-ink"
        >
          Cancel
        </Link>
      </div>
      <h1 className="mt-3 font-serif text-3xl text-ink">Assess a company</h1>
      <p className="mt-2 text-ink-soft leading-relaxed">
        Work through each layer. Your answers autosave to this browser until you submit.
      </p>

      <div className="mt-10">
        <Wizard />
      </div>
    </main>
  );
}
