// Webhook endpoint — ready for Instagram Graph API, TikTok Display API, Snapchat Story API
// Activate by adding real API keys when platform approvals come through.
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Hub verification handshake (Instagram/Meta pattern)
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    const body = req.body;
    const platform = req.query.platform || 'instagram';

    try {
      // Each platform sends different payload shapes:
      let posts = [];

      if (platform === 'instagram') {
        // Instagram Graph API webhook format
        const entry = body.entry || [];
        for (const e of entry) {
          for (const change of (e.changes || [])) {
            if (change.field === 'mentions' || change.field === 'tagged') {
              posts.push({ id: change.value.media_id, platform: 'instagram' });
            }
          }
        }
      } else if (platform === 'tiktok') {
        // TikTok Display API webhook format
        const events = body.events || [];
        posts = events.filter(e => e.event === 'video.publish').map(e => ({ id: e.data?.video_id, platform: 'tiktok' }));
      } else if (platform === 'snapchat') {
        // Snapchat Story API webhook format
        const snaps = body.snaps || [];
        posts = snaps.map(s => ({ id: s.snap_id, platform: 'snapchat' }));
      }

      // TODO: for each post, fetch full content from platform API,
      // check for #hiddenroutes in caption, extract location, run AI analysis,
      // save to Firestore social_submissions, notify user (+50 pts).
      console.log(`[social-webhook] ${platform}: ${posts.length} posts to process`);

      return res.status(200).json({ received: true, posts: posts.length });
    } catch (err) {
      console.error('[social-webhook]', err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
