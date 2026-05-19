const DNA_TYPES = {
  nature:   { type:'WILDERNESS SEEKER',       icon:'🌲', color:'#1D9E75', description:'You are drawn to remote wilderness and untouched landscapes'          },
  waterfall:{ type:'CASCADE CHASER',          icon:'💧', color:'#2B9FAA', description:'Waterfalls and flowing water call to your adventurous spirit'           },
  hidden:   { type:'SECRET HUNTER',           icon:'✦',  color:'#c9a84c', description:'You seek places unknown to most — the more hidden the better'           },
  viewpoint:{ type:'SUMMIT SEEKER',           icon:'🔭', color:'#4A7FC1', description:'High places and panoramic views are your ultimate reward'               },
  beach:    { type:'SHORE WANDERER',          icon:'🌊', color:'#0EA5E9', description:'The call of the ocean and hidden coves never gets old'                   },
  historic: { type:'TIME TRAVELER',           icon:'🏛', color:'#B05C3A', description:'History and ancient places connect you to something deeper'              },
  cave:     { type:'UNDERGROUND EXPLORER',    icon:'🦇', color:'#7C3AED', description:'The hidden depths of the earth fascinate your curious mind'              },
};

export function trackPlaceView(place, userId) {
  if (!userId) return;
  const history = JSON.parse(localStorage.getItem(`dna_${userId}`) || '{}');
  const category = place.category || 'nature';
  const state    = place.state || place._stateAbbr || 'Unknown';
  history.categories = history.categories || {};
  history.categories[category] = (history.categories[category] || 0) + 1;
  history.states = history.states || {};
  history.states[state] = (history.states[state] || 0) + 1;
  history.totalViewed = (history.totalViewed || 0) + 1;
  history.lastActive  = new Date().toISOString();
  localStorage.setItem(`dna_${userId}`, JSON.stringify(history));
}

export function calculateDNA(userId) {
  const history    = JSON.parse(localStorage.getItem(`dna_${userId}`) || '{}');
  const categories = history.categories || {};
  const states     = history.states     || {};

  const topCat    = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'nature';
  const topStates = Object.entries(states).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);
  const dna       = DNA_TYPES[topCat] || DNA_TYPES.nature;

  const totalViewed  = history.totalViewed || 0;
  const uniqueStates = Object.keys(states).length;
  const level        = totalViewed >= 100 ? 'Master Explorer' :
                       totalViewed >= 50  ? 'Legend'          :
                       totalViewed >= 20  ? 'Pathfinder'      : 'Explorer';

  const total = Object.values(categories).reduce((a, b) => a + b, 0) || 1;
  const matchScore = (place) => {
    const cat      = place.category || 'nature';
    const catCount = categories[cat] || 0;
    return Math.round((catCount / total) * 100);
  };

  return { ...dna, topStates, uniqueStates, totalViewed, level, topCategory: topCat, categories, matchScore };
}

export function getPersonalizedPlaces(places, userId) {
  const dna = calculateDNA(userId);
  return places.map(place => ({ ...place, dnaMatch: dna.matchScore(place) }))
               .sort((a, b) => b.dnaMatch - a.dnaMatch);
}
