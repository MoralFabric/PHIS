// Applies field-level patches to the education table.
// Reads patch_education.json from the project root.
//
// Patch file format:
//   [ { "id": "uuid", "updates": { "field": "new value", ... } }, ... ]
//
// Usage: node scripts/apply-education-patch.js

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
const patchPath = path.join(__dirname, '..', 'patch_education.json')

let patches
try {
  patches = JSON.parse(fs.readFileSync(patchPath, 'utf8'))
} catch (e) {
  console.error('Failed to read patch_education.json:', e.message)
  process.exit(1)
}

if (!Array.isArray(patches) || patches.length === 0) {
  console.error('patch_education.json must be a non-empty array of { id, updates } objects')
  process.exit(1)
}

console.log(`Patch file : patch_education.json`)
console.log(`Patches    : ${patches.length}\n`)
console.log('Planned operations:')
for (const p of patches) {
  console.log(`  UPDATE education SET { ${Object.keys(p.updates).join(', ')} } WHERE id = '${p.id}'`)
}
console.log()

async function main() {
  const results = []

  for (const { id, updates } of patches) {
    const { error } = await supabase.from('education').update(updates).eq('id', id)
    if (error) {
      console.error(`  FAIL  ${id}  [${Object.keys(updates).join(', ')}]  —  ${error.message}`)
      results.push({ id, ok: false, error: error.message })
    } else {
      console.log(`  OK    ${id}  [${Object.keys(updates).join(', ')}]`)
      results.push({ id, ok: true })
    }
  }

  const ok   = results.filter(r => r.ok).length
  const fail = results.filter(r => !r.ok).length
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Attempted : ${results.length}   OK : ${ok}   Failed : ${fail}`)

  if (fail > 0) process.exit(1)
}

main().catch(e => { console.error(e.message); process.exit(1) })
