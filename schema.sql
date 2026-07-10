-- Harness Moat Assessor — Supabase schema v1
-- Run in Supabase SQL editor. Idempotent-ish: drop guards omitted deliberately;
-- run once on a fresh project.

-- ============ companies ============
create table public.companies (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  website             text,
  archetype           text not null check (archetype in (
                        'technical_domain_vendor',
                        'enterprise_counter_attack'
                      )),
  domain              text not null,           -- e.g. 'ITSM', 'DevOps', 'SRE', 'AI Engineering'
  core_processes      text[] not null default '{}',
  buyer               text,                    -- primary buyer persona
  monetisation_today  text,                    -- what is monetised today (free text)
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger companies_touch
  before update on public.companies
  for each row execute function public.touch_updated_at();

-- ============ assessments (versioned, append-only) ============
create table public.assessments (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  version             int  not null,
  answers             jsonb not null,          -- { "l1_q1": 2, ..., "l1_mon": "primary", "t_rep_1": 1, "a_tdv_1": 3, ... }
  scores              jsonb not null,          -- { "layers": {"l1": 33, ...}, "stockShare": 71, "threats": {"replication": 40, ...}, "question_bank_version": "1.0" }
  verdict             text not null,           -- e.g. 'MOAT_BUSINESS'
  verdict_rationale   text not null,
  positioning         text,                    -- generated, user-editable
  accumulation_asset  text,
  assessor_notes      text,
  created_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id),
  unique (company_id, version)
);

create index assessments_company_idx on public.assessments (company_id, version desc);

-- convenience view: latest assessment per company (drives the list screen)
create view public.company_latest as
select c.*,
       a.id as assessment_id,
       a.version,
       a.verdict,
       a.scores,
       a.created_at as assessed_at
from public.companies c
left join lateral (
  select * from public.assessments a
  where a.company_id = c.id
  order by a.version desc
  limit 1
) a on true;

-- ============ RLS: single-team workspace, any authenticated user ============
alter table public.companies   enable row level security;
alter table public.assessments enable row level security;

create policy "authenticated read companies"
  on public.companies for select to authenticated using (true);
create policy "authenticated insert companies"
  on public.companies for insert to authenticated with check (true);
create policy "authenticated update companies"
  on public.companies for update to authenticated using (true);
create policy "authenticated delete companies"
  on public.companies for delete to authenticated using (true);

create policy "authenticated read assessments"
  on public.assessments for select to authenticated using (true);
create policy "authenticated insert assessments"
  on public.assessments for insert to authenticated with check (true);
-- No update/delete policies on assessments: versions are append-only by design.
-- (Positioning edits: allow update of the two editable text columns only.)
create policy "authenticated edit assessment text"
  on public.assessments for update to authenticated
  using (true)
  with check (true);
-- Enforce append-only answers at the trigger level instead of RLS:
create or replace function public.assessments_freeze_answers()
returns trigger language plpgsql as $$
begin
  if new.answers is distinct from old.answers
     or new.scores is distinct from old.scores
     or new.verdict is distinct from old.verdict
     or new.version is distinct from old.version then
    raise exception 'Assessments are append-only: create a new version instead of editing answers/scores.';
  end if;
  return new;
end $$;

create trigger assessments_freeze
  before update on public.assessments
  for each row execute function public.assessments_freeze_answers();
