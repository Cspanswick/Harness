import Link from "next/link";
import { notFound } from "next/navigation";

import { emptySetup } from "@/lib/assessment-input";
import type { Archetype } from "@/lib/questions";
import type { Answers } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";

import { Wizard, type WizardInitial } from "../../new/wizard";

export const metadata = { title: "Update assessment — Harness Moat Assessor" };

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();
  if (!company) notFound();

  const { data: latest } = await supabase
    .from("assessments")
    .select("answers, accumulation_asset, assessor_notes, version")
    .eq("company_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .single();
  if (!latest) notFound();

  const initial: WizardInitial = {
    setup: {
      ...emptySetup(),
      name: company.name,
      website: company.website ?? "",
      archetype: company.archetype as Archetype,
      domain: company.domain,
      coreProcesses: company.core_processes ?? [],
      buyer: company.buyer ?? "",
      monetisationToday: company.monetisation_today ?? "",
      notes: company.notes ?? "",
    },
    answers: (latest.answers ?? {}) as Answers,
    accumulationAsset: latest.accumulation_asset ?? "",
    assessorNotes: latest.assessor_notes ?? "",
  };

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">Update assessment · from v{latest.version}</p>
        <Link
          href={`/companies/${id}`}
          className="text-sm text-ink-soft underline underline-offset-4 focus-ink"
        >
          Cancel
        </Link>
      </div>
      <h1 className="mt-3 font-serif text-3xl text-ink">{company.name}</h1>
      <p className="mt-2 text-ink-soft leading-relaxed">
        Prefilled with the latest answers. Saving creates a new version — the earlier
        ones are kept, so your history stays intact.
      </p>

      <div className="mt-10">
        <Wizard mode={{ kind: "edit", companyId: id, initial }} />
      </div>
    </main>
  );
}
