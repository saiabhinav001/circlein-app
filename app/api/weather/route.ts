import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { fetchCommunityWeather } from '@/lib/weather'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const communityId = (session.user as any)?.communityId
    if (!communityId) {
      return NextResponse.json({ error: 'community_not_found' }, { status: 400 })
    }

    const settingsSnap = await adminDb.collection('settings').doc(communityId).get()
    const settingsData = settingsSnap.data() || {}
    const communitySettings = (settingsData.community || {}) as Record<string, any>

    const latRaw = communitySettings.latitude ?? settingsData.latitude
    const lonRaw = communitySettings.longitude ?? settingsData.longitude
    const city = String(communitySettings.city ?? settingsData.city ?? '')

    const lat = Number(latRaw)
    const lon = Number(lonRaw)

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'location_not_configured' })
    }

    const weather = await fetchCommunityWeather(lat, lon)
    if (!weather) {
      return NextResponse.json({ error: 'weather_unavailable' }, { status: 502 })
    }

    weather.location.city = city

    return NextResponse.json(weather, {
      headers: {
        'Cache-Control': 'public, max-age=1800',
      },
    })
  } catch (error) {
    console.error('Failed to fetch community weather:', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
