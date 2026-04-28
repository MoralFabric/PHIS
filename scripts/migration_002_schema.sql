-- ─── MIGRATION 002: awards, education, profile_context tables; facets on experience ───
-- Run this in the Supabase SQL editor before deploying the matching code changes.

-- ─── awards ─────────────────────────────────────────────────────────────────
create table if not exists awards (
  id           uuid primary key default gen_random_uuid(),
  award        text not null,
  year         text,
  organization text,
  narrative    text,
  jd_themes    text[],
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

insert into awards (award, year, organization, narrative) values
  ('Ovation Award — Participant Outcomes Index',      '2025',      'Manulife',                        'Recognized for designing and operationalizing the Participant Outcomes Index, shifting the organization from activity-based to outcome-based value measurement.'),
  ('Ovation Award — Retirement Investment Product',   '2024',      'Manulife',                        'Awarded for strategic insight and financial leadership supporting the launch and scaling of a key retirement investment product.'),
  ('Cheer Award (5,000 pts) — AIR & Retention',      '2023',      'Manulife',                        'Recognized for developing behavioral insights that improved member retention and informed AIR platform enhancements.'),
  ('Applause Award — Sponsor Analytics',             '2023',      'Manulife',                        'Awarded for delivering sponsor-level insights that shaped product, pricing, and distribution strategy.'),
  ('Ovation Award — Digital KPI',                    '2022',      'Manulife',                        'Recognized for leading the redesign of digital KPIs aligned with customer outcomes and enterprise strategy.'),
  ('Stars of Excellence Nomination — KPI Redesign',  '2022',      'Manulife',                        'Nominated for enterprise-wide impact in redesigning KPIs and eliminating misaligned metrics.'),
  ('Stars of Excellence Award — AIR Platform',       '2020',      'Manulife',                        'Awarded for insight leadership that shaped the AIR platform and improved member engagement and retention.'),
  ('Pinnacle Award — Service Excellence',            '2016',      'Manulife Private Asset Management','Recognized for exceptional leadership and service excellence within Private Markets Operations.'),
  ('Super Service Award ×5',                         '2007-2014', 'State Street',                    'Five Super Service Awards for consistently delivering exceptional client outcomes across multiple operational and transformation roles.'),
  ('Above and Beyond Award ×2',                      '2007-2014', 'State Street',                    'Awarded twice for leadership and execution during high-risk fund conversions and operational transformation initiatives.')
on conflict do nothing;

-- RLS: mirror the experience table policy (enable if RLS is on for experience)
-- alter table awards enable row level security;
-- create policy "allow all" on awards for all using (true);

-- ─── education ───────────────────────────────────────────────────────────────
create table if not exists education (
  id           uuid primary key default gen_random_uuid(),
  credential   text not null,
  organization text not null,
  year         text,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

insert into education (credential, organization, year, note) values
  ('Chartered Financial Analyst (CFA)',        'CFA Institute',           '2013', 'CFA Society Toronto Corporate Finance Committee (2017–2022)'),
  ('Honours B.Sc. — Mathematics & Economics', 'University of Toronto',   '2005', 'VP University Affairs · Merit Award for Student Leadership'),
  ('NLP Master Practitioner',                 'NLP Canada Training Inc.', '',    'Applied NLP methodologies for executive influence and strategic communication')
on conflict do nothing;

-- RLS: mirror the experience table policy
-- alter table education enable row level security;
-- create policy "allow all" on education for all using (true);

-- ─── facets column on experience ─────────────────────────────────────────────
alter table experience
  add column if not exists facets jsonb not null default '[]'::jsonb;

-- ─── profile_context ─────────────────────────────────────────────────────────
create table if not exists profile_context (
  id                     uuid primary key default gen_random_uuid(),
  header_tagline         text,
  positioning_summary    text,
  target_seniority       text,
  comp_floor_base        numeric,
  comp_floor_total       numeric,
  geographic_preferences text[],
  industries_excluded    text[],
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

insert into profile_context (
  header_tagline,
  positioning_summary,
  target_seniority,
  comp_floor_base,
  comp_floor_total,
  geographic_preferences,
  industries_excluded
) values (
  'VP, Enterprise Strategy  |  Insight & Analytics Leadership  |  Executive Advisory',
  'Systems-driven finance and strategy leader known for building insight engines, transforming planning models, and enabling organizations to think instead of react.',
  'AVP / MD / VP',
  185000,
  285000,
  array['Toronto', 'Remote Canada'],
  array[]::text[]
)
on conflict do nothing;

-- RLS: mirror the profile table policy
-- alter table profile_context enable row level security;
-- create policy "allow all" on profile_context for all using (true);
