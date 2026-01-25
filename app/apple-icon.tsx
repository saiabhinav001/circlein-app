export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/svg+xml'

export default function AppleIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#2563EB;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="180" height="180" rx="36" fill="url(#grad)"/>
    <text x="90" y="130" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="white" text-anchor="middle">C</text>
  </svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
