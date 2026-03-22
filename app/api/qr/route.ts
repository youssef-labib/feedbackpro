import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  try {
    // @ts-ignore
    const QRCode = await import('qrcode')
    const buffer: Buffer = await QRCode.default.toBuffer(url, {
      type: 'png',
      width: 600,
      margin: 3,
      color: { dark: '#0A1628', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (err) {
    console.error('QR error:', err)
    return NextResponse.json({ error: 'QR generation failed' }, { status: 500 })
  }
}