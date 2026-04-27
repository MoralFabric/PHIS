// One-time import: reads every soar_*.json / soar_*.JSON in the project root,
// normalizes to the DB row shape in lib/data.js, and upserts into Supabase.
// Skips IDs that already exist in the stories table.
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local to bypass RLS.

const fs   = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// ── Load .env.local without requiring dotenv ──────────────────────────────────
function loadEnvLocal(file) {
  let text
  try { text = fs.readFileSync(file, 'utf8') } catch { return }
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!m || line.trimStart().startsWith('#')) continue
    process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
}

loadEnvLocal(path.join(__dirname, '..', '.env.local'))

const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// ── Normalize any soar document shape → stories row ──────────────────────────
function toRow(s) {
  const skills =
    Array.isArray(s.skills)  ? s.skills  :
    Array.isArray(s.themes)  ? s.themes.map(t => t.toLowerCase()) : []

  return {
    id:         String(s.id),
    type:       s.type                     || 'career',
    title:      s.title                    || '',
    employer:   s.employer                 || '',
    situation:  s.situation                || '',
    obstacle:   s.obstacle                 || '',
    action:     s.action                   || '',
    result:     s.result                   || '',
    impact:     s.impact                   || '',
    full_story: s.fullStory || s.full_story || s.fullNarrative || '',
    themes:     Array.isArray(s.themes)  ? s.themes  : [],
    skills,
    use_for:    Array.isArray(s.useFor)  ? s.useFor  :
                Array.isArray(s.use_for) ? s.use_for : [],
    notes:      s.notes                    || '',
    date_added: s.dateAdded || s.date_added || '',
  }
}

// ── Discover files ────────────────────────────────────────────────────────────
const ROOT  = path.join(__dirname, '..')
const files = fs.readdirSync(ROOT).filter(f => /^soar_.*\.json$/i.test(f)).sort()

if (files.length === 0) {
  console.log('No soar_*.json files found in project root.')
  process.exit(0)
}

console.log(`Found ${files.length} file(s):`)
files.forEach(f => console.log(`  ${f}`))

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Parse every file — each may be a single object or an array
  const candidates = []
  for (const file of files) {
    const raw = fs.readFileSync(path.join(ROOT, file), 'utf8')
    let parsed
    try { parsed = JSON.parse(raw) } catch (e) {
      console.warn(`⚠  Skipping ${file} — invalid JSON: ${e.message}`)
      continue
    }
    const stories = Array.isArray(parsed) ? parsed : [parsed]
    stories.forEach(s => candidates.push(toRow(s)))
  }

  if (candidates.length === 0) {
    console.log('No valid stories parsed.')
    return
  }

  // Fetch existing IDs so we can skip them
  const { data: existing, error: fetchErr } = await supabase
    .from('stories')
    .select('id')

  if (fetchErr) {
    console.error('❌  Failed to fetch existing IDs:', fetchErr.message)
    process.exit(1)
  }

  const existingIds = new Set((existing || []).map(r => r.id))
  const toInsert    = candidates.filter(r => !existingIds.has(r.id))
  const skipped     = candidates.filter(r =>  existingIds.has(r.id))

  console.log(`\n${candidates.length} stories parsed`)
  console.log(`  ${toInsert.length} new  →  will insert`)
  console.log(`  ${skipped.length} already in DB  →  skipped`)
  if (skipped.length) console.log('  Skipped IDs:', skipped.map(r => r.id).join(', '))

  if (toInsert.length === 0) {
    console.log('\nNothing to insert. Done.')
    return
  }

  // Upsert in batches of 50 to stay under Supabase payload limits
  const BATCH = 50
  let inserted = 0
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH)
    const { error } = await supabase.from('stories').upsert(batch)
    if (error) {
      console.error(`❌  Batch failed at index ${i}:`, error.message)
      console.error('    First row in batch:', JSON.stringify(batch[0], null, 2))
      process.exit(1)
    }
    inserted += batch.length
    process.stdout.write(`  Upserted ${inserted}/${toInsert.length}...\r`)
  }

  console.log(`\n✓  Inserted ${inserted} stories into Supabase.\n`)
}

main().catch(e => { console.error(e); process.exit(1) })
