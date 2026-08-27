// Faster and more upbeat, plus a new closing line.
//
// 1. SCENE PACING. Scenes averaged 6.2s. All durations cut to 72%, taking the
//    film from 1:21 to 58s. Reveals are fractions of scene duration, so they
//    speed up proportionally with no other change.
// 2. MUSIC. 120bpm to 141bpm, plus an offbeat tick that gives the pulse
//    somewhere to land. A single reused noise buffer rather than one per hit.
// 3. NARRATION. Rate 0.95 to 1.05 and the longest lines trimmed, so speech
//    still fits inside the shorter scenes.
// 4. CLOSING LINE. "You are already standing in one" made the product the
//    punchline, which pegs Adam as the person who built a data tool. The close
//    is now his own statement of what he does.
const fs = require('fs');

function edit(file, pairs, crlf) {
  let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  for (const [find, repl, label] of pairs) {
    if (!s.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
    s = s.split(find).join(repl);
    console.log('ok: ' + label);
  }
  fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s, 'utf8');
}

const FILM = 'app/components/PhisFilm.js';

// ── 1. scene durations, 72% across the board ──────────────
// Guarded: this already ran once and must not compound if the script is
// re-run after a failed match further down.
{
  let s = fs.readFileSync(FILM, 'utf8').replace(/\r/g, '');
  const total = [...s.matchAll(/dur: (\d+)/g)].map(m => +m[1]).reduce((a, b) => a + b, 0);
  if (total > 70000) {
    s = s.replace(/dur: (\d+)/g, (_, d) => 'dur: ' + Math.round(+d * 0.72 / 100) * 100);
    const after = [...s.matchAll(/dur: (\d+)/g)].map(m => +m[1]).reduce((a, b) => a + b, 0);
    fs.writeFileSync(FILM, s, 'utf8');
    console.log('ok: durations ' + (total / 1000) + 's -> ' + (after / 1000) + 's');
  } else {
    console.log('skip: durations already at ' + (total / 1000) + 's');
  }
}

edit(FILM, [
  // ── 2. music: 141bpm ────────────────────────────────────
  ['  const CHORD = 2.0                 // 120bpm, four beats to a chord',
   '  const CHORD = 1.7                 // 141bpm, four beats to a chord', 'chord length'],
  ["  master.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.1)",
   "  master.gain.linearRampToValueAtTime(0.44, ctx.currentTime + 0.9)", 'level and fade in'],
  ['  padFilter.frequency.linearRampToValueAtTime(4400, ctx.currentTime + 45)',
   '  padFilter.frequency.linearRampToValueAtTime(4600, ctx.currentTime + 30)', 'filter opens sooner'],

  // offbeat tick, built on one shared noise buffer
  [`  function bell(time, freq, vel) {`,
   `  // One noise buffer, reused. A tick per hit would allocate dozens.
  const NOISE = (() => {
    const n = Math.ceil(ctx.sampleRate * 0.05)
    const b = ctx.createBuffer(1, n, ctx.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3)
    return b
  })()

  // Offbeat tick. Quiet and bright; it gives the pulse somewhere to land.
  function tick(time, vel) {
    const src = ctx.createBufferSource(); src.buffer = NOISE
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000
    const g = ctx.createGain(); g.gain.value = vel
    src.connect(hp); hp.connect(g); g.connect(bed)
    src.start(time)
  }

  function bell(time, freq, vel) {`, 'offbeat tick'],

  [`          arp(next + i * EIGHTH, f, i % 2 === 0 ? 0.05 : 0.033)
        }`,
   `          arp(next + i * EIGHTH, f, i % 2 === 0 ? 0.05 : 0.033)
          if (slot >= 4 && i % 2 === 1) tick(next + i * EIGHTH, 0.03)
        }`, 'tick on offbeats'],

  ['        if (slot >= 12) bell(next + CHORD / 2 + 0.02, c.mel[1], 0.055)',
   '        if (slot >= 10) bell(next + CHORD / 2 + 0.02, c.mel[1], 0.055)', 'melody thickens sooner'],

  // ── 3. narration ────────────────────────────────────────
  ['    u.rate = 0.95', '    u.rate = 1.05', 'speech rate'],
  ["say: 'Twenty years of work, structured so that every claim traces back to something that actually happened.',",
   "say: 'Twenty years of work, structured so every claim traces to something real.',", 'trim library line'],
  ["say: 'And when there is a gap, I answer it once. The answer joins the library, so the next role that asks already has it.',",
   "say: 'When there is a gap, I answer it once. The next role that asks already has it.',", 'trim fill line'],
  ["say: 'It scores the fit against the real record. Including the gaps. Especially the gaps.',",
   "say: 'It scores the fit against the record. Including the gaps.',", 'trim score line'],
  ["say: 'Or ask it anything, and it answers from the record. It will not invent a thing.',",
   "say: 'Or ask it anything. It answers from the record, and invents nothing.',", 'trim ask line'],

  // ── 4. closing scene ────────────────────────────────────
  [`      say: 'Adam Waldman. I build the systems that turn information into decisions. You are already standing in one.',
      render: t => (
        <Stack gap={26}>
          <div style={{ opacity: inOut(t, 0.08) }}>
            <FilmWordmark p={1} still height={54} />
          </div>
          <Kicker text="Adam Waldman, CFA" p={seg(t, 0.06, 0.3)} size={16} />
          <div style={{ opacity: inOut(seg(t, 0.18, 1), 0.16) }}>
            <Rise text="Builds the systems that turn information into decisions." p={seg(t, 0.2, 0.7)} size={H2} />
          </div>
          <div style={{ opacity: inOut(seg(t, 0.46, 1), 0.18) }}>
            <Rise text="You are already standing in one." p={seg(t, 0.5, 0.72)} size="clamp(13px, 1.8vw, 21px)" color={MIST} />
          </div>
        </Stack>
      ),`,
   `      say: 'I am Adam Waldman, and I turn data into decisions.',
      render: t => (
        <Stack gap={30}>
          <div style={{ opacity: inOut(t, 0.08) }}>
            <FilmWordmark p={1} still height={50} />
          </div>
          <div style={{ opacity: inOut(seg(t, 0.12, 1), 0.14) }}>
            <Rise text="I am Adam Waldman" p={seg(t, 0.12, 0.42)} size={H} />
          </div>
          <div style={{ opacity: inOut(seg(t, 0.34, 1), 0.16) }}>
            <Rise text="and I turn data into decisions." p={seg(t, 0.36, 0.68)} size={H} color={MARIGOLD} />
          </div>
        </Stack>
      ),`, 'closing line'],
], false);

// ── poster runtime label ──────────────────────────────────
edit('app/page.js', [
  ['Play the film &middot; 1 min 21 sec', 'Play the film &middot; 58 sec', 'poster runtime label'],
], true);
