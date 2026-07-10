# Harness Moat Assessor — Build Handover for Claude Code

**What this is:** A complete specification for building a B2B vendor-assessment web app. The app operationalises the "Harness Moat Model" — a strategic framework for judging where an AI-era software company's value is defensible. Users answer a structured Q&A about a company; the app scores it, renders a dashboard verdict, and stores every company as a record in Supabase with versioned assessment history.

**Stack (decided, do not change without asking):**
- Next.js 14+ (App Router, TypeScript)
- Tailwind CSS
- Supabase (Postgres + Auth) via `@supabase/supabase-js` and `@supabase/ssr`
- Recharts for dashboard charts
- Deployed on Vercel

**Scope note:** B2B only. Two company archetypes are supported (see §3). B2C marketplace archetype (Uber-style) is explicitly out of scope for v1 — do not build it, but keep the archetype field extensible.

---

## 1. The domain model in one paragraph

The Harness Moat Model says AI-application value lives in five layers: **L1 Instruction** (prompts/config), **L2 Context** (retrieval/integrations), **L3 Control** (guardrails/compliance), **L4 Evaluation** (ground truth/evals), **L5 Learning loop** (feedback/improvement history). L1–L2 are **flow** (consumed monthly, weak moat); L3–L5 are **stock** (accumulated, strong moat). Three threats attack the stack: **Replication** (rivals), **Absorption** (better models eat the harness), **Internalisation** (customers build in-house). A company is defensible if it *monetises* stock layers and survives the threat tests. The app captures evidence per layer, scores it, and issues a verdict.

Full framework text lives in `EXPLAINER.md` in this package — read it before building so the copy in the UI matches the model's language.

---

## 2. Screens (4)

### 2.1 `/companies` — Company list (the history screen)
- Table/card list of all companies: name, domain, archetype badge, latest verdict chip (colour-coded), stock-share %, last-assessed date, assessment version count.
- Search by name; filter by archetype and verdict.
- Row click → `/companies/[id]`.
- Primary button: **"New assessment"** → `/companies/new`.
- Empty state: short explainer + CTA.

### 2.2 `/companies/new` — Setup + assessment wizard
Step 0 (company setup) then the Q&A wizard (§4). On completion: create `companies` row + `assessments` row (version 1), compute scores server-side, redirect to dashboard.

### 2.3 `/companies/[id]` — Dashboard (results)
Renders the **latest** assessment version:
- **Verdict banner** (verdict label + one-line rule-generated rationale).
- **Layer strength chart**: horizontal bars L1–L5, 0–100, coloured on the exposed→defensible gradient (see §7 palette). Mark which layers are monetised (none/secondary/primary badge).
- **Flow vs stock split**: donut or stacked bar of monetisation weighting.
- **Threat exposure**: three bars (Replication / Absorption / Internalisation), 0–100 where higher = more exposed, with HIGH/MED/LOW chips.
- **Accumulation asset statement** (free text, quoted style).
- **Generated positioning statement** (from template, §5.4).
- **Recommended actions** (rule-generated list, §5.5).
- **Version history panel**: list of assessment versions with date + verdict; clicking an old version renders the dashboard read-only for that version with a "viewing v2 of 4" banner.
- Buttons: **"Update assessment"** → `/companies/[id]/edit`; edit company metadata inline.

### 2.4 `/companies/[id]/edit` — Update with changed insight
- Re-opens the wizard **pre-filled with the latest version's answers**.
- Saving creates a **new assessment version** (never overwrites) so insight changes are auditable over time. Company metadata (name, domain etc.) updates in place on the `companies` row.

Auth: Supabase email magic-link auth. All screens behind auth. Single shared team workspace in v1 (no per-user data isolation beyond "must be logged in").

---

## 3. Archetypes

| Key | Label | Description shown in UI |
|---|---|---|
| `technical_domain_vendor` | Technical domain vendor | Narrow-field AI over an established process domain — ITSM, DevOps, SRE, AI Engineering. The domain's processes are partly codified in public standards (ITIL, SRE practice); the moat question is what the vendor encodes beyond the public playbook. |
| `enterprise_counter_attack` | Enterprise counter-attack | An incumbent building internally to defend against structurally leaner attackers (the NatWest-vs-Revolut pattern: 3,000 IT staff vs 300 engineers). The question is whether the build creates defensible stock or expensively rebuilds flow. |

Setup captures: company name, website (optional), archetype, **domain** (free text with suggestions: ITSM, Service Management, Service Operations, DevOps, AI Engineering, SRE, Other), **core processes covered** (tag input, free text), primary buyer persona (free text), what is monetised today (free text), notes.

---

## 4. Question bank (build exactly this)

All scored questions use a 0–3 scale with per-question anchor labels (render as 4 radio cards, anchor text visible — never bare numbers). Higher always = stronger moat / safer. Each layer also has one **monetisation question** (`none` / `secondary` / `primary`).

### L1 — Instruction
| id | Question | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|
| l1_q1 | How much of the differentiation story rests on prompts, rules, or configuration? | Entirely — "better prompts" is the pitch | Mostly | Partially | Barely — config is onboarding, not product |
| l1_q2 | Would a 10× better foundation model halve this layer's value? | Yes, immediately | Probably | Somewhat | No — value is independent of model quality |
| l1_q3 | Is the encoded domain logic public standard or proprietary? | Fully public (e.g. vanilla ITIL) | Mostly public | Mix | Deeply proprietary, insider-only knowledge |
| l1_mon | Is revenue anchored in this layer? | — | — | — | none / secondary / primary |

### L2 — Context
| id | Question | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|
| l2_q1 | Could a funded rival replicate the integrations/connectors in 12 months? | Easily | Probably | With difficulty | No — deep, entitlement-aware plumbing |
| l2_q2 | If customers rebuilt this integration themselves, would it be hard or just annoying? | Just annoying | Mostly annoying | Somewhat hard | Genuinely hard (permissioning/entitlement logic) |
| l2_q3 | Are agents/models increasingly able to self-serve this context (browse, query, call tools)? | Yes, already happening | Trending that way | Partially protected | No — context requires org-specific access rights |
| l2_mon | Is revenue anchored in this layer? | | | | none / secondary / primary |

### L3 — Control
| id | Question | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|
| l3_q1 | Do buyers cite compliance/audit requirements to justify the purchase? | Never | Rarely | Sometimes | Routinely — it's in procurement criteria |
| l3_q2 | Certifications / regulatory recognition (SOC 2, ISO, EU AI Act readiness, auditor references)? | None | Basic (SOC 2 only) | Several, current | Certified + cited in customers' own compliance evidence |
| l3_q3 | Does switching vendors force the customer to re-audit or re-certify? | No | Minor rework | Significant rework | Full re-audit — regulator-visible change |
| l3_mon | Is revenue anchored in this layer? | | | | none / secondary / primary |

### L4 — Evaluation
| id | Question | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|
| l4_q1 | How much customer-specific outcome/judgment data does the vendor hold? | None / <90 days | 3–6 months | 6–12 months | Years, growing monthly |
| l4_q2 | Does the customer's definition of "good" live in the platform (labels, evals, tuned judges)? | No — off-the-shelf benchmarks | Some custom evals | Substantial custom ground truth | The platform *is* the definition of good |
| l4_q3 | Is that judgment data portable, or bound to the vendor's traces and workflows? | Fully exportable/portable | Mostly portable | Partially bound | Deeply bound — reconstruction ≈ starting over |
| l4_mon | Is revenue anchored in this layer? | | | | none / secondary / primary |

### L5 — Learning loop
| id | Question | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|
| l5_q1 | Does an improvement history accumulate (what was tried, what worked, why)? | No | Logs exist but unused | Structured history, partially used | Yes — a living improvement ledger |
| l5_q2 | Is the loop wired to real business outcomes (not just model metrics)? | No | Weakly | Partially | Directly — outcomes feed the loop |
| l5_q3 | Would leaving mean losing months/years of accumulated learning? | No loss | Minor loss | Significant loss | Catastrophic loss — the history is the value |
| l5_mon | Is revenue anchored in this layer? | | | | none / secondary / primary |

### Threat tests (higher = safer)
| id | Vector | Question | 0 | 3 |
|---|---|---|---|---|
| t_rep_1 | Replication | Could a rival ship an equivalent product in 12 months? | Yes, easily | No — the accumulated data can't be shipped |
| t_rep_2 | Replication | Beyond exportable data, what switching costs exist? | None | Deep: workflows, tuned evaluators, embedded history |
| t_rep_3 | Replication | How fast does a new customer reach "locked in by accumulation"? | Never | Under 6 months |
| t_abs_1 | Absorption | Would a materially better model make the product unnecessary? | Yes | No — value is what agents must consume, not generate |
| t_abs_2 | Absorption | If a lab/hyperscaler bundled a "good-enough" version, what happens? | Displaced | Unaffected — neutrality/independence is structural |
| t_abs_3 | Absorption | Is the vendor neutral across model vendors? | Single-model dependent | Fully neutral, multi-model by design |
| t_int_1 | Internalisation | Could the best customers' platform teams build this in 18 months? | Yes, and they want to | No — network assets they can't self-build |
| t_int_2 | Internalisation | What is the cost of keeping an in-house build current? | Low — stable target | Very high — frontier moves monthly |
| t_int_3 | Internalisation | Does the vendor own cross-customer assets (benchmarks, pooled failure intel)? | None | Yes, and they're the industry reference |

### Archetype-specific (3 each, 0–3, higher = safer)

**technical_domain_vendor:**
| id | Question | 0 | 3 |
|---|---|---|---|
| a_tdv_1 | What share of the encoded process knowledge is proprietary vs public standard (ITIL, SRE books)? | ~All public | Mostly proprietary, insider-only |
| a_tdv_2 | How fast does this domain's frontier move (new tools, failure modes, practices)? | Static — easy to copy once | Monthly — currency itself is the moat |
| a_tdv_3 | Do practitioners in the domain treat the vendor as a reference/standard? | Unknown vendor | Yes — de facto standard |

**enterprise_counter_attack:**
| id | Question | 0 | 3 |
|---|---|---|---|
| a_eca_1 | Cost-to-serve vs the attacker (the 3,000-vs-300 test): headcount and run-cost per customer/journey served? | ≥5× worse than attacker | At or below attacker's cost structure |
| a_eca_2 | Is the build creating stock (judgment data, improvement history) or rebuilding flow the attacker already does cheaper? | Pure flow rebuild | Deliberately accumulating stock the attacker lacks |
| a_eca_3 | Ship cadence vs the attacker? | Quarters vs their weeks | Matched or faster |

### Free-text fields
- `accumulation_asset` — prompt: *"Complete: 'The ___ accumulates in the platform as ___, and after ___ it becomes ___ difficult to switch.' If you can't complete this sentence, there is no moat — only features."*
- `assessor_notes` — anything else.

---

## 5. Scoring engine (implement in `lib/scoring.ts`, pure functions, unit-tested)

### 5.1 Layer scores
`layerScore(L) = mean(l{n}_q1..q3) / 3 * 100`, rounded. Bands: 0–39 WEAK, 40–69 MODERATE, 70–100 STRONG.

### 5.2 Flow/stock split
Monetisation weights: none=0, secondary=1, primary=2.
`flowPoints = w(L1)+w(L2)`; `stockPoints = w(L3)+w(L4)+w(L5)`.
`stockShare = stockPoints / (flowPoints+stockPoints) * 100` (if both 0, stockShare = null → verdict UNPRICED, see below).

### 5.3 Threat exposure
Per vector: `exposure = 100 - mean(3 questions)/3*100`. Bands: 0–33 LOW, 34–66 MEDIUM, 67–100 HIGH.

### 5.4 Verdict rules (evaluate top-down, first match wins)
1. No layer monetised at all → **UNPRICED** — "Value not yet monetised anywhere in the stack; pricing strategy is the first job."
2. Primary monetisation only in L1/L2 → **FEATURE BUSINESS** — "Revenue sits in flow layers; margin compression precedes churn. Reprice toward stock."
3. Primary in L3 with l3_q2 ≤ 1 → **CONDITIONAL MOAT** — "Control-layer revenue without regulatory embedding; harden certifications or the moat is nominal."
4. Primary in L4/L5 and ≥2 threat vectors HIGH → **CONTESTED MOAT** — "Right layer, wrong defences; fix the highest-exposure vector first."
5. Primary in L4/L5, ≤1 vector HIGH → **MOAT BUSINESS** — "Monetising accumulated stock; optimise time-to-embedded and protect network assets."
6. Otherwise → **MIXED** — "Monetisation split across flow and stock; migration plan needed."

For `enterprise_counter_attack`, additionally: if a_eca_1 ≤ 1 AND a_eca_2 ≤ 1 → override verdict to **EXPENSIVE FLOW REBUILD** — "The build reproduces the attacker's flow at multiples of their cost without accumulating stock. Stop and redesign around an accumulation asset."

### 5.5 Recommended actions
Rule-generated, max 5, ordered by severity. Include (non-exhaustive; implement as a rules list that's easy to extend):
- Any HIGH threat vector → the matching defence line (Replication → "Race to embed: instrument deeply in first 90 days"; Absorption → "Position as the independent layer agents must consume; play the neutrality card"; Internalisation → "Build cross-customer network assets; sell cost-of-currency").
- flowShare > 60% → "Reprice toward stock layers before the market reprices you."
- l4_q1 ≤ 1 → "Accumulation is thin: prioritise capture of customer-specific ground truth."
- Empty/weak `accumulation_asset` text (< 40 chars) → "No accumulation asset articulated — this is the strategy gap."

### 5.6 Generated positioning statement
Template: `"Tools that [flow description] are being commoditised by [top threat vector, humanised]. [Company] is the [stock descriptor by strongest monetised stock layer: L3 → 'independent accountability layer'; L4 → 'independent judgment layer'; L5 → 'improvement ledger'] for [domain] — which every rival, agent, and in-house build still has to plug into."` Populate from answers; show as editable text on the dashboard (edits saved to the assessment row).

---

## 6. Data model

Full DDL in `schema.sql` (this package). Summary:

- **companies**: id, name, website, archetype, domain, core_processes text[], buyer, monetisation_today, notes, created_at, updated_at.
- **assessments**: id, company_id FK, version int (unique per company), answers jsonb (all question ids → values), scores jsonb (layer scores, stockShare, threat exposures), verdict text, verdict_rationale text, positioning text, accumulation_asset text, assessor_notes text, created_at, created_by uuid.
- Editing = INSERT new version (max(version)+1). Never UPDATE answers on an existing version. Company metadata updates in place.
- RLS enabled on both tables; policy: any authenticated user full CRUD (single-team workspace v1).
- Store the question bank as versioned TypeScript constants in `lib/questions.ts` with a `question_bank_version` string saved into each assessment's scores jsonb, so old assessments stay interpretable if questions change later.

---

## 7. Design system (match the existing artifact)

The companion HTML one-pager uses a "drafting paper" identity — replicate it:
- Background `#EDF0F2` with a subtle 48px grid; panels `#F7F9FA`; ink `#13222E`; soft ink `#44586A`; line `#C6D0D8`; blue accent `#1F4E8C`.
- Defensibility gradient (weak→strong): `#C7783A → #B98A34 → #7E8F4C → #3E7D62 → #1E5F58`. Use these exact colours for L1–L5 everywhere (bars, chips, charts).
- Type: IBM Plex Serif (display), IBM Plex Sans (body), IBM Plex Mono (labels/eyebrows) via `next/font/google`.
- Sharp corners (0–2px radius), 1.5px ink borders, offset hover shadows. FLOW badges in the warm colours, STOCK badges in the greens.
- Verdict chip colours: MOAT BUSINESS `#1E5F58`; CONTESTED MOAT `#7E8F4C`; CONDITIONAL MOAT `#B98A34`; MIXED `#44586A`; FEATURE BUSINESS / EXPENSIVE FLOW REBUILD `#C7783A`; UNPRICED `#8A93A0`.

Wizard UX: one section per screen (Setup → L1 → L2 → L3 → L4 → L5 → Threats → Archetype → Free text → Review), progress indicator, answers autosaved to localStorage until submit (so a refresh mid-wizard doesn't lose work), keyboard-navigable radio cards, every 0–3 option shows its anchor text.

---

## 8. Build order (work in this sequence, commit per step)

1. Scaffold: `create-next-app` (TS, Tailwind, App Router), fonts, base layout + palette tokens.
2. Supabase: run `schema.sql`, wire `@supabase/ssr` client + magic-link auth, auth middleware.
3. `lib/questions.ts` (question bank) + `lib/scoring.ts` + **unit tests for scoring** (vitest) — test each verdict rule fires correctly, including the ECA override.
4. Wizard (`/companies/new`) end-to-end: setup → questions → review → server action creates company + assessment v1.
5. Dashboard (`/companies/[id]`): charts, verdict, actions, positioning.
6. List (`/companies`) with search/filter.
7. Edit flow (`/companies/[id]/edit`): prefill, save-as-new-version, version history panel on dashboard.
8. Polish: empty states, loading states, mobile pass (assessments will be reviewed on phones).

## 9. Environment & deployment

- `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Commit `.env.example` only; `.env*` in `.gitignore` from commit zero.
- Vercel: import repo, set the two env vars, framework preset Next.js. Add the Vercel deployment URL to Supabase Auth → URL configuration (site URL + redirect).
- Supabase: create project, run `schema.sql` in SQL editor, enable email auth (magic link), disable public signups if the team wants invite-only.
- CI: one GitHub Actions workflow — typecheck, lint, `vitest run` on PR.

## 10. Out of scope for v1 (do not build)

B2C archetype; multi-tenant orgs/roles; PDF export of dashboards; comparison view across companies; public sharing links. All are candidate v2 items — keep the code shaped so none of them are painful later (e.g. archetype is a string enum, scores are jsonb).
