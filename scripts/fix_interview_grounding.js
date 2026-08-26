// The interview prompts already forbade manufacturing whole examples, but two
// gaps let a fabricated answer through:
//   1. Nothing forbade EMBELLISHING a real story. The model took the genuine
//      25% reduction story and added how the team was told and involved.
//   2. The persona line ended with "Surface partial matches rather than
//      answering no", the last instruction in the prompt, which contradicted
//      the prohibitions above it and forced a stretch.
const fs = require('fs');
const f = 'app/page.js';
let s = fs.readFileSync(f, 'utf8').replace(/\r/g, '');
const embellish = fs.readFileSync(process.argv[2], 'utf8').replace(/\r/g, '').trim();
const tail = fs.readFileSync(process.argv[3], 'utf8').replace(/\r/g, '').trim();

function replaceAll(find, repl, expected, label) {
  const n = s.split(find).length - 1;
  if (n !== expected) { console.error('MISS: ' + label + ' (found ' + n + ', expected ' + expected + ')'); process.exit(1); }
  s = s.split(find).join(repl);
  console.log('ok: ' + label + ' x' + n);
}

// 1. add the embellishment prohibition after the manufactured-examples one
const CHECK = 'REQUIRED CHECK: Before you write any name, date, number, scene, quote, or "a time when" \u2014 ask: is this in the source data provided? If no, do not write it.';
replaceAll(CHECK, embellish + '\n\n' + CHECK, 2, 'embellishment prohibition');

// 2. replace the contradictory generosity tail in both prompts
const OLD_TAIL = 'When source stories match the question, draw on them specifically. When they do not, describe Adam\'s approach and principles in your own voice \u2014 that is a complete, correct answer. Interpret questions generously: contributing to a book counts as writing, co-authoring counts, speaking on a topic counts as expertise. Surface partial matches rather than answering "no."';
replaceAll(OLD_TAIL, tail, 2, 'gap protocol tail');

fs.writeFileSync(f, s.replace(/\n/g, '\r\n'), 'utf8');
console.log('page.js written');
