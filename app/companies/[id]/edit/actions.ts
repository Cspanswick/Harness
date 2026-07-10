"use server";

import { redirect } from "next/navigation";

import type { CompanySetup } from "@/lib/assessment-input";
import { ARCHETYPES } from "@/lib/questions";
import { assess, missingAnswers, type Answers } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";

export interface UpdatePayload {
  companyId: string;
  setup: CompanySetup;
  answers: Answers;
  accumulationAsset: string;
  assessorNotes: string;
}

export type UpdateResult = { ok: false; error: string };

/**
 * Saves an edited assessment. Company metadata updates in place on the
 * companies row; the assessment is written as a NEW version (max+1), never an
 * overwrite (HANDOVER §2.4, CLAUDE.md rule 1). Redirects to the dashboard on
 * success; only returns to report failure.
 */
export async function updateAssessment(payload: UpdatePayload): Promise<UpdateResult> {
  const { companyId, setup, answers, accumulationAsset, assessorNotes } = payload;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };

  if (!setup.name.trim()) return { ok: false, error: "Company name is required." };
  if (!setup.domain.trim()) return { ok: false, error: "Domain is required." };
  if (!(setup.archetype in ARCHETYPES)) return { ok: false, error: "Unknown archetype." };
  const missing = missingAnswers(answers, setup.archetype);
  if (missing.length > 0) {
    return { ok: false, error: `Some questions are unanswered (${missing.length}).` };
  }

  const result = assess({
    answers,
    archetype: setup.archetype,
    companyName: setup.name.trim(),
    domain: setup.domain.trim(),
    accumulationAsset,
  });

  // Company metadata updates in place.
  const { error: companyError } = await supabase
    .from("companies")
    .update({
      name: setup.name.trim(),
      website: setup.website.trim() || null,
      archetype: setup.archetype,
      domain: setup.domain.trim(),
      core_processes: setup.coreProcesses,
      buyer: setup.buyer.trim() || null,
      monetisation_today: setup.monetisationToday.trim() || null,
      notes: setup.notes.trim() || null,
    })
    .eq("id", companyId);
  if (companyError) return { ok: false, error: companyError.message };

  // Next version = current max + 1. The unique(company_id, version) constraint
  // is the backstop against a racing second edit landing on the same number.
  const { data: latest, error: latestError } = await supabase
    .from("assessments")
    .select("version")
    .eq("company_id", companyId)
    .order("version", { ascending: false })
    .limit(1)
    .single();
  if (latestError) return { ok: false, error: latestError.message };

  const { error: insertError } = await supabase.from("assessments").insert({
    company_id: companyId,
    version: latest.version + 1,
    answers,
    scores: result.scores,
    verdict: result.verdict,
    verdict_rationale: result.verdictRationale,
    positioning: result.positioning,
    accumulation_asset: accumulationAsset.trim() || null,
    assessor_notes: assessorNotes.trim() || null,
    created_by: user.id,
  });
  if (insertError) {
    return {
      ok: false,
      error:
        insertError.code === "23505"
          ? "Someone else saved a new version while you were editing. Reload and try again."
          : insertError.message,
    };
  }

  redirect(`/companies/${companyId}`);
}
