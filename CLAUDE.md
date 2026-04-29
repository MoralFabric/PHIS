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
  page.js              # Full app UI — single 'use client' component (~4200 lines)
  layout.js            # Root layout, imports globals.css
  globals.css          # CSS variables (colors, font, borders)
  api/
    claude/
      route.js         # Server-side Anthropic proxy — POST /api/claude
lib/
  supabase.js          # Browser Supabase client (NEXT_PUBLIC_ vars only)
  data.js              # All DB helpers: seedAndGetStories, upsertStory/ies, deleteStory,
                       #   getExperience, saveExperience, getProfile, saveProfile,
                       #   getAwards, insertAward, getEducation, insertEducation,
                       #   getProfileContext, saveProfileContext
scripts/
  import-extra-soars.js      # One-time import: reads soar_*.json from root, upserts to Supabase
  migration_001_profile.sql  # Adds salary columns to profile table
  migration_002_schema.sql   # Adds awards, education, profile_context tables; facets column on experience
  step5_resume_v2.js         # ResumeStep source (Phase 3)
  step6_coverletter_v2.js    # CoverLetterStep source (Phase 3)
  inject_step5_step6.js      # Node injection script for step5+6 (run once; file stays for reference)
  step3_gap.js               # GapCard + GapResolutionStep source
  step4_rescore.js           # RescoreStep source
SOAR_Library.json        # 50 canonical SOAR stories (seed source)
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

Columns are snake_case. Both migrations must be run in Supabase SQL editor before deploying.

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
| facets | jsonb (default `[]`) — added by migration_002 |

Each facet object: `{ facet_id: uuid-string, name: string, narrative: string, themes: string[] }`. `facet_id` is generated client-side via `uuidv4()` inside `FreeAddView`; existing facets without an ID get one assigned on first touch.

**`awards` table** — added by migration_002

| Column | Type |
|---|---|
| id | uuid (PK) |
| award | text |
| year | text |
| organization | text |
| narrative | text |
| jd_themes | text[] |
| created_at / updated_at | timestamptz |

**`education` table** — added by migration_002

| Column | Type |
|---|---|
| id | uuid (PK) |
| credential | text |
| organization | text |
| year | text |
| note | text |
| created_at / updated_at | timestamptz |

**`profile_context` table** — added by migration_002 (singleton row)

| Column | Type |
|---|---|
| id | uuid (PK) |
| header_tagline | text |
| positioning_summary | text |
| target_seniority | text |
| comp_floor_base | numeric |
| comp_floor_total | numeric |
| geographic_preferences | text[] |
| industries_excluded | text[] |
| created_at / updated_at | timestamptz |

## Key architectural decisions

**All Claude calls go through `/api/claude`** — the client POSTs the full message body (model, max_tokens, system, messages) and the route adds the `x-api-key` header server-side. `callClaude(system, user, maxTokens, temperature)` in `page.js` is the only client-side helper; temperature defaults to 0 for JSON calls.

**Supabase client is browser-safe** — `lib/supabase.js` uses only `NEXT_PUBLIC_` vars. The service role key is only ever used in `scripts/import-extra-soars.js`, which runs locally via Node.

**awards / education / profileContext are loaded in App's useEffect** and threaded as props down to all components that need them (`ApplyView`, `ProfileView`, `FreeAddView`, `FullCVExporter`). This avoids re-loading on every render and allows components to show fresh data without a page reload.

**`parseJSON` strips markdown fences before parsing** — Claude sometimes wraps JSON in ` ```json ``` ` even when told not to. `parseJSON` handles this; no extra stripping needed at call sites.

**`compMatch(comp, profile)`** — supports both new field names (`base_min`, `base_max`, `total_min`, `total_max`) and the older names (`base_from`, `base_to`, `total_from`, `total_to`) from before Phase 3. Always call it as `compMatch(data?.comp_range_visible || data?.comp, profile)`.

## Application Engine — stepped state machine

`ApplyView` uses a linear 6-step state machine. Each step is an independent component with `active`, `result` (cached data from a previous run), `onComplete`, and `onError` props. Steps are mounted once their prerequisite data exists; completed steps stay mounted (collapsed) so the user can navigate back.

**State shape** (`app` in `ApplyView`):

```js
{
  currentStep: 'input' | 'jdAnalysis' | 'cpsScore' | 'gapResolutions' | 'rescore' | 'resume' | 'coverLetter',
  jdAnalysis: null | {
    role, company,
    seniority_level,          // new (Phase 3) — old shape had `seniority`
    skills,                   // [{name, weight, category, required}]
    responsibilities,         // [{description, priority, jd_order}]  — old shape was string[]
    distinctive_vocabulary,   // [{phrase, context}]  — new in Phase 3
    comp_range_visible,       // {base_min, base_max, total_min, total_max}  — new field name
  },
  cpsResult:      null | { scores: [{skill, score, evidence, gap, improve}] },
  gapResolutions: null | [{skill, score, improve, status: 'pending'|'confirmed_gap'|'story_added', story?}],
  rescore:        null | { scores, probs: {p_interview, p_offer, p_overall, ...reasons} },
  resume:         null | { content: string },
  coverLetter:    null | { content: string },
  error:          null | string,
}
```

**Steps:**

| # | `currentStep` | Component | Claude call | maxTokens |
|---|---|---|---|---|
| 1 | `jdAnalysis` | `JDAnalysisStep` | Structured JD extraction (skills, responsibilities, distinctive_vocabulary, comp) → JSON | 4000 |
| 2 | `cpsScore` | `CPSStep` | Score all skills against full story library → JSON | 3000 |
| 3 | `gapResolutions` | `GapResolutionStep` | Per-gap: validate SOAR claims, generate structured story | 1500 |
| 4 | `rescore` | `RescoreStep` | Re-score with new stories + 3 hire probabilities | 3000 + 800 |
| 5 | `resume` | `ResumeStep` | 3-pass: generate (5000) → framing review (5000) → validate → regenerate once (5000) | 5000 |
| 6 | `coverLetter` | `CoverLetterStep` | Generate + validate → regenerate once if needed | 3000 |

**CPS scoring threshold** — gaps are skills scoring `< 70`; strong is `>= 75`.

**Step 1 — JD Analysis (Phase 3 structured extraction)**

Output schema:
```json
{
  "role": "string",
  "company": "string",
  "seniority_level": "string",
  "skills": [{"name":"string","weight":1,"category":"domain|leadership|technical|soft","required":true}],
  "responsibilities": [{"description":"string","priority":"high|medium|low","jd_order":1}],
  "distinctive_vocabulary": [{"phrase":"string","context":"string"}],
  "comp_range_visible": {"base_min":null,"base_max":null,"total_min":null,"total_max":null}
}
```

**Step 5 — Resume (Phase 3 three-pass pipeline)**

1. Pre-filter: `scoreStoryAgainstJD(story)` ranks all SOAR stories by token overlap with JD skills + vocabulary; top 15 sent to Claude
2. Pass 1: generate with `RESUME_SYS` (14-rule prompt — no contact info, source trace, advisory framing, dynamic competencies for THIS JD)
3. Pass 2: framing review via `FRAMING_SYS` — rewrites operational bullets to advisory framing without changing substance
4. Validate: `validateResume(text)` returns `{issues, flags}` — issues are blocking (em-dashes, banned words, word count, required sections), flags are non-blocking source-trace warnings (multiple relational claims in one bullet)
5. If issues: regenerate once with fix instructions appended. If still failing, show `qualityFlags` red banner; source flags always shown as yellow banner.

**Step 6 — Cover Letter (Phase 3 structured prompt + validator)**

- System prompt injects today's date and specifies exact output structure: date, addressee block, Re: line, Dear salutation, 4 body paragraphs, Sincerely signoff
- `validateCoverLetter(text)` checks: em-dashes, banned phrases, paragraph count (must be 4), body word count (250-550), salutation, signoff, bracketed placeholders
- Regenerate-once pattern: if validator fails, append fix instructions and call again. `qualityFlags` red banner if issues persist.

**Banned phrases** (both resume and cover letter): `leveraged, spearheaded, passionate, synergy, in today's fast-paced, utilized, holistic, robust, transformative, cutting-edge, best-in-class, thought leader, results-driven, dynamic, world-class`.

**RTF export** — `buildResumeRTF(text, subtitle)` and `buildCoverLetterRTF(text)` in CoverLetterStep both use `escRTF()` for escaping. `buildFullCVRTF(exp, edu, awards, subtitle)` generates the full structured CV for download from ProfileView.

## FreeAddView — AI-assisted Capture (Phase 2)

`FreeAddView` (in `app/page.js`, injected from `scripts/step_capture.js`) accepts raw text and classifies it into 6 types:

| Type | Write path |
|---|---|
| `soar` | collected into `newSoars[]`, then single `upsertStories(newSoars)` + `setStories(prev => prev.concat(newSoars))` after loop |
| `experience_bullet` | appends bullet to matching experience role via `onUpdateExperience` |
| `facet` | appends/enriches facet on matching experience role (ID-first lookup, name fallback) |
| `award` | `insertAward(a)` → updates `awards` state via `onUpdateAwards` |
| `education` | `insertEducation(e)` → updates `education` state via `onUpdateEducation` |
| `profile_context` | `saveProfileContext(ctx)` → updates `profileContext` state via `onUpdateProfileContext` |

Similarity checking uses Jaccard token overlap (`tokenOverlap(a,b)` — intersection/union of tokens length>2). Per-item merge proposal UI shows status badges (new / similar / duplicate) with inline JSON editor and Restore button for discarded items.

**`facet_id` stability** — facets are normalized with UUIDs in a `useMemo` on the `experience` prop inside `FreeAddView`. New facets are created with `{facet_id: uuidv4(), name, themes, narrative}`. Enrichment uses ID-first lookup with name fallback for backward compat with pre-Phase-2 facets.


## File injection pattern

Step component source files in `scripts/step*.js` are the source-of-truth for those components. To replace a component in `page.js`:

1. Write the new component to `scripts/stepN_v2.js` using the Write tool
2. Write a Node injection script to `scripts/inject_stepN.js` that does line-based array surgery:
   - `fs.readFileSync(pageFile, 'utf8')`
   - `.replace(/\r/g, '')` on raw content before splitting on `\n`
   - Find start/end markers in the line array
   - Splice in new content
   - Write back with `.replace(/\n/g, '\r\n')` to preserve CRLF
3. Run `node scripts/inject_stepN.js`
4. **Never use heredoc injection** — Node.js corrupts `\n` escape sequences in strings when reading from stdin

## CRLF gotcha

`app/page.js` has Windows CRLF line endings. When writing injection scripts, always `.replace(/\r/g,'')` before splitting on `\n`. Searching for line markers: use `.includes()` or `.trim() ===` on the stripped lines.

## App pages / navigation

| Page key | Component | Description |
|---|---|---|
| `home` | `HomeView` | Summary dashboard |
| `browse` / `detail` | `StoryCard`, `DetailView` | Browse and view SOAR stories |
| `add` | `StoryEditForm` | Edit a story |
| `capture` | `FreeAddView` | AI-assisted story capture (6-type classification) |
| `ask` | `AskView` | Ask AI — library search or interview answer |
| `interview` | `InterviewView` | Interview Adam — composed answers from full library |
| `experience` | `ExperienceView` | Edit career experience entries |
| `awards` | `AwardsView` | Awards list |
| `apply` | `ApplyView` | Application Engine — JD analysis → CPS → gaps → rescore → resume → cover letter |
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

## Content and test-data rules

- **No em-dashes (—), en-dashes (–), or double-hyphens (--)** in any generated content, test scripts, sample inputs, example text, or SOAR fields. Double-hyphens convert to em-dashes in most word processors, RTF, and docx output. All three are forbidden. Use a plain hyphen or rewrite the sentence.
- **Only use Adam's real employers** in test cases and examples: Manulife, Manulife GWAM, Manulife Retirement, Manulife Private Asset Management, OMERS, State Street.

## Git / deployment

- Remote: `https://github.com/MoralFabric/PHIS`
- Branch: `main`
- Vercel auto-deploys on push to `main`
- `.env.local` is gitignored — set all env vars in the Vercel dashboard
