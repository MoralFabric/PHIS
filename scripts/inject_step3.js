const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, '..', 'app', 'page.js');
const step3File = path.join(__dirname, 'step3_gap.js');

const pageRaw = fs.readFileSync(pageFile, 'utf8');
const step3 = fs.readFileSync(step3File, 'utf8');

const pageLines = pageRaw.replace(/\r/g, '').split('\n');

console.log('Total lines:', pageLines.length);

const startMarker = '// ─── STEP 3: GAP RESOLUTION ──────────────────────────────';
const startIdx = pageLines.findIndex(l => l.trim() === startMarker);
if (startIdx === -1) throw new Error('Could not find STEP 3 start marker');
console.log('Step 3 start (0-indexed):', startIdx, '(line', startIdx+1, ')');

const endMarker = '// ─── STEP 4: RE-SCORE + PROBABILITIES ────────────────────';
const endIdx = pageLines.findIndex((l, i) => i > startIdx && l.trim() === endMarker);
if (endIdx === -1) throw new Error('Could not find STEP 4 end marker');
console.log('Step 4 start (0-indexed):', endIdx, '(line', endIdx+1, ')');

const before = pageLines.slice(0, startIdx);
const after = pageLines.slice(endIdx);

const newBlock = step3.replace(/\r/g, '').trimEnd() + '\n\n\n';

const result = before.join('\n') + '\n' + newBlock + after.join('\n');

fs.writeFileSync(pageFile, result.replace(/\n/g, '\r\n'), 'utf8');

console.log('Done. New file line count:', result.split('\n').length);
console.log('Replaced lines', startIdx+1, 'through', endIdx, 'with step3 content.');
