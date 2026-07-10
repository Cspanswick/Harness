"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { VERDICT_HEX } from "@/lib/palette";
import { ARCHETYPES, type Archetype } from "@/lib/questions";
import { VERDICT_LABELS, type Scores, type Verdict } from "@/lib/scoring";

export interface CompanyRow {
  id: string;
  name: string;
  domain: string;
  archetype: Archetype;
  verdict: Verdict | null;
  version: number | null;
  scores: Scores | null;
  assessed_at: string | null;
}

const ALL = "all";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CompanyList({ companies }: { companies: CompanyRow[] }) {
  const [query, setQuery] = useState("");
  const [archetype, setArchetype] = useState<Archetype | typeof ALL>(ALL);
  const [verdict, setVerdict] = useState<Verdict | typeof ALL>(ALL);

  // Only offer verdict filters that actually appear in the data.
  const presentVerdicts = useMemo(() => {
    const set = new Set<Verdict>();
    for (const c of companies) if (c.verdict) set.add(c.verdict);
    return [...set];
  }, [companies]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (archetype !== ALL && c.archetype !== archetype) return false;
      if (verdict !== ALL && c.verdict !== verdict) return false;
      return true;
    });
  }, [companies, query, archetype, verdict]);

  const SELECT =
    "bg-panel border-[1.5px] border-ink rounded-sharp px-3 py-2 text-sm text-ink focus-ink";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className={`${SELECT} flex-1 min-w-40`}
          aria-label="Search companies by name"
        />
        <select
          value={archetype}
          onChange={(e) => setArchetype(e.target.value as Archetype | typeof ALL)}
          className={SELECT}
          aria-label="Filter by archetype"
        >
          <option value={ALL}>All archetypes</option>
          {(Object.keys(ARCHETYPES) as Archetype[]).map((key) => (
            <option key={key} value={key}>
              {ARCHETYPES[key].label}
            </option>
          ))}
        </select>
        {presentVerdicts.length > 1 && (
          <select
            value={verdict}
            onChange={(e) => setVerdict(e.target.value as Verdict | typeof ALL)}
            className={SELECT}
            aria-label="Filter by verdict"
          >
            <option value={ALL}>All verdicts</option>
            {presentVerdicts.map((v) => (
              <option key={v} value={v}>
                {VERDICT_LABELS[v]}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-ink-soft">No companies match those filters.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/companies/${c.id}`}
                className="block panel p-4 offset-shadow-hover focus-ink"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg text-ink">{c.name}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {c.domain} · {ARCHETYPES[c.archetype].label}
                    </p>
                  </div>
                  {c.verdict && (
                    <span
                      className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-sharp text-paper"
                      style={{ backgroundColor: VERDICT_HEX[c.verdict] }}
                    >
                      {VERDICT_LABELS[c.verdict]}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-soft">
                  <span>
                    stock{" "}
                    <span className="text-ink">
                      {c.scores?.stockShare == null ? "—" : `${c.scores.stockShare}%`}
                    </span>
                  </span>
                  <span>
                    v<span className="text-ink">{c.version ?? 0}</span>
                  </span>
                  <span>
                    assessed <span className="text-ink">{formatDate(c.assessed_at)}</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
