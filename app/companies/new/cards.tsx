"use client";

import { optionLabels, type Monetisation, type Score, type ScaleQuestion } from "@/lib/questions";

const SCORES: readonly Score[] = [0, 1, 2, 3];

/**
 * One 0–3 question rendered as four radio cards, each showing its anchor text
 * (never a bare number, per §4). The cards form a radiogroup: arrow keys move
 * and select, matching native radio behaviour for keyboard users.
 */
export function ScaleCard({
  question,
  value,
  onChange,
}: {
  question: ScaleQuestion;
  value: Score | undefined;
  onChange: (value: Score) => void;
}) {
  const labels = optionLabels(question);

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const isForward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const isBack = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!isForward && !isBack) return;
    event.preventDefault();
    const next = ((index + (isForward ? 1 : -1) + 4) % 4) as Score;
    onChange(next);
    // Move focus to the newly selected card.
    const group = event.currentTarget.parentElement;
    (group?.children[next] as HTMLElement | undefined)?.focus();
  }

  return (
    <fieldset>
      <legend className="text-ink leading-relaxed">{question.prompt}</legend>
      <div role="radiogroup" className="mt-4 grid gap-2 sm:grid-cols-2">
        {SCORES.map((score, index) => {
          const selected = value === score;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (value === undefined && index === 0) ? 0 : -1}
              onClick={() => onChange(score)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`text-left p-3 rounded-sharp border-[1.5px] focus-ink transition-colors ${
                selected
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-panel text-ink hover:border-ink"
              }`}
            >
              <span
                className={`font-mono text-[10px] ${selected ? "text-paper/70" : "text-ink-soft"}`}
              >
                {score}
              </span>
              <span className="mt-1 block text-sm leading-snug">{labels[score]}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const MONETISATION_OPTIONS: readonly { value: Monetisation; label: string; hint: string }[] = [
  { value: "none", label: "None", hint: "No revenue here" },
  { value: "secondary", label: "Secondary", hint: "Part of the price" },
  { value: "primary", label: "Primary", hint: "Revenue is anchored here" },
];

/** The per-layer monetisation question: none / secondary / primary (§4). */
export function MonetisationCard({
  prompt,
  value,
  onChange,
}: {
  prompt: string;
  value: Monetisation | undefined;
  onChange: (value: Monetisation) => void;
}) {
  return (
    <fieldset className="mt-8 pt-6 border-t-[1.5px] border-line">
      <legend className="eyebrow">{prompt}</legend>
      <div role="radiogroup" className="mt-3 grid gap-2 sm:grid-cols-3">
        {MONETISATION_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`text-left p-3 rounded-sharp border-[1.5px] focus-ink transition-colors ${
                selected
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-panel text-ink hover:border-ink"
              }`}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              <span
                className={`mt-0.5 block text-xs ${selected ? "text-paper/70" : "text-ink-soft"}`}
              >
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
