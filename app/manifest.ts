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
        src: '/logo.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ]
  }
}