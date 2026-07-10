/**
 * The Harness Moat Model scoring engine (HANDOVER §5).
 *
 * Pure functions, no I/O. Every verdict rule has a unit test in scoring.test.ts,
 * and any change here must update those tests in the same commit (CLAUDE.md rule 2).
 */

import {
  ACCUMULATION_ASSET_MIN_LENGTH,
  ARCHETYPE_QUESTIONS,
  FLOW_LAYERS,
  LAYER_QUESTIONS,
  LAYERS,
  MONETISATION_QUESTIONS,
  QUESTION_BANK_VERSION,
  STOCK_LAYERS,
  THREAT_QUESTIONS,
  THREAT_VECTORS,
  THREATS,
  type Archetype,
  type FlowLayerId,
  type LayerId,
  type Monetisation,
  type Score,
  type StockLayerId,
  type ThreatVector,
} from "./questions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Answers = Readonly<Record<string, Score | Monetisation | undefined>>;

/** Layer strength band (§5.1). */
export type Band = "WEAK" | "MODERATE" | "STRONG";

/** Threat exposure band (§5.3). Higher exposure is worse. */
export type ExposureBand = "LOW" | "MEDIUM" | "HIGH";

export type Verdict =
  | "UNPRICED"
  | "FEATURE_BUSINESS"
  | "CONDITIONAL_MOAT"
  | "CONTESTED_MOAT"
  | "MOAT_BUSINESS"
  | "MIXED"
  | "EXPENSIVE_FLOW_REBUILD";

export interface Scores {
  readonly layers: Readonly<Record<LayerId, number>>;
  readonly layerBands: Readonly<Record<LayerId, Band>>;
  /** Null when nothing is monetised anywhere — the UNPRICED case (§5.2). */
  readonly stockShare: number | null;
  readonly flowShare: number | null;
  readonly threats: Readonly<Record<ThreatVector, number>>;
  readonly threatBands: Readonly<Record<ThreatVector, ExposureBand>>;
  readonly question_bank_version: string;
}

export interface AssessmentInput {
  readonly answers: Answers;
  readonly archetype: Archetype;
  readonly companyName: string;
  readonly domain: string;
  readonly accumulationAsset?: string;
}

export interface AssessmentResult {
  readonly scores: Scores;
  readonly verdict: Verdict;
  readonly verdictRationale: string;
  readonly recommendedActions: readonly string[];
  readonly positioning: string;
}

// ---------------------------------------------------------------------------
// Answer access
// ---------------------------------------------------------------------------

const SCORE_VALUES: readonly Score[] = [0, 1, 2, 3];

function isScore(value: unknown): value is Score {
  return SCORE_VALUES.includes(value as Score);
}

/** Reads a 0–3 answer, throwing on missing/invalid rather than silently scoring 0. */
export function getScore(answers: Answers, id: string): Score {
  const value = answers[id];
  if (!isScore(value)) {
    throw new Error(`Missing or invalid score for question "${id}": ${String(value)}`);
  }
  return value;
}

const MONETISATION_VALUES: readonly Monetisation[] = ["none", "secondary", "primary"];

export function getMonetisation(answers: Answers, layer: LayerId): Monetisation {
  const id = MONETISATION_QUESTIONS[layer].id;
  const value = answers[id];
  if (!MONETISATION_VALUES.includes(value as Monetisation)) {
    throw new Error(`Missing or invalid monetisation for "${id}": ${String(value)}`);
  }
  return value as Monetisation;
}

/** Monetisation weights (§5.2). */
export function monetisationWeight(m: Monetisation): 0 | 1 | 2 {
  return m === "primary" ? 2 : m === "secondary" ? 1 : 0;
}

const mean = (xs: readonly number[]): number =>
  xs.reduce((a, b) => a + b, 0) / xs.length;

// ---------------------------------------------------------------------------
// §5.1 Layer scores
// ---------------------------------------------------------------------------

export function layerScore(answers: Answers, layer: LayerId): number {
  const values = LAYER_QUESTIONS[layer].map((q) => getScore(answers, q.id));
  return Math.round((mean(values) / 3) * 100);
}

export function layerBand(score: number): Band {
  if (score < 40) return "WEAK";
  if (score < 70) return "MODERATE";
  return "STRONG";
}

// ---------------------------------------------------------------------------
// §5.2 Flow / stock split
// ---------------------------------------------------------------------------

export interface FlowStockSplit {
  readonly flowPoints: number;
  readonly stockPoints: number;
  /** Null when no layer is monetised at all. */
  readonly stockShare: number | null;
  readonly flowShare: number | null;
}

export function flowStockSplit(answers: Answers): FlowStockSplit {
  const weightOf = (l: LayerId) => monetisationWeight(getMonetisation(answers, l));
  const flowPoints = FLOW_LAYERS.reduce((sum, l) => sum + weightOf(l), 0);
  const stockPoints = STOCK_LAYERS.reduce((sum, l) => sum + weightOf(l), 0);
  const total = flowPoints + stockPoints;

  if (total === 0) {
    return { flowPoints, stockPoints, stockShare: null, flowShare: null };
  }
  const stockShare = Math.round((stockPoints / total) * 100);
  return { flowPoints, stockPoints, stockShare, flowShare: 100 - stockShare };
}

// ---------------------------------------------------------------------------
// §5.3 Threat exposure (higher = more exposed)
// ---------------------------------------------------------------------------

export function threatExposure(answers: Answers, vector: ThreatVector): number {
  const values = THREAT_QUESTIONS[vector].map((q) => getScore(answers, q.id));
  return Math.round(100 - (mean(values) / 3) * 100);
}

export function exposureBand(exposure: number): ExposureBand {
  if (exposure <= 33) return "LOW";
  if (exposure <= 66) return "MEDIUM";
  return "HIGH";
}

// ---------------------------------------------------------------------------
// Score bundle
// ---------------------------------------------------------------------------

export function computeScores(answers: Answers): Scores {
  const layers = {} as Record<LayerId, number>;
  const layerBands = {} as Record<LayerId, Band>;
  for (const { id } of LAYERS) {
    layers[id] = layerScore(answers, id);
    layerBands[id] = layerBand(layers[id]);
  }

  const threats = {} as Record<ThreatVector, number>;
  const threatBands = {} as Record<ThreatVector, ExposureBand>;
  for (const vector of THREAT_VECTORS) {
    threats[vector] = threatExposure(answers, vector);
    threatBands[vector] = exposureBand(threats[vector]);
  }

  const { stockShare, flowShare } = flowStockSplit(answers);

  return {
    layers,
    layerBands,
    stockShare,
    flowShare,
    threats,
    threatBands,
    question_bank_version: QUESTION_BANK_VERSION,
  };
}

// ---------------------------------------------------------------------------
// §5.4 Verdict rules — evaluated top-down, first match wins
// ---------------------------------------------------------------------------

export const VERDICT_RATIONALES: Readonly<Record<Verdict, string>> = {
  UNPRICED:
    "Value not yet monetised anywhere in the stack; pricing strategy is the first job.",
  FEATURE_BUSINESS:
    "Revenue sits in flow layers; margin compression precedes churn. Reprice toward stock.",
  CONDITIONAL_MOAT:
    "Control-layer revenue without regulatory embedding; harden certifications or the moat is nominal.",
  CONTESTED_MOAT:
    "Right layer, wrong defences; fix the highest-exposure vector first.",
  MOAT_BUSINESS:
    "Monetising accumulated stock; optimise time-to-embedded and protect network assets.",
  MIXED: "Monetisation split across flow and stock; migration plan needed.",
  EXPENSIVE_FLOW_REBUILD:
    "The build reproduces the attacker's flow at multiples of their cost without accumulating stock. Stop and redesign around an accumulation asset.",
} as const;

export const VERDICT_LABELS: Readonly<Record<Verdict, string>> = {
  UNPRICED: "Unpriced",
  FEATURE_BUSINESS: "Feature business",
  CONDITIONAL_MOAT: "Conditional moat",
  CONTESTED_MOAT: "Contested moat",
  MOAT_BUSINESS: "Moat business",
  MIXED: "Mixed",
  EXPENSIVE_FLOW_REBUILD: "Expensive flow rebuild",
} as const;

export function computeVerdict(answers: Answers, archetype: Archetype): Verdict {
  const isPrimary = (l: LayerId) => getMonetisation(answers, l) === "primary";
  const monetisedAnywhere = LAYERS.some(
    ({ id }) => getMonetisation(answers, id) !== "none",
  );
  const primaryInFlow = FLOW_LAYERS.some(isPrimary);
  const primaryInStock = STOCK_LAYERS.some(isPrimary);
  const primaryInAccumulation = isPrimary("l4") || isPrimary("l5");
  const highVectors = THREAT_VECTORS.filter(
    (v) => exposureBand(threatExposure(answers, v)) === "HIGH",
  ).length;

  const base = ((): Verdict => {
    // 1. Nothing monetised anywhere.
    if (!monetisedAnywhere) return "UNPRICED";
    // 2. Primary monetisation only in the flow layers.
    if (primaryInFlow && !primaryInStock) return "FEATURE_BUSINESS";
    // 3. Control-layer revenue without regulatory embedding.
    if (isPrimary("l3") && getScore(answers, "l3_q2") <= 1) return "CONDITIONAL_MOAT";
    // 4. Right layer, but two or more vectors wide open.
    if (primaryInAccumulation && highVectors >= 2) return "CONTESTED_MOAT";
    // 5. Right layer, defences holding.
    if (primaryInAccumulation && highVectors <= 1) return "MOAT_BUSINESS";
    // 6. Everything else.
    return "MIXED";
  })();

  // Archetype override (§5.4): an enterprise counter-attack that is both
  // out-costed and accumulating nothing is rebuilding flow, whatever the base
  // verdict says.
  if (
    archetype === "enterprise_counter_attack" &&
    getScore(answers, "a_eca_1") <= 1 &&
    getScore(answers, "a_eca_2") <= 1
  ) {
    return "EXPENSIVE_FLOW_REBUILD";
  }

  return base;
}

// ---------------------------------------------------------------------------
// §5.5 Recommended actions — rule-generated, max 5, ordered by severity
// ---------------------------------------------------------------------------

const MAX_ACTIONS = 5;

interface CandidateAction {
  readonly severity: number; // lower fires first
  readonly text: string;
}

export function recommendedActions(input: AssessmentInput): readonly string[] {
  const { answers, accumulationAsset } = input;
  const candidates: CandidateAction[] = [];

  // Severity 0: no articulated accumulation asset. The spec calls this "the
  // strategy gap" — it outranks any individual threat, because without it there
  // is nothing to defend.
  const asset = (accumulationAsset ?? "").trim();
  if (asset.length < ACCUMULATION_ASSET_MIN_LENGTH) {
    candidates.push({
      severity: 0,
      text: "No accumulation asset articulated — this is the strategy gap.",
    });
  }

  // Severity 1: each HIGH threat vector, most exposed first.
  const exposed = THREAT_VECTORS.map((vector) => ({
    vector,
    exposure: threatExposure(answers, vector),
  }))
    .filter(({ exposure }) => exposureBand(exposure) === "HIGH")
    .sort((a, b) => b.exposure - a.exposure);

  for (const [index, { vector }] of exposed.entries()) {
    // Fractional severity preserves the most-exposed-first ordering within the tier.
    candidates.push({ severity: 1 + index / 10, text: THREATS[vector].defence });
  }

  // Severity 2: revenue concentrated in the flow layers.
  const { flowShare } = flowStockSplit(answers);
  if (flowShare !== null && flowShare > 60) {
    candidates.push({
      severity: 2,
      text: "Reprice toward stock layers before the market reprices you.",
    });
  }

  // Severity 3: thin accumulation.
  if (getScore(answers, "l4_q1") <= 1) {
    candidates.push({
      severity: 3,
      text: "Accumulation is thin: prioritise capture of customer-specific ground truth.",
    });
  }

  return candidates
    .sort((a, b) => a.severity - b.severity)
    .slice(0, MAX_ACTIONS)
    .map((c) => c.text);
}

// ---------------------------------------------------------------------------
// §5.6 Generated positioning statement
// ---------------------------------------------------------------------------

/** What the commoditised tools in this space do, by strongest monetised flow layer. */
const FLOW_DESCRIPTIONS: Readonly<Record<FlowLayerId | "none", string>> = {
  l1: "wrap a model in prompts and rules",
  l2: "wire a model into your systems",
  none: "wrap a model in prompts and plumbing",
} as const;

/** Stock descriptor by strongest monetised stock layer (§5.6). */
const STOCK_DESCRIPTORS: Readonly<Record<StockLayerId, string>> = {
  l3: "independent accountability layer",
  l4: "independent judgment layer",
  l5: "improvement ledger",
} as const;

/**
 * Strongest monetised layer among `candidates`, by monetisation weight.
 * Ties break toward the deeper layer, which is the stronger stock.
 */
function strongestMonetised<T extends LayerId>(
  answers: Answers,
  candidates: readonly T[],
): T | null {
  let best: T | null = null;
  let bestWeight = 0;
  for (const layer of candidates) {
    const weight = monetisationWeight(getMonetisation(answers, layer));
    if (weight > 0 && weight >= bestWeight) {
      best = layer;
      bestWeight = weight;
    }
  }
  return best;
}

export function topThreatVector(answers: Answers): ThreatVector {
  return THREAT_VECTORS.reduce((worst, vector) =>
    threatExposure(answers, vector) > threatExposure(answers, worst) ? vector : worst,
  );
}

export function positioningStatement(input: AssessmentInput): string {
  const { answers, companyName, domain } = input;

  const flowLayer = strongestMonetised(answers, FLOW_LAYERS);
  const flowDescription = FLOW_DESCRIPTIONS[flowLayer ?? "none"];

  const threat = THREATS[topThreatVector(answers)].humanised;

  const stockLayer = strongestMonetised(answers, STOCK_LAYERS);
  const stockDescriptor = stockLayer
    ? STOCK_DESCRIPTORS[stockLayer]
    : "independent harness layer";

  return (
    `Tools that ${flowDescription} are being commoditised by ${threat}. ` +
    `${companyName} is the ${stockDescriptor} for ${domain} — ` +
    `which every rival, agent, and in-house build still has to plug into.`
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function assess(input: AssessmentInput): AssessmentResult {
  const verdict = computeVerdict(input.answers, input.archetype);
  return {
    scores: computeScores(input.answers),
    verdict,
    verdictRationale: VERDICT_RATIONALES[verdict],
    recommendedActions: recommendedActions(input),
    positioning: positioningStatement(input),
  };
}

/** Question ids this archetype requires but the answers omit. Empty means complete. */
export function missingAnswers(
  answers: Answers,
  archetype: Archetype,
): readonly string[] {
  const required = [
    ...LAYERS.flatMap(({ id }) => LAYER_QUESTIONS[id].map((q) => q.id)),
    ...THREAT_VECTORS.flatMap((v) => THREAT_QUESTIONS[v].map((q) => q.id)),
    ...ARCHETYPE_QUESTIONS[archetype].map((q) => q.id),
  ];
  const missing = required.filter((id) => !isScore(answers[id]));
  const missingMon = LAYERS.map(({ id }) => MONETISATION_QUESTIONS[id].id).filter(
    (id) => !MONETISATION_VALUES.includes(answers[id] as Monetisation),
  );
  return [...missing, ...missingMon];
}
