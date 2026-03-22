import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  // Use goqr.me public API — free, no key, high quality PNG
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&ecc=H&data=${encodeURIComponent(url)}`

  const response = await fetch(qrApiUrl)
  const buffer = await response.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000',
      'Content-Disposition': 'inline',
    },
  })
}
