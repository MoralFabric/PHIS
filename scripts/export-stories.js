// Exports all rows from the stories table to soar_export_for_review.json at the project root.
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local to bypass RLS.

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

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function main() {
  let allStories = []
  let page = 0
  const PAGE_SIZE = 1000

  while (true) {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .order('id')

    if (error) {
      console.error('Failed to fetch stories:', error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) break
    allStories = allStories.concat(data)
    if (data.length < PAGE_SIZE) break
    page++
  }

  const outPath = path.join(__dirname, '..', 'soar_export_for_review.json')
  fs.writeFileSync(outPath, JSON.stringify(allStories, null, 2), 'utf8')

  console.log(`Exported ${allStories.length} stories to soar_export_for_review.json`)
}

main().catch(e => { console.error(e); process.exit(1) })
