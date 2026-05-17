import { getWeatherForecast } from './weather';

// Standard JD-based moon phase — works correctly for modern dates
function getMoonData(date) {
  const d = new Date(date);
  const year  = d.getFullYear();
  const month = d.getMonth() + 1;
  const day   = d.getDate();
  const jd =
    367 * year -
    Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) +
    Math.floor(275 * month / 9) +
    day + 1721013.5;
  const phase = ((jd - 2451550.1) / 29.53058868) % 1;
  const idx   = Math.round((phase < 0 ? phase + 1 : phase) * 8) % 8;

  const phases = [
    { name:'New Moon',        icon:'🌑', illumination:0,   darkSky:true,  score:10 },
    { name:'Waxing Crescent', icon:'🌒', illumination:25,  darkSky:true,  score:8  },
    { name:'First Quarter',   icon:'🌓', illumination:50,  darkSky:false, score:6  },
    { name:'Waxing Gibbous',  icon:'🌔', illumination:75,  darkSky:false, score:4  },
    { name:'Full Moon',       icon:'🌕', illumination:100, darkSky:false, score:10 },
    { name:'Waning Gibbous',  icon:'🌖', illumination:75,  darkSky:false, score:4  },
    { name:'Last Quarter',    icon:'🌗', illumination:50,  darkSky:false, score:6  },
    { name:'Waning Crescent', icon:'🌘', illumination:25,  darkSky:true,  score:8  },
  ];
  return phases[idx];
}

// Rough light-pollution estimate (1 = city, 10 = pristine dark sky)
function getLightPollutionScore(lat, lng) {
  const CITIES = [
    { lat:40.713, lng:-74.006, r:1.5 }, // NYC
    { lat:34.052, lng:-118.244, r:2.0 }, // LA
    { lat:41.878, lng:-87.630, r:1.5  }, // Chicago
    { lat:29.760, lng:-95.370, r:1.0  }, // Houston
    { lat:33.448, lng:-112.074, r:1.0 }, // Phoenix
    { lat:37.775, lng:-122.419, r:1.0 }, // SF
    { lat:47.606, lng:-122.332, r:0.8 }, // Seattle
    { lat:39.739, lng:-104.990, r:0.8 }, // Denver
    { lat:30.267, lng:-97.743, r:0.8  }, // Austin
    { lat:25.762, lng:-80.192, r:0.8  }, // Miami
  ];
  for (const c of CITIES) {
    const dist = Math.hypot(lat - c.lat, lng - c.lng);
    if (dist < c.r)       return 2;
    if (dist < c.r * 2)   return 4;
    if (dist < c.r * 3)   return 6;
  }
  if (lat > 45 || (lng < -110 && lat > 35) || (lng < -100 && lat < 35)) return 9;
  return 7;
}

// Combined stargazing score (0–100)
function getStargazingScore(weather, moon, lightPollution) {
  let score = 0;
  if      (weather.code === 0) score += 40;
  else if (weather.code <= 1)  score += 30;
  else if (weather.code <= 2)  score += 20;
  score += (moon.score / 10) * 30;
  score += (lightPollution / 10) * 30;
  return Math.round(score);
}

// Known bioluminescence spots
function getBioluminescence(lat, lng, month) {
  const SPOTS = [
    { name:'Mosquito Bay, PR',       lat:18.07, lng:-65.44, peak:[5,6,7,8,9,10] },
    { name:'Tomales Bay, CA',         lat:38.15, lng:-122.89, peak:[7,8,9,10] },
    { name:'Mission Bay, CA',         lat:32.77, lng:-117.23, peak:[6,7,8,9] },
    { name:'Bioluminescent Bay, PR',  lat:17.96, lng:-66.87, peak:[4,5,6,7,8,9,10,11] },
    { name:'Indian River Lagoon, FL', lat:27.98, lng:-80.54, peak:[7,8,9,10] },
    { name:'Manele Bay, HI',          lat:20.73, lng:-156.88, peak:[1,2,3,4,5,6,7,8,9,10,11,12] },
  ];
  for (const s of SPOTS) {
    if (Math.hypot(lat - s.lat, lng - s.lng) < 0.5 && s.peak.includes(month)) {
      return { likely:true, spot:s.name, score:10 };
    }
  }
  return { likely:false, score:0 };
}

// Meteor shower calendar
function getMeteorShowers(date) {
  const d     = new Date(date);
  const month = d.getMonth() + 1;
  const day   = d.getDate();
  return [
    { name:'Quadrantids',  peak:'Jan 3–4',    months:[1],  days:[1,2,3,4,5],       rate:120 },
    { name:'Lyrids',       peak:'Apr 22–23',  months:[4],  days:[20,21,22,23,24],  rate:20  },
    { name:'Eta Aquariids',peak:'May 5–6',    months:[5],  days:[3,4,5,6,7],       rate:60  },
    { name:'Perseids',     peak:'Aug 11–13',  months:[8],  days:[9,10,11,12,13,14],rate:100 },
    { name:'Orionids',     peak:'Oct 21–22',  months:[10], days:[19,20,21,22,23],  rate:25  },
    { name:'Leonids',      peak:'Nov 17–18',  months:[11], days:[15,16,17,18,19],  rate:15  },
    { name:'Geminids',     peak:'Dec 13–14',  months:[12], days:[11,12,13,14,15],  rate:150 },
  ].filter(s => s.months.includes(month) && s.days.includes(day));
}

// Aurora probability by latitude
function getNorthernLights(lat) {
  if (lat >= 65) return { likely:true, probability:'High',      score:10 };
  if (lat >= 60) return { likely:true, probability:'Moderate',  score:7  };
  if (lat >= 55) return { likely:true, probability:'Low',       score:4  };
  if (lat >= 45) return { likely:false, probability:'Rare',     score:1  };
  return             { likely:false, probability:'Very Rare', score:0  };
}

// Night experiences per place type
function getNightExperiences(place, stargazing, moon) {
  const cat = place.category || place.type || '';
  const experiences = [];

  if (cat === 'waterfall')
    experiences.push({ icon:'🌊', title:'Moonlit Waterfall',
      description:'Waterfalls look magical in moonlight with long exposure photography',
      bestCondition: moon.illumination > 60 ? 'Perfect tonight' : 'Better on full moon' });

  if (cat === 'cave')
    experiences.push({ icon:'🦇', title:'Cave Night Life',
      description:'Bats emerge at dusk — thousands can stream from cave entrances',
      bestCondition:'Every evening at sunset' });

  if (cat === 'beach')
    experiences.push({ icon:'🌊', title:'Phosphorescent Waves',
      description:'Some beaches glow blue at night from bioluminescent plankton',
      bestCondition:'New moon nights are brightest' });

  if (stargazing.score > 60)
    experiences.push({ icon:'🌌', title:'Milky Way Photography',
      description:'Dark skies reveal the full Milky Way band on clear moonless nights',
      bestCondition: moon.darkSky ? 'Perfect tonight!' : 'Wait for new moon' });

  experiences.push({ icon:'🦉', title:'Nocturnal Wildlife',
    description:'Owls, foxes, deer and other animals are most active after dark',
    bestCondition:'Every night year-round' });

  if (cat === 'viewpoint')
    experiences.push({ icon:'🌃', title:'City Lights Vista',
      description:'Distant city lights create a stunning glittering panorama',
      bestCondition:'Clear nights with low humidity' });

  return experiences;
}

// ── Exports ──────────────────────────────────────────────────────────────────

export { getMeteorShowers, getMoonData };

// Quick summary of tonight's sky (no location needed)
export function getTonightSkyData() {
  const now = new Date();
  return { moon: getMoonData(now), meteors: getMeteorShowers(now) };
}

export async function getNightExplorerData(place) {
  const lat = place.lat ?? place.coordinates?.lat;
  const lng = place.lng ?? place.coordinates?.lng;
  if (!lat || !lng) return null;

  const weather = await getWeatherForecast(lat, lng);
  if (!weather) return null;

  const today  = weather.days[0];
  const month  = new Date().getMonth() + 1;
  const moon   = getMoonData(new Date(), lat, lng);
  const lp     = getLightPollutionScore(lat, lng);
  const sgScore = getStargazingScore(today, moon, lp);
  const bio    = getBioluminescence(lat, lng, month);
  const meteors = getMeteorShowers(new Date());
  const aurora = getNorthernLights(lat);
  const experiences = getNightExperiences(place, { score: sgScore }, moon);

  const nightScore = Math.round(
    sgScore * 0.6 +
    bio.score * 0.8 +
    aurora.score * 0.8 +
    (meteors.length > 0 ? 10 : 0)
  );

  const bestNight = weather.days.reduce((best, day) => {
    const s = getStargazingScore(day, moon, lp);
    return s > (best.score || 0) ? { ...day, score: s } : best;
  }, {});

  return { moon, lightPollution:lp, stargazingScore:sgScore,
           bio, meteors, aurora, experiences,
           nightScore: Math.min(100, nightScore),
           bestNight, weather: today };
}
