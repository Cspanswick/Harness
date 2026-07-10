"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Saves an edited positioning statement. Only the positioning column is
 * touched, which the append-only trigger permits; answers/scores/verdict stay
 * frozen (CLAUDE.md rule 1).
 */
export async function savePositioning(
  assessmentId: string,
  companyId: string,
  positioning: string,
): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expired." };

  const { error } = await supabase
    .from("assessments")
    .update({ positioning })
    .eq("id", assessmentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/companies/${companyId}`);
  return { ok: true };
}
