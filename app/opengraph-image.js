import { ImageResponse } from 'next/og'

// Social preview card (LinkedIn, Slack, iMessage, X). Next wires the og:image
// tags automatically from this file's exports.
export const alt = 'Adam Waldman, CFA. Builds the systems that turn information into decisions.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 86400

const NAVY     = '#1E3A5F'
const MARIGOLD = '#EA6A1A'
const PAPER    = '#FFFFFF'
const MIST     = '#7E93A8'

// Same wordmark paths as PhisWordmark in app/page.js, reversed for the navy field.
// Inlined as a data URI because satori renders <img> more reliably than raw SVG children.
const WORDMARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30.0 0 159.5 76" width="252" height="120">
  <g fill="${PAPER}">
    <path transform="translate(10.00 58.00) scale(0.04600 -0.04600)" d="M392 563Q463 563 520.5 528.0Q578 493 611.5 428.5Q645 364 645 279Q645 194 611.5 128.5Q578 63 520.5 27.0Q463 -9 392 -9Q331 -9 284.5 16.0Q238 41 209 79V-264H69V554H209V474Q236 512 283.5 537.5Q331 563 392 563ZM355 440Q317 440 283.5 420.5Q250 401 229.5 364.0Q209 327 209 277Q209 227 229.5 190.0Q250 153 283.5 133.5Q317 114 355 114Q394 114 427.5 134.0Q461 154 481.5 191.0Q502 228 502 279Q502 329 481.5 365.5Q461 402 427.5 421.0Q394 440 355 440Z"/>
    <path transform="translate(39.69 58.00) scale(0.04600 -0.04600)" d="M597 325V0H457V306Q457 372 424.0 407.5Q391 443 334 443Q276 443 242.5 407.5Q209 372 209 306V0H69V740H209V485Q236 521 281.0 541.5Q326 562 381 562Q444 562 493.0 534.5Q542 507 569.5 453.5Q597 400 597 325Z"/>
    <path transform="translate(68.59 58.00) scale(0.04600 -0.04600)" d="M215 554V0H75V554Z"/>
    <path transform="translate(80.43 58.00) scale(0.04600 -0.04600)" d="M39 175H180Q184 143 211.5 122.0Q239 101 280 101Q320 101 342.5 117.0Q365 133 365 158Q365 185 337.5 198.5Q310 212 250 228Q188 243 148.5 259.0Q109 275 80.5 308.0Q52 341 52 397Q52 443 78.5 481.0Q105 519 154.5 541.0Q204 563 271 563Q370 563 429.0 513.5Q488 464 494 380H360Q357 413 332.5 432.5Q308 452 267 452Q229 452 208.5 438.0Q188 424 188 399Q188 371 216.0 356.5Q244 342 303 327Q363 312 402.0 296.0Q441 280 469.5 246.5Q498 213 499 158Q499 110 472.5 72.0Q446 34 396.5 12.5Q347 -9 281 -9Q213 -9 159.0 15.5Q105 40 73.5 82.0Q42 124 39 175Z"/>
  </g>
  <path d="M-24.00 50.00 Q75.26 -6.00 123.50 30.00" stroke="${PAPER}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <circle cx="75.26" cy="15.95" r="5" fill="${MARIGOLD}"/>
</svg>`

const WORDMARK_URI = `data:image/svg+xml;base64,${Buffer.from(WORDMARK).toString('base64')}`

// Poppins is the brand face. If Google Fonts is unreachable at render time we fall
// back to the font Next bundles with ImageResponse rather than failing the image.
async function poppins(weight) {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Poppins:wght@${weight}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    }).then(r => r.text())
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    if (!url) return null
    const data = await fetch(url).then(r => r.arrayBuffer())
    return { name: 'Poppins', data, style: 'normal', weight }
  } catch {
    return null
  }
}

export default async function Image() {
  const fonts = (await Promise.all([poppins(300), poppins(500)])).filter(Boolean)
  const font = fonts.length ? 'Poppins' : undefined

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: NAVY,
          padding: '76px 88px',
          fontFamily: font,
        }}
      >
        <div style={{ display: 'flex', borderTop: `6px solid ${MARIGOLD}`, width: 96, paddingTop: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: '0.20em',
              textTransform: 'uppercase',
              color: MARIGOLD,
              marginBottom: 26,
            }}
          >
            Adam Waldman, CFA
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 300,
              lineHeight: 1.18,
              color: PAPER,
              maxWidth: 940,
              letterSpacing: '-0.015em',
            }}
          >
            Builds the systems that turn information into decisions.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div
            style={{
              fontSize: 21,
              fontWeight: 300,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: MIST,
            }}
          >
            Data and Analytics  ·  Insight Strategy  ·  Decision Systems
          </div>
          <img src={WORDMARK_URI} width={126} height={60} alt="" />
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  )
}
