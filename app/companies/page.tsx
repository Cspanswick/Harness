import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Companies — Harness Moat Assessor" };

export default async function CompaniesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: companies, error } = await supabase
    .from("company_latest")
    .select("id, name, archetype, verdict, version, assessed_at")
    .order("assessed_at", { ascending: false, nullsFirst: false });

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-16">
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

      <p className="mt-2 text-sm text-ink-soft">
        Signed in as <span className="font-mono">{user?.email}</span>
      </p>

      {error ? (
        <div className="mt-10 panel p-6" role="alert">
          <p className="eyebrow">Could not load companies</p>
          <p className="mt-3 font-mono text-sm text-layer-1">{error.message}</p>
        </div>
      ) : companies && companies.length > 0 ? (
        <ul className="mt-10 flex flex-col gap-3">
          {companies.map((company) => (
            <li key={company.id} className="panel p-4">
              <span className="text-ink">{company.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 panel p-6">
          <p className="eyebrow">No assessments yet</p>
          <p className="mt-3 max-w-lg text-ink-soft leading-relaxed">
            Every company lives as its own record with versioned assessments, so you
            can re-run the Q&amp;A as your insight changes and see how your view
            evolved.
          </p>
        </div>
      )}
    </main>
  );
}
