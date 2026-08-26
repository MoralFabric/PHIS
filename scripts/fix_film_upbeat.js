// Three changes.
//
// 1. SCORE. Held each chord for 4.2s with a 0.9s swell and no rhythmic
//    element, which reads as mournful no matter how major the harmony is.
//    Replaced with a 120bpm version: chord every 2s, eighth note arpeggio
//    carrying the pulse, short pad attacks, brighter filter.
// 2. AUTO CLOSE once the final frame has landed. The Replay control goes with
//    it, since the About poster is the way back in.
// 3. AUTOPLAY on opening the About tab.
//
// Written with the Write tool, not a heredoc. See the CRLF gotcha in CLAUDE.md.
const fs = require('fs');

function edit(file, pairs, crlf) {
  let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  for (const [find, repl, label] of pairs) {
    if (!s.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
    s = s.replace(find, repl);
    console.log('ok: ' + label);
  }
  fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s, 'utf8');
  console.log('wrote ' + file);
}

// ── 1. swap the whole score block ─────────────────────────
{
  const file = 'app/components/PhisFilm.js';
  let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  const score = fs.readFileSync(process.argv[2], 'utf8').replace(/\r/g, '');
  const a = s.indexOf('// ── score ─');
  const b = s.indexOf('// Voice quality is the visitor');
  if (a < 0 || b < 0 || b < a) { console.error('MISS: score block bounds'); process.exit(1); }
  s = s.slice(0, a) + score + s.slice(b);
  fs.writeFileSync(file, s, 'utf8');
  console.log('ok: score replaced');
}

edit('app/components/PhisFilm.js', [
  // resume immediately on creation: autoplay means the context can come back suspended
  [
    `      if (!score.current) score.current = createScore()
      else if (score.current.ctx.state === 'suspended') score.current.ctx.resume()`,
    `      if (!score.current) {
        score.current = createScore()
        // Autoplay can hand us a suspended context even with user activation.
        if (score.current && score.current.ctx.state === 'suspended') score.current.ctx.resume()
      } else if (score.current.ctx.state === 'suspended') score.current.ctx.resume()`,
    'resume on creation',
  ],
  // auto close
  [
    '  useEffect(() => { if (!narrate) stopSpeech() }, [narrate, stopSpeech])',
    `  useEffect(() => { if (!narrate) stopSpeech() }, [narrate, stopSpeech])

  // Close on its own once the closing frame has had a moment to land. The
  // About poster is the way back in, so there is no Replay control.
  useEffect(() => {
    if (!open || !total || elapsed < total) return
    const t = setTimeout(onClose, 1700)
    return () => clearTimeout(t)
  }, [open, elapsed, total, onClose])`,
    'auto close effect',
  ],
  // fade the whole stage out as it ends, so the close is not abrupt
  [
    "        position: 'fixed', inset: 0, zIndex: 200, background: DEEP, fontFamily: GP,\n        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: showUI ? 'default' : 'none',",
    "        position: 'fixed', inset: 0, zIndex: 200, background: DEEP, fontFamily: GP,\n        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: showUI ? 'default' : 'none',\n        opacity: ended ? 0 : 1, transition: 'opacity .9s ease',",
    'fade out on end',
  ],
  // drop the Replay overlay
  [
    `      {ended && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 'clamp(90px, 14vh, 150px)', pointerEvents: 'none' }}>
          <button
            onClick={e => { e.stopPropagation(); seek(0); setPlaying(true) }}
            style={{ pointerEvents: 'auto', background: 'none', border: \`1px solid rgba(255,255,255,0.3)\`, color: PAPER, fontFamily: GP, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '11px 22px', borderRadius: 3, cursor: 'pointer' }}
          >Replay</button>
        </div>
      )}

`,
    '',
    'remove Replay overlay',
  ],
], false);

// ── 3. autoplay when the About tab opens ──────────────────
edit('app/page.js', [
  [
    '  const [playing, setPlaying] = useState(false);\n  const storyCount = (stories || []).length;',
    '  // Opens playing. GuestAboutView is unmounted when the tab is left, so\n  // returning to About starts the film again, and auto close will not loop\n  // because closing only sets state on the mounted instance.\n  const [playing, setPlaying] = useState(true);\n  const storyCount = (stories || []).length;',
    'autoplay on About',
  ],
], true);
