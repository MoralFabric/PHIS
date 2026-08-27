// Restructure: the film is about PHIS, and Adam arrives at the end.
//
// Adam's name previously landed in scene two, before the viewer knew what PHIS
// was, and recurred through the middle. That asks a stranger to care about him
// before giving them a reason to, and it makes the "no agency, no dev team"
// beat read as a running boast rather than as a reveal.
//
// Now: scenes 1 to 10 are the product with no named person at all. Scene 11
// says nobody was hired to build it, scene 12 narrows it to one person, and
// scene 13 names who. The viewer draws the conclusion instead of being told it.
const fs = require('fs');
const file = 'app/components/PhisFilm.js';
let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');

function must(find, repl, label) {
  if (!s.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
  s = s.replace(find, repl);
  console.log('ok: ' + label);
}

// scene 2: no name this early
must("say: 'So Adam Waldman built a system that does.',",
     "say: 'So here is one that does.',", 'say: build');
must('<Rise text="So Adam Waldman built a system that does." p={seg(t, 0.05, 0.62)} size={H} />',
     '<Rise text="So here is one that does." p={seg(t, 0.05, 0.62)} size={H} />', 'screen: build');

// scene 7: keep the gap loop about the system
must("say: 'When there is a gap, Adam answers it once. The next role that asks already has it.',",
     "say: 'A gap gets answered once. The next role that asks already has it.',", 'say: fill');
must('<Kicker text="So Adam answers it. Once." p={seg(t, 0, 0.3)} />',
     '<Kicker text="So the gap gets answered. Once." p={seg(t, 0, 0.3)} />', 'screen: fill');

// scene 9: "his" has no referent before the reveal
must("say: 'Then it writes, in his own words, using only what the record supports.',",
     "say: 'Then it writes, using only what the record supports.',", 'say: write');

// scene 12: narrow to one person, and drop the self-congratulation
must("say: 'Adam designed it, built it, and shipped it.',",
     "say: 'Designed, built and shipped by one person.',", 'say: made');
must('<Rise text="Which may be the most honest thing on the resume." p={seg(t, 0.52, 0.78)} size="clamp(13px, 1.8vw, 21px)" color={MARIGOLD} />',
     '<Rise text="By one person." p={seg(t, 0.52, 0.78)} size={H2} color={MARIGOLD} />', 'screen: made sub');

fs.writeFileSync(file, s, 'utf8');
console.log('wrote ' + file);

// Report the resulting arc so the restructure is visible at a glance.
const says = [...s.matchAll(/say: '([^']+)'/g)].map(m => m[1]);
console.log('\nnarration arc:');
says.forEach((l, i) => console.log('  ' + String(i + 1).padStart(2) + '. ' + l));
const named = says.filter(l => /Adam/.test(l));
console.log('\nlines naming Adam: ' + named.length + '  ' + JSON.stringify(named));
