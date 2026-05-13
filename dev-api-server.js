import 'dotenv/config';
import http from 'http';
import Stripe from 'stripe';
import Anthropic from '@anthropic-ai/sdk';

const PORT = 3001;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// VITE_ prefix only works inside Vite; read both variants for local dev
const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
const anthropic = new Anthropic({ apiKey: anthropicKey });

const RETRY_DELAYS = [2000, 4000, 8000];

// ─── Pipeline helpers ────────────────────────────────────────────────────────

function scoreUpvotes(upvotes) {
  if (upvotes >= 5000) return 30;
  if (upvotes >= 1000) return 25;
  if (upvotes >= 500)  return 20;
  if (upvotes >= 200)  return 15;
  if (upvotes >= 100)  return 10;
  if (upvotes >= 50)   return 5;
  return 2;
}

function scoreEngagement(commentCount) {
  if (commentCount >= 200) return 20;
  if (commentCount >= 100) return 16;
  if (commentCount >= 50)  return 12;
  if (commentCount >= 20)  return 8;
  if (commentCount >= 10)  return 4;
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
  const gm2 = text.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (gm2) return { lat: parseFloat(gm2[1]), lng: parseFloat(gm2[2]), source: 'google_maps_url' };
  return null;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodePlace(name, state) {
  try {
    const q = encodeURIComponent(`${name}, ${state}, USA`);
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=us&limit=1`, {
      headers: { 'User-Agent': 'HiddenRoutes/1.0 (travel discovery app)', 'Accept': 'application/json' },
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.length > 0) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon), source: 'nominatim' };
    return null;
  } catch { return null; }
}

const REDDIT_HEADERS = { 'User-Agent': 'HiddenRoutes/1.0 (travel discovery app)', 'Accept': 'application/json' };

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const r = await fetch(url, { headers: REDDIT_HEADERS });
    if (r.status !== 429) return r;
    const wait = (i + 1) * 5000;
    console.log(`[Reddit] 429 rate limit — waiting ${wait / 1000}s (attempt ${i + 1}/${retries})`);
    await new Promise(res => setTimeout(res, wait));
  }
  throw new Error('Reddit rate limit exceeded — try again in a few minutes');
}

async function fetchPostComments(subreddit, postId) {
  try {
    const r = await fetchWithRetry(`https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=50&sort=top`);
    if (!r.ok) return [];
    const d = await r.json();
    return (d[1]?.data?.children || [])
      .filter(c => c.kind === 't1' && c.data.score > 0)
      .map(c => ({ body: c.data.body || '', score: c.data.score || 0 }))
      .slice(0, 30);
  } catch { return []; }
}

function harvestPhotos(post, comments) {
  const allText = [post.postUrl || '', post.body || '', ...comments.map(c => c.body)].join(' ');
  const redditImgs = allText.match(/https?:\/\/i\.redd\.it\/[^\s)"'\]]+/g) || [];
  const imgurImgs  = allText.match(/https?:\/\/i\.imgur\.com\/[^\s)"'\]]+\.(?:jpg|jpeg|png|gif)/gi) || [];
  return [...new Set([...redditImgs, ...imgurImgs])].slice(0, 5);
}

function analyzeCommunitySignals(post, comments) {
  const allText = (post.title + ' ' + post.body + ' ' + comments.map(c => c.body).join(' ')).toLowerCase();
  const beenThereHits = ['been here','been there','visited this','went here','hiked this',"i've been",'can confirm','confirmed','this is real'].filter(p => allText.includes(p)).length;
  const warnHits      = ['closed','private property','trespassing','no longer','burned down','demolished','dangerous','unsafe','off limits'].filter(p => allText.includes(p)).length;
  const coords  = extractCoordsFromText(post.title + ' ' + post.body + ' ' + comments.map(c => c.body).join(' '));
  const photos  = harvestPhotos(post, comments);

  let communityScore = 0;
  if (beenThereHits >= 2) communityScore += 10; else if (beenThereHits >= 1) communityScore += 5;
  if (coords)             communityScore += 5;
  if (photos.length >= 2) communityScore += 5; else if (photos.length >= 1) communityScore += 2;
  if (warnHits >= 2)      communityScore = Math.max(0, communityScore - 10);
  else if (warnHits >= 1) communityScore = Math.max(0, communityScore - 5);

  return { beenThere: beenThereHits, warnings: warnHits, coords, photos, communityScore };
}

async function analyzeWithAI(post, comments, anthropicClient) {
  const commentSummary = comments.slice(0, 10).map(c => c.body.slice(0, 200)).join('\n---\n');
  const msg = await anthropicWithRetry({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Analyze this Reddit post for a travel app that surfaces hidden, lesser-known US places.

POST: ${post.title}
BODY: ${(post.body || '').slice(0, 500)}
COMMENTS:
${commentSummary.slice(0, 700)}

Return ONLY valid JSON:
{"isSpecificPlace":bool,"isHiddenGem":bool,"isUS":bool,"name":"str or null","state":"full US state or null","city":"nearest city or null","category":"waterfall|cave|viewpoint|beach|trail|forest|lake|nature|history","hiddenness":1-10,"description":"2 sentences or null","localTip":"1 sentence or null","whyHidden":"1 sentence or null","aiScore":0-30,"approxLat":number or null,"approxLng":number or null}`,
    }],
  });
  const match = msg.content[0].text.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : null;
}

function buildFinalScore(post, communityData, aiResult) {
  const upvoteScore     = scoreUpvotes(post.upvotes || 0);
  const engagementScore = scoreEngagement(post.commentCount || 0);
  const communityScore  = communityData.communityScore || 0;
  const aiScore         = aiResult?.aiScore || 0;
  return {
    total: Math.min(100, upvoteScore + engagementScore + communityScore + aiScore),
    breakdown: { upvotes: upvoteScore, engagement: engagementScore, community: communityScore, ai: aiScore },
  };
}

async function runPipeline(subreddit, limit, sendEvent, anthropicClient) {
  sendEvent('status', { message: `Fetching posts from r/${subreddit}…`, phase: 'fetch' });

  const rdRes = await fetchWithRetry(`https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=all`);
  if (!rdRes.ok) throw new Error(`Reddit ${rdRes.status}: ${rdRes.statusText}`);
  const rdJson   = await rdRes.json();
  const allPosts = (rdJson?.data?.children || []).map(c => ({
    id:           c.data.id,
    title:        c.data.title    || '',
    body:         c.data.selftext || '',
    url:          `https://reddit.com${c.data.permalink}`,
    postUrl:      c.data.url      || '',
    upvotes:      c.data.score    || 0,
    commentCount: c.data.num_comments || 0,
  }));

  const filtered = allPosts.filter(p => p.upvotes >= 50 && (p.title.length + p.body.length) > 20);
  sendEvent('status', { message: `${filtered.length} qualifying posts. Running AI analysis…`, phase: 'analyze', total: filtered.length });

  const BATCH = 5;
  const seenCoords = [];
  const summary = { autoApproved: 0, pendingReview: 0, autoRejected: 0, skipped: 0 };

  for (let i = 0; i < filtered.length; i += BATCH) {
    const batch = filtered.slice(i, i + BATCH);

    const batchResults = await Promise.all(batch.map(async (post) => {
      try {
        const comments  = await fetchPostComments(subreddit, post.id);
        const community = analyzeCommunitySignals(post, comments);
        const aiResult  = await analyzeWithAI(post, comments, anthropicClient);

        if (!aiResult?.isSpecificPlace || !aiResult?.isUS || !aiResult?.isHiddenGem || !aiResult?.name) {
          return { verdict: 'skip', reason: 'not a specific hidden US place' };
        }
        if ((aiResult.hiddenness || 0) < 4) {
          return { verdict: 'skip', reason: `hiddenness ${aiResult.hiddenness}/10 too low` };
        }

        const score = buildFinalScore(post, community, aiResult);

        let coords = community.coords;
        if (!coords && aiResult.approxLat && aiResult.approxLng) {
          coords = { lat: aiResult.approxLat, lng: aiResult.approxLng, source: 'ai' };
        }
        if (!coords && aiResult.name && aiResult.state) {
          coords = await geocodePlace(aiResult.name, aiResult.state);
        }

        if (coords) {
          const isDupe = seenCoords.some(sc => haversineKm(sc.lat, sc.lng, coords.lat, coords.lng) < 1.0);
          if (isDupe) return { verdict: 'skip', reason: 'duplicate location' };
          seenCoords.push(coords);
        }

        const verdict = score.total >= 70 ? 'auto_approved' : score.total >= 30 ? 'pending' : 'auto_rejected';

        return {
          verdict,
          place: {
            name:           aiResult.name,
            description:    aiResult.description || '',
            state:          aiResult.state        || '',
            city:           aiResult.city         || '',
            coordinates:    coords ? { lat: coords.lat, lng: coords.lng } : null,
            coordSource:    coords?.source || 'none',
            category:       aiResult.category     || 'nature',
            why_hidden:     aiResult.whyHidden     || '',
            local_tip:      aiResult.localTip      || '',
            confidence:     score.total >= 70 ? 'high' : score.total >= 50 ? 'medium' : 'low',
            source_url:     post.url,
            upvotes:        post.upvotes,
            commentCount:   post.commentCount,
            subreddit,
            score:          score.total,
            scoreBreakdown: score.breakdown,
            hiddenness:     aiResult.hiddenness || 0,
            beenThereCount: community.beenThere,
            photosFound:    community.photos.length,
            photos:         community.photos,
            verdict,
          },
          score,
        };
      } catch (err) {
        return { verdict: 'skip', reason: err.message };
      }
    }));

    for (const result of batchResults) {
      if (result.verdict === 'skip') { summary.skipped++;       continue; }
      if (result.verdict === 'auto_rejected') { summary.autoRejected++; continue; }
      if (result.verdict === 'auto_approved') summary.autoApproved++;
      else summary.pendingReview++;
      sendEvent('place', { place: result.place, score: result.score });
    }

    sendEvent('progress', { processed: Math.min(i + BATCH, filtered.length), total: filtered.length, summary });

    if (i + BATCH < filtered.length) await new Promise(r => setTimeout(r, 2000));
  }

  sendEvent('done', { summary, totalPosts: filtered.length });
}

async function anthropicWithRetry(params) {
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try { return await anthropic.messages.create(params); }
    catch (err) {
      if (err.status === 429 && attempt < RETRY_DELAYS.length) {
        console.log(`[API] Rate limited, retrying in ${RETRY_DELAYS[attempt] / 1000}s (attempt ${attempt + 1})`);
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      throw err;
    }
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-eval' 'unsafe-inline';");

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.url === '/api/create-checkout-session' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { priceId, planId, userId, email } = JSON.parse(body);
        const origin = req.headers.origin || 'http://localhost:5174';
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: priceId, quantity: 1 }],
          customer_email: email || undefined,
          client_reference_id: userId,
          metadata: { userId, planId },
          success_url: `${origin}/payment/success?plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/choose-plan`,
          subscription_data: { metadata: { userId, planId } },
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url: session.url, sessionId: session.id }));
      } catch (err) {
        console.error('Stripe error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/get-route-places' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { startName, endName, dist } = JSON.parse(body);
        const msg = await anthropicWithRetry({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: `Find 6 hidden stops for a road trip from ${startName} to ${endName} (~${Math.round(dist || 0)} miles). Only include spots within 20 miles of the direct route. Return ONLY a JSON array, no other text. Each item: {"name":"str","lat":n,"lng":n,"category":"Nature|History|Food|Adventure|Art","description":"2 sentences.","localTip":"1 sentence.","whyDetour":"1 sentence.","distanceFromRoute":n,"rating":n}`,
          }],
        });
        const text = msg.content[0].text;
        const match = text.match(/\[[\s\S]*\]/);
        const places = match ? JSON.parse(match[0]).filter(p => p.name && typeof p.lat === 'number') : [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ places }));
      } catch (err) {
        console.error('Anthropic error:', err.message);
        const status = err.status === 429 ? 429 : 500;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.status === 429 ? 'Too many requests — please wait 30 seconds and try again.' : err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/verify-place' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { name, description, category, coordinates } = JSON.parse(body);
        const msg = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `You are verifying a community-submitted "hidden place" for a travel app.\n\nPlace name: ${name}\nCategory: ${category}\nDescription: ${description}\nCoordinates: ${coordinates ? `${coordinates.lat}, ${coordinates.lng}` : 'not provided'}\n\nRate this on plausibility, hidden gem quality, and description quality.\nReturn ONLY valid JSON: {"score":0-100,"verdict":"approved"|"review"|"rejected","reason":"1 sentence"}\n- score 75+ = approved, 40-74 = review, <40 = rejected`,
          }],
        });
        const text = msg.content[0].text;
        const match = text.match(/\{[\s\S]*\}/);
        const result = match ? JSON.parse(match[0]) : { score: 50, verdict: 'review', reason: 'Parse error' };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('[verify-place]', err.message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ score: 50, verdict: 'review', reason: 'AI service unavailable' }));
      }
    });
    return;
  }

  if (req.url === '/api/extract-social-place' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { caption, platform, location } = JSON.parse(body);
        const msg = await anthropicWithRetry({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `You are analyzing a ${platform} post for a travel app that maps hidden US places.

CAPTION: ${caption}
LOCATION HINT: ${location || 'none given'}

Extract the hidden place and return ONLY valid JSON:
{"name":"place name or null","description":"2 sentences or null","state":"full US state name or null","city":"nearest city or null","category":"nature|beach|historic|hidden|viewpoint|local","whyHidden":"1 sentence or null","coordinates":{"lat":number,"lng":number} or null,"score":0-100,"isValidPlace":bool}

score 70+ = specific named hidden US place with good description. Return null for name if post isn't about a specific place.`,
          }],
        });
        const match = msg.content[0].text.match(/\{[\s\S]*\}/);
        const result = match ? JSON.parse(match[0]) : { name: null, score: 0, isValidPlace: false };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('[extract-social-place]', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/reddit-import' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { subreddit, limit: lim = 100 } = JSON.parse(body);
        if (!subreddit) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'subreddit required' })); return; }

        // Fetch Reddit posts
        const rdRes = await fetch(`https://www.reddit.com/r/${subreddit}/top.json?limit=${lim}&t=all`, {
          headers: {
            'User-Agent': 'HiddenRoutes/1.0 (travel discovery app)',
            'Accept':     'application/json',
          },
        });
        if (!rdRes.ok) throw new Error(`Reddit ${rdRes.status}`);
        const rdJson = await rdRes.json();
        const allPosts = (rdJson?.data?.children || []).map(c => ({
          title: c.data.title || '', body: c.data.selftext || '',
          url: `https://reddit.com${c.data.permalink}`, upvotes: c.data.score || 0,
        }));
        const filtered = allPosts.filter(p => p.upvotes > 50 && (p.title.length + p.body.length) > 30);

        // Batch AI extraction (5 posts per call)
        const BATCH = 5;
        const allPlaces = [];
        for (let i = 0; i < filtered.length; i += BATCH) {
          const batch = filtered.slice(i, i + BATCH);
          const postsText = batch.map((p, idx) =>
            `--- POST ${idx + 1} ---\nTitle: ${p.title}\nUpvotes: ${p.upvotes}\nURL: ${p.url}\nBody: ${(p.body || '').slice(0, 800)}`
          ).join('\n\n');
          try {
            const msg = await anthropic.messages.create({
              model: 'claude-haiku-4-5-20251001', max_tokens: 2000,
              messages: [{ role: 'user', content: `Analyze these Reddit posts and extract hidden/lesser-known US places.\n\n${postsText}\n\nRules: specific named places only, US only, genuinely hidden (not major national parks).\nReturn ONLY JSON array ([] if none): [{"name":"str","description":"2 sentences","state":"full state name","city":"nearest city","coordinates":{"lat":0.0,"lng":0.0},"category":"nature|waterfall|cave|viewpoint|beach|trail|forest|lake","why_hidden":"str","local_tip":"str","confidence":"high|medium|low","source_url":"url","upvotes":0}]` }],
            });
            const text = msg.content[0].text;
            const match = text.match(/\[[\s\S]*\]/);
            if (match) {
              const places = JSON.parse(match[0]);
              if (Array.isArray(places)) {
                allPlaces.push(...places.filter(p => p.confidence !== 'low' && p.name && p.state).map(p => ({ ...p, subreddit })));
              }
            }
          } catch (batchErr) {
            console.warn(`[reddit-import] batch ${i} error:`, batchErr.message);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ places: allPlaces, postsScanned: filtered.length, totalPosts: allPosts.length, found: allPlaces.length }));
      } catch (err) {
        console.error('[reddit-import]', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // /api/reddit  — Reddit proxy (GET only, exact path match to avoid collisions)
  {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    if (parsedUrl.pathname === '/api/reddit' && req.method === 'GET') {
      const subreddit = parsedUrl.searchParams.get('subreddit');
      const type      = parsedUrl.searchParams.get('type');
      const postId    = parsedUrl.searchParams.get('postId');

      console.log('[/api/reddit] hit:', { subreddit, type, postId });

      let rdUrl = '';
      if (type === 'posts') {
        rdUrl = `https://www.reddit.com/r/${subreddit}/top.json?limit=100&t=all`;
      } else if (type === 'comments') {
        rdUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=500`;
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid type parameter' }));
        return;
      }

      try {
        console.log('[/api/reddit] fetching:', rdUrl);
        const rdRes = await fetch(rdUrl, {
          headers: { 'User-Agent': 'HiddenRoutes/1.0 (travel app)', 'Accept': 'application/json' },
        });
        console.log('[/api/reddit] Reddit status:', rdRes.status);
        if (!rdRes.ok) {
          res.writeHead(rdRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Reddit returned ${rdRes.status}` }));
          return;
        }
        const data = await rdRes.json();
        res.setHeader('Cache-Control', 's-maxage=3600');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        console.error('[/api/reddit] error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // /api/reddit-pipeline — SSE pipeline (exact pathname match)
  {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    if (parsedUrl.pathname === '/api/reddit-pipeline' && req.method === 'GET') {
    const subreddit = parsedUrl.searchParams.get('subreddit');
    const limit     = parseInt(parsedUrl.searchParams.get('limit') || '100', 10);

    console.log('[/api/reddit-pipeline] hit:', { subreddit, limit });

    if (!subreddit) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'subreddit parameter required' })); return; }

    res.writeHead(200, {
      'Content-Type':                'text/event-stream',
      'Cache-Control':               'no-cache',
      'Connection':                  'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const send = (type, data) => {
      try { res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`); } catch {}
    };

    runPipeline(subreddit, limit, send, anthropic)
      .then(() => res.end())
      .catch(err => { send('error', { message: err.message }); res.end(); });
    return;
    } // end pathname check
  } // end block scope

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
