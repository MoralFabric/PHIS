// Applies patches to the profile_context table (singleton row).
// Reads patch_profile_context.json from the project root.
//
// Patch file format (single object, no id needed):
//   { "updates": { "field": "new value", ... } }
//
// Array fields: geographic_preferences and industries_excluded are text[] —
// include the full replacement array in updates.
//
// Usage: node scripts/apply-profile-context-patch.js

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

const supabase  = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
const patchPath = path.join(__dirname, '..', 'patch_profile_context.json')

let patch
try {
  patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'))
} catch (e) {
  console.error('Failed to read patch_profile_context.json:', e.message)
  process.exit(1)
}

if (!patch || typeof patch !== 'object' || !patch.updates || typeof patch.updates !== 'object') {
  console.error('patch_profile_context.json must be a single { "updates": { ... } } object')
  process.exit(1)
}

const fields = Object.keys(patch.updates)
if (fields.length === 0) {
  console.error('patch_profile_context.json updates object is empty — nothing to do')
  process.exit(1)
}

console.log(`Patch file : patch_profile_context.json`)
console.log(`Fields     : ${fields.join(', ')}\n`)
console.log(`Planned operation:`)
console.log(`  UPDATE profile_context SET { ${fields.join(', ')} } (first/only row)\n`)

async function main() {
  // Fetch the id of the singleton row
  const { data: rows, error: fetchErr } = await supabase.from('profile_context').select('id').limit(1)
  if (fetchErr) throw new Error(`Failed to fetch profile_context: ${fetchErr.message}`)
  if (!rows || rows.length === 0) throw new Error('No profile_context row found — create one in the app first')

  const { id } = rows[0]
  const { error } = await supabase.from('profile_context').update(patch.updates).eq('id', id)

  if (error) {
    console.error(`  FAIL  [${fields.join(', ')}]  —  ${error.message}`)
    process.exit(1)
  }

  console.log(`  OK    [${fields.join(', ')}]`)
  console.log(`\n${'─'.repeat(50)}`)
  console.log('profile_context updated successfully.')
}

main().catch(e => { console.error(e.message); process.exit(1) })
