export type WeatherCurrent = {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  precipitationProbability: number
  uvIndex: number
  weatherCode: number
  condition: string
  emoji: string
  isDay: boolean
  updatedAt: Date
}

export type WeatherForecastDay = {
  date: string
  tempMax: number
  tempMin: number
  precipitationSum: number
  weatherCode: number
  condition: string
  emoji: string
}

export type WeatherData = {
  current: WeatherCurrent
  forecast: WeatherForecastDay[]
  location: { lat: number; lon: number; city: string }
}

const WMO_CODES: Record<number, { condition: string; emoji: string }> = {
  0: { condition: 'Clear sky', emoji: '☀️' },
  1: { condition: 'Mainly clear', emoji: '🌤️' },
  2: { condition: 'Partly cloudy', emoji: '⛅' },
  3: { condition: 'Overcast', emoji: '☁️' },
  45: { condition: 'Foggy', emoji: '🌫️' },
  48: { condition: 'Icy fog', emoji: '🌫️' },
  51: { condition: 'Light drizzle', emoji: '🌦️' },
  53: { condition: 'Drizzle', emoji: '🌦️' },
  55: { condition: 'Heavy drizzle', emoji: '🌧️' },
  61: { condition: 'Light rain', emoji: '🌧️' },
  63: { condition: 'Rain', emoji: '🌧️' },
  65: { condition: 'Heavy rain', emoji: '🌧️' },
  71: { condition: 'Light snow', emoji: '❄️' },
  73: { condition: 'Snow', emoji: '❄️' },
  75: { condition: 'Heavy snow', emoji: '☃️' },
  80: { condition: 'Rain showers', emoji: '🌦️' },
  81: { condition: 'Showers', emoji: '🌧️' },
  82: { condition: 'Heavy showers', emoji: '⛈️' },
  95: { condition: 'Thunderstorm', emoji: '⛈️' },
  96: { condition: 'Thunderstorm with hail', emoji: '⛈️' },
  99: { condition: 'Thunderstorm with heavy hail', emoji: '⛈️' },
}

export function interpretWeatherCode(code: number): { condition: string; emoji: string } {
  return WMO_CODES[code] ?? { condition: 'Unknown', emoji: '🌡️' }
}

export async function fetchCommunityWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(lat))
    url.searchParams.set('longitude', String(lon))
    url.searchParams.set(
      'current',
      [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'wind_speed_10m',
        'wind_direction_10m',
        'precipitation_probability',
        'uv_index',
        'weather_code',
        'is_day',
      ].join(',')
    )
    url.searchParams.set(
      'daily',
      ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'].join(',')
    )
    url.searchParams.set('timezone', 'auto')
    url.searchParams.set('forecast_days', '7')

    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 },
    })

    if (!res.ok) return null

    const data = await res.json()
    const current = data.current
    const interpreted = interpretWeatherCode(Number(current.weather_code))

    return {
      current: {
        temperature: Math.round(Number(current.temperature_2m)),
        feelsLike: Math.round(Number(current.apparent_temperature)),
        humidity: Number(current.relative_humidity_2m),
        windSpeed: Math.round(Number(current.wind_speed_10m)),
        windDirection: Number(current.wind_direction_10m),
        precipitationProbability: Number(current.precipitation_probability),
        uvIndex: Number(current.uv_index),
        weatherCode: Number(current.weather_code),
        condition: interpreted.condition,
        emoji: interpreted.emoji,
        isDay: Number(current.is_day) === 1,
        updatedAt: new Date(),
      },
      forecast: ((data.daily?.time ?? []) as string[]).map((date, index) => {
        const forecastCode = Number(data.daily.weather_code[index])
        const forecastInterpreted = interpretWeatherCode(forecastCode)
        return {
          date,
          tempMax: Math.round(Number(data.daily.temperature_2m_max[index])),
          tempMin: Math.round(Number(data.daily.temperature_2m_min[index])),
          precipitationSum: Number(data.daily.precipitation_sum[index]),
          weatherCode: forecastCode,
          condition: forecastInterpreted.condition,
          emoji: forecastInterpreted.emoji,
        }
      }),
      location: { lat, lon, city: '' },
    }
  } catch {
    return null
  }
}
