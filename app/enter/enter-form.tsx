"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { enterWithCode } from "./actions";

export function EnterForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const result = await enterWithCode(code);
      if (result.ok) {
        // The action set the session cookies; navigate now that they're committed.
        router.replace("/companies");
        router.refresh();
        return;
      }
      setError(result.error);
      setStatus("error");
    } catch (err) {
      // Never leave the button stuck on "Entering…": surface the failure.
      setError(err instanceof Error ? err.message : "Something went wrong signing in.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      <label htmlFor="code" className="eyebrow">
        Access code
      </label>
      <input
        id="code"
        name="code"
        type="password"
        required
        autoFocus
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="bg-panel border-[1.5px] border-ink rounded-sharp px-4 py-3 text-ink focus-ink"
      />

      {status === "error" && error && (
        <p role="alert" className="text-sm text-layer-1">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-accent text-paper font-medium px-6 py-3 rounded-sharp border-[1.5px] border-ink offset-shadow offset-shadow-hover focus-ink disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Entering…" : "Enter"}
      </button>
    </form>
  );
}
