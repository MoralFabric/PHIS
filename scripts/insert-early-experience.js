// Insert and verify early/additional experience, SOAR story, and color stories.
// Idempotent: uses upsert throughout. Safe to re-run.
//
// Usage: node scripts/insert-early-experience.js

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

// ── helpers ──────────────────────────────────────────────────────────────────

function ok(label) { console.log('  OK    ' + label) }
function fail(label, msg) { console.error('  FAIL  ' + label + '  --  ' + msg) }

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {

  // ── 0. Survey existing experience ────────────────────────────────────────
  console.log('\n=== Existing experience rows (before changes) ===')
  const { data: existing, error: existErr } = await supabase
    .from('experience')
    .select('id, role, org, dates, sort_order')
  if (existErr) { console.error('Query failed:', existErr.message); process.exit(1) }
  existing.forEach(e => {
    console.log(`  ${String(e.id).padEnd(36)} | ${String(e.sort_order ?? 'null').padEnd(5)} | ${e.dates} | ${e.role} @ ${e.org}`)
  })

  // Find the Australia entry by keyword
  const australiaEntry = existing.find(e =>
    (e.role || '').toLowerCase().includes('australia') ||
    (e.org  || '').toLowerCase().includes('australia') ||
    (e.role || '').toLowerCase().includes('entrepreneur') && (e.org || '').toLowerCase().includes('australia')
  )
  // Fallback: any entry not in our known main set
  const knownMain = new Set(['exp_001','exp_002','exp_003','exp_004','exp_005','exp_006','exp_early_tutoring_business','exp_early_forest_hill_academy'])
  const unknownEntries = existing.filter(e => !knownMain.has(e.id))

  console.log('\nAustralia / entrepreneur entry search:')
  if (australiaEntry) {
    console.log(`  Found: id=${australiaEntry.id}  role="${australiaEntry.role}"  org="${australiaEntry.org}"  dates="${australiaEntry.dates}"`)
  } else if (unknownEntries.length > 0) {
    console.log('  Not found by keyword. Unknown (non-main) entries:')
    unknownEntries.forEach(e => console.log(`    id=${e.id}  role="${e.role}"  org="${e.org}"  dates="${e.dates}"`))
  } else {
    console.log('  Not found. No entries outside known set.')
  }

  // ── 1. Set canonical sort_order on main career entries (1-6) ─────────────
  console.log('\n=== Setting sort_order on main career entries ===')
  const mainOrder = [
    { id: 'exp_001', n: 1 },
    { id: 'exp_002', n: 2 },
    { id: 'exp_003', n: 3 },
    { id: 'exp_004', n: 4 },
    { id: 'exp_005', n: 5 },
    { id: 'exp_006', n: 6 },
  ]
  for (const { id, n } of mainOrder) {
    const { error } = await supabase.from('experience').update({ sort_order: n }).eq('id', id)
    if (error) fail(`sort_order=${n} on ${id}`, error.message)
    else ok(`sort_order=${n}  ${id}`)
  }

  // ── 2. Update Australia entry: dates = "2005", sort_order = 90 ───────────
  console.log('\n=== Updating Australia / Entrepreneur entry ===')
  const targetEntry = australiaEntry || (unknownEntries.length === 1 ? unknownEntries[0] : null)
  if (targetEntry) {
    const { error } = await supabase
      .from('experience')
      .update({ dates: '2005', sort_order: 90 })
      .eq('id', targetEntry.id)
    if (error) fail(`Australia update (${targetEntry.id})`, error.message)
    else ok(`dates=2005, sort_order=90  ${targetEntry.id}  "${targetEntry.role}"`)
  } else {
    console.log('  Skipped: could not identify Australia entry unambiguously')
    console.log('  If there is exactly one non-main entry in the table above, re-run after reviewing')
  }

  // ── 3. Upsert Step 2A: Additional / early experience ─────────────────────
  console.log('\n=== Upserting Step 2A: additional/early experience ===')

  const newExp = [
    {
      id:               'exp_early_tutoring_business',
      role:             'Co-Founder',
      org:              'Hart Waldman Tutoring Network',
      dates:            '2007-2010',
      scope:            'Toronto, ON',
      mandate:          '',
      responsibilities: [],
      bullets: [
        'Co-founded a tutoring business; personally taught Math, Physics, Business, and Economics while a partner covered Chemistry, Biology, and English',
        'Generated demand through school and library advertising and referrals',
        'Turned overflow into revenue: interviewed and approved external tutors into a managed network, posted opportunities, and sold leads the business could not service for capacity, timing, or location reasons at about 100 dollars each, avoiding billing and payroll overhead',
        'Raised the rate to 300 dollars per hour for a university-student-only client base in the final year, then exited as the State Street career took off',
      ],
      themes:         ['Entrepreneurship', 'Commercial Mindset', 'Marketplace and Lead Generation', 'Teaching'],
      full_narrative: '',
      facets:         [],
      sort_order:     91,
    },
    {
      id:               'exp_early_forest_hill_academy',
      role:             'Teacher',
      org:              'Forest Hill Academy',
      dates:            '2006-2008',
      scope:            'Forest Hill, Toronto, ON',
      mandate:          '',
      responsibilities: [],
      bullets: [
        'Taught Calculus, Economics, Statistics, Algebra, Geometry, Physics, and one Entrepreneurship course at a private credit-granting high school',
        'Worked in small classes of one to five students, adapting instruction to individual pace',
        'First engaged by the owner for tutoring while at university, then joined as a teacher when she launched the school',
      ],
      themes:         ['Teaching', 'Quantitative Subjects', 'Communication'],
      full_narrative: '',
      facets:         [],
      sort_order:     92,
    },
  ]

  for (const e of newExp) {
    const { error } = await supabase.from('experience').upsert(e)
    if (error) fail(e.id, error.message)
    else ok(e.id + '  "' + e.role + '"  sort_order=' + e.sort_order)
  }

  // ── 4. Upsert Step 2B: SOAR story ────────────────────────────────────────
  console.log('\n=== Upserting Step 2B: SOAR story ===')

  const froshStory = {
    id:         'soar_early_frosh_sponsorship',
    type:       'career',
    title:      'Building a Sponsorship Function for University Frosh Week from Nothing',
    employer:   'University of Toronto, University College',
    situation:  'As a Frosh Week organizer, sponsorship was not a real function. Frosh fees were borne largely by incoming students and kits were thin.',
    obstacle:   'No existing sponsorship process, contacts, or playbook existed to build on.',
    action:     'Served as a Frosh leader in second year, then joined the Frosh Week executive team responsible for sponsorship in third and fourth year. Built the sponsorship function effectively from inception. Sourced and closed cash and in-kind sponsorship.',
    result:     'Generated over 100,000 dollars in cash sponsorship. Added significant swag and rewards into frosh kits. Lowered frosh fees by 20 percent in the fourth year.',
    impact:     '',
    full_story: 'As a Frosh Week organizer at University College, U of T, I identified that sponsorship was an untapped revenue source. Starting from nothing - no contacts, no process, no playbook - I built the sponsorship function from inception. Serving on the Frosh Week executive team in third and fourth year, I sourced and closed cash and in-kind sponsorship. We generated over 100,000 dollars in cash sponsorship, enriched frosh kits with swag and rewards, and lowered frosh fees by 20 percent in the fourth year.',
    themes:     ['Business Development', 'Building from Inception', 'Commercial Mindset', 'Early Leadership'],
    skills:     ['Business Development', 'Sponsorship', 'Commercial Mindset', 'Building from Scratch'],
    use_for:    ['Interview', 'Book'],
    notes:      'Dates: 2002-2004. University of Toronto, University College. Available to interview and book engines.',
    date_added: '2002',
  }

  const { error: froshErr } = await supabase.from('stories').upsert(froshStory)
  if (froshErr) fail('soar_early_frosh_sponsorship', froshErr.message)
  else ok('soar_early_frosh_sponsorship  "' + froshStory.title + '"')

  // ── 5. Upsert Step 2C: color stories ─────────────────────────────────────
  console.log('\n=== Upserting Step 2C: color stories (interview/book only) ===')

  const colorStories = [
    {
      id:         'recognition_toronto_star_stock',
      type:       'career',
      title:      'Second Place, Toronto Star Stock Market Competition (Grade 11)',
      employer:   'Toronto Star',
      situation:  'Grade 11 stock market competition.',
      obstacle:   '',
      action:     'Allocated an imaginary 100,000 dollars across sectors, one stock per sector. Concentrated about 80 percent in Nortel on name recognition.',
      result:     'Placed second.',
      impact:     '',
      full_story: 'Placed second in a Toronto Star grade 11 stock market competition, allocating an imaginary 100,000 dollars across sectors, one stock per sector. Concentrated about 80 percent in Nortel on name recognition. A self-aware story about luck versus skill, not a credential.',
      themes:     ['Commercial Mindset', 'Early Leadership'],
      skills:     [],
      use_for:    ['Interview', 'Book'],
      notes:      'Year: 1999. Color item - interview and book only. Not a profile credential.',
      date_added: '1999',
    },
    {
      id:         'exp_early_telemarketing',
      type:       'career',
      title:      'Early Telephone Work (Telemarketing and Customer Surveys)',
      employer:   'Xentel; Consumer Contact',
      situation:  'Early work starting at sixteen in telephone roles.',
      obstacle:   '',
      action:     'Telemarketing at Xentel and customer satisfaction surveys at Consumer Contact.',
      result:     'Formative experience in persuasion and handling rejection.',
      impact:     '',
      full_story: 'Early telephone work starting at sixteen: telemarketing at Xentel and customer satisfaction surveys at Consumer Contact. Formative experience in persuasion and handling rejection.',
      themes:     ['Communication', 'Resilience', 'Early Leadership'],
      skills:     ['Persuasion', 'Communication'],
      use_for:    ['Interview', 'Book'],
      notes:      'Dates: 1998-2000. Color item - interview and book only. Not a profile credential.',
      date_added: '1998',
    },
    {
      id:         'exp_early_canada_trust_coop',
      type:       'career',
      title:      'Bank Teller Co-op (Grade 11)',
      employer:   'Canada Trust',
      situation:  'Grade 11 co-op placement for one semester.',
      obstacle:   '',
      action:     'Worked as a bank teller.',
      result:     'Earliest exposure to financial services.',
      impact:     '',
      full_story: 'Grade 11 co-op as a bank teller for one semester. Earliest exposure to financial services.',
      themes:     ['Financial Services', 'Early Leadership'],
      skills:     [],
      use_for:    ['Interview', 'Book'],
      notes:      'Year: 1999. Color item - interview and book only. Not a profile credential.',
      date_added: '1999',
    },
  ]

  for (const s of colorStories) {
    const { error } = await supabase.from('stories').upsert(s)
    if (error) fail(s.id, error.message)
    else ok(s.id + '  "' + s.title + '"')
  }

  // ── 6. Verify: query back new rows ───────────────────────────────────────
  console.log('\n=== Verification: all experience rows (sorted) ===')
  const { data: allExp, error: allExpErr } = await supabase
    .from('experience')
    .select('id, role, org, dates, sort_order')
    .order('sort_order', { ascending: true })
  if (allExpErr) { console.error('Verify query failed:', allExpErr.message) }
  else {
    allExp.forEach(e => {
      console.log(`  ${String(e.sort_order ?? 'null').padEnd(5)} | ${String(e.id).padEnd(36)} | ${e.dates} | ${e.role} @ ${e.org}`)
    })
  }

  console.log('\n=== Verification: new SOAR + color stories ===')
  const newIds = ['soar_early_frosh_sponsorship','recognition_toronto_star_stock','exp_early_telemarketing','exp_early_canada_trust_coop']
  const { data: newStories, error: nsErr } = await supabase
    .from('stories')
    .select('id, title, employer, use_for, date_added, notes')
    .in('id', newIds)
  if (nsErr) console.error('Stories verify failed:', nsErr.message)
  else console.log(JSON.stringify(newStories, null, 2))

  console.log('\nDone.')
}

main().catch(e => { console.error(e); process.exit(1) })
