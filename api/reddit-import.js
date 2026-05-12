/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BATCH = 5; // posts per Claude call

async function fetchRedditPosts(subreddit, limit = 100) {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=all`;
  const res  = await fetch(url, {
    headers: { 'User-Agent': 'ExploreAI/1.0 (hidden-places-discovery)' },
  });
  if (!res.ok) throw new Error(`Reddit fetch failed: ${res.status}`);
  const json = await res.json();
  return (json?.data?.children || []).map(c => ({
    title:    c.data.title    || '',
    body:     c.data.selftext || '',
    url:      `https://reddit.com${c.data.permalink}`,
    upvotes:  c.data.score    || 0,
    comments: c.data.num_comments || 0,
  }));
}

async function extractPlacesFromBatch(posts) {
  const postsText = posts.map((p, i) =>
    `--- POST ${i + 1} ---\nTitle: ${p.title}\nUpvotes: ${p.upvotes}\nURL: ${p.url}\nBody: ${(p.body || '').slice(0, 800)}`
  ).join('\n\n');

  const msg = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{
      role:    'user',
      content: `Analyze these Reddit posts and extract any specific hidden or lesser-known places mentioned in the US.

${postsText}

Rules:
- Only include SPECIFIC named places (not generic "a waterfall near Denver")
- Only US locations
- Only places that are genuinely hidden/lesser-known (not Yellowstone, Grand Canyon, etc.)
- Include coordinates if you're confident (otherwise use approximate center of city)

Return ONLY valid JSON array (empty array [] if nothing found):
[{"name":"exact place name","description":"what makes it special (2 sentences)","state":"full US state name","city":"nearest city","coordinates":{"lat":0.0,"lng":0.0},"category":"nature|waterfall|cave|viewpoint|beach|trail|forest|lake","why_hidden":"why its lesser known","local_tip":"any tip from the post","confidence":"high|medium|low","source_url":"reddit post url","upvotes":0}]`,
    }],
  });

  const text  = msg.content[0].text;
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const places = JSON.parse(match[0]);
    return Array.isArray(places) ? places : [];
  } catch { return []; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const { subreddit, limit: lim = 100 } = req.body || {};
  if (!subreddit) { res.status(400).json({ error: 'subreddit required' }); return; }

  try {
    // 1. Fetch Reddit posts
    const allPosts = await fetchRedditPosts(subreddit, lim);

    // 2. Filter posts with enough upvotes and content
    const filtered = allPosts.filter(p => p.upvotes > 50 && (p.title.length + p.body.length) > 30);

    // 3. Batch-process with Claude
    const allPlaces = [];
    for (let i = 0; i < filtered.length; i += BATCH) {
      const batch  = filtered.slice(i, i + BATCH);
      try {
        const places = await extractPlacesFromBatch(batch);
        // Keep only high/medium confidence, attach subreddit
        const valid = places
          .filter(p => p.confidence !== 'low' && p.upvotes > 50 && p.name && p.state)
          .map(p => ({ ...p, subreddit }));
        allPlaces.push(...valid);
      } catch (err) {
        console.warn(`[reddit-import] batch ${i} failed:`, err.message);
      }
    }

    res.status(200).json({
      places:       allPlaces,
      postsScanned: filtered.length,
      totalPosts:   allPosts.length,
      found:        allPlaces.length,
    });
  } catch (err) {
    console.error('[reddit-import]', err.message);
    res.status(500).json({ error: err.message });
  }
}
