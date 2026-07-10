import { describe, expect, it } from "vitest";

import {
  monetisationQuestionIds,
  scoredQuestionIds,
  THREAT_QUESTIONS,
  type Archetype,
  type Monetisation,
  type Score,
  type ThreatVector,
} from "./questions";
import {
  assess,
  computeScores,
  computeVerdict,
  exposureBand,
  flowStockSplit,
  getScore,
  layerBand,
  layerScore,
  missingAnswers,
  positioningStatement,
  recommendedActions,
  threatExposure,
  topThreatVector,
  type Answers,
} from "./scoring";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type Overrides = Record<string, Score | Monetisation>;

/**
 * A complete answer set: every scored question at 3 (strongest/safest) and
 * every layer unmonetised. Tests override only the fields under test, so a
 * failure points at the rule being exercised rather than at fixture noise.
 */
function answersFor(archetype: Archetype, overrides: Overrides = {}): Answers {
  const answers: Overrides = {};
  for (const id of scoredQuestionIds(archetype)) answers[id] = 3;
  for (const id of monetisationQuestionIds()) answers[id] = "none";
  return { ...answers, ...overrides };
}

/** Sets all three questions of a vector, driving its exposure to a known band. */
function vector(v: ThreatVector, score: Score): Overrides {
  return Object.fromEntries(THREAT_QUESTIONS[v].map((q) => [q.id, score]));
}

const TDV: Archetype = "technical_domain_vendor";
const ECA: Archetype = "enterprise_counter_attack";

// ---------------------------------------------------------------------------
// §5.1 Layer scores
// ---------------------------------------------------------------------------

describe("layerScore (§5.1)", () => {
  it("maps the 0–3 mean onto 0–100", () => {
    expect(layerScore(answersFor(TDV, { l1_q1: 0, l1_q2: 0, l1_q3: 0 }), "l1")).toBe(0);
    expect(layerScore(answersFor(TDV, { l1_q1: 3, l1_q2: 3, l1_q3: 3 }), "l1")).toBe(100);
  });

  it("rounds a 1/2/3 spread to 67", () => {
    expect(layerScore(answersFor(TDV, { l1_q1: 1, l1_q2: 2, l1_q3: 3 }), "l1")).toBe(67);
  });

  it("scores each layer independently", () => {
    const answers = answersFor(TDV, { l1_q1: 0, l1_q2: 0, l1_q3: 0 });
    const { layers } = computeScores(answers);
    expect(layers.l1).toBe(0);
    expect(layers.l5).toBe(100);
  });
});

describe("layerBand (§5.1)", () => {
  it("bands on 0–39 / 40–69 / 70–100", () => {
    expect(layerBand(0)).toBe("WEAK");
    expect(layerBand(39)).toBe("WEAK");
    expect(layerBand(40)).toBe("MODERATE");
    expect(layerBand(69)).toBe("MODERATE");
    expect(layerBand(70)).toBe("STRONG");
    expect(layerBand(100)).toBe("STRONG");
  });
});

// ---------------------------------------------------------------------------
// §5.2 Flow / stock split
// ---------------------------------------------------------------------------

describe("flowStockSplit (§5.2)", () => {
  it("returns a null share when nothing is monetised", () => {
    const split = flowStockSplit(answersFor(TDV));
    expect(split).toMatchObject({ flowPoints: 0, stockPoints: 0, stockShare: null });
    expect(split.flowShare).toBeNull();
  });

  it("weights none=0, secondary=1, primary=2", () => {
    const split = flowStockSplit(
      answersFor(TDV, { l1_mon: "primary", l3_mon: "secondary" }),
    );
    expect(split.flowPoints).toBe(2);
    expect(split.stockPoints).toBe(1);
    expect(split.stockShare).toBe(33);
    expect(split.flowShare).toBe(67);
  });

  it("splits evenly when flow and stock carry equal weight", () => {
    const split = flowStockSplit(answersFor(TDV, { l1_mon: "primary", l4_mon: "primary" }));
    expect(split.stockShare).toBe(50);
    expect(split.flowShare).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// §5.3 Threat exposure
// ---------------------------------------------------------------------------

describe("threatExposure (§5.3)", () => {
  it("inverts the 0–3 answers: safest answers mean zero exposure", () => {
    expect(threatExposure(answersFor(TDV), "replication")).toBe(0);
  });

  it("reports full exposure when every answer is the unsafe pole", () => {
    const answers = answersFor(TDV, vector("absorption", 0));
    expect(threatExposure(answers, "absorption")).toBe(100);
  });

  it("bands on 0–33 / 34–66 / 67–100", () => {
    expect(exposureBand(0)).toBe("LOW");
    expect(exposureBand(33)).toBe("LOW");
    expect(exposureBand(34)).toBe("MEDIUM");
    expect(exposureBand(66)).toBe("MEDIUM");
    expect(exposureBand(67)).toBe("HIGH");
    expect(exposureBand(100)).toBe("HIGH");
  });

  it("picks the most exposed vector", () => {
    const answers = answersFor(TDV, { ...vector("internalisation", 0) });
    expect(topThreatVector(answers)).toBe("internalisation");
  });
});

// ---------------------------------------------------------------------------
// §5.4 Verdict rules — evaluated top-down, first match wins
// ---------------------------------------------------------------------------

describe("computeVerdict (§5.4)", () => {
  it("rule 1: nothing monetised anywhere → UNPRICED", () => {
    expect(computeVerdict(answersFor(TDV), TDV)).toBe("UNPRICED");
  });

  it("rule 2: primary only in flow layers → FEATURE_BUSINESS", () => {
    const answers = answersFor(TDV, { l1_mon: "primary" });
    expect(computeVerdict(answers, TDV)).toBe("FEATURE_BUSINESS");
  });

  it("rule 2: secondary stock revenue does not rescue a flow-primary business", () => {
    const answers = answersFor(TDV, { l2_mon: "primary", l4_mon: "secondary" });
    expect(computeVerdict(answers, TDV)).toBe("FEATURE_BUSINESS");
  });

  it("rule 3: primary in L3 with weak certification → CONDITIONAL_MOAT", () => {
    const answers = answersFor(TDV, { l3_mon: "primary", l3_q2: 1 });
    expect(computeVerdict(answers, TDV)).toBe("CONDITIONAL_MOAT");
  });

  it("rule 3 beats rule 5: it is checked before the accumulation layers", () => {
    // Primary in both L3 (weak certs) and L4. Top-down order must yield rule 3.
    const answers = answersFor(TDV, {
      l3_mon: "primary",
      l3_q2: 0,
      l4_mon: "primary",
    });
    expect(computeVerdict(answers, TDV)).toBe("CONDITIONAL_MOAT");
  });

  it("rule 3 beats rule 4 when both match: first match wins", () => {
    // Rule 3 (L3 primary, weak certs) and rule 4 (L4 primary, 2 HIGH vectors)
    // both hold. Top-down evaluation must return the earlier rule.
    const answers = answersFor(TDV, {
      l3_mon: "primary",
      l3_q2: 1,
      l4_mon: "primary",
      ...vector("replication", 0),
      ...vector("absorption", 0),
    });
    expect(computeVerdict(answers, TDV)).toBe("CONDITIONAL_MOAT");
  });

  it("rule 2 does not pre-empt rule 3 when stock also carries primary revenue", () => {
    // Primary in L1 *and* L3: rule 2 requires primary to sit only in flow.
    const answers = answersFor(TDV, { l1_mon: "primary", l3_mon: "primary", l3_q2: 0 });
    expect(computeVerdict(answers, TDV)).toBe("CONDITIONAL_MOAT");
  });

  it("rule 3 does not fire when certifications are embedded", () => {
    const answers = answersFor(TDV, { l3_mon: "primary", l3_q2: 2 });
    expect(computeVerdict(answers, TDV)).toBe("MIXED");
  });

  it("rule 4: primary in L4/L5 with two HIGH vectors → CONTESTED_MOAT", () => {
    const answers = answersFor(TDV, {
      l4_mon: "primary",
      ...vector("replication", 0),
      ...vector("absorption", 0),
    });
    expect(computeVerdict(answers, TDV)).toBe("CONTESTED_MOAT");
  });

  it("rule 5: primary in L5 with at most one HIGH vector → MOAT_BUSINESS", () => {
    const answers = answersFor(TDV, {
      l5_mon: "primary",
      ...vector("replication", 0),
    });
    expect(computeVerdict(answers, TDV)).toBe("MOAT_BUSINESS");
  });

  it("rule 5: a clean sheet with L4 primary is a MOAT_BUSINESS", () => {
    expect(computeVerdict(answersFor(TDV, { l4_mon: "primary" }), TDV)).toBe(
      "MOAT_BUSINESS",
    );
  });

  it("rule 6: monetised but no primary anywhere → MIXED", () => {
    const answers = answersFor(TDV, { l1_mon: "secondary", l4_mon: "secondary" });
    expect(computeVerdict(answers, TDV)).toBe("MIXED");
  });
});

// ---------------------------------------------------------------------------
// §5.4 Enterprise counter-attack override
// ---------------------------------------------------------------------------

describe("enterprise counter-attack override (§5.4)", () => {
  it("out-costed and accumulating nothing → EXPENSIVE_FLOW_REBUILD", () => {
    const answers = answersFor(ECA, { a_eca_1: 1, a_eca_2: 1 });
    expect(computeVerdict(answers, ECA)).toBe("EXPENSIVE_FLOW_REBUILD");
  });

  it("overrides even a verdict that would otherwise be MOAT_BUSINESS", () => {
    const answers = answersFor(ECA, { l4_mon: "primary", a_eca_1: 0, a_eca_2: 0 });
    expect(computeVerdict(answers, ECA)).toBe("EXPENSIVE_FLOW_REBUILD");
  });

  it("overrides UNPRICED too: the override is unconditional", () => {
    const answers = answersFor(ECA, { a_eca_1: 0, a_eca_2: 0 });
    expect(computeVerdict(answers, ECA)).toBe("EXPENSIVE_FLOW_REBUILD");
  });

  it("does not fire when cost-to-serve is competitive", () => {
    const answers = answersFor(ECA, { l4_mon: "primary", a_eca_1: 2, a_eca_2: 1 });
    expect(computeVerdict(answers, ECA)).toBe("MOAT_BUSINESS");
  });

  it("does not fire when the build accumulates stock", () => {
    const answers = answersFor(ECA, { l4_mon: "primary", a_eca_1: 1, a_eca_2: 2 });
    expect(computeVerdict(answers, ECA)).toBe("MOAT_BUSINESS");
  });

  it("never applies to a technical domain vendor", () => {
    // a_eca_* are absent from a TDV answer set; the override must not read them.
    const answers = answersFor(TDV, { l4_mon: "primary" });
    expect(computeVerdict(answers, TDV)).toBe("MOAT_BUSINESS");
  });
});

// ---------------------------------------------------------------------------
// §5.5 Recommended actions
// ---------------------------------------------------------------------------

const ASSET = "Ten years of resolved-incident judgment data accumulates as tuned evaluators.";

function actionsFor(overrides: Overrides, accumulationAsset = ASSET) {
  return recommendedActions({
    answers: answersFor(TDV, overrides),
    archetype: TDV,
    companyName: "Acme",
    domain: "ITSM",
    accumulationAsset,
  });
}

describe("recommendedActions (§5.5)", () => {
  it("flags a missing accumulation asset as the top-severity gap", () => {
    const actions = actionsFor({}, "too short");
    expect(actions[0]).toBe("No accumulation asset articulated — this is the strategy gap.");
  });

  it("treats a whitespace-only asset as absent", () => {
    expect(actionsFor({}, "   ")).toContain(
      "No accumulation asset articulated — this is the strategy gap.",
    );
  });

  it("stays silent when the asset is articulated", () => {
    expect(actionsFor({})).not.toContain(
      "No accumulation asset articulated — this is the strategy gap.",
    );
  });

  it("emits the matching defence line for each HIGH vector", () => {
    expect(actionsFor(vector("absorption", 0))).toContain(
      "Position as the independent layer agents must consume; play the neutrality card",
    );
    expect(actionsFor(vector("internalisation", 0))).toContain(
      "Build cross-customer network assets; sell cost-of-currency",
    );
  });

  it("orders HIGH vectors most-exposed first", () => {
    // replication fully exposed (100); internalisation partially (67).
    const actions = actionsFor({
      ...vector("replication", 0),
      ...vector("internalisation", 1),
    });
    expect(actions).toEqual([
      "Race to embed: instrument deeply in first 90 days",
      "Build cross-customer network assets; sell cost-of-currency",
    ]);
  });

  it("fires the reprice action only when flow share exceeds 60%", () => {
    const reprice = "Reprice toward stock layers before the market reprices you.";
    expect(actionsFor({ l1_mon: "primary", l4_mon: "secondary" })).toContain(reprice);
    // 50/50 is not "greater than 60".
    expect(actionsFor({ l1_mon: "primary", l4_mon: "primary" })).not.toContain(reprice);
    // Nothing monetised → null share → cannot fire.
    expect(actionsFor({})).not.toContain(reprice);
  });

  it("flags thin accumulation when l4_q1 is 0 or 1", () => {
    const thin = "Accumulation is thin: prioritise capture of customer-specific ground truth.";
    expect(actionsFor({ l4_q1: 1 })).toContain(thin);
    expect(actionsFor({ l4_q1: 2 })).not.toContain(thin);
  });

  it("caps at five actions, dropping the least severe", () => {
    const actions = actionsFor(
      {
        ...vector("replication", 0),
        ...vector("absorption", 0),
        ...vector("internalisation", 0),
        l1_mon: "primary",
        l4_q1: 0,
      },
      "short",
    );
    expect(actions).toHaveLength(5);
    expect(actions[0]).toBe("No accumulation asset articulated — this is the strategy gap.");
    // Six candidates fired; the thin-accumulation line is lowest severity and is cut.
    expect(actions).not.toContain(
      "Accumulation is thin: prioritise capture of customer-specific ground truth.",
    );
  });
});

// ---------------------------------------------------------------------------
// §5.6 Positioning statement
// ---------------------------------------------------------------------------

describe("positioningStatement (§5.6)", () => {
  const base = { archetype: TDV, companyName: "Acme", domain: "ITSM" } as const;

  it("populates flow description, top threat, stock descriptor, and domain", () => {
    const statement = positioningStatement({
      ...base,
      answers: answersFor(TDV, {
        l1_mon: "primary",
        l4_mon: "primary",
        ...vector("absorption", 0),
      }),
    });
    expect(statement).toBe(
      "Tools that wrap a model in prompts and rules are being commoditised by " +
        "models that increasingly do this themselves. Acme is the independent " +
        "judgment layer for ITSM — which every rival, agent, and in-house build " +
        "still has to plug into.",
    );
  });

  it("breaks stock ties toward the deeper layer", () => {
    const statement = positioningStatement({
      ...base,
      answers: answersFor(TDV, { l4_mon: "primary", l5_mon: "primary" }),
    });
    expect(statement).toContain("Acme is the improvement ledger for ITSM");
  });

  it("names the control layer when L3 is the monetised stock layer", () => {
    const statement = positioningStatement({
      ...base,
      answers: answersFor(TDV, { l3_mon: "primary" }),
    });
    expect(statement).toContain("Acme is the independent accountability layer for ITSM");
  });

  it("falls back gracefully when no layer is monetised", () => {
    const statement = positioningStatement({ ...base, answers: answersFor(TDV) });
    expect(statement).toContain("Tools that wrap a model in prompts and plumbing");
    expect(statement).toContain("Acme is the independent harness layer for ITSM");
  });
});

// ---------------------------------------------------------------------------
// Answer validation and the assembled result
// ---------------------------------------------------------------------------

describe("answer validation", () => {
  it("throws rather than scoring a missing answer as zero", () => {
    const answers = { ...answersFor(TDV), l1_q1: undefined };
    expect(() => layerScore(answers, "l1")).toThrow(/l1_q1/);
  });

  it("rejects an out-of-range score", () => {
    expect(() => getScore({ x: 7 as unknown as Score }, "x")).toThrow(/invalid/i);
  });

  it("reports missing question ids for the archetype", () => {
    const partial: Record<string, Score | Monetisation | undefined> = {
      ...answersFor(TDV),
    };
    delete partial.l4_q2;
    expect(missingAnswers(partial, TDV)).toEqual(["l4_q2"]);
  });

  it("requires the archetype-specific questions", () => {
    expect(missingAnswers(answersFor(TDV), ECA)).toEqual(["a_eca_1", "a_eca_2", "a_eca_3"]);
  });

  it("considers a full answer set complete", () => {
    expect(missingAnswers(answersFor(ECA), ECA)).toEqual([]);
  });
});

describe("assess", () => {
  it("stamps the question bank version into the scores", () => {
    const result = assess({
      answers: answersFor(TDV, { l4_mon: "primary" }),
      archetype: TDV,
      companyName: "Acme",
      domain: "ITSM",
      accumulationAsset: ASSET,
    });
    expect(result.scores.question_bank_version).toBe("1.0");
    expect(result.verdict).toBe("MOAT_BUSINESS");
    expect(result.verdictRationale).toMatch(/Monetising accumulated stock/);
    expect(result.positioning).toContain("Acme");
  });
});
