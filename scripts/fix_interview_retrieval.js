// Two fixes.
//
// 1. INTERVIEW RETRIEVAL. Asked about a stakeholder conflict, the interview AI
//    reached past "Standing Up to the Head of Risk" (themes: Ethical Judgment,
//    Political Navigation, Resilience) and stretched the 25% reduction story
//    instead. Two causes: themes and skills were stripped out of the story
//    context entirely, so capability matching was impossible, and nothing told
//    the model to select on capability rather than on scale.
//
// 2. METRICS SILENT FAILURE. createMetric returned null on error and handleAdd
//    did `if (row) setMetrics(...)`, so a failed insert did nothing at all: no
//    row, no message. Combined with getMetrics returning [] on error, a missing
//    table or an RLS policy gap looked like an empty list rather than a fault.
//
// Written with the Write tool, not a heredoc: bash collapses the `\\n` escapes
// these search strings depend on. See the CRLF gotcha in CLAUDE.md.
const fs = require('fs');

function edit(file, pairs, crlf) {
  let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  for (const [find, repl, expected, label] of pairs) {
    const n = s.split(find).length - 1;
    if (n !== expected) {
      console.error('MISS: ' + label + ' (found ' + n + ', expected ' + expected + ')');
      process.exit(1);
    }
    s = s.split(find).join(repl);
    console.log('ok: ' + label + ' x' + n);
  }
  fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s, 'utf8');
  console.log('wrote ' + file);
}

const SELECT_RULE = 'SELECTING THE RIGHT STORY: Before you write anything, name to yourself the capability the question is actually testing. Then scan the THEMES and SKILLS lines of every story for that capability, and pick the story that matches it most directly. Do not default to the biggest or most familiar story in the library. A story about a large transformation is not an answer to a question about courage, conflict, or judgment simply because it is impressive. If a story\'s title or themes speak directly to what was asked, use that one.';

edit('app/page.js', [
  // 1a. surface themes and skills so capability matching is possible at all
  [
    'STORY: ${s.title} (${s.employer})\\n${s.fullStory',
    'STORY: ${s.title} (${s.employer})\\nTHEMES: ${(s.themes||[]).join(", ")||"none recorded"}\\nSKILLS: ${(s.skills||[]).join(", ")||"none recorded"}\\n${s.fullStory',
    2,
    'themes and skills in story context',
  ],
  // 1b. select on capability, stated before the grounding prohibitions
  [
    'PROHIBITED — NAMES:',
    SELECT_RULE + '\n\nPROHIBITED — NAMES:',
    2,
    'story selection rule',
  ],
  // 2a. error state for the metrics manager
  [
    '  const [newRow, setNewRow] = useState({ value: "", label: "", pinned: false });\n  const [saving, setSaving] = useState(false);',
    '  const [newRow, setNewRow] = useState({ value: "", label: "", pinned: false });\n  const [saving, setSaving] = useState(false);\n  const [err, setErr] = useState("");',
    1,
    'metrics error state',
  ],
  // 2b. surface a failed insert instead of swallowing it
  [
    '    const row = await createMetric({ ...newRow, sort_order: maxOrder + 1, tags: [] });\n    if (row) setMetrics(m => [...m, row]);\n    setAdding(false);\n    setNewRow({ value: "", label: "", pinned: false });\n    setSaving(false);',
    '    const res = await createMetric({ ...newRow, sort_order: maxOrder + 1, tags: [] });\n    setSaving(false);\n    if (res.error) { setErr(res.error); return; }   // keep the form open so the input is not lost\n    setMetrics(m => [...m, res.row]);\n    setErr("");\n    setAdding(false);\n    setNewRow({ value: "", label: "", pinned: false });',
    1,
    'metrics add error handling',
  ],
  // 2c. show the error, and explain an empty list rather than leaving it blank
  [
    '      {adding ? (\n        <div style={{ ...row0, marginTop: 5 }}>',
    '      {err && (\n        <div style={{ marginTop: 8, padding: "9px 11px", borderRadius: 5, background: "#FDF2F2", border: "0.5px solid #E4B9B9", fontSize: 12, color: "#A32D2D", lineHeight: 1.5 }}>\n          Could not save: {err}\n          <div style={{ marginTop: 4, color: "var(--phis-slate)" }}>If this says the table is missing or permission was denied, run scripts/migration_004_metrics_values_guidance.sql in the Supabase SQL editor.</div>\n        </div>\n      )}\n      {!err && metrics.length === 0 && (\n        <div style={{ marginTop: 8, padding: "9px 11px", borderRadius: 5, background: "var(--phis-stone)", fontSize: 12, color: "var(--phis-slate)", lineHeight: 1.5 }}>\n          No metrics yet. If you expected some here, the profile_metrics table may be missing or blocked by RLS: run scripts/migration_004_metrics_values_guidance.sql in the Supabase SQL editor.\n        </div>\n      )}\n      {adding ? (\n        <div style={{ ...row0, marginTop: 5 }}>',
    1,
    'metrics error and empty-state UI',
  ],
], true);

edit('lib/data.js', [
  [
    "  if (error) { console.error('createMetric', error); return null; }\n  return data;",
    "  // Return the failure rather than null so the caller can show it. A silent\n  // null here is what made a blocked insert look like nothing happening.\n  if (error) { console.error('createMetric', error); return { error: error.message || 'Insert failed' }; }\n  return { row: data };",
    1,
    'createMetric returns its error',
  ],
], false);
