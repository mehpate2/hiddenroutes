const QUIET_CATS = {
  wilderness: 4, cave: 4, 'hidden-road': 3, nature: 3, waterfall: 3,
  trail: 3, lake: 3, forest: 3, viewpoint: 2, beach: 1,
  historic: 1, local: 0, food: -1,
};

const QUIET_WORDS = [
  'remote','secluded','isolated','wilderness','backcountry','primitive',
  'undeveloped','rarely visited','few visitors','hidden','peaceful','tranquil','serene','silent',
];
const NOISY_WORDS = [
  'popular','crowded','busy','tourist','attraction','famous','well-known',
  'parking lot','gift shop','restaurant',
];

const MAJOR_CITIES = [
  { lat:40.71, lng:-74.00 },
  { lat:34.05, lng:-118.24 },
  { lat:41.88, lng:-87.63 },
  { lat:29.76, lng:-95.37 },
  { lat:33.45, lng:-112.07 },
  { lat:37.77, lng:-122.42 },
];

export function calculateSilenceScore(place) {
  const cat  = (place.category || place.type || '').toLowerCase();
  const desc = (place.description || '').toLowerCase();

  let score = 5;
  score += QUIET_CATS[cat] ?? 1;
  QUIET_WORDS.forEach(w => { if (desc.includes(w)) score += 0.5; });
  NOISY_WORDS.forEach(w => { if (desc.includes(w)) score -= 0.5; });

  const lat = place.lat ?? place.coordinates?.lat;
  const lng = place.lng ?? place.coordinates?.lng;
  if (lat && lng) {
    const minDist = Math.min(...MAJOR_CITIES.map(c =>
      Math.sqrt(Math.pow(lat - c.lat, 2) + Math.pow(lng - c.lng, 2))
    ));
    if (minDist > 3)   score += 2;
    else if (minDist > 1.5) score += 1;
  }

  const finalScore = Math.max(1, Math.min(10, Math.round(score)));

  const label = finalScore >= 9 ? 'Pure Silence'  :
                finalScore >= 7 ? 'Very Peaceful'  :
                finalScore >= 5 ? 'Quiet'          :
                finalScore >= 3 ? 'Moderate'       : 'Busy';

  const description = finalScore >= 9 ? 'Extremely remote — you may hear only nature'  :
                      finalScore >= 7 ? 'Very quiet — minimal human noise'              :
                      finalScore >= 5 ? 'Peaceful with occasional visitors'             :
                      finalScore >= 3 ? 'Moderate activity — not ideal for solitude'   :
                                        'Popular spot — expect other visitors';

  const icon = finalScore >= 7 ? '🔇' : finalScore >= 5 ? '🔉' : '🔊';

  return { score: finalScore, label, description, icon };
}
