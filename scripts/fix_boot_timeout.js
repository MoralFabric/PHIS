// Without a deadline the boot load can hang: when Supabase is unreachable the
// requests do not always fail fast, and a visitor sat on the splash for ~30s
// before the offline card appeared. Bound every call so the app commits to an
// answer quickly. A real outage usually errors in well under a second; these
// timeouts only matter for the hang case.
const fs = require('fs');
const file = 'app/page.js';
let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');

function must(find, repl, label) {
  if (!s.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
  s = s.replace(find, repl);
  console.log('ok: ' + label);
}

// helper, defined next to the other top-level utilities
must(
  'export default function App() {',
  `// Reject rather than hang. An unreachable Supabase does not reliably fail
// fast, so every boot call is raced against a deadline.
function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout after ' + ms + 'ms')), ms); }),
  ]).finally(() => clearTimeout(timer));
}

export default function App() {`,
  'withTimeout helper'
);

must(
  `      for(let attempt=0;attempt<2&&!loaded;attempt++){
        try{ loaded=await seedAndGetStories(allBase); }
        catch(e){ if(attempt===0) await new Promise(r=>setTimeout(r,1500)); }
      }`,
  `      for(let attempt=0;attempt<2&&!loaded;attempt++){
        try{ loaded=await withTimeout(seedAndGetStories(allBase), attempt===0?5000:4000); }
        catch(e){ if(attempt===0) await new Promise(r=>setTimeout(r,1000)); }
      }`,
  'bounded story load'
);

must(
  `      const [exp,prof,aw,edu,ctx]=(await Promise.allSettled([
        getExperience(),getProfile(),getAwards(),getEducation(),getProfileContext(),
      ])).map(settle);`,
  `      const [exp,prof,aw,edu,ctx]=(await Promise.allSettled([
        getExperience(),getProfile(),getAwards(),getEducation(),getProfileContext(),
      ].map(p=>withTimeout(p,5000)))).map(settle);`,
  'bounded secondary loads'
);

fs.writeFileSync(file, s.replace(/\n/g, '\r\n'), 'utf8');
console.log('page.js written');
