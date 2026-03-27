import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CircleIn - Community Amenity Booking',
    short_name: 'CircleIn',
    description: 'Premium community operations and amenity booking',
    start_url: '/',
    display: 'standalone',
    background_color: '#0C0C0D',
    theme_color: '#10B981',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/favicon.png',
        sizes: '32x32',
        type: 'image/png'
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  }
}