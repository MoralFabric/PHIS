-- Migration 004 — profile_metrics, profile_values, interview_guidance
--
-- These three tables were created by hand in the Supabase dashboard and were
-- never captured in a migration, so there was no way to recreate them and no
-- record of their shape. If the tables are missing, or RLS is enabled on them
-- without a policy, the app fails quietly: reads come back as an empty array
-- and writes return null, so the Metrics and Review Values pages simply render
-- empty and a saved metric never appears.
--
-- Safe to run repeatedly.

-- ── profile_metrics ───────────────────────────────────────
-- The headline numbers on the guest dashboard. `pinned` rows always show;
-- the rest are chosen per role by the dashboard's Claude call.
create table if not exists profile_metrics (
  id          uuid primary key default gen_random_uuid(),
  value       text,
  label       text,
  pinned      boolean default false,
  tags        text[] default '{}',
  sort_order  integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── profile_values ────────────────────────────────────────
-- Adam's principles and leadership approach. Captured by FreeAddView as
-- status='draft', confirmed on the Review Values page, then injected into the
-- interview system prompt by buildValuesBlock(). Drafts steer tone only and
-- are never asserted as fact.
create table if not exists profile_values (
  id          uuid primary key default gen_random_uuid(),
  principle   text,
  in_practice text,
  kind        text,          -- principle | style | situation
  topic       text,
  surface     text,          -- optional filter used by getValues({surface})
  status      text default 'draft',   -- draft | confirmed
  soar_refs   text[] default '{}',    -- story ids that demonstrate this
  sort_order  integer default 999,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── interview_guidance ────────────────────────────────────
-- Corrections and tone instructions for the interview AI. This is the channel
-- for fixing a bad answer so the same mistake does not recur.
create table if not exists interview_guidance (
  id          uuid primary key default gen_random_uuid(),
  guidance    text,
  kind        text,          -- correction | tone | general
  question    text,          -- the question that prompted the correction
  answer      text,          -- excerpt of the answer being corrected
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ── RLS ───────────────────────────────────────────────────
-- The app talks to Supabase with the anon key, so each table needs a policy or
-- every read returns empty and every write fails. Mirrors the existing tables.
-- Drop-then-create keeps this idempotent across Postgres versions.
alter table profile_metrics    enable row level security;
alter table profile_values     enable row level security;
alter table interview_guidance enable row level security;

drop policy if exists "allow all" on profile_metrics;
create policy "allow all" on profile_metrics for all using (true) with check (true);

drop policy if exists "allow all" on profile_values;
create policy "allow all" on profile_values for all using (true) with check (true);

drop policy if exists "allow all" on interview_guidance;
create policy "allow all" on interview_guidance for all using (true) with check (true);

-- ── Diagnostic ────────────────────────────────────────────
-- Run this on its own to see whether the tables exist and carry a policy:
--
--   select c.relname                as table_name,
--          c.relrowsecurity         as rls_enabled,
--          count(p.polname)         as policies
--   from pg_class c
--   left join pg_policy p on p.polrelid = c.oid
--   where c.relname in ('profile_metrics','profile_values','interview_guidance')
--   group by c.relname, c.relrowsecurity;
--
-- rls_enabled = true with policies = 0 is the silent-failure state.
