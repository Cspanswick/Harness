"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "sending" });

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setStatus({ kind: "sent", email });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not send the link.",
      });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="mt-8 panel p-6" role="status">
        <p className="eyebrow">Check your inbox</p>
        <p className="mt-3 text-ink leading-relaxed">
          A sign-in link is on its way to <strong>{status.email}</strong>. It expires
          in an hour.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-4 text-accent underline underline-offset-4 focus-ink"
        >
          Use a different address
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      <label htmlFor="email" className="eyebrow">
        Work email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@company.com"
        className="bg-panel border-[1.5px] border-ink rounded-sharp px-4 py-3 text-ink placeholder:text-ink-soft/60 focus-ink"
      />

      {status.kind === "error" && (
        <p role="alert" className="text-layer-1 text-sm">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={status.kind === "sending"}
        className="bg-accent text-paper font-medium px-6 py-3 rounded-sharp border-[1.5px] border-ink offset-shadow offset-shadow-hover focus-ink disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status.kind === "sending" ? "Sending…" : "Email me a link"}
      </button>
    </form>
  );
}
