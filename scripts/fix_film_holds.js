// Several payoff lines finished revealing at t=0.92 to 0.95, but the scene
// fade out begins at 0.93, so the line a viewer is meant to read was fully
// legible for a fraction of a second. Land every reveal by ~0.8 and hold.
const fs = require('fs');
const f = 'app/components/PhisFilm.js';
let s = fs.readFileSync(f, 'utf8').replace(/\r/g, '');
const edits = [
  ['p={seg(t, 0.45, 0.85)}', 'p={seg(t, 0.45, 0.78)}'],        // premise, second line
  ['p={seg(t, 0.6, 0.95)}',  'p={seg(t, 0.58, 0.8)}'],         // library, closer
  ['p={seg(t, 0.34, 0.94)}', 'p={seg(t, 0.34, 0.9)}'],         // paste, jd lines
  ['p={seg(t, 0.62, 0.95)}', 'p={seg(t, 0.6, 0.82)}'],         // score, closer
  ['p={seg(t, 0.28, 0.95)}', 'p={seg(t, 0.28, 0.9)}'],         // write, resume lines
  ['p={seg(t, 0.32, 0.95)}', 'p={seg(t, 0.32, 0.9)}'],         // ask, answer lines
  ['p={seg(t, 0.54, 0.92)}', 'p={seg(t, 0.52, 0.78)}'],        // made, closer
  ['p={seg(t, 0.1, 0.5)} size={16}', 'p={seg(t, 0.06, 0.3)} size={16}'],  // close, name
  ['p={seg(t, 0.2, 0.7)}',   'p={seg(t, 0.16, 0.5)}'],         // close, tagline
  ['p={seg(t, 0.6, 0.9)}',   'p={seg(t, 0.5, 0.72)}'],         // close, final line
  ['inOut(seg(t, 0.58, 1), 0.22)', 'inOut(seg(t, 0.46, 1), 0.18)'], // close, final line fade
];
let n = 0;
for (const [a, b] of edits) {
  if (!s.includes(a)) { console.error('MISS: ' + a); process.exit(1); }
  s = s.replace(a, b); n++;
}
fs.writeFileSync(f, s, 'utf8');
console.log('applied ' + n + ' timing edits');
