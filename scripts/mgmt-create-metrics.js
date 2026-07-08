// Attempt DDL via Supabase Management API, then seed via JS client.
// Usage: node scripts/mgmt-create-metrics.js

const fs   = require('fs')
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
loadEnvLocal(path.join(__dirname, '..', '.env.local'))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)/)[1]

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const DDL = `
create table if not exists profile_metrics (
  id uuid primary key default gen_random_uuid(),
  value text not null,
  label text not null,
  pinned boolean not null default false,
  tags text[] default '{}',
  sort_order int not null default 0,
  created_at timestamptz default now()
);
alter table profile_metrics disable row level security;
`

const ROWS = [
  { value: 'CFA',    label: 'Charterholder',                  pinned: true,  tags: ['credential'],                     sort_order: 1 },
  { value: '20',     label: 'Years in financial services',     pinned: true,  tags: ['experience', 'leadership'],       sort_order: 2 },
  { value: '150',    label: 'Largest team led',                pinned: true,  tags: ['leadership'],                     sort_order: 3 },
  { value: '3',      label: 'Global firms',                    pinned: false, tags: ['experience'],                     sort_order: 4 },
  { value: 'U of T', label: 'Math and Economics, Honours BSc', pinned: false, tags: ['credential', 'analytics'],        sort_order: 5 },
  { value: '2025',   label: 'Published author',                pinned: false, tags: ['thought-leadership', 'strategy'], sort_order: 6 },
  { value: 'NLP',    label: 'Master Practitioner',             pinned: false, tags: ['communication'],                  sort_order: 7 },
]

async function main() {
  // ── 1. Try Management API DDL ──────────────────────────────────────────────
  console.log('=== Attempting DDL via Supabase Management API ===')
  console.log('  Project ref:', projectRef)

  let ddlOk = false
  try {
    const resp = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: DDL }),
      }
    )
    const body = await resp.text()
    if (resp.ok) {
      console.log('  DDL succeeded via Management API')
      ddlOk = true
    } else {
      console.log(`  Management API returned ${resp.status}: ${body}`)
    }
  } catch (e) {
    console.log('  Management API fetch failed:', e.message)
  }

  if (!ddlOk) {
    // ── 2. Try the direct /sql endpoint (older Supabase versions) ─────────
    try {
      const resp2 = await fetch(`${SUPABASE_URL}/sql`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':        SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: DDL }),
      })
      const body2 = await resp2.text()
      if (resp2.ok) {
        console.log('  DDL succeeded via /sql endpoint')
        ddlOk = true
      } else {
        console.log(`  /sql endpoint returned ${resp2.status}: ${body2}`)
      }
    } catch (e) {
      console.log('  /sql fetch failed:', e.message)
    }
  }

  if (!ddlOk) {
    console.log('\n  Could not run DDL programmatically.')
    console.log('  ACTION REQUIRED: run this in the Supabase SQL editor and re-run this script:')
    console.log('  ---')
    console.log(DDL.trim())
    console.log('  ---')
    process.exit(1)
  }

  // ── 3. Check existing rows ─────────────────────────────────────────────────
  console.log('\n=== Checking existing rows ===')
  const { data: existing, error: existErr } = await supabase
    .from('profile_metrics')
    .select('id, value, label, sort_order, pinned')
    .order('sort_order', { ascending: true })

  if (existErr) {
    console.error('  Query failed after DDL:', existErr.message)
    process.exit(1)
  }

  console.log(`  ${existing.length} rows found`)

  if (existing.length > 0) {
    console.log('  Already seeded:')
    existing.forEach(r => console.log(`    [${r.pinned ? 'pinned' : '     '}] sort=${r.sort_order}  ${r.value}  "${r.label}"`))
  } else {
    // ── 4. Insert seed rows ──────────────────────────────────────────────────
    console.log('\n=== Inserting seed rows ===')
    const { data: inserted, error: insErr } = await supabase
      .from('profile_metrics')
      .insert(ROWS)
      .select()

    if (insErr) {
      console.error('  Insert failed:', insErr.message)
      process.exit(1)
    }
    console.log(`  Inserted ${inserted.length} rows`)
  }

  // ── 5. Final verification ──────────────────────────────────────────────────
  console.log('\n=== Final rows ===')
  const { data: final, error: finalErr } = await supabase
    .from('profile_metrics')
    .select('id, value, label, pinned, tags, sort_order')
    .order('sort_order', { ascending: true })

  if (finalErr) { console.error('Final query failed:', finalErr.message); process.exit(1) }

  console.log(JSON.stringify(final, null, 2))
  console.log(`\nTotal: ${final.length} rows`)
  const pinned   = final.filter(r => r.pinned)
  const unpinned = final.filter(r => !r.pinned)
  const defaultCards = [...pinned.slice(0, 3), unpinned[0]].filter(Boolean)
  console.log(`Default 4 cards: ${defaultCards.map(r => `${r.value} (${r.label})`).join(' | ')}`)
}

main().catch(e => { console.error(e); process.exit(1) })
