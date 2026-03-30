import { fetchCommunityWeather } from '@/lib/weather';

interface WeatherForecast {
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

export async function getWeatherForecast(
  _date: Date,
  latitude: number,
  longitude: number
): Promise<WeatherForecast | null> {
  const weather = await fetchCommunityWeather(latitude, longitude);
  if (!weather) {
    return null;
  }

  const current = weather.current;
  return {
    temp: current.temperature,
    feelsLike: current.feelsLike,
    condition: current.condition,
    description: current.condition,
    icon: current.weatherCode.toString(),
    humidity: current.humidity,
    windSpeed: current.windSpeed,
    precipitation: current.precipitationProbability,
  };
}

export function isOutdoorAmenity(amenityType: string): boolean {
  const outdoorTypes = [
    'pool', 'swimming pool', 'tennis', 'basketball', 
    'bbq', 'barbecue', 'playground', 'garden', 
    'rooftop', 'terrace', 'outdoor'
  ];
  
  return outdoorTypes.some(type => amenityType.toLowerCase().includes(type));
}

export function getWeatherEmoji(condition: string): string {
  const emojiMap: { [key: string]: string } = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
  };
  
  return emojiMap[condition] || '🌤️';
}

export function generateWeatherHTML(weather: WeatherForecast): string {
  return `
    <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border-left: 4px solid #0284c7; padding: 20px; border-radius: 12px; margin: 25px 0;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 24px; margin-bottom: 10px;">
            ${getWeatherEmoji(weather.condition)} <strong>${weather.temp}°C</strong>
          </div>
          <div style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin-bottom: 5px;">
            ${weather.condition} - ${weather.description}
          </div>
          <div style="color: #075985; font-size: 14px;">
            Feels like ${weather.feelsLike}°C
          </div>
        </div>
        <div style="text-align: right; color: #0c4a6e; font-size: 13px;">
          <div>💧 Humidity: ${weather.humidity}%</div>
          <div>💨 Wind: ${weather.windSpeed} km/h</div>
          <div>🌧️ Rain: ${weather.precipitation}%</div>
        </div>
      </div>
      ${weather.precipitation > 50 ? `
        <div style="margin-top: 15px; padding: 12px; background: #fef3c7; border-radius: 8px; color: #92400e; font-size: 14px;">
          ⚠️ High chance of rain (${weather.precipitation}%). You may want to check the forecast before your booking.
        </div>
      ` : ''}
    </div>
  `;
}
