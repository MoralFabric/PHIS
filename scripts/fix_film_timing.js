// Elements were double windowed: a sub range fade in AND their own fade out,
// which made kickers and closing lines vanish mid scene. Now elements only
// arrive; the player applies a single fade out across the whole scene.
const fs = require('fs');
const f = 'app/components/PhisFilm.js';
let s = fs.readFileSync(f, 'utf8').replace(/\r/g, '');
const before = s;

s = s.replace(
  "// Fade in at the head of a scene, back out at the tail.\nconst inOut = (t, up = 0.12, down = 0.88) => Math.min(easeOut(seg(t, 0, up)), 1 - easeOut(seg(t, down, 1)))",
  "// Fade an element in at its own pace. Scene level fade out is applied once by\n// the player, so an element only ever has to arrive, never to leave.\nconst inOut = (t, up = 0.12) => easeOut(seg(t, 0, up))"
);

// Drop the now unused fade out argument at every call site.
s = s.replace(/inOut\(seg\(t, ([\d.]+), ([\d.]+)\), ([\d.]+), ([\d.]+)\)/g, 'inOut(seg(t, $1, $2), $3)');
s = s.replace(/inOut\(t, ([\d.]+), ([\d.]+)\)/g, 'inOut(t, $1)');

// Kicker held its own fade out too.
s = s.replace(
  "  const o = still ? 1 : inOut(p, 0.2, 0.85)",
  "  const o = still ? 1 : easeOut(p)"
);

// Scene level envelope in the player.
s = s.replace(
  "        {scene && scene.render(t)}",
  "        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: reduced ? 1 : Math.min(easeOut(seg(rawT, 0, 0.07)), 1 - easeOut(seg(rawT, 0.93, 1))) }}>\n          {scene && scene.render(t)}\n        </div>"
);

if (s === before) { console.error('no changes applied'); process.exit(1); }
fs.writeFileSync(f, s, 'utf8');
console.log('remaining 3-arg inOut calls:', (s.match(/inOut\([^)]*,[^)]*,[^)]*\)/g) || []).length);
console.log('scene envelope:', s.includes('1 - easeOut(seg(rawT, 0.93, 1))'));
console.log('kicker fixed:', s.includes('const o = still ? 1 : easeOut(p)'));
