"use client";

import { useState } from "react";

import { savePositioning } from "./actions";

/**
 * The generated positioning statement, editable in place. Editing is disabled
 * when viewing a past version (read-only history).
 */
export function PositioningEditor({
  assessmentId,
  companyId,
  initial,
  readOnly,
}: {
  assessmentId: string;
  companyId: string;
  initial: string;
  readOnly: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setSaving(true);
    setError(null);
    const result = await savePositioning(assessmentId, companyId, value);
    setSaving(false);
    if (result.ok) {
      setSaved(value);
      setEditing(false);
    } else {
      setError(result.error);
    }
  }

  if (readOnly) {
    return <p className="font-serif text-lg leading-relaxed text-ink">{saved}</p>;
  }

  if (!editing) {
    return (
      <div>
        <p className="font-serif text-lg leading-relaxed text-ink">{saved}</p>
        <button
          type="button"
          onClick={() => {
            setValue(saved);
            setEditing(true);
          }}
          className="mt-3 text-sm text-accent underline underline-offset-4 focus-ink"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        className="bg-panel border-[1.5px] border-ink rounded-sharp px-3 py-2 font-serif text-lg leading-relaxed text-ink focus-ink"
      />
      {error && (
        <p role="alert" className="text-sm text-layer-1">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-ink text-paper text-sm px-4 py-2 rounded-sharp border-[1.5px] border-ink focus-ink disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm px-4 py-2 rounded-sharp border-[1.5px] border-line text-ink-soft focus-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
