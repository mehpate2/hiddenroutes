const CACHE_TTL = 24 * 60 * 60 * 1000;

function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return undefined;
    const { url, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(key); return undefined; }
    return url; // may be '' (meaning: already looked up, no result)
  } catch { return undefined; }
}

function cacheSet(key, url) {
  try { sessionStorage.setItem(key, JSON.stringify({ url: url || '', ts: Date.now() })); } catch {}
}

// Wikipedia REST API — page summary contains thumbnail/originalimage
async function getWikipediaPhoto(placeName, stateName = '') {
  const titles = stateName
    ? [`${placeName}, ${stateName}`, placeName]
    : [placeName];

  for (const title of titles) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      // Skip disambiguation pages — they don't have useful images
      if (data.type === 'disambiguation') continue;
      const url = data.originalimage?.source || data.thumbnail?.source;
      if (url) return url;
    } catch { /* network error — try next title */ }
  }
  return null;
}

// Main export — tries Wikipedia, caches result 24 hr, returns null on miss
export async function getRealPhoto(place) {
  const name = (place?.name || '').trim();
  const state = (place?.stateName || place?.state || '').trim();
  if (!name) return null;

  const key = `rp_${name}_${state}`.replace(/\s+/g, '_').toLowerCase();
  const cached = cacheGet(key);
  if (cached !== undefined) return cached || null; // '' → null

  const url = await getWikipediaPhoto(name, state);
  cacheSet(key, url);
  return url || null;
}
