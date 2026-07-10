"use client";

import { useState } from "react";

import { enterWithCode } from "./actions";

export function EnterForm() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);
    const result = await enterWithCode(code);
    // Success redirects and never returns; reaching here is a failure.
    if (result && !result.ok) {
      setError(result.error);
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
