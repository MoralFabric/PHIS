// Retiring the duplicate Ben story cleared its use_for, but use_for is only an
// opt-out for resume and cover letter generation. AskView and InterviewView
// deliberately keep the full library, so the retired copy was still being sent
// to the interview model, carrying the OLD framing of the exact story Adam
// asked to have reframed. Two near-identical entries, one corrected and one
// not, and nothing to stop the model picking the wrong one.
//
// Filter retired entries out of the interview and ask context, mirroring the
// existing isGenerationBlocked / generationStories pattern.
const fs = require('fs');
const file = 'app/page.js';
let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');

function must(find, repl, label, count) {
  const n = s.split(find).length - 1;
  if (n !== (count || 1)) { console.error('MISS: ' + label + ' (found ' + n + ')'); process.exit(1); }
  s = s.split(find).join(repl);
  console.log('ok: ' + label + ' x' + n);
}

// helper next to the other generation guards
must(
  'function isGenerationBlocked(',
  `// Retired entries are kept rather than deleted, per the library convention,
// but they must not reach any AI surface. use_for does not cover this: it is
// only consulted by resume and cover letter generation.
function isRetired(story) {
  const n = String((story && story.notes) || '').trimStart();
  return /^RETIRED\\b/i.test(n) || /^\\s*RETIRED as a duplicate/i.test(n);
}

function liveStories(list) {
  return (list || []).filter(s => !isRetired(s));
}

function isGenerationBlocked(`,
  'isRetired helper'
);

// both interview-facing context builders
must(
  'const ctx=stories.map(s=>`STORY: ${s.title}',
  'const ctx=liveStories(stories).map(s=>`STORY: ${s.title}',
  'AskView context'
);
must(
  '      const ctx = stories.map(s =>\n        `STORY: ${s.title}',
  '      const ctx = liveStories(stories).map(s =>\n        `STORY: ${s.title}',
  'InterviewView context'
);

fs.writeFileSync(file, s.replace(/\n/g, '\r\n'), 'utf8');
console.log('wrote ' + file);
