// Exports all PHIS tables to review_*.json files at the project root.
// Uses Node's built-in https module (no fetch dependency).
//
// Usage: node scripts/export-all.js
//
// Output files:
//   review_stories.json
//   review_experience.json
//   review_awards.json
//   review_education.json
//   review_profile_context.json

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

const ROOT = path.join(__dirname, '..')

// Parse host from URL like https://xxxx.supabase.co
const urlObj  = new URL(SUPABASE_URL)
const SBHOST  = urlObj.hostname

function get(urlPath) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: SBHOST,
      path: urlPath,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Accept': 'application/json',
      },
    }
    const req = https.request(opts, res => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`))
        } else {
          try { resolve(JSON.parse(body)) }
          catch (e) { reject(new Error(`JSON parse error: ${e.message}\n${body.slice(0,200)}`)) }
        }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function fetchAll(table, orderCol) {
  const PAGE = 1000
  let rows = []
  let offset = 0
  while (true) {
    const qs = `?order=${orderCol}&limit=${PAGE}&offset=${offset}`
    const page = await get(`/rest/v1/${table}${qs}`)
    if (!Array.isArray(page) || page.length === 0) break
    rows = rows.concat(page)
    if (page.length < PAGE) break
    offset += PAGE
  }
  return rows
}

function write(filename, data) {
  fs.writeFileSync(path.join(ROOT, filename), JSON.stringify(data, null, 2), 'utf8')
}

async function main() {
  console.log('Exporting PHIS tables...\n')

  const stories = await fetchAll('stories', 'id')
  write('review_stories.json', stories)
  console.log(`  stories          : ${stories.length} rows  ->  review_stories.json`)

  const experience = await fetchAll('experience', 'id')
  write('review_experience.json', experience)
  console.log(`  experience       : ${experience.length} rows  ->  review_experience.json`)

  const awards = await fetchAll('awards', 'year')
  write('review_awards.json', awards)
  console.log(`  awards           : ${awards.length} rows  ->  review_awards.json`)

  const education = await fetchAll('education', 'year')
  write('review_education.json', education)
  console.log(`  education        : ${education.length} rows  ->  review_education.json`)

  const pc = await get('/rest/v1/profile_context?limit=1')
  const profileContext = Array.isArray(pc) && pc.length > 0 ? pc[0] : null
  write('review_profile_context.json', profileContext)
  console.log(`  profile_context  : ${profileContext ? 1 : 0} row   ->  review_profile_context.json`)

  console.log('\nDone. Load review_*.json files into Claude Chat for review.')
  console.log('Claude Chat should return patch_*.json files — apply with scripts/apply-*-patch.js')
}

main().catch(e => { console.error('\nERROR:', e.message); process.exit(1) })
