const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, '..', 'app', 'page.js');
const step5File = path.join(__dirname, 'step5_resume_v2.js');
const step6File = path.join(__dirname, 'step6_coverletter_v2.js');

const pageRaw = fs.readFileSync(pageFile, 'utf8');
const step5 = fs.readFileSync(step5File, 'utf8');
const step6 = fs.readFileSync(step6File, 'utf8');

// Normalize CRLF -> LF
const pageLines = pageRaw.replace(/\r/g, '').split('\n');

console.log('Total lines:', pageLines.length);

// Find start: the STEP 5 comment line
const startMarker = '// ─── STEP 5: RESUME GENERATION ───────────────────────────';
const startIdx = pageLines.findIndex(l => l.trim() === startMarker);
if (startIdx === -1) throw new Error('Could not find STEP 5 start marker');
console.log('Step 5 start (0-indexed):', startIdx, '(line', startIdx+1, ')');

// Find end: closing brace of CoverLetterStep — search for the APPLICATION ENGINE comment
const endMarker = '// ─── APPLICATION ENGINE ───────────────────────────';
const endIdx = pageLines.findIndex((l, i) => i > startIdx && l.trim() === endMarker);
if (endIdx === -1) throw new Error('Could not find APPLICATION ENGINE end marker');
console.log('Application engine start (0-indexed):', endIdx, '(line', endIdx+1, ')');

// The range to replace: startIdx to endIdx-1 (inclusive)
// We want to remove everything from step5 comment up to (but not including) APPLICATION ENGINE comment
const before = pageLines.slice(0, startIdx);
const after = pageLines.slice(endIdx);

// Build new content: step5 + blank line + step6 + blank line
const newBlock = step5.replace(/\r/g, '').trimEnd() + '\n\n\n' + step6.replace(/\r/g, '').trimEnd() + '\n\n\n';

const result = before.join('\n') + '\n' + newBlock + after.join('\n');

// Write back with CRLF (to match original Windows line endings)
fs.writeFileSync(pageFile, result.replace(/\n/g, '\r\n'), 'utf8');

console.log('Done. New file line count:', result.split('\n').length);
console.log('Replaced lines', startIdx+1, 'through', endIdx, 'with step5+step6 content.');
