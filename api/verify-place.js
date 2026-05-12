/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 */
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const { name, description, category, coordinates } = req.body || {};
  if (!name || !description) {
    res.status(400).json({ error: 'name and description required' });
    return;
  }

  try {
    const msg = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role:    'user',
        content: `You are verifying a community-submitted "hidden place" for a travel app.

Place name: ${name}
Category: ${category}
Description: ${description}
Coordinates: ${coordinates ? `${coordinates.lat}, ${coordinates.lng}` : 'not provided'}

Rate this submission on:
1. Plausibility — does it sound like a real place?
2. Hidden gem quality — is it genuinely off-the-beaten-path vs tourist trap?
3. Description quality — is it specific and helpful?

Return ONLY valid JSON: {"score":0-100,"verdict":"approved"|"review"|"rejected","reason":"1 sentence"}
- score 75+ = approved, 40-74 = review (needs human), <40 = rejected`,
      }],
    });

    const text = msg.content[0].text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const result = JSON.parse(match[0]);
    res.status(200).json(result);
  } catch (err) {
    console.error('[verify-place]', err.message);
    res.status(200).json({ score: 50, verdict: 'review', reason: 'AI verification unavailable' });
  }
}
