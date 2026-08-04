// Import soar_064_to_068_combined.json into the stories table.
//
// WHY THIS EXISTS instead of using import-extra-soars.js:
// These five entries use a richer authoring schema than the flat DB row shape.
// toRow() in import-extra-soars.js looks for `action`/`result`/`use_for` (singular,
// flat) and would write EMPTY STRINGS for all three, silently dropping the entire
// body of each story. It also has nowhere to put `usageWarning`, `toConfirm`,
// `year`, `role`, or `relatedSOARs`, so those guardrails would vanish.
//
// The stories table has no column for them either. This script folds them into
// `notes`, following the convention already set by soar_062_gr_digital_leader_product_analytics.
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

function loadEnvLocal(file) {
  let text
  try { text = fs.readFileSync(file, 'utf8') } catch { return }
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!m || line.trimStart().startsWith('#')) continue
    process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
}

const ROOT = path.join(__dirname, '..')
loadEnvLocal(path.join(ROOT, '.env.local'))

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const SRC = path.join(ROOT, 'soar_064_to_068_combined.json')
const TODAY = '2026-08-04'

// Join an authored array of clauses into one prose field, matching the
// sentence-per-clause house style used by soar_055 / soar_062.
function joinClauses(arr) {
  if (!Array.isArray(arr)) return typeof arr === 'string' ? arr : ''
  return arr
    .map(s => String(s).trim())
    .filter(Boolean)
    .map(s => (/[.!?]$/.test(s) ? s : s + '.'))
    .join(' ')
}

// Everything the stories table has no column for goes here, usageWarning first
// so it is the first thing anyone (or any prompt) reading notes encounters.
function buildNotes(s) {
  const parts = []
  if (s.usageWarning) parts.push('USAGE WARNING: ' + s.usageWarning)
  parts.push('NOT GENERATION READY: results contain TO CONFIRM placeholders. Do not use for resume or cover letter output until resolved.')
  if (s.role) parts.push('Role: ' + s.role)
  if (s.year) parts.push('Year: ' + s.year + '.')
  if (Array.isArray(s.relatedSOARs) && s.relatedSOARs.length) {
    parts.push('Related SOARs: ' + s.relatedSOARs.join(', ') + '.')
  }
  if (Array.isArray(s.toConfirm) && s.toConfirm.length) {
    parts.push('TO CONFIRM: ' + s.toConfirm.map(t => String(t).trim().replace(/\.$/, '')).join('; ') + '.')
  }
  return parts.join('\n')
}

function toRow(s) {
  return {
    id:         String(s.id),
    type:       s.type     || 'career',
    title:      s.title    || '',
    employer:   s.employer || '',
    situation:  s.situation || '',
    obstacle:   s.obstacle  || '',
    action:     joinClauses(s.actions || s.action),
    result:     joinClauses(s.results || s.result),
    impact:     s.impact || '',
    full_story: s.fullStory || s.full_story || '',
    themes:     Array.isArray(s.themes) ? s.themes : [],
    skills:     Array.isArray(s.competenciesDemonstrated) ? s.competenciesDemonstrated
              : Array.isArray(s.skills) ? s.skills : [],
    use_for:    Array.isArray(s.useCases) ? s.useCases
              : Array.isArray(s.use_for) ? s.use_for : [],
    notes:      buildNotes(s),
    date_added: TODAY,
  }
}

// CLAUDE.md content rule: no em-dash, en-dash, or double-hyphen anywhere.
function dashScan(rows) {
  const bad = []
  for (const r of rows) {
    for (const [k, v] of Object.entries(r)) {
      const text = typeof v === 'string' ? v : JSON.stringify(v)
      if (/[–—]|--/.test(text)) bad.push(`${r.id}.${k}`)
    }
  }
  return bad
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'))
  const src = Array.isArray(raw) ? raw : [raw]
  const rows = src.map(toRow)

  const bad = dashScan(rows)
  if (bad.length) {
    console.error('Dash rule violation in:', bad.join(', '))
    process.exit(1)
  }

  // Report anything that would have been silently lost, so the mapping stays honest.
  for (const r of rows) {
    const empty = ['situation','obstacle','action','result','full_story']
      .filter(k => !r[k] || !r[k].trim())
    console.log(`${r.id}  action:${r.action.length}c  result:${r.result.length}c  skills:${r.skills.length}  use_for:${r.use_for.length}  notes:${r.notes.length}c` +
      (empty.length ? `  EMPTY: ${empty.join(',')}` : ''))
  }

  const { data: existing, error: fetchErr } = await supabase.from('stories').select('id')
  if (fetchErr) { console.error('Fetch failed:', fetchErr.message); process.exit(1) }
  const existingIds = new Set((existing || []).map(r => r.id))
  const collisions = rows.filter(r => existingIds.has(r.id)).map(r => r.id)
  console.log(collisions.length ? `\nOverwriting existing: ${collisions.join(', ')}` : '\nNo id collisions.')

  const { error } = await supabase.from('stories').upsert(rows)
  if (error) { console.error('Upsert failed:', error.message); process.exit(1) }
  console.log(`\nUpserted ${rows.length} stories.`)

  // Verify cross-references resolve to live rows.
  const refs = [...new Set(src.flatMap(s => s.relatedSOARs || []))]
  const { data: found } = await supabase.from('stories').select('id,notes').in('id', refs)
  const foundIds = new Set((found || []).map(r => r.id))
  console.log('\nCross-reference check:')
  for (const ref of refs) {
    const row = (found || []).find(r => r.id === ref)
    const retired = row && /^RETIRED/i.test(row.notes || '')
    console.log(`  ${ref}: ${!foundIds.has(ref) ? 'MISSING' : retired ? 'RETIRED STUB' : 'ok'}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
