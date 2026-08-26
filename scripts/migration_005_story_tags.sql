-- Migration 005 — tags and verification on stories
--
-- The August 2026 library update introduced retrieval tags (stood_ground,
-- team_defense, lost_outcome, ...) and verification states (verified,
-- verification_needed, outcome_unverified, needs_disambiguation). Neither had
-- a column, so scripts/apply_soar_updates_2026_08.js folded both into `notes`
-- using the same convention as USAGE WARNING / NOT GENERATION READY.
--
-- That works for Adam reading review_stories.json, but it does not work for
-- retrieval: `notes` is never sent to the interview or ask prompts, so a tag
-- like `lost_outcome` cannot influence which story the model picks. The
-- Raymond entry specifically must NOT be selected when a question is probing
-- for standing ground and prevailing, and that only holds if the tag is
-- visible to the model.
--
-- Run this in the Supabase SQL editor, then run:
--   node scripts/promote_story_tags.js
-- which parses the TAGS: and VERIFICATION: lines out of notes into the columns.
--
-- Safe to run repeatedly.

alter table stories add column if not exists tags         text[] default '{}';
alter table stories add column if not exists verification text;

-- Retrieval filters on tags, so index it.
create index if not exists stories_tags_idx on stories using gin (tags);

comment on column stories.tags is
  'Retrieval tags, snake_case. Surfaced to the interview and ask prompts as a TAGS: line so the model can select on capability. lost_outcome specifically marks stories that must not be offered as stood-ground-and-won.';

comment on column stories.verification is
  'One of: verified, verification_needed, outcome_unverified, needs_disambiguation. Anything other than verified means some element of the story is not confirmed and must not be asserted.';

-- After running, confirm:
--   select id, tags, verification from stories where verification is not null;
