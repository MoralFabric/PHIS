// A saved pick in localStorage silently outranks the computed default, so once
// a voice has been chosen from the transport no later change to scoreVoice can
// ever reach that browser. That is correct behaviour for a deliberate choice
// and a trap for an experimental one. Add an explicit way back to the default.
const fs = require('fs');
const file = 'app/components/PhisFilm.js';
let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');

function must(find, repl, label) {
  if (!s.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
  s = s.replace(find, repl);
  console.log('ok: ' + label);
}

must(
  `            onChange={e => {
              stopSpeech()
              setVoiceURI(e.target.value)
              try { window.localStorage.setItem('phis.film.voice', e.target.value) } catch (err) {}
            }}`,
  `            onChange={e => {
              stopSpeech()
              // The sentinel clears the stored pick and returns to whatever
              // scoreVoice ranks highest on this machine.
              if (e.target.value === '__best__') {
                try { window.localStorage.removeItem('phis.film.voice') } catch (err) {}
                setVoiceURI(voices.length ? voices[0].voiceURI : null)
                return
              }
              setVoiceURI(e.target.value)
              try { window.localStorage.setItem('phis.film.voice', e.target.value) } catch (err) {}
            }}`,
  'reset sentinel'
);

must(
  `            {voices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI} style={{ background: NAVY }}>`,
  `            <option value="__best__" style={{ background: NAVY }}>Best available</option>
            {voices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI} style={{ background: NAVY }}>`,
  'best-available option'
);

fs.writeFileSync(file, s, 'utf8');
console.log('wrote ' + file);
