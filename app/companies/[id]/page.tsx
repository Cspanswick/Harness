import Link from "next/link";
import { notFound } from "next/navigation";

import { VERDICT_HEX } from "@/lib/palette";
import { ARCHETYPES, type Archetype } from "@/lib/questions";
import {
  recommendedActions,
  VERDICT_LABELS,
  type Answers,
  type Scores,
  type Verdict,
} from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";

import { LayerBars, ThreatBars } from "./bars";
import { FlowStockDonut } from "./flow-stock-donut";
import { PositioningEditor } from "./positioning-editor";

interface AssessmentRow {
  id: string;
  version: number;
  answers: Answers;
  scores: Scores;
  verdict: Verdict;
  verdict_rationale: string;
  positioning: string | null;
  accumulation_asset: string | null;
  assessor_notes: string | null;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id } = await params;
  const { version: versionParam } = await searchParams;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();
  if (!company) notFound();

  const { data: versions } = await supabase
    .from("assessments")
    .select("id, version, verdict, created_at")
    .eq("company_id", id)
    .order("version", { ascending: false });

  if (!versions || versions.length === 0) notFound();

  const latestVersion = versions[0].version;
  const selectedVersion = versionParam ? Number(versionParam) : latestVersion;
  const isLatest = selectedVersion === latestVersion;

  const { data: assessment } = await supabase
    .from("assessments")
    .select("*")
    .eq("company_id", id)
    .eq("version", selectedVersion)
    .single<AssessmentRow>();
  if (!assessment) notFound();

  const archetype = company.archetype as Archetype;
  // Recommended actions are derived, not stored (§5.5): recompute from the
  // frozen answers so they always reflect the current rules.
  const actions = recommendedActions({
    answers: assessment.answers,
    archetype,
    companyName: company.name,
    domain: company.domain,
    accumulationAsset: assessment.accumulation_asset ?? "",
  });

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4">
        <Link
          href="/companies"
          className="text-sm text-ink-soft underline underline-offset-4 focus-ink"
        >
          ← Companies
        </Link>
        {isLatest && (
          <Link
            href={`/companies/${id}/edit`}
            className="text-sm bg-ink text-paper px-4 py-2 rounded-sharp border-[1.5px] border-ink offset-shadow-hover focus-ink"
          >
            Update assessment
          </Link>
        )}
      </div>

      <p className="mt-6 eyebrow">{ARCHETYPES[archetype].label}</p>
      <h1 className="mt-2 font-serif text-4xl text-ink">{company.name}</h1>
      <p className="mt-1 text-ink-soft">
        {company.domain}
        {company.website && (
          <>
            {" · "}
            <a
              href={company.website}
              className="text-accent underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {company.website.replace(/^https?:\/\//, "")}
            </a>
          </>
        )}
      </p>

      {!isLatest && (
        <div
          className="mt-6 panel p-3 text-sm text-ink"
          style={{ borderColor: "#b98a34" }}
          role="status"
        >
          Viewing v{selectedVersion} of {latestVersion} — read only.{" "}
          <Link href={`/companies/${id}`} className="text-accent underline underline-offset-2">
            Back to latest
          </Link>
        </div>
      )}

      {/* Verdict banner */}
      <section className="mt-8 panel p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="font-mono text-xs uppercase tracking-wider px-2 py-1 rounded-sharp text-paper"
            style={{ backgroundColor: VERDICT_HEX[assessment.verdict] }}
          >
            {VERDICT_LABELS[assessment.verdict]}
          </span>
          <span className="font-mono text-xs text-ink-soft">
            v{assessment.version} · {formatDate(assessment.created_at)}
          </span>
        </div>
        <p className="mt-4 font-serif text-xl leading-relaxed text-ink">
          {assessment.verdict_rationale}
        </p>
      </section>

      {/* Layer strength + flow/stock */}
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto]">
        <section className="panel p-6">
          <p className="eyebrow">Layer strength</p>
          <div className="mt-5">
            <LayerBars scores={assessment.scores} answers={assessment.answers} />
          </div>
        </section>
        <section className="panel p-6 md:w-64">
          <p className="eyebrow">Flow vs stock</p>
          <div className="mt-3">
            <FlowStockDonut stockShare={assessment.scores.stockShare} />
          </div>
        </section>
      </div>

      {/* Threat exposure */}
      <section className="mt-6 panel p-6">
        <p className="eyebrow">Threat exposure — higher is more exposed</p>
        <div className="mt-5">
          <ThreatBars scores={assessment.scores} />
        </div>
      </section>

      {/* Accumulation asset */}
      {assessment.accumulation_asset && (
        <section className="mt-6 panel p-6">
          <p className="eyebrow">Accumulation asset</p>
          <blockquote className="mt-3 border-l-[3px] border-ink pl-4 font-serif text-lg italic leading-relaxed text-ink">
            {assessment.accumulation_asset}
          </blockquote>
        </section>
      )}

      {/* Positioning */}
      <section className="mt-6 panel p-6">
        <p className="eyebrow">Positioning statement</p>
        <div className="mt-3">
          <PositioningEditor
            assessmentId={assessment.id}
            companyId={id}
            initial={assessment.positioning ?? ""}
            readOnly={!isLatest}
          />
        </div>
      </section>

      {/* Recommended actions */}
      {actions.length > 0 && (
        <section className="mt-6 panel p-6">
          <p className="eyebrow">Recommended actions</p>
          <ol className="mt-4 flex flex-col gap-3">
            {actions.map((action, index) => (
              <li key={action} className="flex gap-3 text-ink">
                <span className="font-mono text-xs text-ink-soft pt-0.5">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed">{action}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Version history */}
      {versions.length > 1 && (
        <section className="mt-6 panel p-6">
          <p className="eyebrow">Version history</p>
          <ul className="mt-4 flex flex-col gap-2">
            {versions.map((v) => {
              const active = v.version === selectedVersion;
              return (
                <li key={v.id}>
                  <Link
                    href={v.version === latestVersion ? `/companies/${id}` : `/companies/${id}?version=${v.version}`}
                    className={`flex items-center justify-between gap-3 p-3 rounded-sharp border-[1.5px] text-sm focus-ink ${
                      active ? "border-ink bg-panel" : "border-line hover:border-ink"
                    }`}
                  >
                    <span className="text-ink">
                      v{v.version}
                      {v.version === latestVersion && (
                        <span className="ml-2 font-mono text-[10px] text-ink-soft">LATEST</span>
                      )}
                    </span>
                    <span className="flex items-center gap-3">
                      <span
                        className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sharp text-paper"
                        style={{ backgroundColor: VERDICT_HEX[v.verdict as Verdict] }}
                      >
                        {VERDICT_LABELS[v.verdict as Verdict]}
                      </span>
                      <span className="font-mono text-xs text-ink-soft">
                        {formatDate(v.created_at)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
