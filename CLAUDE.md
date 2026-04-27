# PHIS — Personal History & Interview System

Next.js + Supabase migration of PHIS_v5.jsx. Adam Waldman's personal career story library and AI-powered interview prep tool.

## Stack

- **Next.js 16** (App Router, no TypeScript, JS only)
- **Supabase** — Postgres via `@supabase/supabase-js` v2
- **Anthropic Claude** — proxied through a server-side API route (key never reaches the browser)
- No CSS framework — inline styles + CSS variables defined in `app/globals.css`

## Project layout

```
app/
  page.js              # Full app UI — single 'use client' component (converted from PHIS_v5.jsx)
  layout.js            # Root layout, imports globals.css
  globals.css          # CSS variables (colors, font, borders)
  api/
    claude/
      route.js         # Server-side Anthropic proxy — POST /api/claude
lib/
  supabase.js          # Browser Supabase client (NEXT_PUBLIC_ vars only)
  data.js              # All DB helpers: seedAndGetStories, upsertStory/ies, deleteStory,
                       #   getExperience, saveExperience
scripts/
  import-extra-soars.js  # One-time import: reads soar_*.json from root, upserts to Supabase
SOAR_Library.json        # 50 canonical SOAR stories (seed source)
soar_050_*.JSON … soar_2026_001.JSON  # Additional SOAR story files imported via script
PHIS_v5.jsx              # Original single-file React app (kept for reference)
```

## Environment variables

Stored in `.env.local` (gitignored — never commit this file).

| Variable | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Supabase anon/publishable key |
| `ANTHROPIC_API_KEY` | server only (`/api/claude`) | Anthropic API key — never expose to browser |
| `SUPABASE_SERVICE_ROLE_KEY` | `scripts/import-extra-soars.js` only | Bypasses RLS for one-time imports |

## Supabase schema

Columns are snake_case. The `year` column does **not** exist — it was removed after schema discovery.

**`stories` table**

| Column | Type |
|---|---|
| id | text (PK) |
| type | text |
| title | text |
| employer | text |
| situation | text |
| obstacle | text |
| action | text |
| result | text |
| impact | text |
| full_story | text |
| themes | jsonb |
| skills | jsonb |
| use_for | jsonb |
| notes | text |
| date_added | text |

**`profile` table** (singleton row, `id = 'adam'`)

| Column | Type |
|---|---|
| id | text (PK, default 'adam') |
| base_salary_from | integer (default 185000) |
| base_salary_to | integer (default 220000) |
| total_comp_from | integer (default 285000) |
| total_comp_to | integer (default 350000) |

Migration: `scripts/migration_001_profile.sql` — run in Supabase SQL editor.

**`experience` table**

| Column | Type |
|---|---|
| id | text (PK) |
| role | text |
| org | text |
| dates | text |
| scope | text |
| mandate | text |
| responsibilities | jsonb |
| bullets | jsonb |
| themes | jsonb |
| full_narrative | text |

## Key architectural decisions

**All Claude calls go through `/api/claude`** — the client POSTs the full message body (model, max_tokens, system, messages) and the route adds the `x-api-key` header server-side. `callClaude(system, user, maxTokens)` in `page.js` is the only client-side helper; it hits `/api/claude`, not Anthropic directly.

**Supabase client is browser-safe** — `lib/supabase.js` uses only `NEXT_PUBLIC_` vars. The service role key is only ever used in `scripts/import-extra-soars.js`, which runs locally via Node.

**Story seeding** — `seedAndGetStories(inlineSeeds)` in `lib/data.js` is called on app boot. If the `stories` table is empty it seeds from all three sources (inline `SEEDS` array, inline `EXTENDED_SOAR` array, and `SOAR_Library.json`), deduplicated by `id`. On subsequent boots it only upserts inline seeds whose IDs are missing from the DB.

**`buildStoryContext` (line ~1527) is Apply-only** — this helper slices to 30 stories and is used exclusively by `ApplyView` (Application Engine) for resume/CPS generation where token budget is tight. It is not called by `InterviewView` or `AskView`.

**Interview context uses all stories** — both `InterviewView.ask` and `AskView.ask` (interview branch) build their context inline with `stories.map(...)`, no cap.

## App pages / navigation

| Page key | Component | Description |
|---|---|---|
| `home` | `HomeView` | Summary dashboard |
| `browse` / `detail` | `StoryCard`, `DetailView` | Browse and view SOAR stories |
| `add` | `StoryEditForm` | Edit a story |
| `capture` | `FreeAddView` | AI-assisted story capture |
| `ask` | `AskView` | Ask AI — library search or interview answer |
| `interview` | `InterviewView` | Interview Adam — composed answers from full library |
| `experience` | `ExperienceView` | Edit career experience entries |
| `awards` | `AwardsView` | Awards list |
| `apply` | `ApplyView` | Application Engine — JD analysis, CPS scoring, resume + cover letter |
| `profile` | `ProfileView` | Profile & settings |

## Interview AI system prompt policy

Both `AskView.ask` (interview branch) and `InterviewView.ask` carry the same two-part system prompt:

1. Speak in first person, naturally, 3-4 paragraphs, no bullets, no headers.
2. **Interpret questions generously** — contributing a chapter counts as writing for the book, co-authoring counts, speaking on a topic counts as expertise. Surface partial matches rather than answering "no."

## Running locally

```bash
npm run dev          # starts on http://localhost:3000
```

## One-time story import

To import additional `soar_*.json` files dropped into the project root:

```bash
node scripts/import-extra-soars.js
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Skips IDs already in the DB.

## Git / deployment

- Remote: `https://github.com/MoralFabric/PHIS`
- Branch: `main`
- Vercel auto-deploys on push to `main`
- `.env.local` is gitignored — set all env vars in the Vercel dashboard
