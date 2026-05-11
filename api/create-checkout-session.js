import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Map of planId → Stripe price ID (falls back to env vars)
const PRICE_IDS = {
  explorer: process.env.VITE_STRIPE_EXPLORER_PRICE_ID,
  pro:      process.env.VITE_STRIPE_PRO_PRICE_ID,
};

export default async function handler(req, res) {
  // CORS headers — Vercel functions need these for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, planId, userId, email } = req.body;

  if (!priceId || !planId || !userId) {
    return res.status(400).json({ error: 'Missing required fields: priceId, planId, userId' });
  }

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_your')) {
    return res.status(503).json({ error: 'Stripe not configured. Add real STRIPE_SECRET_KEY to environment.' });
  }

  const origin = req.headers.origin || 'http://localhost:5173';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      client_reference_id: userId,
      metadata: { userId, planId },
      success_url: `${origin}/payment/success?plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/choose-plan`,
      subscription_data: {
        metadata: { userId, planId },
      },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
