export async function geocodeAddress(address) {
  try {
    const encoded = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=us`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HiddenRoutes/1.0' } });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), confidence: 'high' };
    }
    return null;
  } catch (e) {
    console.error('Geocoding failed:', address, e);
    return null;
  }
}
