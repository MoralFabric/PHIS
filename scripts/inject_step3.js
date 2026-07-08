// Injects updated GapCard + GapResolutionStep into app/page.js.
// Replaces the block between the STEP 3 and STEP 4 markers.

const fs   = require('fs')
const path = require('path')

const pageFile = path.join(__dirname, '..', 'app', 'page.js')
const srcFile  = path.join(__dirname, 'step3_gap.js')

const raw     = fs.readFileSync(pageFile, 'utf8').replace(/\r/g, '')
const newCode = fs.readFileSync(srcFile, 'utf8').replace(/\r/g, '')
const lines   = raw.split('\n')

const START_MARKER = '// ─── STEP 3: GAP RESOLUTION ──────────────────────────────'
const END_MARKER   = '// ─── STEP 4: RE-SCORE + PROBABILITIES ────────────────────'

const startIdx = lines.findIndex(l => l.includes(START_MARKER))
const endIdx   = lines.findIndex(l => l.includes(END_MARKER))

if (startIdx === -1) { console.error('Could not find STEP 3 marker'); process.exit(1) }
if (endIdx   === -1) { console.error('Could not find STEP 4 marker'); process.exit(1) }

console.log('Replacing lines '+(startIdx+1)+' to '+endIdx+' with updated step3_gap.js')

const before = lines.slice(0, startIdx)
const after  = lines.slice(endIdx)
const result = [...before, ...newCode.split('\n'), ...after].join('\n')

fs.writeFileSync(pageFile, result.replace(/\n/g, '\r\n'), 'utf8')
console.log('Done. New line count:', result.split('\n').length)
