// Applies targeted field-level patches to stories rows in Supabase.
// Reads patch list from phis_soar_quarantine_patch.json at project root.
// Uses SUPABASE_SERVICE_ROLE_KEY (preferred) to bypass RLS.

const fs   = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// ── Env loader (no dotenv dependency) ────────────────────────────────────────
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const KEY_LABEL    = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

console.log(`Supabase URL : ${SUPABASE_URL}`)
console.log(`Auth key     : ${KEY_LABEL}`)
console.log()

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

// ── Load patch file ───────────────────────────────────────────────────────────
const patchPath = path.join(__dirname, '..', 'phis_soar_quarantine_patch.json')
let patches
try {
  patches = JSON.parse(fs.readFileSync(patchPath, 'utf8'))
} catch (e) {
  console.error('Failed to read phis_soar_quarantine_patch.json:', e.message)
  process.exit(1)
}

if (!Array.isArray(patches) || patches.length === 0) {
  console.error('phis_soar_quarantine_patch.json must be a non-empty array')
  process.exit(1)
}

// ── Preview ───────────────────────────────────────────────────────────────────
console.log(`Patch file   : phis_soar_quarantine_patch.json`)
console.log(`Patches      : ${patches.length}`)
console.log()
console.log('Planned operations:')
for (const p of patches) {
  const fields = Object.keys(p.updates).join(', ')
  console.log(`  UPDATE stories SET { ${fields} } WHERE id = '${p.id}'`)
}
console.log()

// ── Apply patches ─────────────────────────────────────────────────────────────
async function main() {
  const results = []

  for (const { id, updates } of patches) {
    const fields = Object.keys(updates)
    const { error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error(`  FAIL  ${id}  [${fields.join(', ')}]  — ${error.message}`)
      results.push({ id, fields, ok: false, error: error.message })
    } else {
      console.log(`  OK    ${id}  [${fields.join(', ')}]`)
      results.push({ id, fields, ok: true })
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const succeeded = results.filter(r => r.ok)
  const failed    = results.filter(r => !r.ok)

  console.log()
  console.log('─'.repeat(60))
  console.log(`Total attempted : ${results.length}`)
  console.log(`Succeeded       : ${succeeded.length}`)
  console.log(`Failed          : ${failed.length}`)

  if (failed.length > 0) {
    console.log()
    console.log('Failed patches:')
    for (const f of failed) console.log(`  ${f.id} — ${f.error}`)
  }

  // ── Validation 1: quarantine use_for buckets ──────────────────────────────
  const { data: allUseFor, error: ufErr } = await supabase
    .from('stories')
    .select('id, use_for')

  if (ufErr) {
    console.error('\nFailed to fetch use_for data:', ufErr.message)
  } else {
    const bookOnly  = allUseFor.filter(r => Array.isArray(r.use_for) && r.use_for.length === 1 && r.use_for[0] === 'Book')
    const emptyUsed = allUseFor.filter(r => Array.isArray(r.use_for) && r.use_for.length === 0)
    console.log()
    console.log(`Validation 1 — use_for quarantine buckets:`)
    console.log(`  use_for = ["Book"] only  : ${bookOnly.length}  (expected 23 — Group A)`)
    console.log(`  use_for = []             : ${emptyUsed.length}  (expected 1 — Group B, id=18)`)
  }

  // ── Validation 2: quarantine notes markers ────────────────────────────────
  const { data: copilotRows, error: cpErr } = await supabase
    .from('stories')
    .select('id')
    .ilike('notes', '%COPILOT_SEED%')

  const { data: fabricatedRows, error: fabErr } = await supabase
    .from('stories')
    .select('id')
    .ilike('notes', '%FABRICATED%')

  if (cpErr || fabErr) {
    console.error('\nFailed to fetch notes data:', (cpErr || fabErr).message)
  } else {
    console.log()
    console.log(`Validation 2 — notes markers:`)
    console.log(`  notes contains COPILOT_SEED : ${copilotRows.length}  (expected 23)`)
    console.log(`  notes contains FABRICATED   : ${fabricatedRows.length}  (expected 1)`)
  }

  // ── Validation 3: fully-populated stories ─────────────────────────────────
  const { data: fullRows, error: fullErr } = await supabase
    .from('stories')
    .select('id')
    .neq('action', '')
    .neq('result', '')
    .neq('full_story', '')
    .not('action', 'is', null)
    .not('result', 'is', null)
    .not('full_story', 'is', null)

  if (fullErr) {
    console.error('\nFailed to run validation query:', fullErr.message)
  } else {
    console.log()
    console.log(`Validation 3 — fully-populated rows (action + result + full_story non-empty):`)
    console.log(`  Count : ${fullRows.length}`)
  }

  // ── Final: total row count ────────────────────────────────────────────────
  const { count: totalCount, error: cntErr } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: true })

  if (cntErr) {
    console.error('\nFailed to fetch total row count:', cntErr.message)
  } else {
    console.log(`\nTotal rows in stories table : ${totalCount}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
