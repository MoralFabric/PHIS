// Diagnose why the app is showing seed data instead of the database.
//
// The app fails quietly by design: seedAndGetStories falls back to the
// hardcoded SEEDS + EXTENDED_SOAR (64 stories) and every other getter returns
// [] on error. So a paused project, a bad key and an RLS gap all look the same
// from the browser: a thin library and blank sections.
//
// Run:  node scripts/check-supabase.js
const fs = require("fs");
const path = require("path");

// Load .env.local without requiring dotenv, matching the other admin scripts.
function loadEnvLocal(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trimStart().startsWith('#')) continue;
    process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvLocal(path.join(__dirname, "..", ".env.local"));

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TABLES = [
  'stories', 'experience', 'profile', 'awards', 'education', 'profile_context',
  'profile_metrics', 'profile_values', 'interview_guidance', 'guest_sessions',
];

async function count(table, key, label) {
  // GET with Range 0-0, not HEAD: PostgREST 404s HEAD requests, which made an
  // earlier version of this script report every table as missing.
  const res = await fetch(`${URL}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  });
  const range = res.headers.get('content-range');
  const n = range ? range.split('/')[1] : '?';
  return { table, label, ok: res.ok, status: res.status, count: n };
}

(async () => {
  if (!URL || !ANON) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
  }
  console.log('Project: ' + URL + '\n');

  // Reachability first. A paused project fails here, before any table matters.
  try {
    const ping = await fetch(`${URL}/rest/v1/`, { headers: { apikey: ANON } });
    console.log('Reachable: yes (HTTP ' + ping.status + ')\n');
  } catch (e) {
    console.log('Reachable: NO -- ' + e.message);
    console.log('\nThis is almost always a PAUSED project. Open the Supabase');
    console.log('dashboard; a paused project shows a Restore banner. Free tier');
    console.log('projects pause automatically after a period of inactivity.');
    console.log('It can also mean NEXT_PUBLIC_SUPABASE_URL is wrong.');
    process.exit(1);
  }

  const pad = s => String(s).padEnd(20);
  console.log(pad('TABLE') + 'ANON'.padEnd(16) + (SERVICE ? 'SERVICE ROLE' : ''));
  console.log('-'.repeat(SERVICE ? 52 : 36));

  const anonFail = [], bothFail = [], rlsSuspect = [];
  for (const t of TABLES) {
    let a, s;
    try { a = await count(t, ANON); } catch (e) { a = { ok: false, status: 'ERR', count: '-' }; }
    if (SERVICE) { try { s = await count(t, SERVICE); } catch (e) { s = { ok: false, status: 'ERR', count: '-' }; } }

    const acell = (a.ok ? a.count + ' rows' : 'FAIL ' + a.status).padEnd(16);
    const scell = s ? (s.ok ? s.count + ' rows' : 'FAIL ' + s.status) : '';
    console.log(pad(t) + acell + scell);

    if (!a.ok) anonFail.push(t);
    if (s && !s.ok && !a.ok) bothFail.push(t);
    // Readable with the service role but empty or refused with anon = RLS.
    if (s && s.ok && (!a.ok || (Number(s.count) > 0 && Number(a.count) === 0))) rlsSuspect.push(t);
  }

  console.log('\n--- reading ---');
  if (rlsSuspect.length) {
    console.log('RLS is blocking anon on: ' + rlsSuspect.join(', '));
    console.log('The rows exist; the anon key cannot see them. Add a policy.');
    console.log('scripts/migration_004_metrics_values_guidance.sql does this for');
    console.log('profile_metrics, profile_values and interview_guidance.');
  }
  if (bothFail.length) {
    console.log('Missing or inaccessible to both keys: ' + bothFail.join(', '));
    console.log('These tables likely do not exist. Run the migrations in scripts/.');
  }
  if (!rlsSuspect.length && !bothFail.length && !anonFail.length) {
    console.log('All tables readable with the anon key.');
    console.log('If the deployed site still shows 64 stories, the browser is not');
    console.log('getting these values: check NEXT_PUBLIC_SUPABASE_URL and');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY in the Vercel project settings,');
    console.log('then redeploy. NEXT_PUBLIC_ vars are baked in at build time, so');
    console.log('changing them requires a new deploy to take effect.');
  }
  console.log('\nNote: 64 stories in the app means the local SEEDS + EXTENDED_SOAR');
  console.log('fallback is rendering, not the database.');
})();
