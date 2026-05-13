/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET')     { res.status(405).end(); return; }

  const { subreddit, type, postId } = req.query;

  let url = '';
  if (type === 'posts') {
    url = `https://www.reddit.com/r/${subreddit}/top.json?limit=100&t=all`;
  } else if (type === 'comments') {
    url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=500`;
  } else {
    return res.status(400).json({ error: 'type must be posts or comments' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HiddenRoutes/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Reddit API error: ${response.status}` });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
