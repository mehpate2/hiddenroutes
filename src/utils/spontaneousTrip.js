import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { calculatePerfectMoment } from './perfectMoment';

function getDistance(lat1, lng1, lat2, lng2) {
  const R    = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDriveTime(miles) {
  const h = miles / 55;
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
}

export async function findSpontaneousTrip(userLat, userLng, preferences = {}) {
  const {
    maxDriveHours = 2,
    categories    = ['nature', 'waterfall', 'hidden', 'viewpoint'],
  } = preferences;
  const maxMiles = maxDriveHours * 55;
  const catSet   = new Set(categories);

  try {
    // Query both curated collections — fetch all, filter client-side to avoid index requirements
    const [verifiedSnap, redditSnap] = await Promise.all([
      getDocs(collection(db, 'verified_places')),
      getDocs(collection(db, 'reddit_places')),
    ]);

    const verified = verifiedSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'verified' }));
    const reddit   = redditSnap.docs
      .map(d => ({ id: d.id, ...d.data(), source: 'reddit' }))
      .filter(p => p.approved === true && (p.score || 0) >= 60);

    const allPlaces = [...verified, ...reddit];
    if (!allPlaces.length) return null;

    // Filter by drive radius
    const nearby = allPlaces.filter(p => {
      const lat = p.coordinates?.lat ?? p.lat;
      const lng = p.coordinates?.lng ?? p.lng;
      if (!lat || !lng) return false;
      return getDistance(userLat, userLng, lat, lng) <= maxMiles;
    });

    if (!nearby.length) return null;

    // Score each candidate (cap at 15 to limit API calls)
    const scored = await Promise.all(
      nearby.slice(0, 15).map(async place => {
        const lat      = place.coordinates?.lat ?? place.lat;
        const lng      = place.coordinates?.lng ?? place.lng;
        const distance = getDistance(userLat, userLng, lat, lng);
        const driveTime = getDriveTime(distance);

        const momentData  = await calculatePerfectMoment({ ...place, lat, lng });
        const momentScore = momentData?.perfectMoment?.score || 50;
        const catMatch    = (catSet.has(place.category) || catSet.has(place.type)) ? 20 : 0;
        const distScore   = Math.max(0, 20 - (distance / maxMiles) * 20);

        return {
          ...place,
          lat, lng,
          distance:    Math.round(distance),
          driveTime,
          momentScore,
          totalScore:  momentScore + catMatch + distScore,
          moment:      momentData?.perfectMoment,
          events:      momentData?.perfectMoment?.events || [],
        };
      })
    );

    scored.sort((a, b) => b.totalScore - a.totalScore);
    return scored[0] || null;
  } catch (e) {
    console.error('Spontaneous trip error:', e);
    return null;
  }
}
