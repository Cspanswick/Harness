import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { CompanyList, type CompanyRow } from "./company-list";

export const metadata = { title: "Companies — Harness Moat Assessor" };

export default async function CompaniesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("company_latest")
    .select("id, name, domain, archetype, verdict, version, scores, assessed_at")
    .order("assessed_at", { ascending: false, nullsFirst: false });

  const companies = (data ?? []) as CompanyRow[];

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">Harness Moat Assessor</p>
          <h1 className="mt-3 font-serif text-3xl text-ink">Companies</h1>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-ink-soft underline underline-offset-4 focus-ink"
          >
            Sign out
          </button>
        </form>
      </div>
      {user?.email && (
        <p className="mt-2 text-sm text-ink-soft">
          Signed in as <span className="font-mono">{user.email}</span>
        </p>
      )}

      <div className="mt-8 flex justify-end">
        <Link
          href="/companies/new"
          className="bg-accent text-paper font-medium px-5 py-2.5 rounded-sharp border-[1.5px] border-ink offset-shadow offset-shadow-hover focus-ink"
        >
          New assessment
        </Link>
      </div>

      {error ? (
        <div className="mt-8 panel p-6" role="alert">
          <p className="eyebrow">Could not load companies</p>
          <p className="mt-3 font-mono text-sm text-layer-1">{error.message}</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="mt-8 panel p-8 text-center">
          <p className="eyebrow">No assessments yet</p>
          <p className="mt-3 mx-auto max-w-md text-ink-soft leading-relaxed">
            Every company lives as its own record with versioned assessments, so you can
            re-run the Q&amp;A as your insight changes and watch how your view evolved.
          </p>
          <Link
            href="/companies/new"
            className="mt-6 inline-block bg-ink text-paper font-medium px-6 py-3 rounded-sharp border-[1.5px] border-ink offset-shadow offset-shadow-hover focus-ink"
          >
            Assess your first company
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <CompanyList companies={companies} />
        </div>
      )}
    </main>
  );
}
