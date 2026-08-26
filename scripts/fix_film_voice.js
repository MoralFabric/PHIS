// Voice selection was matching exact names, which never hit on Windows or Edge
// (real names look like "Microsoft Guy Online (Natural) - English (US)"), so it
// fell through to pool[0] and landed on Microsoft David. Score instead, and let
// the viewer override.
const fs = require('fs');
const f = 'app/components/PhisFilm.js';
let s = fs.readFileSync(f, 'utf8').replace(/\r/g, '');
const picker = fs.readFileSync(process.argv[2], 'utf8').replace(/\r/g, '').trim();

function must(a, b, l) {
  if (!s.includes(a)) { console.error('MISS: ' + l); process.exit(1); }
  s = s.replace(a, b);
  console.log('ok: ' + l);
}

const OLD_PICK = `// Prefer a natural sounding English voice when the platform offers one.
function pickVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices() || []
  if (!voices.length) return null
  const en = voices.filter(v => /^en(-|_|$)/i.test(v.lang))
  const pool = en.length ? en : voices
  const preferred = ['Google UK English Male', 'Microsoft Guy Online', 'Microsoft Ryan Online', 'Daniel', 'Alex', 'Google US English', 'Microsoft Aria Online', 'Samantha']
  for (const name of preferred) {
    const hit = pool.find(v => v.name === name)
    if (hit) return hit
  }
  return pool.find(v => /natural|online|premium|enhanced/i.test(v.name)) || pool[0]
}`;
must(OLD_PICK, picker, 'pickVoice rewrite');

must(
  `  const [reduced, setReduced] = useState(false)`,
  `  const [reduced, setReduced] = useState(false)
  const [voices, setVoices] = useState([])
  const [voiceURI, setVoiceURI] = useState(null)`,
  'voice state'
);

must(
  `    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    // Some browsers populate the voice list asynchronously.
    if (window.speechSynthesis) window.speechSynthesis.getVoices()
  }, [])`,
  `    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    if (!window.speechSynthesis) return
    // Chrome populates the voice list asynchronously, so read it twice.
    const load = () => {
      const list = listVoices()
      if (!list.length) return
      setVoices(list)
      setVoiceURI(cur => {
        if (cur) return cur
        const saved = window.localStorage.getItem('phis.film.voice')
        return saved && list.some(v => v.voiceURI === saved) ? saved : list[0].voiceURI
      })
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])`,
  'voice loading'
);

must(
  `    const v = pickVoice()
    if (v) u.voice = v`,
  `    const v = pickVoice(voiceURI)
    if (v) u.voice = v`,
  'narration uses chosen voice'
);

must(
  `  }, [open, playing, narrate, scene])`,
  `  }, [open, playing, narrate, scene, voiceURI])`,
  'narration deps'
);

must(
  `        <button onClick={() => setNarrate(n => !n)} style={narrate ? btn : off}>Voice</button>`,
  `        <button onClick={() => setNarrate(n => !n)} style={narrate ? btn : off}>Voice</button>
        {narrate && voices.length > 1 && (
          <select
            value={voiceURI || ''}
            onChange={e => {
              stopSpeech()
              setVoiceURI(e.target.value)
              try { window.localStorage.setItem('phis.film.voice', e.target.value) } catch (err) {}
            }}
            style={{ background: 'rgba(255,255,255,0.08)', color: PAPER, border: '1px solid rgba(255,255,255,0.18)', borderRadius: 3, fontFamily: GP, fontSize: 10, letterSpacing: '0.06em', padding: '5px 6px', maxWidth: 150, cursor: 'pointer' }}
          >
            {voices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI} style={{ background: NAVY }}>
                {v.name.replace(/ - English.*$/, '').replace(/^Microsoft /, '')}
              </option>
            ))}
          </select>
        )}`,
  'voice picker control'
);

fs.writeFileSync(f, s, 'utf8');
console.log('PhisFilm.js written');
