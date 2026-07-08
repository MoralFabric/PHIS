// Upserts all five review_*.json files into Supabase.
// Run after the review/edit cycle. Safe to re-run (idempotent).
//
// Schema notes handled automatically:
//   - stories:    status/retired_reason folded into notes, use_for cleared for retired records
//   - experience: notes field stripped (not in DB schema)
//
// Usage: node scripts/apply-all-reviewed.js

const fs    = require('fs')
const path  = require('path')
const https = require('https')

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
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const SBHOST = new URL(SUPABASE_URL).hostname
const ROOT   = path.join(__dirname, '..')

function post(urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const opts = {
      hostname: SBHOST,
      path: urlPath,
      method: 'POST',
      headers: {
        'apikey':          SERVICE_KEY,
        'Authorization':   'Bearer ' + SERVICE_KEY,
        'Content-Type':    'application/json',
        'Content-Length':  Buffer.byteLength(payload),
        'Prefer':          'resolution=merge-duplicates,return=minimal',
      },
    }
    const req = https.request(opts, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error('HTTP ' + res.statusCode + ': ' + data.slice(0, 400)))
        } else {
          resolve(res.statusCode)
        }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

async function upsert(table, records) {
  const BATCH      = 50
  const normalized = normalizeBatch(records)
  for (let i = 0; i < normalized.length; i += BATCH) {
    await post('/rest/v1/' + table + '?on_conflict=id', normalized.slice(i, i + BATCH))
  }
  return normalized.length
}

function read(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'))
}

// Fields added by the editing agent that are not DB columns
const STORY_STRIP = new Set(['status', 'retired_reason', 'usage', 'needs_adam_detail'])
const EXP_STRIP   = new Set(['notes', 'needs_adam_detail'])

// stories: fold retired marker into notes, clear use_for, strip non-schema keys
function prepareStory(r) {
  const status        = r.status
  const retired_reason = r.retired_reason
  const rec = {}
  for (const [k, v] of Object.entries(r)) {
    if (!STORY_STRIP.has(k)) rec[k] = v
  }
  if (status === 'retired') {
    const marker = 'RETIRED: ' + (retired_reason || 'see review log') + '.'
    if (!String(rec.notes || '').includes('RETIRED:')) {
      rec.notes = (marker + ' ' + (rec.notes || '')).trim()
    }
    rec.use_for = []
  }
  return rec
}

// experience: strip notes and any other non-schema keys
function prepareExperience(r) {
  const rec = {}
  for (const [k, v] of Object.entries(r)) {
    if (!EXP_STRIP.has(k)) rec[k] = v
  }
  return rec
}

// Ensure all records in a batch have identical keys (required by Supabase REST)
function normalizeBatch(records) {
  const allKeys = new Set()
  records.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)))
  return records.map(r => {
    const out = {}
    for (const k of allKeys) out[k] = r[k] !== undefined ? r[k] : null
    return out
  })
}

async function main() {
  console.log('Applying reviewed files to Supabase...\n')

  const stories    = read('review_stories.json').map(prepareStory)
  const experience = read('review_experience.json').map(prepareExperience)
  const awards     = read('review_awards.json')
  const education  = read('review_education.json')
  const pc         = read('review_profile_context.json')

  console.log('  stories          : ' + await upsert('stories', stories)    + ' records')
  console.log('  experience       : ' + await upsert('experience', experience) + ' records')
  console.log('  awards           : ' + await upsert('awards', awards)       + ' records')
  console.log('  education        : ' + await upsert('education', education) + ' records')
  console.log('  profile_context  : ' + await upsert('profile_context', [pc]) + ' record')

  console.log('\nDone.')
}

main().catch(e => { console.error('\nERROR:', e.message); process.exit(1) })
