import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY });

const RETRY_DELAYS = [2000, 4000, 8000];

async function callWithRetry(params) {
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await client.messages.create(params);
    } catch (err) {
      const isRateLimit = err.status === 429;
      if (isRateLimit && attempt < RETRY_DELAYS.length) {
        console.log(`[Route] Rate limited, retrying in ${RETRY_DELAYS[attempt] / 1000}s (attempt ${attempt + 1})`);
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      throw err;
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { startName, endName, dist } = req.body;
  if (!startName || !endName) { res.status(400).json({ error: 'Missing startName or endName' }); return; }

  try {
    const msg = await callWithRetry({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Find 6 hidden stops for a road trip from ${startName} to ${endName} (~${Math.round(dist || 0)} miles). Only include spots within 20 miles of the direct route. Return ONLY a JSON array, no other text. Each item: {"name":"str","lat":n,"lng":n,"category":"Nature|History|Food|Adventure|Art","description":"2 sentences.","localTip":"1 sentence.","whyDetour":"1 sentence.","distanceFromRoute":n,"rating":n}`,
      }],
    });

    const text = msg.content[0].text;
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) { res.status(500).json({ error: 'Could not parse places from AI response' }); return; }

    const places = JSON.parse(match[0]).filter(p => p.name && typeof p.lat === 'number');
    res.status(200).json({ places });
  } catch (err) {
    console.error('[Route] Error after all retries:', err.message);
    if (err.status === 429) {
      res.status(429).json({ error: 'Too many requests — please wait 30 seconds and try again.' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
}
