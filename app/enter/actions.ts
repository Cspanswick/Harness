"use server";

import { timingSafeEqual } from "node:crypto";

import { createClient } from "@/lib/supabase/server";

export type EnterResult = { ok: true } | { ok: false; error: string };

/** Constant-time string compare so the access code can't be guessed by timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Master-page login: a single shared access code signs into one shared Supabase
 * account whose credentials live only in server env vars (HARNESS_ACCOUNT_*),
 * so no password ever reaches the browser and no email is sent. Single-team
 * workspace by design (HANDOVER §2) — created_by will be the shared account.
 */
export async function enterWithCode(code: string): Promise<EnterResult> {
  const expected = process.env.APP_ACCESS_CODE;
  const email = process.env.HARNESS_ACCOUNT_EMAIL;
  const password = process.env.HARNESS_ACCOUNT_PASSWORD;

  if (!expected || !email || !password) {
    return {
      ok: false,
      error:
        "Access code sign-in isn't configured. Set APP_ACCESS_CODE, HARNESS_ACCOUNT_EMAIL and HARNESS_ACCOUNT_PASSWORD.",
    };
  }

  if (!code || !safeEqual(code, expected)) {
    return { ok: false, error: "Incorrect access code." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      ok: false,
      error: `Shared account sign-in failed: ${error.message}. Check HARNESS_ACCOUNT_EMAIL / HARNESS_ACCOUNT_PASSWORD match a confirmed Supabase user.`,
    };
  }

  // Navigation happens client-side after this returns, so the session cookies
  // set by signInWithPassword are committed before the redirect request.
  return { ok: true };
}
