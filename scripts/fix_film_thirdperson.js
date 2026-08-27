// Three changes.
//
// 1. THIRD PERSON. The narration is a synthetic voice and will not sound like
//    Adam on anyone's machine, so it should stop claiming to be him. Narration
//    and on-screen copy move to third person. The typed lines inside the paste,
//    fill, write and ask scenes stay in first person on purpose: those depict
//    input and output of the product, not the narrator.
// 2. BEST AVAILABLE VOICE. With the narration no longer in Adam's voice, the
//    heavy accent penalty is wrong. Quality leads again, with a mild North
//    American tiebreak rather than a penalty.
// 3. TEMPO. BPM was not the problem. The arpeggio ran in eighths and the pad
//    held one sustained wash per chord, which smooths over the pulse at any
//    tempo. Sixteenths, two pad stabs per chord, and a backbeat on two and four.
const fs = require('fs');
const FILM = 'app/components/PhisFilm.js';

// ── 3. score ──────────────────────────────────────────────
{
  let s = fs.readFileSync(FILM, 'utf8').replace(/\r/g, '');
  const score = fs.readFileSync(process.argv[2], 'utf8').replace(/\r/g, '');
  const a = s.indexOf('// ── score ─');
  const b = s.indexOf('// Voice quality is the visitor');
  if (a < 0 || b < 0 || b < a) { console.error('MISS: score block bounds'); process.exit(1); }
  fs.writeFileSync(FILM, s.slice(0, a) + score + s.slice(b), 'utf8');
  console.log('ok: score replaced');
}

let s = fs.readFileSync(FILM, 'utf8').replace(/\r/g, '');
function must(find, repl, label) {
  if (!s.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
  s = s.replace(find, repl);
  console.log('ok: ' + label);
}

// ── 1. narration to third person ──────────────────────────
must("say: 'So I built a system that does.',", "say: 'So Adam Waldman built a system that does.',", 'say: build');
must("say: 'When there is a gap, I answer it once. The next role that asks already has it.',",
     "say: 'When there is a gap, Adam answers it once. The next role that asks already has it.',", 'say: fill');
must("say: 'Then it writes, in my voice, using only what the record supports.',",
     "say: 'Then it writes, in his own words, using only what the record supports.',", 'say: write');
must("say: 'I designed it. I built it. I shipped it.',",
     "say: 'Adam designed it, built it, and shipped it.',", 'say: made');
must("say: 'I am Adam Waldman, and I turn data into decisions.',",
     "say: 'Adam Waldman turns data into decisions.',", 'say: close');

// ── on-screen copy to third person ────────────────────────
must('<Rise text="So I built a system that does." p={seg(t, 0.05, 0.62)} size={H} />',
     '<Rise text="So Adam Waldman built a system that does." p={seg(t, 0.05, 0.62)} size={H} />', 'screen: build');
must('<Kicker text="So I answer it. Once." p={seg(t, 0, 0.3)} />',
     '<Kicker text="So Adam answers it. Once." p={seg(t, 0, 0.3)} />', 'screen: fill');
// Verb-first keeps the three beat rhythm without needing a pronoun.
must('<Rise text="I designed it. I built it. I shipped it." p={seg(t, 0.02, 0.55)} size={H} />',
     '<Rise text="Designed it. Built it. Shipped it." p={seg(t, 0.02, 0.55)} size={H} />', 'screen: made');
must('<Rise text="Which may be the most honest thing on my resume." p={seg(t, 0.52, 0.78)} size="clamp(13px, 1.8vw, 21px)" color={MARIGOLD} />',
     '<Rise text="Which may be the most honest thing on the resume." p={seg(t, 0.52, 0.78)} size="clamp(13px, 1.8vw, 21px)" color={MARIGOLD} />', 'screen: made sub');
must('<Rise text="I am Adam Waldman" p={seg(t, 0.12, 0.42)} size={H} />',
     '<Rise text="Adam Waldman" p={seg(t, 0.12, 0.42)} size={H} />', 'screen: close name');
must('<Rise text="and I turn data into decisions." p={seg(t, 0.36, 0.68)} size={H} color={MARIGOLD} />',
     '<Rise text="turns data into decisions." p={seg(t, 0.36, 0.68)} size={H} color={MARIGOLD} />', 'screen: close line');

// ── 2. voice: quality first again ─────────────────────────
must(`function scoreVoice(v) {
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
}`,
`function scoreVoice(v) {
  let s = 0
  // Quality leads. The script is third person now, so the narrator is not
  // claiming to be Adam and a polished non-Canadian voice is fine. Accent is
  // kept as a mild tiebreak rather than the penalty it was when the narration
  // was written in the first person.
  if (VOICE_GOOD.test(v.name)) s += 100
  if (VOICE_NAMED.test(v.name)) s += 25
  if (VOICE_DATED.test(v.name)) s -= 40
  if (/en-CA/i.test(v.lang)) s += 14
  else if (/en-US/i.test(v.lang)) s += 10
  else if (VOICE_WRONG_ACCENT.test(v.lang)) s += 2
  if (v.localService === false) s += 8         // cloud voices are usually the better ones
  return s
}`, 'voice: quality first');

fs.writeFileSync(FILM, s, 'utf8');
console.log('wrote ' + FILM);
