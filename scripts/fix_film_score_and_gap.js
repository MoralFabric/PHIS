// Two changes:
//  1. Replace the pentatonic arpeggio score. Minor pentatonic played as
//     decaying plucks reads as chinoiserie; this is major key and uplifting.
//  2. Add the missing product beat: a gap gets answered once, the answer
//     joins the library, and the library compounds.
const fs = require('fs');
const f = 'app/components/PhisFilm.js';
let s = fs.readFileSync(f, 'utf8').replace(/\r/g, '');
const score = fs.readFileSync(process.argv[2], 'utf8').replace(/\r/g, '');
const scenes = fs.readFileSync(process.argv[3], 'utf8').replace(/\r/g, '');

// 1. swap the whole score block, start marker through the next section
const START = '// \u2500\u2500 score \u2500';
const END = '// Voice quality is the visitor';
const a = s.indexOf(START);
const b = s.indexOf(END);
if (a < 0 || b < 0 || b < a) { console.error('MISS: score block bounds'); process.exit(1); }
s = s.slice(0, a) + score + s.slice(b);
console.log('ok: score replaced');

// 2. insert the two new scenes between the score and write scenes
const ANCHOR = "    {\n      id: 'write', dur: 6400,";
if (!s.includes(ANCHOR)) { console.error('MISS: write scene anchor'); process.exit(1); }
s = s.replace(ANCHOR, scenes + ANCHOR);
console.log('ok: fill + compound scenes inserted');

fs.writeFileSync(f, s, 'utf8');

// report the new runtime
const durs = [...s.matchAll(/dur: (\d+)/g)].map(m => +m[1]);
const total = durs.reduce((x, y) => x + y, 0);
console.log('scenes: ' + durs.length + ', runtime: ' + Math.floor(total / 60000) + ':' + String(Math.round(total / 1000) % 60).padStart(2, '0'));
