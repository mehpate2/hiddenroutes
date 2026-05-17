import { getWeatherForecast } from './weather';

// Golden hour window around sunrise / sunset
function getGoldenHour(sunrise, sunset) {
  const sr = new Date(sunrise);
  const ss = new Date(sunset);
  return {
    morningGolden: {
      start: new Date(sr.getTime() - 30 * 60000),
      end:   new Date(sr.getTime() + 45 * 60000),
    },
    eveningGolden: {
      start: new Date(ss.getTime() - 45 * 60000),
      end:   new Date(ss.getTime() + 30 * 60000),
    },
  };
}

// Moon phase — anchored to a known new moon
const KNOWN_NEW_MOON = new Date('2024-01-11T11:57:00Z').getTime();
const SYNODIC_MS    = 29.53058867 * 24 * 3600 * 1000;

function getMoonPhase(dateStr) {
  const phases = [
    { name: 'New Moon',        icon: '🌑', score: 10 },
    { name: 'Waxing Crescent', icon: '🌒', score: 6  },
    { name: 'First Quarter',   icon: '🌓', score: 7  },
    { name: 'Waxing Gibbous',  icon: '🌔', score: 8  },
    { name: 'Full Moon',       icon: '🌕', score: 10 },
    { name: 'Waning Gibbous',  icon: '🌖', score: 8  },
    { name: 'Last Quarter',    icon: '🌗', score: 7  },
    { name: 'Waning Crescent', icon: '🌘', score: 5  },
  ];
  const d = new Date(dateStr + 'T12:00:00Z').getTime();
  let phase = ((d - KNOWN_NEW_MOON) % SYNODIC_MS) / SYNODIC_MS;
  if (phase < 0) phase += 1;
  return phases[Math.round(phase * 8) % 8];
}

// Season — corrected for southern hemisphere
function getSeason(lat, dateStr) {
  const month = new Date(dateStr + 'T12:00:00Z').getUTCMonth() + 1;
  const north  = lat >= 0;
  const SEA = {
    spring: { name:'Spring', icon:'🌸', score:9,  highlights:['Wildflowers blooming','Waterfalls at peak flow','Wildlife active'] },
    summer: { name:'Summer', icon:'☀️',  score:8,  highlights:['Long daylight hours','Hiking season','Clear skies'] },
    fall:   { name:'Fall',   icon:'🍂', score:10, highlights:['Fall foliage peak','Cooler temperatures','Less crowds'] },
    winter: { name:'Winter', icon:'❄️',  score:7,  highlights:['Snow-covered landscapes','Frozen waterfalls','Solitude'] },
  };
  if (north) {
    if ([3,4,5].includes(month))  return SEA.spring;
    if ([6,7,8].includes(month))  return SEA.summer;
    if ([9,10,11].includes(month)) return SEA.fall;
    return SEA.winter;
  }
  if ([9,10,11].includes(month))  return SEA.spring;
  if ([12,1,2].includes(month))   return SEA.summer;
  if ([3,4,5].includes(month))    return SEA.fall;
  return SEA.winter;
}

// Crowd score 1–10 (10 = empty, 1 = packed)
function getCrowdScore(dateStr, placeType) {
  const d    = new Date(dateStr + 'T12:00:00Z');
  const dow   = d.getUTCDay();
  const month = d.getUTCMonth() + 1;
  const mmdd  = `${String(month).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  const HOLIDAYS = ['01-01','07-04','11-11','12-25','12-31'];

  let score = 10;
  if (HOLIDAYS.includes(mmdd))          score -= 6;
  else if (dow === 0 || dow === 6)       score -= 4;
  else if (dow === 1 || dow === 5)       score -= 2;
  if ([6,7,8].includes(month))           score -= 2;
  if (['nature','waterfall','cave'].includes(placeType) && dow !== 0 && dow !== 6) score += 1;
  return Math.max(1, Math.min(10, score));
}

// Detect rare natural conditions
function getSpecialEvents(weather, place) {
  const days   = weather.days;
  const events = [];
  const today  = days[0];
  const prec0  = today?.precipitation ?? 0;
  const code0  = today?.code ?? 99;
  const wind0  = today?.windSpeed ?? 0;

  if (prec0 > 2 && code0 <= 2)
    events.push({ icon:'🌈', label:'Rainbow likely', description:'Clear sky after rain creates perfect rainbow conditions', rarity:'rare' });

  if (days.slice(0,3).some(d => (d.precipitation??0) > 5) && place.category === 'waterfall')
    events.push({ icon:'💧', label:'Peak waterfall flow', description:'Recent rainfall means maximum water flow', rarity:'special' });

  if (code0 <= 2 && wind0 < 15)
    events.push({ icon:'📸', label:'Perfect photography conditions', description:'Clear sky, low wind — ideal for stunning shots', rarity:'good' });

  if (days.slice(1,4).some(d => d.code > 3) && code0 <= 2)
    events.push({ icon:'✨', label:'First clear day after clouds', description:'Air is clearest right after a cloudy period', rarity:'special' });

  if (code0 >= 80 && code0 < 95)
    events.push({ icon:'⛅', label:'Dramatic storm clouds', description:'Moody dramatic skies perfect for landscape photography', rarity:'special' });

  return events;
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function calculatePerfectMoment(place) {
  const lat = place.lat ?? place.coordinates?.lat;
  const lng = place.lng ?? place.coordinates?.lng;
  if (!lat || !lng) return null;

  const weather = await getWeatherForecast(lat, lng);
  if (!weather) return null;

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const moments = weather.days.map(day => {
    const { morningGolden, eveningGolden } = getGoldenHour(day.sunrise, day.sunset);
    const moon       = getMoonPhase(day.date);
    const season     = getSeason(lat, day.date);
    const crowdScore = getCrowdScore(day.date, place.category || place.type);
    const events     = getSpecialEvents(weather, place);

    // Weather (40 pts max)
    let score = 0;
    if      (day.code === 0) score += 40;
    else if (day.code <= 2)  score += 32;
    else if (day.code === 3) score += 20;
    else if (day.code <= 55) score += 10;
    else if (day.code <= 65) score += 5;

    // Temperature comfort — °C ranges (20 pts max)
    const avg = (day.maxTemp + day.minTemp) / 2;
    if      (avg >= 18 && avg <= 27) score += 20;
    else if (avg >= 13 && avg <= 29) score += 15;
    else if (avg >= 7  && avg <= 32) score += 10;
    else score += 5;

    score += crowdScore * 2;              // crowd  (20 pts max)
    score += (season.score / 10) * 10;   // season (10 pts max)
    score += Math.min(events.length * 4, 10); // events (10 pts max)

    const fmt = d => d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    const bestTimes = [];
    if (day.code <= 2) bestTimes.push({ time: fmt(morningGolden.start), label:'🌅 Morning Golden Hour', description:'Warm golden light, very few visitors' });
    if (day.code <= 3) bestTimes.push({ time:'10:00 AM', label:'☀️ Mid Morning', description:'Good light, comfortable temperature' });
    if (day.code <= 2) bestTimes.push({ time: fmt(eveningGolden.start), label:'🌇 Evening Golden Hour', description:'Magical light, dramatic colors' });

    const daysUntil = Math.round((new Date(day.date + 'T00:00:00') - todayMidnight) / 86400000);

    return {
      date: day.date,
      daysUntil,
      score: Math.round(score),
      weather: day,
      moon,
      season,
      crowdScore,
      events,
      bestTimes,
      label: daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`,
    };
  });

  const sorted        = [...moments].sort((a, b) => b.score - a.score);
  const perfectMoment = sorted[0];
  const avgScore      = Math.round(moments.reduce((s, m) => s + m.score, 0) / moments.length);
  const rarity        = perfectMoment.score > 85
    ? `Once-in-${Math.round(30 * (perfectMoment.score / 100))} days opportunity`
    : perfectMoment.score > 70
    ? 'Great opportunity this week'
    : 'Best available this week';

  return { moments, perfectMoment, rarity, avgScore };
}
