import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CircleIn - Community Amenity Booking',
    short_name: 'CircleIn',
    description: 'Book and manage community amenities with ease',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#3B82F6',
    icons: [
      {
        src: '/favicon.svg',
        sizes: '32x32',
        type: 'image/svg+xml',
      },
      {
        src: '/logo.svg',
        sizes: '120x120',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-touch-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}