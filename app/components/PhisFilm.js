'use client'

// PHIS Film - a ~65s motion piece that plays inside the About section.
// Everything is generated: type animation, transitions, and the score are all
// code. There is no video file, no footage, and no third-party embed, so it
// stays sharp at any resolution and adds nothing to page weight.
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

const NAVY = '#1E3A5F'
const DEEP = '#16304F'
const MARIGOLD = '#EA6A1A'
const PAPER = '#FFFFFF'
const MIST = '#7E93A8'
const GP = "'Poppins', system-ui, sans-serif"

// ── timing helpers ────────────────────────────────────────
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
// Map a sub-window [a,b] of a scene's progress onto 0..1.
const seg = (t, a, b) => clamp((t - a) / (b - a))
const easeOut = t => 1 - Math.pow(1 - t, 3)
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
// Fade an element in at its own pace. Scene level fade out is applied once by
// the player, so an element only ever has to arrive, never to leave.
const inOut = (t, up = 0.12) => easeOut(seg(t, 0, up))

// ── animated primitives ───────────────────────────────────
// Words rise and fade in on a stagger. `p` is 0..1 across the whole line.
function Rise({ text, p, size, weight = 300, color = PAPER, ls = '-0.015em', lh = 1.15, delayShare = 0.55, still }) {
  const words = text.split(' ')
  const each = words.length > 1 ? delayShare / (words.length - 1) : 0
  return (
    <div style={{ fontSize: size, fontWeight: weight, color, letterSpacing: ls, lineHeight: lh, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 0.28em' }}>
      {words.map((w, i) => {
        const wp = still ? 1 : easeOut(seg(p, i * each, i * each + (1 - delayShare)))
        return (
          <span key={i} style={{ display: 'inline-block', opacity: wp, transform: still ? 'none' : `translateY(${(1 - wp) * 26}px)` }}>{w}</span>
        )
      })}
    </div>
  )
}

// Small uppercase label with tracking, used for kickers and eyebrows.
function Kicker({ text, p, color = MARIGOLD, size = 15, still }) {
  const o = still ? 1 : easeOut(p)
  return (
    <div style={{ fontSize: size, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color, opacity: o, transform: still ? 'none' : `translateY(${(1 - o) * 10}px)` }}>{text}</div>
  )
}

// Counts up to `value`, holding the final number for the rest of the scene.
function Counter({ value, p, label, suffix = '' }) {
  const n = Math.round(easeOut(clamp(p)) * value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 'clamp(38px, 6.4vw, 74px)', fontWeight: 300, color: PAPER, letterSpacing: '-0.02em', lineHeight: 1 }}>{n}{suffix}</div>
      <div style={{ fontSize: 'clamp(9px, 1.15vw, 13px)', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: MIST, textAlign: 'center' }}>{label}</div>
    </div>
  )
}

// The wordmark, with the swoosh drawing itself and the dot landing after.
function FilmWordmark({ p, height = 96, still }) {
  const draw = still ? 1 : easeInOut(seg(p, 0, 0.55))
  const letters = still ? 1 : easeOut(seg(p, 0.25, 0.8))
  const dot = still ? 1 : easeOut(seg(p, 0.6, 0.85))
  const LEN = 260
  return (
    <svg viewBox="-30.0 0 159.5 76" height={height} style={{ overflow: 'visible' }} role="img" aria-label="phis">
      <g fill={PAPER} opacity={letters} transform={`translate(0 ${(1 - letters) * 5})`}>
        <path transform="translate(10.00 58.00) scale(0.04600 -0.04600)" d="M392 563Q463 563 520.5 528.0Q578 493 611.5 428.5Q645 364 645 279Q645 194 611.5 128.5Q578 63 520.5 27.0Q463 -9 392 -9Q331 -9 284.5 16.0Q238 41 209 79V-264H69V554H209V474Q236 512 283.5 537.5Q331 563 392 563ZM355 440Q317 440 283.5 420.5Q250 401 229.5 364.0Q209 327 209 277Q209 227 229.5 190.0Q250 153 283.5 133.5Q317 114 355 114Q394 114 427.5 134.0Q461 154 481.5 191.0Q502 228 502 279Q502 329 481.5 365.5Q461 402 427.5 421.0Q394 440 355 440Z" />
        <path transform="translate(39.69 58.00) scale(0.04600 -0.04600)" d="M597 325V0H457V306Q457 372 424.0 407.5Q391 443 334 443Q276 443 242.5 407.5Q209 372 209 306V0H69V740H209V485Q236 521 281.0 541.5Q326 562 381 562Q444 562 493.0 534.5Q542 507 569.5 453.5Q597 400 597 325Z" />
        <path transform="translate(68.59 58.00) scale(0.04600 -0.04600)" d="M215 554V0H75V554Z" />
        <path transform="translate(80.43 58.00) scale(0.04600 -0.04600)" d="M39 175H180Q184 143 211.5 122.0Q239 101 280 101Q320 101 342.5 117.0Q365 133 365 158Q365 185 337.5 198.5Q310 212 250 228Q188 243 148.5 259.0Q109 275 80.5 308.0Q52 341 52 397Q52 443 78.5 481.0Q105 519 154.5 541.0Q204 563 271 563Q370 563 429.0 513.5Q488 464 494 380H360Q357 413 332.5 432.5Q308 452 267 452Q229 452 208.5 438.0Q188 424 188 399Q188 371 216.0 356.5Q244 342 303 327Q363 312 402.0 296.0Q441 280 469.5 246.5Q498 213 499 158Q499 110 472.5 72.0Q446 34 396.5 12.5Q347 -9 281 -9Q213 -9 159.0 15.5Q105 40 73.5 82.0Q42 124 39 175Z" />
      </g>
      <path d="M-24.00 50.00 Q75.26 -6.00 123.50 30.00" stroke={PAPER} strokeWidth="2.4" fill="none" strokeLinecap="round"
        strokeDasharray={LEN} strokeDashoffset={LEN * (1 - draw)} />
      <circle cx="75.26" cy="15.95" r="5" fill={MARIGOLD} opacity={dot} transform={`translate(0 ${(1 - dot) * -8})`} />
    </svg>
  )
}

// A skill bar that fills to `pct`. Gaps render in marigold, strengths in white.
function Bar({ label, pct, p, gap }) {
  const w = easeOut(clamp(p)) * pct
  return (
    <div style={{ width: '100%', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'clamp(9px, 1.15vw, 12px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: gap ? MARIGOLD : MIST, marginBottom: 7 }}>
        <span>{label}</span><span>{Math.round(w)}</span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.13)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, background: gap ? MARIGOLD : PAPER, borderRadius: 2 }} />
      </div>
    </div>
  )
}

// Lines of text that type on in sequence, used for the resume and answer scenes.
function TypeLines({ lines, p, color = PAPER, size = 'clamp(11px, 1.5vw, 17px)' }) {
  const each = 1 / lines.length
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
      {lines.map((l, i) => {
        const lp = clamp((p - i * each * 0.82) / each)
        const chars = Math.round(lp * l.length)
        return (
          <div key={i} style={{ fontSize: size, fontWeight: 300, color, lineHeight: 1.5, opacity: lp > 0 ? 1 : 0, minHeight: '1.4em' }}>
            {l.slice(0, chars)}
            {lp > 0 && lp < 1 && <span style={{ color: MARIGOLD }}>|</span>}
          </div>
        )
      })}
    </div>
  )
}

const Stack = ({ children, gap = 26 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap, textAlign: 'center', width: '100%', maxWidth: 900, padding: '0 6%' }}>{children}</div>
)

const H = 'clamp(26px, 4.6vw, 62px)'
const H2 = 'clamp(19px, 3.1vw, 40px)'

// ── scenes ────────────────────────────────────────────────
// `dur` is milliseconds, `say` is the narration line, `render` receives the
// scene's own 0..1 progress. Keep `say` close to what is on screen so the
// narration reads as a voiceover rather than as a separate script.
function buildScenes({ storyCount, employerCount }) {
  return [
    {
      id: 'premise', dur: 6200,
      say: 'Every career is a data set. Almost nobody treats it like one.',
      render: t => (
        <Stack gap={20}>
          <div style={{ opacity: inOut(t, 0.1) }}>
            <Rise text="Every career is a data set." p={seg(t, 0.02, 0.5)} size={H} />
          </div>
          <div style={{ opacity: inOut(seg(t, 0.42, 1), 0.15) }}>
            <Rise text="Almost nobody treats it like one." p={seg(t, 0.45, 0.78)} size={H2} color={MIST} />
          </div>
        </Stack>
      ),
    },
    {
      id: 'build', dur: 4600,
      say: 'So I built a system that does.',
      render: t => (
        <Stack>
          <div style={{ opacity: inOut(t, 0.14) }}>
            <Rise text="So I built a system that does." p={seg(t, 0.05, 0.62)} size={H} />
          </div>
        </Stack>
      ),
    },
    {
      id: 'mark', dur: 5400,
      render: t => (
        <Stack gap={30}>
          <div style={{ opacity: inOut(t, 0.06) }}>
            <FilmWordmark p={seg(t, 0.04, 0.72)} height={110} />
          </div>
          <Kicker text="Professional History Intelligence Studio" p={seg(t, 0.5, 1)} color={MIST} size={13} />
        </Stack>
      ),
    },
    {
      id: 'library', dur: 6600,
      say: 'Twenty years of work, structured so that every claim traces back to something that actually happened.',
      render: t => (
        <Stack gap={40}>
          <Kicker text="The library" p={seg(t, 0, 0.5)} />
          <div style={{ display: 'flex', gap: 'clamp(28px, 7vw, 84px)', alignItems: 'flex-start', opacity: inOut(t, 0.1) }}>
            <Counter value={20} p={seg(t, 0.12, 0.62)} label="Years" />
            <Counter value={storyCount} p={seg(t, 0.16, 0.5)} label="Structured stories" />
            <Counter value={employerCount} p={seg(t, 0.28, 0.78)} label="Organizations" />
          </div>
          <div style={{ opacity: inOut(seg(t, 0.58, 1), 0.2) }}>
            <Rise text="Every claim traceable to something that actually happened." p={seg(t, 0.58, 0.8)} size="clamp(13px, 1.8vw, 21px)" color={MIST} />
          </div>
        </Stack>
      ),
    },
    {
      id: 'paste', dur: 5200,
      say: 'Paste in a job description.',
      render: t => (
        <Stack gap={34}>
          <div style={{ opacity: inOut(t, 0.12) }}>
            <Rise text="Paste in a job description." p={seg(t, 0.03, 0.5)} size={H2} />
          </div>
          <div style={{ width: '100%', maxWidth: 620, border: '1px solid rgba(255,255,255,0.16)', borderRadius: 6, padding: 'clamp(16px, 2.4vw, 26px)', opacity: inOut(seg(t, 0.3, 1), 0.2), background: 'rgba(255,255,255,0.03)' }}>
            <TypeLines p={seg(t, 0.34, 0.9)} color={MIST} lines={[
              'VP, Enterprise Planning and Insight',
              'Lead driver based forecasting across the platform.',
              'Partner with the CFO on capital allocation.',
              'Build the analytics function from the ground up.',
            ]} />
          </div>
        </Stack>
      ),
    },
    {
      id: 'score', dur: 7000,
      say: 'It scores the fit against the real record. Including the gaps. Especially the gaps.',
      render: t => (
        <Stack gap={32}>
          <Kicker text="Fit, scored against the record" p={seg(t, 0, 0.42)} />
          <div style={{ width: '100%', maxWidth: 560, opacity: inOut(t, 0.1) }}>
            <Bar label="Driver based forecasting" pct={92} p={seg(t, 0.14, 0.5)} />
            <Bar label="Capital planning" pct={88} p={seg(t, 0.2, 0.56)} />
            <Bar label="Building functions from scratch" pct={95} p={seg(t, 0.26, 0.62)} />
            <Bar label="Reinsurance modelling" pct={54} p={seg(t, 0.32, 0.68)} gap />
          </div>
          <div style={{ opacity: inOut(seg(t, 0.6, 1), 0.2) }}>
            <Rise text="Including the gaps. Especially the gaps." p={seg(t, 0.6, 0.82)} size="clamp(13px, 1.8vw, 21px)" color={MARIGOLD} />
          </div>
        </Stack>
      ),
    },
    {
      id: 'fill', dur: 7400,
      say: 'And when there is a gap, I answer it once. The answer joins the library, so the next role that asks already has it.',
      render: t => {
        // Picks the gap bar up where the previous scene left it and closes it,
        // so the two scenes read as one continuous motion.
        const fill = easeOut(seg(t, 0.5, 0.76))
        return (
          <Stack gap={26}>
            <Kicker text="So I answer it. Once." p={seg(t, 0, 0.3)} />
            <div style={{ width: '100%', maxWidth: 560, opacity: inOut(t, 0.1) }}>
              <Bar label="Reinsurance modelling" pct={54 + fill * 22} p={1} gap={fill < 0.5} />
            </div>
            <div style={{ width: '100%', maxWidth: 560, opacity: inOut(seg(t, 0.16, 1), 0.12) }}>
              <TypeLines p={seg(t, 0.18, 0.48)} color={MIST} lines={[
                'I have not modelled reinsurance directly. I built the capital model it feeds.',
              ]} />
            </div>
            <div style={{ opacity: inOut(seg(t, 0.58, 1), 0.18) }}>
              <Rise text="Answered once. In the library for good." p={seg(t, 0.6, 0.8)} size="clamp(13px, 1.8vw, 21px)" color={MARIGOLD} />
            </div>
          </Stack>
        )
      },
    },
    {
      id: 'compound', dur: 6000,
      say: 'Which means it gets sharper every time somebody uses it.',
      render: t => {
        const ticked = t > 0.48
        // A small pop on the tick so the plus one registers without a caption.
        const pop = 1 + easeOut(seg(t, 0.48, 0.56)) * 0.09 - easeOut(seg(t, 0.56, 0.7)) * 0.09
        return (
          <Stack gap={32}>
            <div style={{ opacity: inOut(t, 0.1) }}>
              <Rise text="Every question makes it sharper." p={seg(t, 0.02, 0.46)} size={H2} />
            </div>
            <div style={{ opacity: inOut(seg(t, 0.28, 1), 0.16), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 'clamp(38px, 6.4vw, 74px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: ticked ? MARIGOLD : PAPER, transform: 'scale(' + pop + ')' }}>
                {storyCount + (ticked ? 1 : 0)}
              </div>
              <div style={{ fontSize: 'clamp(9px, 1.15vw, 13px)', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: MIST }}>Stories in the library</div>
            </div>
            <div style={{ opacity: inOut(seg(t, 0.6, 1), 0.18) }}>
              <Rise text="That experience will not be missed again." p={seg(t, 0.62, 0.82)} size="clamp(13px, 1.8vw, 21px)" color={MIST} />
            </div>
          </Stack>
        )
      },
    },
    {
      id: 'write', dur: 6400,
      say: 'Then it writes, in my voice, using only what the record supports.',
      render: t => (
        <Stack gap={30}>
          <div style={{ opacity: inOut(t, 0.12) }}>
            <Rise text="Then it writes." p={seg(t, 0.02, 0.38)} size={H2} />
          </div>
          <div style={{ width: '100%', maxWidth: 640, borderLeft: '2px solid ' + MARIGOLD, paddingLeft: 'clamp(14px, 2vw, 24px)', opacity: inOut(seg(t, 0.24, 1), 0.18) }}>
            <TypeLines p={seg(t, 0.28, 0.9)} lines={[
              'Rebuilt the planning model for a global wealth platform,',
              'cutting the forecast cycle from six weeks to nine days.',
              'Advised the CFO on the capital case behind it.',
            ]} />
          </div>
        </Stack>
      ),
    },
    {
      id: 'ask', dur: 6400,
      say: 'Or ask it anything, and it answers from the record. It will not invent a thing.',
      render: t => (
        <Stack gap={26}>
          <div style={{ opacity: inOut(t, 0.12) }}>
            <Rise text="Or just ask it anything." p={seg(t, 0.02, 0.36)} size={H2} />
          </div>
          <div style={{ width: '100%', maxWidth: 640, opacity: inOut(seg(t, 0.22, 1), 0.18) }}>
            <div style={{ fontSize: 'clamp(11px, 1.5vw, 17px)', color: MARIGOLD, marginBottom: 16, textAlign: 'left', fontWeight: 400 }}>
              &ldquo;Tell me about a time you had to cut a team.&rdquo;
            </div>
            <TypeLines p={seg(t, 0.32, 0.9)} color={MIST} lines={[
              'I was handed a 25 percent reduction and told to hold the output.',
              'So I mapped every process first, and found the reports nobody read.',
              'We lost a quarter of the team. We did not lose a quarter of the value.',
            ]} />
          </div>
        </Stack>
      ),
    },
    {
      id: 'turn', dur: 5800,
      say: 'There was no agency. No template. No development team.',
      render: t => {
        const items = ['No agency.', 'No template.', 'No dev team.']
        return (
          <Stack gap={16}>
            <div style={{ opacity: inOut(t, 0.1), display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
              {items.map((s, i) => {
                const sp = easeOut(seg(t, 0.05 + i * 0.16, 0.35 + i * 0.16))
                return <div key={i} style={{ fontSize: H2, fontWeight: 300, color: PAPER, opacity: sp, transform: 'translateY(' + (1 - sp) * 20 + 'px)' }}>{s}</div>
              })}
            </div>
          </Stack>
        )
      },
    },
    {
      id: 'made', dur: 6000,
      say: 'I designed it. I built it. I shipped it.',
      render: t => (
        <Stack gap={24}>
          <div style={{ opacity: inOut(t, 0.1) }}>
            <Rise text="I designed it. I built it. I shipped it." p={seg(t, 0.02, 0.55)} size={H} />
          </div>
          <div style={{ opacity: inOut(seg(t, 0.5, 1), 0.2) }}>
            <Rise text="Which may be the most honest thing on my resume." p={seg(t, 0.52, 0.78)} size="clamp(13px, 1.8vw, 21px)" color={MARIGOLD} />
          </div>
        </Stack>
      ),
    },
    {
      id: 'close', dur: 7600,
      say: 'Adam Waldman. I build the systems that turn information into decisions. You are already standing in one.',
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
      ),
    },
  ]
}

// ── score ─────────────────────────────────────────────────
// Upbeat and driven, not ambient. The previous version held each chord for
// 4.2s with a 0.9s swell and no rhythmic element at all, which reads as
// mournful however major the harmony is. This one runs at 120bpm with a chord
// every two seconds, an eighth note arpeggio carrying the pulse, short pad
// attacks so chords land rather than bloom, and a bright filter.
// Written rather than licensed, so there is no audio file and nothing to clear.
function createScore() {
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!AC) return null
  const ctx = new AC()

  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, ctx.currentTime)
  master.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.1)
  master.connect(ctx.destination)

  // Music sits under narration; `duck` pulls it down while a line is spoken.
  const bed = ctx.createGain()
  bed.gain.value = 1
  bed.connect(master)

  // Short, bright air. A long feedback tail smears the pulse and was part of
  // what made the old version drag.
  const delay = ctx.createDelay(1.0)
  delay.delayTime.value = 0.25
  const fb = ctx.createGain()
  fb.gain.value = 0.17
  const wet = ctx.createGain()
  wet.gain.value = 0.22
  delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(bed)

  const padFilter = ctx.createBiquadFilter()
  padFilter.type = 'lowpass'
  padFilter.frequency.setValueAtTime(1900, ctx.currentTime)
  padFilter.frequency.linearRampToValueAtTime(4400, ctx.currentTime + 45)
  padFilter.connect(bed)

  // Eight chord loop in D major: D G A D | Bm G A D. Only one minor, placed
  // mid phrase, and it resolves home twice.
  const CH = [
    { root: 73.42, tri: [146.83, 220.00, 293.66], mel: [587.33, 440.00] },  // D
    { root: 98.00, tri: [146.83, 196.00, 246.94], mel: [493.88, 587.33] },  // G
    { root: 110.00, tri: [164.81, 220.00, 277.18], mel: [554.37, 659.25] }, // A
    { root: 73.42, tri: [146.83, 220.00, 293.66], mel: [587.33, 493.88] },  // D
    { root: 123.47, tri: [123.47, 185.00, 246.94], mel: [493.88, 369.99] }, // Bm
    { root: 98.00, tri: [146.83, 196.00, 246.94], mel: [587.33, 493.88] },  // G
    { root: 110.00, tri: [164.81, 220.00, 277.18], mel: [659.25, 554.37] }, // A
    { root: 73.42, tri: [146.83, 220.00, 293.66], mel: [880.00, 587.33] },  // D
  ]
  const CHORD = 2.0                 // 120bpm, four beats to a chord
  const EIGHTH = CHORD / 8
  const ARP = [0, 1, 2, 1, 0, 2, 1, 2]   // index into tri
  const ARP_OCT = [0, 0, 1, 0, 0, 1, 0, 1]

  function pad(time, freq) {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq
    const d = ctx.createOscillator(); d.type = 'sine'; d.frequency.value = freq * 1.005
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, time)
    g.gain.linearRampToValueAtTime(0.042, time + 0.14)      // lands, does not bloom
    g.gain.setValueAtTime(0.042, time + CHORD - 0.25)
    g.gain.linearRampToValueAtTime(0.0001, time + CHORD + 0.12)
    o.connect(g); d.connect(g); g.connect(padFilter)
    o.start(time); d.start(time)
    o.stop(time + CHORD + 0.25); d.stop(time + CHORD + 0.25)
  }

  function bass(time, freq) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, time)
    g.gain.linearRampToValueAtTime(0.16, time + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.85)
    o.connect(g); g.connect(bed)
    o.start(time); o.stop(time + 0.95)
  }

  // The pulse. Short and quiet; it is felt more than heard.
  function arp(time, freq, vel) {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, time)
    g.gain.linearRampToValueAtTime(vel, time + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.3)
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000
    o.connect(g); g.connect(lp); lp.connect(bed)
    o.start(time); o.stop(time + 0.35)
  }

  function bell(time, freq, vel) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq
    const h = ctx.createOscillator(); h.type = 'triangle'; h.frequency.value = freq * 2
    const hg = ctx.createGain(); hg.gain.value = 0.2
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, time)
    g.gain.linearRampToValueAtTime(vel, time + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, time + 1.5)
    o.connect(g); h.connect(hg); hg.connect(g)
    g.connect(bed); g.connect(delay)
    o.start(time); h.start(time)
    o.stop(time + 1.6); h.stop(time + 1.6)
  }

  let slot = 0
  let next = ctx.currentTime + 0.25
  const timer = setInterval(() => {
    if (ctx.state !== 'running') return
    while (next < ctx.currentTime + 0.6) {
      const c = CH[slot % CH.length]
      c.tri.forEach(f => pad(next, f))
      bass(next, c.root)
      bass(next + CHORD / 2, c.root)
      // Hold the arpeggio back for the first two chords so the opening line
      // is not fighting a pulse, then let it drive.
      if (slot >= 2) {
        for (let i = 0; i < 8; i++) {
          const f = c.tri[ARP[i]] * (ARP_OCT[i] ? 2 : 1)
          arp(next + i * EIGHTH, f, i % 2 === 0 ? 0.05 : 0.033)
        }
      }
      if (slot >= 4) {
        bell(next + 0.02, c.mel[0], 0.075)
        if (slot >= 12) bell(next + CHORD / 2 + 0.02, c.mel[1], 0.055)
      }
      next += CHORD
      slot++
    }
  }, 45)

  return {
    ctx,
    duck: on => {
      const now = ctx.currentTime
      bed.gain.cancelScheduledValues(now)
      bed.gain.linearRampToValueAtTime(on ? 0.5 : 1, now + 0.3)
    },
    stop: () => {
      clearInterval(timer)
      try {
        master.gain.cancelScheduledValues(ctx.currentTime)
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
      } catch (e) { /* context may already be closing */ }
      setTimeout(() => { try { ctx.close() } catch (e) {} }, 650)
    },
  }
}

// Voice quality is the visitor's machine, not ours: Chrome on Windows exposes
// only the five legacy SAPI voices, Edge exposes ~100 cloud neural ones, macOS
// has its own set. So score what is actually there rather than matching exact
// names, and make sure we never fall through to Microsoft David by accident.
const VOICE_GOOD = /natural|neural|online|premium|enhanced|siri/i
const VOICE_NAMED = /\b(daniel|alex|samantha|serena|oliver|arthur|matilda|guy|ryan|aria|jenny|christopher)\b/i
const VOICE_DATED = /\b(david|zira|mark|hazel|george|susan|linda|eva|catherine|james)\b/i

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
}

function listVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  const all = window.speechSynthesis.getVoices() || []
  const en = all.filter(v => /^en(-|_|$)/i.test(v.lang))
  return (en.length ? en : all).slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))
}

function pickVoice(preferredURI) {
  const pool = listVoices()
  if (!pool.length) return null
  if (preferredURI) {
    const chosen = pool.find(v => v.voiceURI === preferredURI)
    if (chosen) return chosen
  }
  return pool[0]
}

const fmt = ms => {
  const s = Math.max(0, Math.round(ms / 1000))
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

// ── player ────────────────────────────────────────────────
export default function PhisFilm({ open, onClose, storyCount = 70, employerCount = 6 }) {
  const scenes = useMemo(() => buildScenes({ storyCount, employerCount }), [storyCount, employerCount])
  const marks = useMemo(() => {
    let acc = 0
    const out = scenes.map(s => { const start = acc; acc += s.dur; return { ...s, start, end: acc } })
    return { out, total: acc }
  }, [scenes])

  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [sound, setSound] = useState(true)
  const [narrate, setNarrate] = useState(true)
  const [uiVisible, setUiVisible] = useState(true)
  const [reduced, setReduced] = useState(false)
  const [voices, setVoices] = useState([])
  const [voiceURI, setVoiceURI] = useState(null)

  const raf = useRef(0)
  const last = useRef(0)
  const score = useRef(null)
  const spoken = useRef(new Set())
  const hideTimer = useRef(null)
  // Kept in a ref so the auto close timer does not restart when the parent
  // hands us a fresh onClose identity on re-render.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  const total = marks.total
  const idx = Math.min(marks.out.findIndex(s => elapsed < s.end), marks.out.length - 1)
  const scene = marks.out[idx < 0 ? marks.out.length - 1 : idx]
  const rawT = scene ? clamp((elapsed - scene.start) / scene.dur) : 0
  const t = reduced ? 0.82 : rawT

  useEffect(() => {
    if (typeof window === 'undefined') return
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
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
  }, [])

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    if (score.current) score.current.duck(false)
  }, [])

  const teardown = useCallback(() => {
    cancelAnimationFrame(raf.current)
    stopSpeech()
    if (score.current) { score.current.stop(); score.current = null }
  }, [stopSpeech])

  // Reset whenever the film is opened.
  useEffect(() => {
    if (open) {
      setElapsed(0); setPlaying(true); setUiVisible(true)
      spoken.current = new Set()
    } else {
      setPlaying(false)
      teardown()
    }
    return () => { if (!open) teardown() }
  }, [open, teardown])

  useEffect(() => () => teardown(), [teardown])

  // Timeline. Driving from rAF rather than chained timeouts keeps scrubbing,
  // pausing and the progress bar in sync with what is actually on screen.
  useEffect(() => {
    if (!open || !playing) { cancelAnimationFrame(raf.current); return }
    last.current = performance.now()
    const tick = now => {
      const dt = now - last.current
      last.current = now
      setElapsed(e => {
        const nxt = e + dt
        if (nxt >= total) { setPlaying(false); return total }
        return nxt
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [open, playing, total])

  // Score follows play state. The AudioContext is created on the first play,
  // which is a user gesture, so autoplay policy is satisfied.
  useEffect(() => {
    if (!open) return
    if (playing && sound) {
      if (!score.current) {
        score.current = createScore()
        // Autoplay can hand us a suspended context even with user activation.
        if (score.current && score.current.ctx.state === 'suspended') score.current.ctx.resume()
      } else if (score.current.ctx.state === 'suspended') score.current.ctx.resume()
    } else if (score.current) {
      if (!sound) { score.current.stop(); score.current = null }
      else score.current.ctx.suspend()
    }
  }, [open, playing, sound])

  // Narration, fired once per scene.
  useEffect(() => {
    if (!open || !playing || !narrate || !scene || !scene.say) return
    if (spoken.current.has(scene.id)) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    spoken.current.add(scene.id)
    const u = new SpeechSynthesisUtterance(scene.say)
    const v = pickVoice(voiceURI)
    if (v) u.voice = v
    u.rate = 0.95
    u.pitch = 1
    if (score.current) score.current.duck(true)
    u.onend = () => { if (score.current) score.current.duck(false) }
    window.speechSynthesis.speak(u)
  }, [open, playing, narrate, scene, voiceURI])

  useEffect(() => { if (!narrate) stopSpeech() }, [narrate, stopSpeech])

  // Close on its own once the closing frame has had a moment to land. The
  // About poster is the way back in, so there is no Replay control.
  useEffect(() => {
    if (!open || !total || elapsed < total) return
    const t = setTimeout(() => onCloseRef.current && onCloseRef.current(), 1700)
    return () => clearTimeout(t)
  }, [open, elapsed, total])

  const seek = useCallback(ms => {
    stopSpeech()
    const target = clamp(ms, 0, total)
    // Anything at or before the new position counts as already narrated.
    spoken.current = new Set(marks.out.filter(s => s.start <= target).map(s => s.id))
    const cur = marks.out.find(s => target >= s.start && target < s.end)
    if (cur) spoken.current.delete(cur.id)
    setElapsed(target)
  }, [marks, total, stopSpeech])

  const nudgeUI = useCallback(() => {
    setUiVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setUiVisible(false), 2600)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      else if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); nudgeUI() }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose, nudgeUI])

  if (!open) return null

  const ended = elapsed >= total
  const showUI = uiVisible || !playing || ended
  const btn = {
    background: 'none', border: 'none', cursor: 'pointer', color: PAPER, fontFamily: GP,
    fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '7px 11px',
    opacity: 0.75, borderRadius: 3,
  }
  const off = { ...btn, opacity: 0.34 }

  return (
    <div
      onMouseMove={nudgeUI}
      onClick={() => { if (!ended) { setPlaying(p => !p); nudgeUI() } }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: DEEP, fontFamily: GP,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: showUI ? 'default' : 'none',
        opacity: ended ? 0 : 1, transition: 'opacity .9s ease',
      }}
    >
      {/* subtle vignette so the type sits on a field rather than a flat block */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 42%, ${NAVY} 0%, ${DEEP} 62%, #102540 100%)` }} />

      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: reduced ? 1 : Math.min(easeOut(seg(rawT, 0, 0.07)), 1 - easeOut(seg(rawT, 0.93, 1))) }}>
          {scene && scene.render(t)}
        </div>
      </div>

      {/* controls */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: 'clamp(14px, 2.4vw, 26px)',
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'linear-gradient(to top, rgba(11,26,45,0.85), rgba(11,26,45,0))',
          opacity: showUI ? 1 : 0, transition: 'opacity .4s ease', pointerEvents: showUI ? 'auto' : 'none',
        }}
      >
        <button onClick={() => { setPlaying(p => !p); nudgeUI() }} style={{ ...btn, opacity: 1, minWidth: 54 }}>
          {ended ? 'Done' : playing ? 'Pause' : 'Play'}
        </button>
        <div style={{ fontSize: 11, color: MIST, letterSpacing: '0.06em', minWidth: 82 }}>{fmt(elapsed)} / {fmt(total)}</div>
        <div
          onClick={e => {
            const r = e.currentTarget.getBoundingClientRect()
            seek(((e.clientX - r.left) / r.width) * total)
          }}
          style={{ flex: 1, height: 16, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.18)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(elapsed / total) * 100}%`, background: MARIGOLD }} />
          </div>
        </div>
        <button onClick={() => setSound(s => !s)} style={sound ? btn : off}>Music</button>
        <button onClick={() => setNarrate(n => !n)} style={narrate ? btn : off}>Voice</button>
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
        )}
        <button onClick={onClose} style={{ ...btn, opacity: 1 }}>Close</button>
      </div>
    </div>
  )
}
