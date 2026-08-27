// Adam is in Toronto and the narration was coming out British.
//
// Three separate paths led there:
//   1. en-GB scored +6 and en-US scored nothing, so "Google UK English Male"
//      outranked "Google US English" in Chrome.
//   2. The neural bonus was +100 against a locale bonus of +12, so on Edge any
//      "Online (Natural)" British voice beat every Canadian one.
//   3. The preferred-names list contained daniel, oliver, arthur and matilda,
//      which are British and Australian.
//
// Canadian English sits with General American, not with Received Pronunciation,
// so accent is weighted heavily now: en-CA first, en-US close behind, and every
// other English locale actively penalised. Quality still matters, but it can no
// longer buy its way past a wrong accent.
const fs = require('fs');
const file = 'app/components/PhisFilm.js';
let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');

function must(find, repl, label) {
  if (!s.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
  s = s.replace(find, repl);
  console.log('ok: ' + label);
}

const OLD = `const VOICE_GOOD = /natural|neural|online|premium|enhanced|siri/i
const VOICE_NAMED = /\\b(daniel|alex|samantha|serena|oliver|arthur|matilda|guy|ryan|aria|jenny|christopher)\\b/i
const VOICE_DATED = /\\b(david|zira|mark|hazel|george|susan|linda|eva|catherine|james)\\b/i

function scoreVoice(v) {
  let s = 0
  if (VOICE_GOOD.test(v.name)) s += 100
  if (VOICE_NAMED.test(v.name)) s += 45
  if (VOICE_DATED.test(v.name)) s -= 40
  if (/en-CA/i.test(v.lang)) s += 12          // Adam is in Toronto
  else if (/en-GB/i.test(v.lang)) s += 6
  else if (/en-AU|en-IE/i.test(v.lang)) s += 3
  if (v.localService === false) s += 8         // cloud voices are usually the better ones
  return s
}`;

const NEW = `const VOICE_GOOD = /natural|neural|online|premium|enhanced|siri/i
// North American given names only. Daniel, Oliver, Arthur and Matilda are
// British or Australian and were part of how the narration ended up British.
const VOICE_NAMED = /\\b(liam|clara|alex|samantha|tom|guy|andrew|brian|christopher|eric|roger|steffan|davis|jenny|aria|michelle|ana)\\b/i
const VOICE_DATED = /\\b(david|zira|mark|hazel|george|susan|linda|eva|catherine|james)\\b/i
// Anything that is audibly not North American.
const VOICE_WRONG_ACCENT = /en-GB|en-AU|en-IE|en-ZA|en-IN|en-NZ/i
const VOICE_WRONG_NAME = /\\b(daniel|oliver|arthur|matilda|ryan|libby|maisie|thomas|hollie|natasha|william|neerja)\\b/i

function scoreVoice(v) {
  let s = 0
  if (VOICE_GOOD.test(v.name)) s += 100
  if (VOICE_NAMED.test(v.name)) s += 25
  if (VOICE_DATED.test(v.name)) s -= 40
  // Accent is weighted above quality on purpose. A polished British voice
  // reading Adam's words in the first person is worse than a plainer
  // Canadian one, because the whole piece is him speaking.
  if (/en-CA/i.test(v.lang)) s += 60
  else if (/en-US/i.test(v.lang)) s += 45
  else if (VOICE_WRONG_ACCENT.test(v.lang)) s -= 50
  if (VOICE_WRONG_NAME.test(v.name)) s -= 50   // some voices carry the accent in the name only
  if (v.localService === false) s += 8         // cloud voices are usually the better ones
  return s
}`;

must(OLD, NEW, 'accent-first voice scoring');

// The picker stripped the locale out of the label, so there was no way to see
// which entry was Canadian and which was British.
must(
  `              <option key={v.voiceURI} value={v.voiceURI} style={{ background: NAVY }}>
                {v.name.replace(/ - English.*$/, '').replace(/^Microsoft /, '')}
              </option>`,
  `              <option key={v.voiceURI} value={v.voiceURI} style={{ background: NAVY }}>
                {v.name.replace(/ - English.*$/, '').replace(/^Microsoft /, '').replace(/ Online \\(Natural\\)/, '')}
                {' '}({(v.lang.split(/[-_]/)[1] || 'EN').toUpperCase()})
              </option>`,
  'show accent in the picker'
);

// Widen the select a little now that it carries a locale tag.
must("padding: '5px 6px', maxWidth: 150, cursor: 'pointer' }}", "padding: '5px 6px', maxWidth: 170, cursor: 'pointer' }}", 'picker width');

fs.writeFileSync(file, s, 'utf8');
console.log('wrote ' + file);
