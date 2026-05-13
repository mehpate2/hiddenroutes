/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function scoreUpvotes(n) {
  if (n >= 5000) return 30; if (n >= 1000) return 25; if (n >= 500) return 20;
  if (n >= 200)  return 15; if (n >= 100)  return 10; if (n >= 50)  return 5;
  return 2;
}
function scoreEngagement(n) {
  if (n >= 200) return 20; if (n >= 100) return 16; if (n >= 50) return 12;
  if (n >= 20)  return 8;  if (n >= 10)  return 4;
  return 1;
}

function extractCoordsFromText(text) {
  if (!text) return null;
  const dec = text.match(/(-?\d{2,3}\.\d{3,})\s*[,;]\s*(-?\d{2,3}\.\d{3,})/);
  if (dec) {
    const lat = parseFloat(dec[1]), lng = parseFloat(dec[2]);
    if (lat >= 18 && lat <= 72 && lng >= -180 && lng <= -65) return { lat, lng, source: 'gps_regex' };
    if (lng >= 18 && lng <= 72 && lat >= -180 && lat <= -65) return { lat: lng, lng: lat, source: 'gps_regex' };
  }
  const gm = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (gm) {
    const lat = parseFloat(gm[1]), lng = parseFloat(gm[2]);
    if (lat >= 18 && lat <= 72 && lng >= -180 && lng <= -65) return { lat, lng, source: 'google_maps_url' };
  }
  return null;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodePlace(name, state) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${name}, ${state}, USA`)}&countrycodes=us&limit=1`, {
      headers: { 'User-Agent': 'HiddenRoutes/1.0 (travel discovery app)', 'Accept': 'application/json' },
    });
    const d = await r.json();
    return d.length > 0 ? { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon), source: 'nominatim' } : null;
  } catch { return null; }
}

async function fetchComments(subreddit, postId) {
  try {
    const r = await fetch(`https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=50&sort=top`, {
      headers: { 'User-Agent': 'HiddenRoutes/1.0 (travel discovery app)', 'Accept': 'application/json' },
    });
    const d = await r.json();
    return (d[1]?.data?.children || []).filter(c => c.kind === 't1').map(c => ({ body: c.data.body || '', score: c.data.score || 0 })).slice(0, 30);
  } catch { return []; }
}

function analyzeCommunity(post, comments) {
  const allText = (post.title + ' ' + post.body + ' ' + comments.map(c => c.body).join(' ')).toLowerCase();
  const beenThere = ['been here','been there','visited this','went here','hiked this','can confirm'].filter(p => allText.includes(p)).length;
  const warnings  = ['closed','private property','trespassing','no longer','dangerous','unsafe'].filter(p => allText.includes(p)).length;
  const coords    = extractCoordsFromText(post.title + ' ' + post.body + ' ' + comments.map(c => c.body).join(' '));
  const allUrls   = [post.postUrl || '', ...comments.map(c => c.body)].join(' ');
  const photos    = [...new Set([...(allUrls.match(/https?:\/\/i\.redd\.it\/[^\s)"'\]]+/g) || []), ...(allUrls.match(/https?:\/\/i\.imgur\.com\/[^\s)"'\]]+\.(?:jpg|jpeg|png|gif)/gi) || [])])].slice(0, 5);
  let cs = 0;
  if (beenThere >= 2) cs += 10; else if (beenThere >= 1) cs += 5;
  if (coords)         cs += 5;
  if (photos.length >= 2) cs += 5; else if (photos.length >= 1) cs += 2;
  if (warnings >= 2)  cs = Math.max(0, cs - 10); else if (warnings >= 1) cs = Math.max(0, cs - 5);
  return { beenThere, warnings, coords, photos, communityScore: cs };
}

async function analyzeWithAI(post, comments) {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 600,
    messages: [{ role: 'user', content: `Analyze for a hidden US places travel app.\nPOST: ${post.title}\nBODY: ${(post.body || '').slice(0, 500)}\nCOMMENTS:\n${comments.slice(0, 8).map(c => c.body.slice(0, 200)).join('\n---\n').slice(0, 700)}\n\nReturn ONLY valid JSON:\n{"isSpecificPlace":bool,"isHiddenGem":bool,"isUS":bool,"name":"str or null","state":"full US state or null","city":"nearest city or null","category":"waterfall|cave|viewpoint|beach|trail|forest|lake|nature|history","hiddenness":1-10,"description":"2 sentences or null","localTip":"1 sentence or null","whyHidden":"1 sentence or null","aiScore":0-30,"approxLat":number or null,"approxLng":number or null}` }],
  });
  const match = msg.content[0].text.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }
  const { subreddit, limit: lim = 100 } = req.body || {};
  if (!subreddit) { res.status(400).json({ error: 'subreddit required' }); return; }

  try {
    const rdRes  = await fetch(`https://www.reddit.com/r/${subreddit}/top.json?limit=${lim}&t=all`, {
      headers: { 'User-Agent': 'HiddenRoutes/1.0 (travel discovery app)', 'Accept': 'application/json' },
    });
    if (!rdRes.ok) throw new Error(`Reddit ${rdRes.status}`);
    const allPosts = ((await rdRes.json())?.data?.children || []).map(c => ({
      id: c.data.id, title: c.data.title || '', body: c.data.selftext || '',
      url: `https://reddit.com${c.data.permalink}`, postUrl: c.data.url || '',
      upvotes: c.data.score || 0, commentCount: c.data.num_comments || 0,
    })).filter(p => p.upvotes >= 50 && (p.title.length + p.body.length) > 20);

    const results = [], seenCoords = [];
    const summary = { autoApproved: 0, pendingReview: 0, autoRejected: 0, skipped: 0 };

    for (let i = 0; i < allPosts.length; i += 5) {
      const batch = allPosts.slice(i, i + 5);
      const batchOut = await Promise.all(batch.map(async (post) => {
        try {
          const comments  = await fetchComments(subreddit, post.id);
          const community = analyzeCommunity(post, comments);
          const ai        = await analyzeWithAI(post, comments);
          if (!ai?.isSpecificPlace || !ai?.isUS || !ai?.isHiddenGem || !ai?.name) return null;
          if ((ai.hiddenness || 0) < 4) return null;

          const total = Math.min(100, scoreUpvotes(post.upvotes) + scoreEngagement(post.commentCount) + community.communityScore + (ai.aiScore || 0));
          const breakdown = { upvotes: scoreUpvotes(post.upvotes), engagement: scoreEngagement(post.commentCount), community: community.communityScore, ai: ai.aiScore || 0 };
          let coords = community.coords;
          if (!coords && ai.approxLat && ai.approxLng) coords = { lat: ai.approxLat, lng: ai.approxLng, source: 'ai' };
          if (!coords && ai.name && ai.state) coords = await geocodePlace(ai.name, ai.state);
          if (coords && seenCoords.some(sc => haversineKm(sc.lat, sc.lng, coords.lat, coords.lng) < 1)) return null;
          if (coords) seenCoords.push(coords);

          const verdict = total >= 70 ? 'auto_approved' : total >= 30 ? 'pending' : 'auto_rejected';
          return { place: { name: ai.name, description: ai.description || '', state: ai.state || '', city: ai.city || '', coordinates: coords ? { lat: coords.lat, lng: coords.lng } : null, coordSource: coords?.source || 'none', category: ai.category || 'nature', why_hidden: ai.whyHidden || '', local_tip: ai.localTip || '', confidence: total >= 70 ? 'high' : total >= 50 ? 'medium' : 'low', source_url: post.url, upvotes: post.upvotes, commentCount: post.commentCount, subreddit, score: total, scoreBreakdown: breakdown, hiddenness: ai.hiddenness || 0, beenThereCount: community.beenThere, photosFound: community.photos.length, photos: community.photos, verdict }, score: { total, breakdown } };
        } catch { return null; }
      }));
      for (const r of batchOut) {
        if (!r) { summary.skipped++; continue; }
        if (r.place.verdict === 'auto_rejected') { summary.autoRejected++; continue; }
        if (r.place.verdict === 'auto_approved') summary.autoApproved++; else summary.pendingReview++;
        results.push(r);
      }
      if (i + 5 < allPosts.length) await new Promise(r => setTimeout(r, 2000));
    }

    res.status(200).json({ places: results, summary, totalPosts: allPosts.length });
  } catch (err) {
    console.error('[pipeline]', err.message);
    res.status(500).json({ error: err.message });
  }
}
