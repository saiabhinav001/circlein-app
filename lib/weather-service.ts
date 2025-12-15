/**
 * WEATHER SERVICE
 * Fetch weather forecast for outdoor amenities
 * Using Open-Meteo API (FREE, NO API KEY REQUIRED)
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
    // Open-Meteo API - FREE, no API key needed!
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&timezone=auto`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Weather API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    // Find forecast closest to booking date
    const targetTime = date.getTime();
    let closestIndex = 0;
    let minDiff = Math.abs(new Date(data.hourly.time[0]).getTime() - targetTime);

    for (let i = 0; i < data.hourly.time.length; i++) {
      const forecastTime = new Date(data.hourly.time[i]).getTime();
      const diff = Math.abs(forecastTime - targetTime);
      
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    const weatherCode = data.hourly.weather_code[closestIndex];
    const { condition, description } = getWeatherCondition(weatherCode);

    return {
      temp: Math.round(data.hourly.temperature_2m[closestIndex]),
      feelsLike: Math.round(data.hourly.apparent_temperature[closestIndex]),
      condition,
      description,
      icon: getWeatherIcon(weatherCode),
      humidity: Math.round(data.hourly.relative_humidity_2m[closestIndex]),
      windSpeed: Math.round(data.hourly.wind_speed_10m[closestIndex]),
      precipitation: Math.round(data.hourly.precipitation_probability[closestIndex] || 0)
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

// Convert Open-Meteo weather codes to conditions
function getWeatherCondition(code: number): { condition: string; description: string } {
  if (code === 0) return { condition: 'Clear', description: 'Clear sky' };
  if (code <= 3) return { condition: 'Clouds', description: 'Partly cloudy' };
  if (code <= 48) return { condition: 'Fog', description: 'Foggy' };
  if (code <= 67) return { condition: 'Rain', description: 'Rainy' };
  if (code <= 77) return { condition: 'Snow', description: 'Snowy' };
  if (code <= 82) return { condition: 'Rain', description: 'Rain showers' };
  if (code <= 86) return { condition: 'Snow', description: 'Snow showers' };
  if (code <= 99) return { condition: 'Thunderstorm', description: 'Thunderstorm' };
  return { condition: 'Unknown', description: 'Weather unavailable' };
}

// Get weather icon based on code
function getWeatherIcon(code: number): string {
  if (code === 0) return '01d';
  if (code <= 3) return '02d';
  if (code <= 48) return '50d';
  if (code <= 67) return '10d';
  if (code <= 77) return '13d';
  if (code <= 82) return '09d';
  if (code <= 86) return '13d';
  if (code <= 99) return '11d';
  return '01d';
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
