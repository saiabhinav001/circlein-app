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
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon'
      },
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  }
}