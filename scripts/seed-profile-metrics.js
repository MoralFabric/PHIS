// Seed profile_metrics (table must already exist).
// Usage: node scripts/seed-profile-metrics.js

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

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

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
  // Check existing rows
  console.log('=== Checking existing rows ===')
  const { data: existing, error: existErr } = await supabase
    .from('profile_metrics')
    .select('id, value, label, sort_order, pinned')
    .order('sort_order', { ascending: true })

  if (existErr) {
    console.error('Query failed:', existErr.message)
    console.error('Is the table created? Run the DDL in the Supabase SQL editor first.')
    process.exit(1)
  }

  console.log(`  ${existing.length} rows found`)

  if (existing.length > 0) {
    console.log('  Already seeded — skipping insert:')
    existing.forEach(r => console.log(`    [${r.pinned ? 'pinned' : '     '}] sort=${r.sort_order}  ${r.value}  "${r.label}"`))
  } else {
    console.log('\n=== Inserting 7 seed rows ===')
    const { data: inserted, error: insErr } = await supabase
      .from('profile_metrics')
      .insert(ROWS)
      .select()

    if (insErr) {
      console.error('Insert failed:', insErr.message)
      process.exit(1)
    }
    console.log(`  Inserted ${inserted.length} rows OK`)
  }

  // Final verification
  console.log('\n=== Final rows in profile_metrics ===')
  const { data: final, error: finalErr } = await supabase
    .from('profile_metrics')
    .select('id, value, label, pinned, tags, sort_order')
    .order('sort_order', { ascending: true })

  if (finalErr) { console.error('Final query failed:', finalErr.message); process.exit(1) }

  console.log(JSON.stringify(final, null, 2))

  const pinned   = final.filter(r => r.pinned)
  const unpinned = final.filter(r => !r.pinned)
  const cards    = [...pinned.slice(0, 3), unpinned[0]].filter(Boolean)
  console.log(`\nTotal rows: ${final.length}`)
  console.log(`Default 4 cards: ${cards.map(r => `"${r.value}" (${r.label})`).join(' | ')}`)
}

main().catch(e => { console.error(e); process.exit(1) })
