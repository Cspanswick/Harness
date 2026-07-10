# The Harness Moat Assessor — Explainer

*What this tool is, the thinking behind it, and how to read its verdicts.*

---

## Why this exists

Foundation models — the AI engines from Anthropic, OpenAI, Google — are becoming a commodity. Every software company rents the same intelligence from the same few labs at converging prices. So the old question "how good is your AI?" no longer separates winners from losers.

The question that does: **how good is your harness?**

A harness is everything a company wraps around a model to turn raw intelligence into accountable, domain-specific work. Think of the model as a brilliant new hire with no context. The harness is the job description, the filing system, the approval chain, the performance review, and the training programme. A horse harness is the right metaphor: the horse supplies raw power; the harness converts it into directed, repeatable, accountable work.

This tool assesses where a company's harness value actually sits — and whether it's defensible.

## The two ideas you need

**Flow vs stock.** Flow is value delivered and consumed each month — a taxi ride, a coffee, one good AI answer. Deliver it, it's gone, deliver it again. Stock is value that accumulates — your Gmail history, your doctor's ten-year knowledge of you, a library's collection. The longer it builds, the harder it is to leave. **Flow businesses must out-innovate everyone forever. Stock businesses get stronger by existing.** Moats are made of stock.

**The five layers.** Every AI software company is a stack of five layers, running from flow to stock:

1. **Instruction** (flow) — prompts, rules, encoded domain logic. *Weakest moat:* it's text; better models regenerate it.
2. **Context** (flow) — retrieval, integrations, data plumbing. *Moderate:* real friction, but replicable, and agents increasingly fetch their own context.
3. **Control** (stock begins) — guardrails, audit trails, compliance. *Strong in regulated domains:* an agent can't self-generate your regulator's requirements.
4. **Evaluation** (stock) — ground truth, evals, the accumulated definition of "good." *Strong:* judgment data takes months to build and can't ship in a rival's release. A model can't grade its own homework.
5. **Learning loop** (stock) — the improvement history: what was tried, what worked, why. *Strongest:* it compounds monthly and is irreplaceable.

The critical distinction the tool probes: which layers does the company **monetise** — not just build? Many companies build layer 4 internally but bill like layer 1. Revenue anchored in flow layers is revenue awaiting commoditisation.

## The three threats

- **Replication (from the side):** rivals copy features. Tooling is copyable; accumulated data isn't. The real race is who captures the customer's definition of "good" first.
- **Absorption (from below):** better models eat the harness — self-prompting, self-retrieving, self-improving. Defence: own what agents must *consume* (ground truth, accountability) rather than what they can *generate*. Neutrality across model vendors is the structural card no lab can play.
- **Internalisation (from above):** sophisticated customers build it themselves. Defences: cost of currency (an in-house build is a snapshot that decays against a monthly-moving frontier) and network assets (cross-customer benchmarks no single customer can self-build).

A layer that fails two of three threat tests is a **feature, not a moat**.

## The two archetypes this version assesses

**Technical domain vendor.** Narrow-field AI over an established process domain — ITSM, DevOps, SRE, AI Engineering. Because these domains are partly codified in public standards (ITIL, the SRE books), the extra question is: what does the vendor encode *beyond* the public playbook, and does the domain move fast enough that staying current is itself the moat?

**Enterprise counter-attack.** An incumbent building internally against a leaner challenger — the NatWest-vs-Revolut pattern, where the incumbent runs 3,000 IT staff to do what the attacker does better with 300 engineers. The extra questions are brutal on purpose: what's your cost-to-serve versus the attacker, and is the build accumulating stock the attacker lacks — or expensively rebuilding flow they already do cheaper? If it's the latter, the tool says so: **Expensive Flow Rebuild** is a verdict, and it means stop and redesign around an accumulation asset before spending more.

## How the assessment works

You answer a structured Q&A — three evidence questions per layer, one monetisation question per layer, nine threat tests, three archetype questions, and one sentence you must be able to complete:

> *"The ___ accumulates in the platform as ___, and after ___ it becomes ___ difficult to switch."*

If that sentence can't be completed honestly, there is no moat — only features. That single prompt is the sharpest diagnostic in the tool.

The engine then scores each layer (0–100), splits revenue between flow and stock, rates exposure to each threat, and issues a verdict:

| Verdict | Meaning |
|---|---|
| **Moat business** | Monetising accumulated stock with manageable threat exposure. Optimise time-to-embedded; protect network assets. |
| **Contested moat** | Right layer, weak defences. Fix the highest-exposure threat first. |
| **Conditional moat** | Control-layer revenue without regulatory embedding — harden certifications or the moat is nominal. |
| **Mixed** | Revenue split across flow and stock. Needs a migration plan. |
| **Feature business** | Revenue sits in flow layers. Margin compression arrives before churn. Reprice toward stock now. |
| **Expensive flow rebuild** | (Enterprise archetype) Rebuilding the attacker's flow at multiples of their cost. Stop; redesign around accumulation. |
| **Unpriced** | Value not yet monetised anywhere. Pricing strategy is job one. |

Every company lives as its own record with **versioned assessments** — re-run the Q&A as your insight changes and the history is preserved, so you can see how your view of a company evolved.

## Honest limits

The model assumes model-intelligence commoditisation continues; if one lab opens a durable capability gap, value snaps back to the model layer and every harness moat thins. It underweights brand and distribution, which remain real moats. And scores are structured judgment, not measurement — the tool's value is forcing the right questions in the right order, not manufacturing false precision. Use it as a lens, not a law.
—————————————————–———
