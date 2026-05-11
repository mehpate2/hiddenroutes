import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Updates Firestore via Firebase Admin SDK (requires FIREBASE_ADMIN_KEY env var).
// If not configured, plan is updated client-side on /payment/success instead.
async function updateFirestoreUser(userId, fields) {
  const adminKeyRaw = process.env.FIREBASE_ADMIN_KEY;
  if (!adminKeyRaw) {
    console.log('[Webhook] FIREBASE_ADMIN_KEY not set — Firestore update skipped (handled client-side)');
    return;
  }
  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
    if (!getApps().length) {
      const serviceAccount = JSON.parse(
        adminKeyRaw.startsWith('{') ? adminKeyRaw : Buffer.from(adminKeyRaw, 'base64').toString()
      );
      initializeApp({ credential: cert(serviceAccount) });
    }
    const db = getFirestore();
    await db.collection('users').doc(userId).set(
      { ...fields, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    console.log(`[Webhook] Firestore updated for user ${userId}:`, Object.keys(fields));
  } catch (err) {
    console.error('[Webhook] Firestore update failed:', err.message);
  }
}

export default async function handler(req, res) {
  // Health check
  if (req.method === 'GET') return res.status(200).json({ ok: true, webhook: 'active' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Stripe requires raw body for signature verification
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // Dev mode: skip signature verification
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!webhookSecret) console.warn('[Webhook] No STRIPE_WEBHOOK_SECRET — skipping signature check');
    }
  } catch (err) {
    console.error('[Webhook] Signature error:', err.message);
    return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` });
  }

  console.log(`[Webhook] ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId;
        const subscriptionId = session.subscription;
        if (userId && planId) {
          await updateFirestoreUser(userId, {
            plan: planId,
            subscriptionId: subscriptionId || null,
            stripeCustomerId: session.customer || null,
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId) {
          await updateFirestoreUser(userId, {
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId) {
          await updateFirestoreUser(userId, {
            plan: 'free',
            subscriptionId: null,
            subscriptionCancelledAt: new Date().toISOString(),
          });
        }
        break;
      }
      default:
        // Ignore other events
    }
  } catch (err) {
    console.error('[Webhook] Handler error:', err);
    return res.status(500).json({ error: err.message });
  }

  return res.status(200).json({ received: true });
}
