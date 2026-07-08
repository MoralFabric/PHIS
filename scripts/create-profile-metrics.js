// Create and seed profile_metrics table.
// Usage: node scripts/create-profile-metrics.js

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
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const ROWS = [
  { value: 'CFA',   label: 'Charterholder',                  pinned: true,  tags: ['credential'],                    sort_order: 1 },
  { value: '20',    label: 'Years in financial services',     pinned: true,  tags: ['experience', 'leadership'],      sort_order: 2 },
  { value: '150',   label: 'Largest team led',                pinned: true,  tags: ['leadership'],                    sort_order: 3 },
  { value: '3',     label: 'Global firms',                    pinned: false, tags: ['experience'],                    sort_order: 4 },
  { value: 'U of T',label: 'Math and Economics, Honours BSc', pinned: false, tags: ['credential', 'analytics'],       sort_order: 5 },
  { value: '2025',  label: 'Published author',                pinned: false, tags: ['thought-leadership', 'strategy'],sort_order: 6 },
  { value: 'NLP',   label: 'Master Practitioner',             pinned: false, tags: ['communication'],                 sort_order: 7 },
]

async function main() {
  // Step 1: create table via raw SQL using rpc if available, otherwise use insert directly
  // Supabase JS client doesn't expose DDL directly — use the REST API with service key
  console.log('=== Creating profile_metrics table ===')
  const ddl = `
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
  // Use the Supabase Management API is not available here; use pg via REST
  // The JS client can run raw SQL via supabase.rpc if a helper function exists,
  // or via the /rest/v1/rpc endpoint. Fallback: try inserting directly (table may already exist).
  // Best path: POST to the SQL endpoint using the service key.
  const sqlResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql: ddl }),
  })
  if (sqlResp.ok) {
    console.log('  Table created via exec_sql RPC')
  } else {
    // exec_sql not available — try the pg endpoint
    const pgResp = await fetch(`${SUPABASE_URL}/pg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: ddl }),
    })
    if (pgResp.ok) {
      console.log('  Table created via /pg endpoint')
    } else {
      const errText = await pgResp.text().catch(() => '(no body)')
      console.log(`  DDL via HTTP failed (${pgResp.status}): ${errText}`)
      console.log('  Will attempt direct insert — table must already exist or this will fail.')
    }
  }

  // Step 2: upsert rows (idempotent via on-conflict on sort_order not possible without unique constraint;
  // instead delete-all then insert, or just insert and handle duplicates)
  console.log('\n=== Checking existing rows ===')
  const { data: existing, error: existErr } = await supabase
    .from('profile_metrics')
    .select('id, value, label, sort_order')
    .order('sort_order', { ascending: true })

  if (existErr) {
    console.log('  Table query failed:', existErr.message)
    console.log('  The table may not exist yet. If DDL failed above, run the SQL manually in the Supabase dashboard.')
    process.exit(1)
  }

  console.log(`  Found ${existing.length} existing rows`)

  if (existing.length > 0) {
    console.log('  Rows already present:')
    existing.forEach(r => console.log(`    sort_order=${r.sort_order}  ${r.value}  "${r.label}"`))
    console.log('  Skipping insert (already seeded). To re-seed, delete all rows first.')
  } else {
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

  // Step 3: query back and display
  console.log('\n=== Final rows in profile_metrics (sorted) ===')
  const { data: final, error: finalErr } = await supabase
    .from('profile_metrics')
    .select('id, value, label, pinned, tags, sort_order')
    .order('sort_order', { ascending: true })
  if (finalErr) { console.error('Final query failed:', finalErr.message); process.exit(1) }

  console.log(JSON.stringify(final, null, 2))
  console.log(`\nTotal: ${final.length} rows`)
  const pinned = final.filter(r => r.pinned)
  console.log(`Pinned (${pinned.length}): ${pinned.map(r => r.value).join(', ')}`)
  console.log('Expected default cards: first 3 pinned + 1 next by sort_order =>', [...pinned.slice(0,3), final.find(r => !r.pinned)].filter(Boolean).map(r => r.value).join(', '))
}

main().catch(e => { console.error(e); process.exit(1) })
