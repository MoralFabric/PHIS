// 1. THE FIRST REEL USED A DIFFERENT VOICE. Chrome populates getVoices()
//    asynchronously. The mount effect returns early on an empty list, so
//    voiceURI was still null when the film autoplayed. Scene one spoke via
//    pickVoice(null), which falls back to listVoices()[0] computed from
//    whatever partial list existed at that instant. onvoiceschanged then fired,
//    voiceURI was set, and every later scene used a different voice. Gate
//    narration on voiceURI: it is already an effect dependency, so the line
//    speaks as soon as the list settles.
//
// 2. VOICE QUALITY. Accent went back to a mild tiebreak when the script moved
//    to third person, and the result was worse. Adam has now twice rejected a
//    non-North-American voice, so the preference is restored with weight,
//    while neural still leads overall. Remote voices get a bigger bump because
//    they are consistently better than the legacy local SAPI set.
const fs = require('fs');
const file = 'app/components/PhisFilm.js';
let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');

function must(find, repl, label) {
  if (!s.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
  s = s.replace(find, repl);
  console.log('ok: ' + label);
}

must(
  `    if (typeof window === 'undefined' || !window.speechSynthesis) return
    spoken.current.add(scene.id)`,
  `    if (typeof window === 'undefined' || !window.speechSynthesis) return
    // Wait for the voice list to settle. Chrome fills it asynchronously, and
    // speaking before it lands gave the first scene a different voice from the
    // rest of the film. voiceURI is a dependency, so this re-runs and speaks
    // as soon as the list arrives.
    if (!voiceURI) return
    spoken.current.add(scene.id)`,
  'gate narration on a settled voice list'
);

must(
  `  if (/en-CA/i.test(v.lang)) s += 14
  else if (/en-US/i.test(v.lang)) s += 10
  else if (VOICE_WRONG_ACCENT.test(v.lang)) s += 2
  if (v.localService === false) s += 8         // cloud voices are usually the better ones`,
  `  // North American with weight. Adam has rejected a non-North-American
  // narrator twice, so this outranks a modest quality edge, though a genuinely
  // neural voice (+100) can still win across locales.
  if (/en-CA/i.test(v.lang)) s += 45
  else if (/en-US/i.test(v.lang)) s += 38
  else if (VOICE_WRONG_ACCENT.test(v.lang)) s -= 25
  // Remote voices are consistently better than the legacy local SAPI set.
  if (v.localService === false) s += 22`,
  'north american preference with weight'
);

fs.writeFileSync(file, s, 'utf8');
console.log('wrote ' + file);
