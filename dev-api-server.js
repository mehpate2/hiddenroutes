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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
