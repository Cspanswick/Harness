"use client";

import { useEffect, useState } from "react";

import {
  emptySetup,
  type CompanySetup,
} from "@/lib/assessment-input";
import {
  ACCUMULATION_ASSET_PROMPT,
  ARCHETYPE_QUESTIONS,
  ASSESSOR_NOTES_PROMPT,
  LAYER_QUESTIONS,
  LAYERS,
  MONETISATION_QUESTIONS,
  THREAT_QUESTIONS,
  THREAT_VECTORS,
  THREATS,
  type LayerId,
  type Monetisation,
  type Score,
} from "@/lib/questions";
import { missingAnswers, type Answers } from "@/lib/scoring";

import { submitAssessment } from "./actions";
import { MonetisationCard, ScaleCard } from "./cards";
import { SetupStep } from "./setup-step";

const STORAGE_KEY = "harness-wizard-draft";

interface Draft {
  step: number;
  setup: CompanySetup;
  answers: Answers;
  accumulationAsset: string;
  assessorNotes: string;
}

const LAYER_COLOR: Record<LayerId, string> = {
  l1: "text-layer-1",
  l2: "text-layer-2",
  l3: "text-layer-3",
  l4: "text-layer-4",
  l5: "text-layer-5",
};

type StepKind =
  | { kind: "setup" }
  | { kind: "layer"; layer: LayerId }
  | { kind: "threats" }
  | { kind: "archetype" }
  | { kind: "freetext" }
  | { kind: "review" };

const STEPS: StepKind[] = [
  { kind: "setup" },
  ...LAYERS.map((l) => ({ kind: "layer" as const, layer: l.id })),
  { kind: "threats" },
  { kind: "archetype" },
  { kind: "freetext" },
  { kind: "review" },
];

const STEP_LABELS = [
  "Setup",
  "L1",
  "L2",
  "L3",
  "L4",
  "L5",
  "Threats",
  "Archetype",
  "Notes",
  "Review",
];

export function Wizard() {
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [setup, setSetup] = useState<CompanySetup>(emptySetup);
  const [answers, setAnswers] = useState<Answers>({});
  const [accumulationAsset, setAccumulationAsset] = useState("");
  const [assessorNotes, setAssessorNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage after mount, so a refresh mid-wizard keeps work.
  // localStorage is unavailable during SSR, so this must run in an effect; the
  // `loaded` guard renders "Loading…" on both server and first client paint, so
  // there is no hydration mismatch despite the state writes below.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Draft;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- loading external (localStorage) state on mount
        setStep(draft.step ?? 0);
        setSetup({ ...emptySetup(), ...draft.setup });
        setAnswers(draft.answers ?? {});
        setAccumulationAsset(draft.accumulationAsset ?? "");
        setAssessorNotes(draft.assessorNotes ?? "");
      }
    } catch {
      // Corrupt draft: ignore and start fresh.
    }
    setLoaded(true);
  }, []);

  // Autosave every change once hydrated.
  useEffect(() => {
    if (!loaded) return;
    const draft: Draft = { step, setup, answers, accumulationAsset, assessorNotes };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [loaded, step, setup, answers, accumulationAsset, assessorNotes]);

  if (!loaded) {
    return <p className="mt-10 text-ink-soft">Loading…</p>;
  }

  const current = STEPS[step];
  const setScore = (id: string, value: Score) => setAnswers((a) => ({ ...a, [id]: value }));
  const setMon = (id: string, value: Monetisation) =>
    setAnswers((a) => ({ ...a, [id]: value }));

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    // Clear the draft up front so a successful submit (which redirects and never
    // returns) leaves nothing stale behind. Restored below if the submit fails.
    localStorage.removeItem(STORAGE_KEY);
    const result = await submitAssessment({
      setup,
      answers,
      accumulationAsset,
      assessorNotes,
    });
    // A successful submit redirects and never returns; reaching here is a failure.
    if (result && !result.ok) {
      const draft: Draft = { step, setup, answers, accumulationAsset, assessorNotes };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setError(result.error);
      setSubmitting(false);
    }
  }

  const missing = missingAnswers(answers, setup.archetype);

  return (
    <div>
      <Progress step={step} />

      <div className="mt-8 panel p-6">
        {current.kind === "setup" && (
          <StepShell title="Company setup" hint="Who are we assessing?">
            <SetupStep setup={setup} onChange={(patch) => setSetup((s) => ({ ...s, ...patch }))} />
          </StepShell>
        )}

        {current.kind === "layer" && (
          <LayerStep layer={current.layer} answers={answers} onScore={setScore} onMon={setMon} />
        )}

        {current.kind === "threats" && (
          <StepShell title="Threat tests" hint="Higher = safer. Three vectors, three questions each.">
            <div className="flex flex-col gap-10">
              {THREAT_VECTORS.map((vector) => (
                <div key={vector} className="flex flex-col gap-6">
                  <p className="eyebrow">{THREATS[vector].label}</p>
                  {THREAT_QUESTIONS[vector].map((q) => (
                    <ScaleCard
                      key={q.id}
                      question={q}
                      value={answers[q.id] as Score | undefined}
                      onChange={(v) => setScore(q.id, v)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </StepShell>
        )}

        {current.kind === "archetype" && (
          <StepShell
            title="Archetype questions"
            hint="Specific to the archetype you chose at setup."
          >
            <div className="flex flex-col gap-6">
              {ARCHETYPE_QUESTIONS[setup.archetype].map((q) => (
                <ScaleCard
                  key={q.id}
                  question={q}
                  value={answers[q.id] as Score | undefined}
                  onChange={(v) => setScore(q.id, v)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {current.kind === "freetext" && (
          <StepShell title="The sharpest question" hint="If you can't complete it, there's no moat.">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="asset" className="text-ink leading-relaxed">
                  {ACCUMULATION_ASSET_PROMPT}
                </label>
                <textarea
                  id="asset"
                  rows={4}
                  value={accumulationAsset}
                  onChange={(e) => setAccumulationAsset(e.target.value)}
                  className="bg-panel border-[1.5px] border-ink rounded-sharp px-3 py-2 text-ink focus-ink"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="anotes" className="eyebrow">
                  {ASSESSOR_NOTES_PROMPT}
                </label>
                <textarea
                  id="anotes"
                  rows={3}
                  value={assessorNotes}
                  onChange={(e) => setAssessorNotes(e.target.value)}
                  className="bg-panel border-[1.5px] border-ink rounded-sharp px-3 py-2 text-ink focus-ink"
                />
              </div>
            </div>
          </StepShell>
        )}

        {current.kind === "review" && (
          <StepShell title="Review" hint="Confirm, then create the assessment.">
            <ReviewStep setup={setup} missing={missing.length} />
            {error && (
              <p role="alert" className="mt-4 text-sm text-layer-1">
                {error}
              </p>
            )}
          </StepShell>
        )}
      </div>

      <Nav
        step={step}
        total={STEPS.length}
        canSubmit={missing.length === 0 && setup.name.trim() !== "" && setup.domain.trim() !== ""}
        submitting={submitting}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function StepShell({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{hint}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function LayerStep({
  layer,
  answers,
  onScore,
  onMon,
}: {
  layer: LayerId;
  answers: Answers;
  onScore: (id: string, v: Score) => void;
  onMon: (id: string, v: Monetisation) => void;
}) {
  const meta = LAYERS.find((l) => l.id === layer)!;
  const mon = MONETISATION_QUESTIONS[layer];
  return (
    <StepShell
      title={`L${meta.n} — ${meta.name}`}
      hint={meta.kind === "flow" ? "A flow layer — consumed monthly." : "A stock layer — it accumulates."}
    >
      <p className={`eyebrow ${LAYER_COLOR[layer]}`}>{meta.kind}</p>
      <div className="mt-6 flex flex-col gap-8">
        {LAYER_QUESTIONS[layer].map((q) => (
          <ScaleCard
            key={q.id}
            question={q}
            value={answers[q.id] as Score | undefined}
            onChange={(v) => onScore(q.id, v)}
          />
        ))}
      </div>
      <MonetisationCard
        prompt={mon.prompt}
        value={answers[mon.id] as Monetisation | undefined}
        onChange={(v) => onMon(mon.id, v)}
      />
    </StepShell>
  );
}

function ReviewStep({ setup, missing }: { setup: CompanySetup; missing: number }) {
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-ink-soft">Company</dt>
        <dd className="text-ink">{setup.name || "—"}</dd>
        <dt className="text-ink-soft">Domain</dt>
        <dd className="text-ink">{setup.domain || "—"}</dd>
        <dt className="text-ink-soft">Archetype</dt>
        <dd className="text-ink">{setup.archetype.replace(/_/g, " ")}</dd>
      </dl>
      {missing > 0 ? (
        <p className="text-sm text-layer-1">
          {missing} question{missing === 1 ? "" : "s"} still unanswered. Go back and complete
          them before creating the assessment.
        </p>
      ) : (
        <p className="text-sm text-layer-4">All questions answered. Ready to score.</p>
      )}
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {STEP_LABELS.map((label, index) => {
        const state = index === step ? "current" : index < step ? "done" : "todo";
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-sharp border-[1.5px] ${
              state === "current"
                ? "border-ink bg-ink text-paper"
                : state === "done"
                  ? "border-ink text-ink"
                  : "border-line text-ink-soft"
            }`}
          >
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function Nav({
  step,
  total,
  canSubmit,
  submitting,
  onBack,
  onNext,
  onSubmit,
}: {
  step: number;
  total: number;
  canSubmit: boolean;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const isReview = step === total - 1;
  return (
    <div className="mt-6 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 0}
        className="border-[1.5px] border-ink rounded-sharp px-5 py-2 text-ink hover:bg-panel focus-ink disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Back
      </button>

      {isReview ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="bg-accent text-paper font-medium px-6 py-2 rounded-sharp border-[1.5px] border-ink offset-shadow offset-shadow-hover focus-ink disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating…" : "Create assessment"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="bg-ink text-paper font-medium px-6 py-2 rounded-sharp border-[1.5px] border-ink offset-shadow offset-shadow-hover focus-ink"
        >
          Next
        </button>
      )}
    </div>
  );
}
