# CLAUDE.md — Harness Moat Assessor

Read HANDOVER.md before doing anything. It is the full spec and is authoritative. EXPLAINER.md explains the strategy model the app implements — read it so UI copy matches the model's language.

## What this repo is
Next.js 14 (App Router, TypeScript) + Tailwind + Supabase app that assesses B2B AI software companies against the Harness Moat Model via a Q&A wizard, scores them, and stores versioned assessments per company. Deployed on Vercel.

## Commands
- `npm run dev` — local dev
- - `npm run build` — production build (must pass before any PR)
  - - `npm run lint` — eslint
    - - `npm run test` — vitest (scoring engine tests live in `lib/scoring.test.ts`)
     
      - ## Architecture
      - - `lib/questions.ts` — the question bank, versioned via `QUESTION_BANK_VERSION`. Changing any question text or scale requires bumping the version.
        - - `lib/scoring.ts` — pure scoring functions. No I/O. Every verdict rule has a unit test.
          - - `app/companies/*` — list, new (wizard), [id] (dashboard), [id]/edit (new-version flow).
            - - Supabase access via `@supabase/ssr` helpers in `lib/supabase/`. Schema in `schema.sql`.
             
              - ## Hard rules
              - 1. **Assessments are append-only.** Editing an assessment ALWAYS creates a new version row. Never UPDATE answers/scores/verdict on an existing row (a DB trigger will reject it anyway).
                2. 2. **Scoring is deterministic and tested.** Any change to `lib/scoring.ts` must update/extend the tests in the same commit.
                   3. 3. **Do not add archetypes or change the question bank** without explicit instruction from the user; if asked, bump `QUESTION_BANK_VERSION`.
                      4. 4. **Design tokens are fixed** (see HANDOVER §7): drafting-paper palette, IBM Plex family, the five layer colours are exact hex values used everywhere the layers appear.
                         5. 5. Secrets: `.env*` never committed. `.env.example` documents required vars.
                            6. 6. Work on branches, open PRs; do not commit to main directly.
                              
                               7. ## Environment
                               8. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — set in `.env.local` locally and Vercel project settings in prod.
                               9. 
