# PHIS — Professional History Intelligence Studio

Next.js + Supabase migration of PHIS_v5.jsx. Adam Waldman's career record, held as structured data, with AI tools over it for fit scoring, interviewing and document generation. The product name, everywhere it is shown, is Professional History Intelligence Studio.

## Stack

- **Next.js 16** (App Router, no TypeScript, JS only)
- **Supabase** — Postgres via `@supabase/supabase-js` v2
- **Anthropic Claude** — proxied through a server-side API route (key never reaches the browser)
- No CSS framework — inline styles + CSS variables defined in `app/globals.css`

## Project layout

```
app/
  page.js              # Full app UI — single 'use client' component (~5300 lines)
  layout.js            # Root layout + all social/SEO metadata (see 'Social preview card')
  globals.css          # CSS variables (colors, font, borders) + splash and film keyframes
  opengraph-image.js   # Generated 1200x630 social card (next/og). Wires og:image automatically
  components/
    PhisFilm.js        # ~65s generated motion piece played from the About tab
  api/
    claude/
      route.js         # Server-side Anthropic proxy — POST /api/claude
lib/
  supabase.js          # Browser Supabase client (NEXT_PUBLIC_ vars only)
  data.js              # All DB helpers: seedAndGetStories, upsertStory/ies, deleteStory,
                       #   getExperience, saveExperience, getProfile, saveProfile,
                       #   getAwards, insertAward, getEducation, insertEducation,
                       #   getProfileContext, saveProfileContext,
                       #   insertGuidance, getValues, insertValue
scripts/
  import-extra-soars.js      # One-time import: reads soar_*.json from root, upserts to Supabase
  export-stories.js          # Admin: exports all stories table rows to soar_export_for_review.json
  apply_soar_patch.js        # Admin: applies a JSON patch file to stories rows (targeted field updates)
  export-all.js              # Data review: exports all tables to review_*.json (stories/experience/awards/education/profile_context)
  apply-all-reviewed.js      # Data review: upserts all five review_*.json files back to Supabase (idempotent, use after full review cycle)
  apply-stories-patch.js     # Data review: targeted patch — applies patch_stories.json to stories table
  apply-experience-patch.js  # Data review: targeted patch — applies patch_experience.json to experience table
  apply-awards-patch.js      # Data review: targeted patch — applies patch_awards.json to awards table
  apply-education-patch.js   # Data review: targeted patch — applies patch_education.json to education table
  apply-profile-context-patch.js  # Data review: targeted patch — applies patch_profile_context.json (singleton)
  migration_001_profile.sql  # Adds salary columns to profile table
  migration_002_schema.sql   # Adds awards, education, profile_context tables; facets column on experience
  migration_003_guest_email_optional.sql  # Makes guest_sessions.email nullable (trust-first landing)
  step5_resume_v2.js         # ResumeStep source (Phase 3)
  step6_coverletter_v2.js    # CoverLetterStep source (Phase 3)
  inject_step5_step6.js      # Node injection script for step5+6 (run once; file stays for reference)
  inject_splash_boot.js      # Boot fix: splash-as-loader + parallel data load (run once, kept for reference)
  inject_about.js            # Injects GuestAboutView + About nav tab (run once, kept for reference)
  fix_film_timing.js         # One-off: collapsed double fade windows in PhisFilm
  fix_film_holds.js          # One-off: retimed PhisFilm payoff-line reveals
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
| `SUPABASE_SERVICE_ROLE_KEY` | admin scripts only | Bypasses RLS — used by `import-extra-soars.js`, `export-stories.js`, `apply_soar_patch.js` |

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
4. **Dash strip** — em-dashes (U+2014) and en-dashes (U+2013) are replaced with hyphens unconditionally before validation. This prevents the model from producing an unfixable dash warning in the next step.
5. Validate: `validateResume(text)` returns `{issues, flags}` — issues are blocking (banned words, word count, required sections), flags are non-blocking source-trace warnings (multiple relational claims in one bullet)
6. If issues: regenerate once with fix instructions appended; dash-strip applied again before re-validating. If still failing, show `qualityFlags` red banner; source flags always shown as yellow banner.

**Headline (per application)** — `ResumeStep` holds a `headline` state initialized from `profileContext.headerTagline` (if set) falling back to `CANDIDATE.subtitle`. Once a resume is generated, an editable "Resume headline (top of page)" text input appears above the export buttons. Both the `.rtf` download and the Copy button use this state, so the headline can differ across applications without touching profile settings.

**Step 6 — Cover Letter (Phase 3 structured prompt + validator)**

- System prompt injects today's date and specifies exact output structure: date, addressee block, Re: line, Dear salutation, 4 body paragraphs, Sincerely signoff
- `validateCoverLetter(text)` checks: em-dashes, banned phrases, paragraph count (must be 4), body word count (250-550), salutation, signoff, bracketed placeholders
- Regenerate-once pattern: if validator fails, append fix instructions and call again. `qualityFlags` red banner if issues persist.

**Banned phrases** (both resume and cover letter): `leveraged, spearheaded, passionate, synergy, in today's fast-paced, utilized, holistic, robust, transformative, cutting-edge, best-in-class, thought leader, results-driven, dynamic, world-class`.

**Generation guardrails (steps 5 and 6 only)**

The `stories` table has no column for authoring metadata, so usage warnings and unresolved placeholders are folded into `notes` at import time. Three top-level helpers in `page.js` (mirrored in `scripts/step5_resume_v2.js`) enforce them:

| Helper | Behaviour |
|---|---|
| `isGenerationBlocked(story)` | `true` if `notes` begins with `NOT GENERATION READY`, **or** if `use_for` is populated and contains neither `Resume` nor `Cover Letter` |
| `usageWarningOf(story)` | Extracts the `USAGE WARNING:` block from `notes`, empty string if absent |
| `generationStories(list)` | `list` minus blocked stories |

`ResumeStep` filters through `generationStories` before the top-15 pre-filter; `CoverLetterStep` filters before its `slice(0,8)`. Surviving warnings are appended to each story's context block as `USAGE WARNING (binding):` and enforced by RESUME_SYS rule 15 / CL_SYS rule 8, which state that warnings override all other prompt rules.

`use_for` is treated as an **opt-out only when populated** — the ~25 rows with an empty `use_for` stay available rather than being silently dropped. `AskView` and `InterviewView` deliberately keep the full library; these guardrails are resume and cover letter only, because that is where an overclaim gets checked by a reference.

To make a story generation-eligible again, resolve its `TO CONFIRM` items and remove the `NOT GENERATION READY` line from `notes`.

**RTF export** — `buildResumeRTF(text, headline)` takes the per-application `headline` state from `ResumeStep` as its second argument (not a direct `profileContext` lookup). `buildCoverLetterRTF(text)` and `buildFullCVRTF(exp, edu, awards, subtitle)` use `escRTF()` for escaping; the full CV subtitle falls back to `profileContext?.headerTagline || CANDIDATE.subtitle`.

**`CANDIDATE` constants** (`app/page.js` top of file) — `CANDIDATE.subtitle` is the last-resort headline fallback: `"Data and Analytics Leader  |  Insight Strategy  |  Enterprise Decision Systems"`. Do not change it to a job title — it must be accurate without any active application context. The `profileContext.headerTagline` field (editable in ProfileView) and the per-application `headline` input in ResumeStep both take precedence over this default.

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
| `about` (guest) | `GuestAboutView` | About PHIS + the generated film. Ungated. |

## Visitor entry flow (trust-first landing)

`App` has two modes: `guest` (default) and `adam`. There is **no entry gate** — visitors land directly on the guest experience so no one is asked for info before seeing anything.

1. **`BrandSplash`** — shown on every load (gated on `splashDone` state). Navy PHIS splash that auto-fades after ~1.6s and is tap-to-skip. Purely cosmetic; collects nothing.
2. **`GuestShell`** — the visitor app. Three tabs (`GuestTopBar`): `home` (`GuestDashboard`, ungated), `fit` (`GuestFitView`), `interview` (`InterviewView`).
3. **`GuestInfoGate`** — the info ask. Only `fit` and `interview` are gated (`GATED = {fit, interview}`). The first time an anonymous guest (`guest == null`) opens either, this card appears instead of the tool. **Name required; Organization + Email optional.** On submit → `onCapture` in `App` sets `guest` and fires `createGuestSession` → `guestSessionId`. Once captured, both tools stay unlocked for the session (no re-gate).
4. **`GuestFooter`** — discreet "I'm Adam" link at the bottom of `GuestShell`; opens an inline passcode field (`ADAM_CODE = "phisphis"`) → `onAdam` sets `mode = "adam"` → full internal app.

`createGuestSession` sends `email: info.email || null`. The `guest_sessions.email` column must be nullable (`migration_003_guest_email_optional.sql`) or the insert 400s on blank email. **Trade-off:** pure browsers who never open an AI tool create no `guest_sessions` row, so Adam has no record they visited — this is the intended cost of the no-gate design.

## Social preview card (LinkedIn, Slack, iMessage)

All metadata lives in `app/layout.js`. The card leads with identity, not the product codename: `og:title` is `Adam Waldman, CFA | Builds the systems that turn information into decisions.` The tagline is the same line stored in `profile_context.header_tagline`.

**The document `<title>` is deliberately short** (`Adam Waldman, CFA`) because it is a browser-tab label; the long line is set separately on `openGraph.title` and `twitter.title`. Do not merge them.

**`metadataBase` resolves without a hardcoded domain:**

```js
process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${...}` : 'http://localhost:3000')
```

Vercel injects `VERCEL_PROJECT_PRODUCTION_URL` automatically (the custom domain if one is attached). Locally the tags read `localhost:3000` and that is expected. Set `NEXT_PUBLIC_SITE_URL` only to override.

**`app/opengraph-image.js`** generates the 1200x630 PNG at request time via `next/og`. Next wires `og:image`, its dimensions and `og:image:alt` from the file's exports, so never hand-write those tags.

- The wordmark is inlined as a base64 SVG data URI, because satori renders `<img>` far more reliably than raw SVG children.
- Poppins is fetched from Google Fonts at render and **falls back to Next's bundled font inside a try/catch**. A font fetch failure must never fail the image.
- `revalidate = 86400`. The tagline is hardcoded rather than read from `profile_context`: a crawler request must not depend on a Supabase round trip. If you change `header_tagline`, change it here too.

LinkedIn caches aggressively. After changing any of this, re-scrape via the LinkedIn Post Inspector or the card will keep showing the old version.

## Boot sequence

`App` renders in this order, and the order matters:

```js
if (loading || !splashDone) return <BrandSplash waiting={loading} onDone={...} />
```

**`BrandSplash` is the loading screen.** It used to play *after* a bare `Loading PHIS…` text node, so a visitor saw the ugly wait first and then paid another 2.1s for the brand moment. It now covers the wait.

- Holds a minimum 1.6s beat so a fast load still feels composed, then leaves as soon as `waiting` goes false.
- Tapping sets `skipped`, which skips the beat but **not** the data wait.
- `.phis-splash-track` (in `globals.css`) is a marigold sweep that appears only when the minimum beat has elapsed and data is still loading. A fast connection never sees a loading indicator at all.

The boot effect loads stories first (they seed), then runs the other five reads through a single `Promise.allSettled`. They are independent of each other, so keep them batched; do not reintroduce sequential `await`s.

## About tab and the PHIS film

`GuestAboutView` (in `page.js`) is the fourth guest tab and is **ungated** on purpose: it is a pitch, not a tool, so it must not sit behind `GuestInfoGate`. Its narrative order is fixed by Adam: what PHIS is, why it exists, then who built it.

`app/components/PhisFilm.js` is a ~67s motion piece. There is no video file, no footage and no third-party embed. Everything is generated:

| Piece | How |
|---|---|
| Timeline | `requestAnimationFrame` accumulating into `elapsed`, not chained timeouts. This is what makes pause, seek and the progress bar stay in sync. |
| Scenes | `buildScenes()` returns `{id, dur, say, render(t)}`. `t` is the scene's own 0..1 progress. |
| Score | `createScore()` builds a Web Audio drone plus a D minor pentatonic arpeggio through a feedback delay, using lookahead scheduling. Written rather than licensed, so there is nothing to clear and no asset to ship. |
| Narration | `speechSynthesis`, one utterance per scene, fired once. Ducks the music to 0.4 while speaking. Both music and voice are user-togglable in the transport. |

**Timing rule, learned the hard way:** scene elements only ever *arrive*. `inOut(t, up)` is fade-in only, and the **player** applies the single fade-out envelope across the whole scene. An earlier version had elements carrying their own fade-out on top of a sub-range fade-in, and kickers silently vanished mid-scene. Never give an element its own fade-out.

Land every reveal by about `t = 0.8`. The scene envelope starts closing at `0.93`, so a line that finishes revealing at `0.95` is legible for roughly 200ms.

`storyCount` and `employerCount` are passed in live from the loaded library, so the counters in the library scene reflect real data.

## Interview AI system prompt policy

Both `AskView.ask` (interview branch) and `InterviewView.ask` carry the same two-part system prompt:

1. Speak in first person, naturally, 3-4 paragraphs, no bullets, no headers.
2. **Interpret questions generously** — contributing a chapter counts as writing for the book, co-authoring counts, speaking on a topic counts as expertise. Surface partial matches rather than answering "no."

## Running locally

```bash
npm run dev          # starts on http://localhost:3000
```

## Data review workflow (Claude Chat round-trip)

Periodically review all table data to correct AI-generated inaccuracies. Two modes:

### Full review cycle (preferred for broad editorial passes)

**Step 1 — Export** (run locally — Supabase project must be active, not paused):
```bash
node scripts/export-all.js
```
Writes `review_*.json` to the project root. Load into Claude Chat for review.

**Step 2 — Edit in Claude Chat or Claude Code**: Claude edits the `review_*.json` files in place. Retiring a record means adding `"status":"retired"` and `"retired_reason":"..."` — do NOT delete rows.

Schema notes that `apply-all-reviewed.js` handles automatically:
- `stories`: `status`/`retired_reason` are not DB columns — they get folded into `notes` and `use_for` cleared for retired records.
- `experience`: `notes` is not a DB column — it gets stripped before upsert.

**Step 3 — Apply**:
```bash
node scripts/apply-all-reviewed.js
```
Idempotent full upsert of all five tables. Safe to re-run.

### Targeted patch (for small, surgical fixes)

Create `patch_<table>.json` in the project root:
```json
[ { "id": "row-id", "updates": { "field": "corrected value" } } ]
```
Then run the matching script:
```bash
node scripts/apply-stories-patch.js
node scripts/apply-experience-patch.js
node scripts/apply-awards-patch.js
node scripts/apply-education-patch.js
node scripts/apply-profile-context-patch.js   # format: { "updates": {...} }
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
