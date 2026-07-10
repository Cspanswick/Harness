"use server";

import { redirect } from "next/navigation";

import type { CompanySetup } from "@/lib/assessment-input";
import { ARCHETYPES } from "@/lib/questions";
import { assess, missingAnswers, type Answers } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";

export interface SubmitPayload {
  setup: CompanySetup;
  answers: Answers;
  accumulationAsset: string;
  assessorNotes: string;
}

export type SubmitResult = { ok: false; error: string };

/**
 * Creates a company and its first assessment version.
 *
 * Scores are computed server-side from the answers — never trusted from the
 * client — so the stored verdict cannot be forged. On success this redirects to
 * the dashboard and does not return; it only returns to report a failure.
 */
export async function submitAssessment(payload: SubmitPayload): Promise<SubmitResult> {
  const { setup, answers, accumulationAsset, assessorNotes } = payload;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };

  // Validate before touching the database.
  if (!setup.name.trim()) return { ok: false, error: "Company name is required." };
  if (!setup.domain.trim()) return { ok: false, error: "Domain is required." };
  if (!(setup.archetype in ARCHETYPES)) {
    return { ok: false, error: "Unknown archetype." };
  }
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

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: setup.name.trim(),
      website: setup.website.trim() || null,
      archetype: setup.archetype,
      domain: setup.domain.trim(),
      core_processes: setup.coreProcesses,
      buyer: setup.buyer.trim() || null,
      monetisation_today: setup.monetisationToday.trim() || null,
      notes: setup.notes.trim() || null,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    return { ok: false, error: companyError?.message ?? "Could not save the company." };
  }

  const { error: assessmentError } = await supabase.from("assessments").insert({
    company_id: company.id,
    version: 1,
    answers,
    scores: result.scores,
    verdict: result.verdict,
    verdict_rationale: result.verdictRationale,
    positioning: result.positioning,
    accumulation_asset: accumulationAsset.trim() || null,
    assessor_notes: assessorNotes.trim() || null,
    created_by: user.id,
  });

  if (assessmentError) {
    // The company row was created but the assessment failed. Roll it back so the
    // list does not show a company with no assessment.
    await supabase.from("companies").delete().eq("id", company.id);
    return { ok: false, error: assessmentError.message };
  }

  redirect(`/companies/${company.id}`);
}
