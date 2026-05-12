/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDiscoverFeed, addReview, getReviews } from '../lib/community';
import { getRedditDiscoverStats } from '../lib/reddit';

const D = {
  navy: '#0A0F1E', teal: '#00D2FF', gold: '#C9A84C',
  white: '#FFFFFF', muted: '#6B7A9A', border: 'rgba(255,255,255,0.12)',
  font: "'Inter',system-ui,sans-serif", serif: "'Playfair Display',Georgia,serif",
  success: '#22c55e',
};

const CAT_EMOJI  = { Nature: '🌿', History: '🏛️', Food: '🍽️', Adventure: '⛰️', Art: '🎨' };
const CAT_COLOR  = { Nature: '#22c55e', History: '#f59e0b', Food: '#ec4899', Adventure: '#3b82f6', Art: '#a855f7' };
const DIFF_COLOR = { Easy: '#22c55e', Moderate: '#f59e0b', Challenging: '#ef4444' };

function FeedCard({ sub, userId, onReviewPosted }) {
  const [showDetail, setShowDetail] = useState(false);
  const [reviews, setReviews]       = useState(null);
  const [rating, setRating]         = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [posting, setPosting]       = useState(false);
  const [imgErr, setImgErr]         = useState(false);
  const photo = sub.photos?.[0];
  const cat   = sub.category || 'Nature';
  const ts = sub.createdAt?.seconds
    ? new Date(sub.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const loadDetail = async () => {
    if (!showDetail && reviews === null) {
      const r = await getReviews(sub.id);
      setReviews(r);
    }
    setShowDetail(s => !s);
  };

  const postReview = async () => {
    if (!userId || !reviewText.trim()) return;
    setPosting(true);
    try {
      await addReview(sub.id, userId, '', { rating, review: reviewText, stillHidden: true });
      const r = await getReviews(sub.id);
      setReviews(r);
      setReviewText('');
      onReviewPosted?.();
    } finally { setPosting(false); }
  };

  const avgRating = reviews?.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 20, border: `1px solid ${D.border}`, overflow: 'hidden', marginBottom: 20 }}>
      {/* Photo */}
      <div style={{ position: 'relative', height: 260 }}>
        {photo && !imgErr
          ? <img src={photo} alt={sub.name} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${CAT_COLOR[cat]}22,#0A0F1E)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>{CAT_EMOJI[cat]}</div>
        }
        {/* Overlay gradient */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(transparent,rgba(10,15,30,0.95))' }} />
        {/* Category badge */}
        <div style={{ position: 'absolute', top: 14, left: 14, padding: '5px 10px', borderRadius: 20, background: `${CAT_COLOR[cat]}22`, backdropFilter: 'blur(8px)', border: `1px solid ${CAT_COLOR[cat]}44`, color: CAT_COLOR[cat], fontSize: 12, fontWeight: 700 }}>
          {CAT_EMOJI[cat]} {cat}
        </div>
        {sub.gpsVerified && (
          <div style={{ position: 'absolute', top: 14, right: 14, padding: '4px 8px', borderRadius: 8, background: 'rgba(34,197,94,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(34,197,94,0.4)', color: D.success, fontSize: 11, fontWeight: 700 }}>
            📍 GPS ✓
          </div>
        )}
        {/* Title overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 18px' }}>
          <div style={{ color: D.white, fontWeight: 800, fontSize: 20, fontFamily: D.serif, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{sub.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{sub.state} · {sub.difficulty} · {ts}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.65, marginBottom: 12 }}>{sub.description}</div>

        {sub.localTip && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: `${D.teal}0D`, border: `1px solid ${D.teal}22`, color: D.teal, fontSize: 13, marginBottom: 12 }}>
            💡 <strong>Local tip:</strong> {sub.localTip}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ padding: '4px 10px', borderRadius: 16, background: `${DIFF_COLOR[sub.difficulty] || '#6B7A9A'}1A`, color: DIFF_COLOR[sub.difficulty] || D.muted, fontSize: 12, fontWeight: 600 }}>
            {sub.difficulty === 'Easy' ? '🟢' : sub.difficulty === 'Moderate' ? '🟡' : '🔴'} {sub.difficulty}
          </div>
          {sub.bestTime && <div style={{ color: D.muted, fontSize: 12 }}>⏰ {sub.bestTime}</div>}
          {avgRating && <div style={{ color: D.gold, fontSize: 13 }}>★ {avgRating} ({reviews.length})</div>}
          <div style={{ color: D.muted, fontSize: 12 }}>By {sub.userName}</div>
        </div>

        <button onClick={loadDetail} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1px solid ${showDetail ? D.teal + '44' : D.border}`, background: showDetail ? `${D.teal}0D` : 'transparent', color: showDetail ? D.teal : D.muted, fontSize: 13, cursor: 'pointer', fontFamily: D.font, fontWeight: 600, transition: 'all 0.2s' }}>
          {showDetail ? '▲ Close' : '💬 See Reviews & Add Yours'}
        </button>

        {showDetail && (
          <div style={{ marginTop: 16 }}>
            {userId && (
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}`, marginBottom: 14 }}>
                <div style={{ color: D.white, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Leave a Review (+20 pts)</div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRating(n)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', opacity: n <= rating ? 1 : 0.25, transition: 'opacity 0.2s' }}>★</button>
                  ))}
                </div>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Was it still hidden? What surprised you?" rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${D.border}`, background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: D.font, resize: 'none', boxSizing: 'border-box', lineHeight: 1.6 }} />
                <button onClick={postReview} disabled={posting || !reviewText.trim()}
                  style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, border: 'none', background: posting || !reviewText.trim() ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,${D.teal},#3A7BD5)`, color: posting || !reviewText.trim() ? D.muted : '#fff', fontSize: 12, fontWeight: 700, cursor: posting || !reviewText.trim() ? 'not-allowed' : 'pointer', fontFamily: D.font }}>
                  {posting ? '…' : 'Post Review'}
                </button>
              </div>
            )}

            {reviews === null && <div style={{ color: D.muted, fontSize: 13 }}>Loading…</div>}
            {reviews?.length === 0 && <div style={{ color: D.muted, fontSize: 13 }}>No reviews yet.</div>}
            {reviews?.map(r => (
              <div key={r.id} style={{ padding: '10px 0', borderTop: `1px solid ${D.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ color: D.muted, fontSize: 12 }}>{r.userName || 'Explorer'}</div>
                  <div style={{ color: D.gold, fontSize: 12 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{r.review}</div>
                {r.stillHidden && <span style={{ fontSize: 11, color: D.success }}>✓ Still a hidden gem</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reddit Stats Banner ──────────────────────────────────────────────────────
function RedditStatsBanner() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getRedditDiscoverStats().then(s => { if (s.total > 0) setStats(s); });
  }, []);

  if (!stats || stats.total === 0) return null;

  return (
    <div style={{ marginBottom: 24, borderRadius: 18, border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.06)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(249,115,22,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#F97316', fontWeight: 800, fontSize: 15 }}>🔴 From the Reddit Community</div>
          <div style={{ color: D.muted, fontSize: 12, marginTop: 2 }}>{stats.total} hidden places discovered from real explorers</div>
        </div>
        <button onClick={() => navigate('/admin/import')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(249,115,22,0.4)', background: 'transparent', color: '#F97316', fontSize: 12, cursor: 'pointer', fontFamily: D.font }}>
          View All →
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>
        {stats.mostUpvoted && (
          <div style={{ padding: '12px 16px', borderRight: '1px solid rgba(249,115,22,0.15)' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Most Upvoted</div>
            <div style={{ color: D.white, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{stats.mostUpvoted.name}</div>
            <div style={{ color: '#F97316', fontSize: 11 }}>▲ {(stats.mostUpvoted.upvotes || 0).toLocaleString()}</div>
          </div>
        )}
        {stats.newest && (
          <div style={{ padding: '12px 16px', borderRight: '1px solid rgba(249,115,22,0.15)' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Newest Find</div>
            <div style={{ color: D.white, fontWeight: 700, fontSize: 13 }}>{stats.newest.name}</div>
            <div style={{ color: D.muted, fontSize: 11 }}>{stats.newest.state}</div>
          </div>
        )}
        {stats.topSubreddit && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Top Source</div>
            <div style={{ color: D.white, fontWeight: 700, fontSize: 13 }}>r/{stats.topSubreddit.name}</div>
            <div style={{ color: D.muted, fontSize: 11 }}>{stats.topSubreddit.count} places found</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({ cat, setCat, state, setState }) {
  const cats = ['All', 'Nature', 'History', 'Food', 'Adventure', 'Art'];
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
      {cats.map(c => (
        <button key={c} onClick={() => setCat(c)}
          style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${cat === c ? D.teal : D.border}`, background: cat === c ? `${D.teal}18` : 'transparent', color: cat === c ? D.teal : D.muted, fontSize: 13, cursor: 'pointer', fontFamily: D.font, transition: 'all 0.2s', fontWeight: cat === c ? 700 : 400 }}>
          {c === 'All' ? '🗺️ All' : `${CAT_EMOJI[c]} ${c}`}
        </button>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DiscoverFeed() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [items, setItems]     = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [catFilter, setCatFilter] = useState('All');
  const loaderRef = useRef(null);

  const fetchMore = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const { docs, lastDoc: ld } = await getDiscoverFeed(12, reset ? null : lastDoc);
    const newItems = docs.map(d => ({ id: d.id, ...d.data() }));
    setItems(prev => reset ? newItems : [...prev, ...newItems]);
    setLastDoc(ld);
    setHasMore(docs.length === 12);
    setLoading(false);
  }, [loading, lastDoc]);

  useEffect(() => { fetchMore(true); }, []);

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) fetchMore();
    }, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [fetchMore, hasMore, loading]);

  const filtered = catFilter === 'All' ? items : items.filter(i => i.category === catFilter);

  return (
    <div style={{ minHeight: '100vh', background: D.navy, fontFamily: D.font, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
          <div>
            <h1 style={{ fontFamily: D.serif, color: D.white, fontSize: 22, fontWeight: 900, margin: 0 }}>Discover Hidden Places</h1>
            <p style={{ color: D.muted, fontSize: 13, margin: 0 }}>Secret spots verified by real explorers</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/community')} style={{ padding: '9px 16px', borderRadius: 10, border: `1px solid ${D.border}`, background: 'transparent', color: D.muted, fontSize: 13, cursor: 'pointer', fontFamily: D.font }}>
            🗳️ Vote
          </button>
          <button onClick={() => navigate('/submit')} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${D.gold},#e8960a)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
            + Submit
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px' }}>
        <RedditStatsBanner />
        <FilterBar cat={catFilter} setCat={setCatFilter} />

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 60, color: D.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16 }}>No places yet in this category.</div>
            <button onClick={() => navigate('/submit')} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 10, border: `1px solid ${D.gold}44`, background: 'rgba(201,168,76,0.08)', color: D.gold, fontSize: 14, cursor: 'pointer', fontFamily: D.font }}>
              Submit the First One!
            </button>
          </div>
        )}

        {filtered.map(sub => (
          <FeedCard
            key={sub.id}
            sub={sub}
            userId={user?.uid}
            onReviewPosted={() => showToast('Review posted! +20 pts 🎉')}
          />
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={loaderRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(0,210,255,0.2)', borderTopColor: D.teal, animation: 'spin 0.8s linear infinite' }} />}
          {!hasMore && items.length > 0 && <div style={{ color: D.muted, fontSize: 13 }}>You've seen all {filtered.length} hidden places 🗺️</div>}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
