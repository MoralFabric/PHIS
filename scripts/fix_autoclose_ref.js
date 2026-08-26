// The auto close timer depended on the `onClose` prop, which GuestAboutView
// passes as an inline arrow. A new function identity on any re-render tore the
// effect down and restarted the 1.7s timer, so the close could be deferred
// indefinitely. Hold onClose in a ref and depend only on the timeline.
const fs = require('fs');
const file = 'app/components/PhisFilm.js';
let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');

function must(find, repl, label) {
  if (!s.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
  s = s.replace(find, repl);
  console.log('ok: ' + label);
}

must(
  '  const hideTimer = useRef(null)',
  '  const hideTimer = useRef(null)\n  // Kept in a ref so the auto close timer does not restart when the parent\n  // hands us a fresh onClose identity on re-render.\n  const onCloseRef = useRef(onClose)\n  useEffect(() => { onCloseRef.current = onClose }, [onClose])',
  'onClose ref'
);

must(
  `  useEffect(() => {
    if (!open || !total || elapsed < total) return
    const t = setTimeout(onClose, 1700)
    return () => clearTimeout(t)
  }, [open, elapsed, total, onClose])`,
  `  useEffect(() => {
    if (!open || !total || elapsed < total) return
    const t = setTimeout(() => onCloseRef.current && onCloseRef.current(), 1700)
    return () => clearTimeout(t)
  }, [open, elapsed, total])`,
  'auto close depends only on the timeline'
);

fs.writeFileSync(file, s, 'utf8');
console.log('wrote ' + file);
