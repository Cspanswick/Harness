"use client";

import { useState } from "react";

import {
  DOMAIN_SUGGESTIONS,
  type CompanySetup,
} from "@/lib/assessment-input";
import { ARCHETYPES, type Archetype } from "@/lib/questions";

const FIELD =
  "bg-panel border-[1.5px] border-ink rounded-sharp px-3 py-2 text-ink placeholder:text-ink-soft/60 focus-ink w-full";

export function SetupStep({
  setup,
  onChange,
}: {
  setup: CompanySetup;
  onChange: (patch: Partial<CompanySetup>) => void;
}) {
  const [processDraft, setProcessDraft] = useState("");

  function addProcess() {
    const value = processDraft.trim();
    if (value && !setup.coreProcesses.includes(value)) {
      onChange({ coreProcesses: [...setup.coreProcesses, value] });
    }
    setProcessDraft("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="eyebrow">
          Company name <span className="text-layer-1">*</span>
        </label>
        <input
          id="name"
          className={FIELD}
          value={setup.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Acme ITSM"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="website" className="eyebrow">
          Website
        </label>
        <input
          id="website"
          type="url"
          className={FIELD}
          value={setup.website}
          onChange={(e) => onChange({ website: e.target.value })}
          placeholder="https://acme.com"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="eyebrow mb-2">
          Archetype <span className="text-layer-1">*</span>
        </legend>
        <div className="grid gap-2">
          {(Object.keys(ARCHETYPES) as Archetype[]).map((key) => {
            const meta = ARCHETYPES[key];
            const selected = setup.archetype === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ archetype: key })}
                className={`text-left p-4 rounded-sharp border-[1.5px] focus-ink transition-colors ${
                  selected ? "border-ink bg-panel" : "border-line bg-panel/50 hover:border-ink"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`h-3 w-3 rounded-full border-[1.5px] border-ink ${
                      selected ? "bg-ink" : "bg-transparent"
                    }`}
                  />
                  <span className="font-medium text-ink">{meta.label}</span>
                </span>
                <span className="mt-2 block text-sm text-ink-soft leading-relaxed">
                  {meta.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="domain" className="eyebrow">
          Domain <span className="text-layer-1">*</span>
        </label>
        <input
          id="domain"
          className={FIELD}
          value={setup.domain}
          onChange={(e) => onChange({ domain: e.target.value })}
          placeholder="ITSM"
          list="domain-suggestions"
        />
        <datalist id="domain-suggestions">
          {DOMAIN_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="process" className="eyebrow">
          Core processes covered
        </label>
        {setup.coreProcesses.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {setup.coreProcesses.map((process) => (
              <li
                key={process}
                className="flex items-center gap-2 bg-panel border-[1.5px] border-ink rounded-sharp px-2 py-1 text-sm text-ink"
              >
                {process}
                <button
                  type="button"
                  aria-label={`Remove ${process}`}
                  onClick={() =>
                    onChange({
                      coreProcesses: setup.coreProcesses.filter((p) => p !== process),
                    })
                  }
                  className="text-ink-soft hover:text-layer-1 focus-ink"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            id="process"
            className={FIELD}
            value={processDraft}
            onChange={(e) => setProcessDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addProcess();
              }
            }}
            placeholder="Incident management, then Enter"
          />
          <button
            type="button"
            onClick={addProcess}
            className="shrink-0 border-[1.5px] border-ink rounded-sharp px-4 text-ink hover:bg-panel focus-ink"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="buyer" className="eyebrow">
          Primary buyer persona
        </label>
        <input
          id="buyer"
          className={FIELD}
          value={setup.buyer}
          onChange={(e) => onChange({ buyer: e.target.value })}
          placeholder="VP of IT Operations"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="monetisation" className="eyebrow">
          What is monetised today
        </label>
        <textarea
          id="monetisation"
          rows={2}
          className={FIELD}
          value={setup.monetisationToday}
          onChange={(e) => onChange({ monetisationToday: e.target.value })}
          placeholder="Per-seat SaaS on the incident console…"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="eyebrow">
          Notes
        </label>
        <textarea
          id="notes"
          rows={2}
          className={FIELD}
          value={setup.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}
