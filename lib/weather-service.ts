/**
 * WEATHER SERVICE
 * Fetch weather forecast for outdoor amenities
 * Using OpenWeatherMap API
 */

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
  date: Date,
  latitude: number,
  longitude: number
): Promise<WeatherForecast | null> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenWeather API key not configured');
      return null;
    }

    // Use 5-day forecast API
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Weather API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    // Find forecast closest to booking date
    const targetTimestamp = Math.floor(date.getTime() / 1000);
    let closestForecast = data.list[0];
    let minDiff = Math.abs(data.list[0].dt - targetTimestamp);

    for (const forecast of data.list) {
      const diff = Math.abs(forecast.dt - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestForecast = forecast;
      }
    }

    return {
      temp: Math.round(closestForecast.main.temp),
      feelsLike: Math.round(closestForecast.main.feels_like),
      condition: closestForecast.weather[0].main,
      description: closestForecast.weather[0].description,
      icon: closestForecast.weather[0].icon,
      humidity: closestForecast.main.humidity,
      windSpeed: Math.round(closestForecast.wind.speed * 3.6), // Convert m/s to km/h
      precipitation: Math.round((closestForecast.pop || 0) * 100) // Probability of precipitation
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
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
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️'
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
