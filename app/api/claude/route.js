import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) {
      console.error('[/api/claude] Anthropic error', response.status, JSON.stringify(data))
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/claude] fetch failed:', err)
    return NextResponse.json({ error: { message: `API route error: ${err.message}` } }, { status: 500 })
  }
}
