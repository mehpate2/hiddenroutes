const WMO_CODES = {
  0:  { label: 'Clear Sky',             icon: '☀️',  good: true  },
  1:  { label: 'Mainly Clear',           icon: '🌤',  good: true  },
  2:  { label: 'Partly Cloudy',          icon: '⛅️',  good: true  },
  3:  { label: 'Overcast',              icon: '☁️',  good: false },
  45: { label: 'Foggy',                 icon: '🌫',  good: false },
  48: { label: 'Icy Fog',               icon: '🌫',  good: false },
  51: { label: 'Light Drizzle',         icon: '🌦',  good: false },
  53: { label: 'Drizzle',               icon: '🌦',  good: false },
  55: { label: 'Heavy Drizzle',         icon: '🌧',  good: false },
  61: { label: 'Light Rain',            icon: '🌧',  good: false },
  63: { label: 'Rain',                  icon: '🌧',  good: false },
  65: { label: 'Heavy Rain',            icon: '🌧',  good: false },
  71: { label: 'Light Snow',            icon: '🌨',  good: false },
  73: { label: 'Snow',                  icon: '❄️',  good: false },
  75: { label: 'Heavy Snow',            icon: '❄️',  good: false },
  77: { label: 'Snow Grains',           icon: '🌨',  good: false },
  80: { label: 'Light Showers',         icon: '🌦',  good: false },
  81: { label: 'Showers',              icon: '🌧',  good: false },
  82: { label: 'Heavy Showers',         icon: '⛈',  good: false },
  85: { label: 'Snow Showers',          icon: '🌨',  good: false },
  86: { label: 'Heavy Snow Showers',    icon: '❄️',  good: false },
  95: { label: 'Thunderstorm',          icon: '⛈',  good: false },
  96: { label: 'Thunderstorm + Hail',   icon: '⛈',  good: false },
  99: { label: 'Heavy Thunderstorm',    icon: '⛈',  good: false },
};

export async function getWeatherForecast(lat, lng) {
  try {
    const cacheKey = `weather_${lat?.toFixed(2)}_${lng?.toFixed(2)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, time } = JSON.parse(cached);
      if (Date.now() - time < 3 * 60 * 60 * 1000) return data;
    }

    // temperatures in °C, wind in mph
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,sunrise,sunset` +
      `&timezone=auto&forecast_days=7&wind_speed_unit=mph`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const raw = await res.json();

    const days = raw.daily.time.map((date, i) => ({
      date,
      code: raw.daily.weathercode[i],
      maxTemp: Math.round(raw.daily.temperature_2m_max[i] ?? 0),   // °C
      minTemp: Math.round(raw.daily.temperature_2m_min[i] ?? 0),   // °C
      precipitation: parseFloat((raw.daily.precipitation_sum[i] ?? 0).toFixed(1)),
      windSpeed: Math.round(raw.daily.windspeed_10m_max[i] ?? 0),  // mph
      sunrise: raw.daily.sunrise[i],
      sunset:  raw.daily.sunset[i],
      ...(WMO_CODES[raw.daily.weathercode[i]] ?? { label: 'Unknown', icon: '🌡', good: false }),
    }));

    const bestDay = days.find(d => d.good) || days[0];
    const result  = { days, bestDay, timezone: raw.timezone };

    sessionStorage.setItem(cacheKey, JSON.stringify({ data: result, time: Date.now() }));
    return result;
  } catch (e) {
    console.error('Weather error:', e);
    return null;
  }
}

export function getDayLabel(dateStr) {
  const date     = new Date(dateStr + 'T00:00:00');
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString())    return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getTravelAdvice(days) {
  const today   = days[0];
  const tomorrow = days[1];
  const weekend  = days.filter((_, i) => i >= 4 && i <= 6);
  const bestDays = days.filter(d => d.good);

  if (today?.good)         return { message: 'Perfect day to visit today!',          type: 'great', icon: '🌟' };
  if (tomorrow?.good)      return { message: 'Tomorrow looks perfect for visiting!',  type: 'good',  icon: '👍' };
  if (weekend.some(d=>d.good)) return { message: 'Great weather this weekend!',       type: 'good',  icon: '🎉' };
  if (bestDays.length > 0) return { message: `Best day: ${getDayLabel(bestDays[0].date)}`, type: 'ok', icon: '📅' };
  return { message: 'Rough week ahead — check back soon', type: 'bad', icon: '⚠️' };
}

// °C → display string based on stored preference
export function displayTemp(celsius, unit = 'F') {
  if (unit === 'F') return Math.round(celsius * 9 / 5 + 32) + '°F';
  return celsius + '°C';
}
