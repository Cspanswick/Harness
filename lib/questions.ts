/**
 * The Harness Moat Model question bank (HANDOVER §4).
 *
 * Question text and anchor labels are transcribed verbatim from the spec —
 * they are product copy, not paraphrase. Changing any question text or scale
 * requires bumping QUESTION_BANK_VERSION (CLAUDE.md rule 3), which is stamped
 * into every assessment's `scores` jsonb so old assessments stay interpretable.
 */

export const QUESTION_BANK_VERSION = "1.0";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Every scored question is 0–3, where higher always means stronger moat / safer. */
export type Score = 0 | 1 | 2 | 3;

export type Monetisation = "none" | "secondary" | "primary";

export type Archetype = "technical_domain_vendor" | "enterprise_counter_attack";

export type LayerId = "l1" | "l2" | "l3" | "l4" | "l5";

export type ThreatVector = "replication" | "absorption" | "internalisation";

/** Flow is consumed monthly; stock accumulates. Moats are made of stock. */
export type LayerKind = "flow" | "stock";

export type Anchors4 = readonly [string, string, string, string];

export interface ScaleQuestion {
  readonly id: string;
  readonly prompt: string;
  /** Layer evidence questions: the spec supplies all four anchors. */
  readonly anchors?: Anchors4;
  /** Threat and archetype questions: the spec supplies only the 0 and 3 poles. */
  readonly endpoints?: readonly [string, string];
}

export interface MonetisationQuestion {
  readonly id: string;
  readonly prompt: string;
}

/**
 * Four labels for the four radio cards. The spec requires anchor text to be
 * visible on every option — never bare numbers — but only gives both poles for
 * threat/archetype questions, so the midpoints are rendered as leanings toward
 * a pole rather than invented claims.
 */
export function optionLabels(question: ScaleQuestion): Anchors4 {
  if (question.anchors) return question.anchors;
  if (!question.endpoints) {
    throw new Error(`Question ${question.id} has neither anchors nor endpoints`);
  }
  const [low, high] = question.endpoints;
  return [low, `Closer to “${low}”`, `Closer to “${high}”`, high] as const;
}

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

export interface LayerMeta {
  readonly id: LayerId;
  readonly n: 1 | 2 | 3 | 4 | 5;
  readonly name: string;
  readonly kind: LayerKind;
}

export const LAYERS: readonly LayerMeta[] = [
  { id: "l1", n: 1, name: "Instruction", kind: "flow" },
  { id: "l2", n: 2, name: "Context", kind: "flow" },
  { id: "l3", n: 3, name: "Control", kind: "stock" },
  { id: "l4", n: 4, name: "Evaluation", kind: "stock" },
  { id: "l5", n: 5, name: "Learning loop", kind: "stock" },
] as const;

/** Kept as literal tuples so callers narrow to the exact layers, not LayerId. */
export const FLOW_LAYERS = ["l1", "l2"] as const;
export const STOCK_LAYERS = ["l3", "l4", "l5"] as const;

export type FlowLayerId = (typeof FLOW_LAYERS)[number];
export type StockLayerId = (typeof STOCK_LAYERS)[number];

const MONETISATION_PROMPT = "Is revenue anchored in this layer?";

export const LAYER_QUESTIONS: Readonly<Record<LayerId, readonly ScaleQuestion[]>> = {
  l1: [
    {
      id: "l1_q1",
      prompt:
        "How much of the differentiation story rests on prompts, rules, or configuration?",
      anchors: [
        'Entirely — "better prompts" is the pitch',
        "Mostly",
        "Partially",
        "Barely — config is onboarding, not product",
      ],
    },
    {
      id: "l1_q2",
      prompt: "Would a 10× better foundation model halve this layer's value?",
      anchors: [
        "Yes, immediately",
        "Probably",
        "Somewhat",
        "No — value is independent of model quality",
      ],
    },
    {
      id: "l1_q3",
      prompt: "Is the encoded domain logic public standard or proprietary?",
      anchors: [
        "Fully public (e.g. vanilla ITIL)",
        "Mostly public",
        "Mix",
        "Deeply proprietary, insider-only knowledge",
      ],
    },
  ],
  l2: [
    {
      id: "l2_q1",
      prompt:
        "Could a funded rival replicate the integrations/connectors in 12 months?",
      anchors: [
        "Easily",
        "Probably",
        "With difficulty",
        "No — deep, entitlement-aware plumbing",
      ],
    },
    {
      id: "l2_q2",
      prompt:
        "If customers rebuilt this integration themselves, would it be hard or just annoying?",
      anchors: [
        "Just annoying",
        "Mostly annoying",
        "Somewhat hard",
        "Genuinely hard (permissioning/entitlement logic)",
      ],
    },
    {
      id: "l2_q3",
      prompt:
        "Are agents/models increasingly able to self-serve this context (browse, query, call tools)?",
      anchors: [
        "Yes, already happening",
        "Trending that way",
        "Partially protected",
        "No — context requires org-specific access rights",
      ],
    },
  ],
  l3: [
    {
      id: "l3_q1",
      prompt:
        "Do buyers cite compliance/audit requirements to justify the purchase?",
      anchors: [
        "Never",
        "Rarely",
        "Sometimes",
        "Routinely — it's in procurement criteria",
      ],
    },
    {
      id: "l3_q2",
      prompt:
        "Certifications / regulatory recognition (SOC 2, ISO, EU AI Act readiness, auditor references)?",
      anchors: [
        "None",
        "Basic (SOC 2 only)",
        "Several, current",
        "Certified + cited in customers' own compliance evidence",
      ],
    },
    {
      id: "l3_q3",
      prompt: "Does switching vendors force the customer to re-audit or re-certify?",
      anchors: [
        "No",
        "Minor rework",
        "Significant rework",
        "Full re-audit — regulator-visible change",
      ],
    },
  ],
  l4: [
    {
      id: "l4_q1",
      prompt:
        "How much customer-specific outcome/judgment data does the vendor hold?",
      anchors: [
        "None / <90 days",
        "3–6 months",
        "6–12 months",
        "Years, growing monthly",
      ],
    },
    {
      id: "l4_q2",
      prompt:
        'Does the customer\'s definition of "good" live in the platform (labels, evals, tuned judges)?',
      anchors: [
        "No — off-the-shelf benchmarks",
        "Some custom evals",
        "Substantial custom ground truth",
        "The platform is the definition of good",
      ],
    },
    {
      id: "l4_q3",
      prompt:
        "Is that judgment data portable, or bound to the vendor's traces and workflows?",
      anchors: [
        "Fully exportable/portable",
        "Mostly portable",
        "Partially bound",
        "Deeply bound — reconstruction ≈ starting over",
      ],
    },
  ],
  l5: [
    {
      id: "l5_q1",
      prompt:
        "Does an improvement history accumulate (what was tried, what worked, why)?",
      anchors: [
        "No",
        "Logs exist but unused",
        "Structured history, partially used",
        "Yes — a living improvement ledger",
      ],
    },
    {
      id: "l5_q2",
      prompt: "Is the loop wired to real business outcomes (not just model metrics)?",
      anchors: ["No", "Weakly", "Partially", "Directly — outcomes feed the loop"],
    },
    {
      id: "l5_q3",
      prompt: "Would leaving mean losing months/years of accumulated learning?",
      anchors: [
        "No loss",
        "Minor loss",
        "Significant loss",
        "Catastrophic loss — the history is the value",
      ],
    },
  ],
} as const;

export const MONETISATION_QUESTIONS: Readonly<Record<LayerId, MonetisationQuestion>> = {
  l1: { id: "l1_mon", prompt: MONETISATION_PROMPT },
  l2: { id: "l2_mon", prompt: MONETISATION_PROMPT },
  l3: { id: "l3_mon", prompt: MONETISATION_PROMPT },
  l4: { id: "l4_mon", prompt: MONETISATION_PROMPT },
  l5: { id: "l5_mon", prompt: MONETISATION_PROMPT },
} as const;

// ---------------------------------------------------------------------------
// Threat tests (higher = safer)
// ---------------------------------------------------------------------------

export interface ThreatMeta {
  readonly vector: ThreatVector;
  readonly label: string;
  /** The defence line surfaced as a recommended action when exposure is HIGH (§5.5). */
  readonly defence: string;
  /** Humanised form used in the generated positioning statement (§5.6). */
  readonly humanised: string;
}

export const THREATS: Readonly<Record<ThreatVector, ThreatMeta>> = {
  replication: {
    vector: "replication",
    label: "Replication",
    defence: "Race to embed: instrument deeply in first 90 days",
    humanised: "rivals who can copy the tooling",
  },
  absorption: {
    vector: "absorption",
    label: "Absorption",
    defence:
      "Position as the independent layer agents must consume; play the neutrality card",
    humanised: "models that increasingly do this themselves",
  },
  internalisation: {
    vector: "internalisation",
    label: "Internalisation",
    defence: "Build cross-customer network assets; sell cost-of-currency",
    humanised: "customers who can build it in-house",
  },
} as const;

export const THREAT_QUESTIONS: Readonly<Record<ThreatVector, readonly ScaleQuestion[]>> = {
  replication: [
    {
      id: "t_rep_1",
      prompt: "Could a rival ship an equivalent product in 12 months?",
      endpoints: ["Yes, easily", "No — the accumulated data can't be shipped"],
    },
    {
      id: "t_rep_2",
      prompt: "Beyond exportable data, what switching costs exist?",
      endpoints: ["None", "Deep: workflows, tuned evaluators, embedded history"],
    },
    {
      id: "t_rep_3",
      prompt: 'How fast does a new customer reach "locked in by accumulation"?',
      endpoints: ["Never", "Under 6 months"],
    },
  ],
  absorption: [
    {
      id: "t_abs_1",
      prompt: "Would a materially better model make the product unnecessary?",
      endpoints: ["Yes", "No — value is what agents must consume, not generate"],
    },
    {
      id: "t_abs_2",
      prompt: 'If a lab/hyperscaler bundled a "good-enough" version, what happens?',
      endpoints: ["Displaced", "Unaffected — neutrality/independence is structural"],
    },
    {
      id: "t_abs_3",
      prompt: "Is the vendor neutral across model vendors?",
      endpoints: ["Single-model dependent", "Fully neutral, multi-model by design"],
    },
  ],
  internalisation: [
    {
      id: "t_int_1",
      prompt: "Could the best customers' platform teams build this in 18 months?",
      endpoints: ["Yes, and they want to", "No — network assets they can't self-build"],
    },
    {
      id: "t_int_2",
      prompt: "What is the cost of keeping an in-house build current?",
      endpoints: ["Low — stable target", "Very high — frontier moves monthly"],
    },
    {
      id: "t_int_3",
      prompt:
        "Does the vendor own cross-customer assets (benchmarks, pooled failure intel)?",
      endpoints: ["None", "Yes, and they're the industry reference"],
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// Archetypes
// ---------------------------------------------------------------------------

export interface ArchetypeMeta {
  readonly key: Archetype;
  readonly label: string;
  readonly description: string;
}

export const ARCHETYPES: Readonly<Record<Archetype, ArchetypeMeta>> = {
  technical_domain_vendor: {
    key: "technical_domain_vendor",
    label: "Technical domain vendor",
    description:
      "Narrow-field AI over an established process domain — ITSM, DevOps, SRE, AI Engineering. The domain's processes are partly codified in public standards (ITIL, SRE practice); the moat question is what the vendor encodes beyond the public playbook.",
  },
  enterprise_counter_attack: {
    key: "enterprise_counter_attack",
    label: "Enterprise counter-attack",
    description:
      "An incumbent building internally to defend against structurally leaner attackers (the NatWest-vs-Revolut pattern: 3,000 IT staff vs 300 engineers). The question is whether the build creates defensible stock or expensively rebuilds flow.",
  },
} as const;

export const ARCHETYPE_QUESTIONS: Readonly<Record<Archetype, readonly ScaleQuestion[]>> = {
  technical_domain_vendor: [
    {
      id: "a_tdv_1",
      prompt:
        "What share of the encoded process knowledge is proprietary vs public standard (ITIL, SRE books)?",
      endpoints: ["~All public", "Mostly proprietary, insider-only"],
    },
    {
      id: "a_tdv_2",
      prompt:
        "How fast does this domain's frontier move (new tools, failure modes, practices)?",
      endpoints: ["Static — easy to copy once", "Monthly — currency itself is the moat"],
    },
    {
      id: "a_tdv_3",
      prompt: "Do practitioners in the domain treat the vendor as a reference/standard?",
      endpoints: ["Unknown vendor", "Yes — de facto standard"],
    },
  ],
  enterprise_counter_attack: [
    {
      id: "a_eca_1",
      prompt:
        "Cost-to-serve vs the attacker (the 3,000-vs-300 test): headcount and run-cost per customer/journey served?",
      endpoints: ["≥5× worse than attacker", "At or below attacker's cost structure"],
    },
    {
      id: "a_eca_2",
      prompt:
        "Is the build creating stock (judgment data, improvement history) or rebuilding flow the attacker already does cheaper?",
      endpoints: [
        "Pure flow rebuild",
        "Deliberately accumulating stock the attacker lacks",
      ],
    },
    {
      id: "a_eca_3",
      prompt: "Ship cadence vs the attacker?",
      endpoints: ["Quarters vs their weeks", "Matched or faster"],
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// Free text (§4)
// ---------------------------------------------------------------------------

/** The sharpest diagnostic in the tool: if it can't be completed, there is no moat. */
export const ACCUMULATION_ASSET_PROMPT =
  "Complete: “The ___ accumulates in the platform as ___, and after ___ it becomes ___ difficult to switch.” If you can't complete this sentence, there is no moat — only features.";

export const ASSESSOR_NOTES_PROMPT = "Anything else.";

/** Below this length the accumulation asset counts as unarticulated (§5.5). */
export const ACCUMULATION_ASSET_MIN_LENGTH = 40;

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export const THREAT_VECTORS: readonly ThreatVector[] = [
  "replication",
  "absorption",
  "internalisation",
] as const;

/** Every scored question id required for a complete assessment of this archetype. */
export function scoredQuestionIds(archetype: Archetype): readonly string[] {
  return [
    ...LAYERS.flatMap((l) => LAYER_QUESTIONS[l.id].map((q) => q.id)),
    ...THREAT_VECTORS.flatMap((v) => THREAT_QUESTIONS[v].map((q) => q.id)),
    ...ARCHETYPE_QUESTIONS[archetype].map((q) => q.id),
  ];
}

/** Every monetisation question id (one per layer). */
export function monetisationQuestionIds(): readonly string[] {
  return LAYERS.map((l) => MONETISATION_QUESTIONS[l.id].id);
}
