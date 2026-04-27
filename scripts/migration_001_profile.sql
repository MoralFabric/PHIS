-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Creates the profile table and inserts the default singleton row.

create table if not exists profile (
  id               text    primary key default 'adam',
  base_salary_from integer not null    default 185000,
  base_salary_to   integer not null    default 220000,
  total_comp_from  integer not null    default 285000,
  total_comp_to    integer not null    default 350000
);

-- Seed the singleton row; no-op if it already exists.
insert into profile (id)
values ('adam')
on conflict (id) do nothing;
