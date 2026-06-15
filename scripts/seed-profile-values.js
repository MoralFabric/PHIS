// Seeds 20 core values into profile_values.
// Uses ON CONFLICT (id) DO NOTHING — safe to re-run.
// Usage: node scripts/seed-profile-values.js

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

function request(method, urlPath, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const opts = {
      hostname: SBHOST,
      path: urlPath,
      method,
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type':  'application/json',
        ...extraHeaders,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }
    const req = https.request(opts, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error('HTTP ' + res.statusCode + ': ' + data.slice(0, 400)))
        } else {
          resolve(data ? JSON.parse(data) : null)
        }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

const ROWS = [
  { id: 'val_01', principle: 'Listen',                                              in_practice: "First move, not the polite pause before I say what I planned to.",                                           surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 1,  soar_refs: [], tags: [] },
  { id: 'val_02', principle: 'Act like you matter',                                  in_practice: "Show up owning the outcome, not waiting to be told my part is important.",                                    surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 2,  soar_refs: [], tags: [] },
  { id: 'val_03', principle: 'Buy-in and get buy in',                                in_practice: "Alignment comes from shared principles, not forced consensus. Sell the why before the what.",                surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 3,  soar_refs: [], tags: [] },
  { id: 'val_04', principle: 'People who interact with you should be better off because of it', in_practice: "Every interaction should leave the other person ahead. Report, peer, or client.",                 surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 4,  soar_refs: [], tags: [] },
  { id: 'val_05', principle: 'Share the credit, take the blame',                     in_practice: "Wins belong to the team. Failures stop with me.",                                                            surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 5,  soar_refs: [], tags: [] },
  { id: 'val_06', principle: 'Put your hand up',                                     in_practice: "Volunteer for the hard, unowned problem instead of waiting for it to be assigned.",                          surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 6,  soar_refs: [], tags: [] },
  { id: 'val_07', principle: 'Make it yours',                                        in_practice: "Own the work as if the mission were mine, even when the title says otherwise.",                              surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 7,  soar_refs: [], tags: [] },
  { id: 'val_08', principle: 'Be yourself and show yourself',                        in_practice: "No corporate performance of myself. People get the real one.",                                               surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 8,  soar_refs: [], tags: [] },
  { id: 'val_09', principle: 'Accept others',                                        in_practice: "Take people as they are and find the path that works with them.",                                            surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 9,  soar_refs: [], tags: [] },
  { id: 'val_10', principle: "Don't apologize, unless you mean it",                  in_practice: "I don't reflexively soften. An apology from me is real.",                                                   surface: 'interview_only', source: 'seed', status: 'draft', kind: 'principle', sort_order: 10, soar_refs: [], tags: [] },
  { id: 'val_11', principle: 'Be competitive',                                       in_practice: "I want to win, and I treat the plan as the scoreboard.",                                                     surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 11, soar_refs: [], tags: [] },
  { id: 'val_12', principle: 'Have real humility and real confidence',               in_practice: "Certain of my work, open to being wrong. Both at once.",                                                     surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 12, soar_refs: [], tags: [] },
  { id: 'val_13', principle: "Try and don't be embarrassed of it",                   in_practice: "Full effort, visibly, even when trying hard isn't the cool thing to do.",                                    surface: 'interview_only', source: 'seed', status: 'draft', kind: 'principle', sort_order: 13, soar_refs: [], tags: [] },
  { id: 'val_14', principle: "Automate what's urgent",                               in_practice: "Recurring fire-drills get engineered away so the team's time goes to thinking.",                             surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 14, soar_refs: [], tags: [] },
  { id: 'val_15', principle: 'Prioritize what important and not urgent',             in_practice: "Protect time for what matters before it becomes a crisis.",                                                  surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 15, soar_refs: [], tags: [] },
  { id: 'val_16', principle: 'Know your audience',                                   in_practice: "Shape the message to the room, not to my own comfort.",                                                      surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 16, soar_refs: [], tags: [] },
  { id: 'val_17', principle: 'Do things for good reasons',                           in_practice: "A real why behind the work, not politics or motion for its own sake.",                                       surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 17, soar_refs: [], tags: [] },
  { id: 'val_18', principle: 'Welcome opportunities',                                in_practice: "Lean toward yes when something new shows up.",                                                               surface: 'profile',        source: 'seed', status: 'draft', kind: 'principle', sort_order: 18, soar_refs: [], tags: [] },
  { id: 'val_19', principle: 'Go to bat, take a pitch, take the walk, bunt and swing for the fences', in_practice: "Pick the moment: when to push, when to wait, when to take the small win, when to swing big.", surface: 'interview_only', source: 'seed', status: 'draft', kind: 'principle', sort_order: 19, soar_refs: [], tags: [] },
  { id: 'val_20', principle: 'Smile',                                                in_practice: null,                                                                                                         surface: 'interview_only', source: 'seed', status: 'draft', kind: 'principle', sort_order: 20, soar_refs: [], tags: [] },
]

async function main() {
  console.log(`Inserting ${ROWS.length} rows (ON CONFLICT DO NOTHING)…`)

  await request('POST', '/rest/v1/profile_values?on_conflict=id', ROWS, {
    'Prefer': 'resolution=ignore-duplicates,return=minimal',
  })

  const rows = await request(
    'GET',
    '/rest/v1/profile_values?select=id,principle,status,kind,surface&order=sort_order.asc',
    null,
    { 'Accept': 'application/json' }
  )

  console.log(`\nRows now in profile_values: ${rows.length}`)
  console.log('First 3:')
  rows.slice(0, 3).forEach(r => console.log(JSON.stringify(r)))
}

main().catch(err => { console.error(err.message); process.exit(1) })
