/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getSubmissions, voteOnSubmission, getReviews,
  addReview, getLeaderboard, getLevelInfo, markReviewHelpful,
} from '../lib/community';

const D = {
  navy: '#0A0F1E', teal: '#00D2FF', gold: '#C9A84C',
  white: '#FFFFFF', muted: '#6B7A9A', border: 'rgba(255,255,255,0.12)',
  font: "'Inter',system-ui,sans-serif", serif: "'Playfair Display',Georgia,serif",
  success: '#22c55e', error: '#ef4444',
};

const CAT_EMOJI = { Nature: '🌿', History: '🏛️', Food: '🍽️', Adventure: '⛰️', Art: '🎨' };

const LEVEL_COLORS = {
  Explorer: '#00D2FF', Pathfinder: '#3b82f6', Legend: '#a855f7', Master: '#FFB347',
};

function Tab({ label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
      background: active ? `linear-gradient(135deg,${D.teal},#3A7BD5)` : 'rgba(255,255,255,0.05)',
      color: active ? '#fff' : D.muted, fontSize: 14, fontWeight: active ? 700 : 400,
      fontFamily: D.font, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {label}
      {badge > 0 && <span style={{ background: D.error, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>{badge}</span>}
    </button>
  );
}

function VoteBar({ confirm, reject, total }) {
  const pct = total > 0 ? Math.round((confirm / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: D.muted, marginBottom: 4 }}>
        <span>👍 {confirm} confirm</span>
        <span>{reject} reject 👎</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${D.success},${D.teal})`, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

// ─── Pending Card ─────────────────────────────────────────────────────────────
function PendingCard({ sub, userId, onVote }) {
  const [voting, setVoting]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const confirm = (sub.confirmVotes || []).length;
  const reject  = (sub.rejectVotes  || []).length;
  const total   = confirm + reject;
  const myVote  = userId
    ? (sub.confirmVotes || []).includes(userId) ? 'confirm'
    : (sub.rejectVotes  || []).includes(userId) ? 'reject' : null
    : null;

  const handleVote = async (v) => {
    if (!userId) return;
    setVoting(true);
    await onVote(sub.id, v);
    setVoting(false);
  };

  const photo = sub.photos?.[0];
  const ts = sub.createdAt?.seconds ? new Date(sub.createdAt.seconds * 1000).toLocaleDateString() : '';

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: `1px solid ${D.border}`, overflow: 'hidden', transition: 'transform 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>

      {photo && <img src={photo} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />}
      {!photo && (
        <div style={{ width: '100%', height: 100, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
          {CAT_EMOJI[sub.category] || '📍'}
        </div>
      )}

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ color: D.white, fontWeight: 700, fontSize: 15 }}>{sub.name}</div>
            <div style={{ color: D.muted, fontSize: 12 }}>{CAT_EMOJI[sub.category]} {sub.category} · {sub.state}</div>
          </div>
          {sub.gpsVerified && <span style={{ fontSize: 10, color: D.success, border: `1px solid ${D.success}44`, borderRadius: 6, padding: '2px 6px' }}>GPS ✓</span>}
        </div>

        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
          {expanded ? sub.description : sub.description?.substring(0, 100) + (sub.description?.length > 100 ? '…' : '')}
          {sub.description?.length > 100 && (
            <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', color: D.teal, fontSize: 12, cursor: 'pointer', padding: '0 0 0 4px' }}>
              {expanded ? 'less' : 'more'}
            </button>
          )}
        </div>

        <VoteBar confirm={confirm} reject={reject} total={total} />

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => handleVote('confirm')} disabled={voting || myVote === 'confirm'}
            style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: `1px solid ${myVote === 'confirm' ? D.success : 'rgba(34,197,94,0.3)'}`, background: myVote === 'confirm' ? 'rgba(34,197,94,0.15)' : 'transparent', color: myVote === 'confirm' ? D.success : 'rgba(255,255,255,0.6)', fontSize: 13, cursor: voting || myVote === 'confirm' ? 'not-allowed' : 'pointer', fontFamily: D.font, fontWeight: 600 }}>
            👍 Real Spot
          </button>
          <button onClick={() => handleVote('reject')} disabled={voting || myVote === 'reject'}
            style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: `1px solid ${myVote === 'reject' ? D.error : 'rgba(239,68,68,0.3)'}`, background: myVote === 'reject' ? 'rgba(239,68,68,0.12)' : 'transparent', color: myVote === 'reject' ? D.error : 'rgba(255,255,255,0.6)', fontSize: 13, cursor: voting || myVote === 'reject' ? 'not-allowed' : 'pointer', fontFamily: D.font, fontWeight: 600 }}>
            🚫 Fake/Tourist
          </button>
        </div>
        <div style={{ color: D.muted, fontSize: 11, marginTop: 8 }}>By {sub.userName} · {ts}</div>
      </div>
    </div>
  );
}

// ─── Approved Card ────────────────────────────────────────────────────────────
function ApprovedCard({ sub, userId, onReviewSubmit }) {
  const [showReview, setShowReview] = useState(false);
  const [reviews, setReviews]       = useState(null);
  const [rating, setRating]         = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [stillHidden, setStillHidden] = useState(true);
  const [submittingR, setSubmittingR] = useState(false);
  const photo = sub.photos?.[0];

  const loadReviews = async () => {
    if (reviews !== null) { setShowReview(s => !s); return; }
    const r = await getReviews(sub.id);
    setReviews(r);
    setShowReview(true);
  };

  const submitReview = async () => {
    if (!userId || !reviewText.trim()) return;
    setSubmittingR(true);
    try {
      await addReview(sub.id, userId, '', { rating, review: reviewText, stillHidden });
      const r = await getReviews(sub.id);
      setReviews(r);
      setReviewText('');
      onReviewSubmit?.();
    } finally { setSubmittingR(false); }
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: `1px solid ${D.border}`, overflow: 'hidden' }}>
      {photo && <img src={photo} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />}
      {!photo && <div style={{ width: '100%', height: 100, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>{CAT_EMOJI[sub.category] || '📍'}</div>}

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <div style={{ color: D.white, fontWeight: 700, fontSize: 15 }}>{sub.name}</div>
            <div style={{ color: D.muted, fontSize: 12 }}>{CAT_EMOJI[sub.category]} {sub.category} · {sub.state} · {sub.difficulty}</div>
          </div>
          <span style={{ fontSize: 10, color: D.success, border: `1px solid ${D.success}44`, borderRadius: 6, padding: '2px 6px' }}>✓ Approved</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>{sub.description}</div>
        {sub.localTip && <div style={{ color: D.teal, fontSize: 13, marginBottom: 10 }}>💡 {sub.localTip}</div>}
        {sub.bestTime && <div style={{ color: D.muted, fontSize: 12, marginBottom: 10 }}>⏰ Best: {sub.bestTime}</div>}

        <button onClick={loadReviews} style={{ width: '100%', padding: '9px 0', borderRadius: 9, border: `1px solid ${D.teal}44`, background: 'rgba(0,210,255,0.06)', color: D.teal, fontSize: 13, cursor: 'pointer', fontFamily: D.font, fontWeight: 600 }}>
          {showReview ? '▲ Hide Reviews' : '💬 Reviews & Leave One'}
        </button>

        {showReview && (
          <div style={{ marginTop: 14 }}>
            {userId && (
              <div style={{ marginBottom: 14, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: `1px solid ${D.border}` }}>
                <div style={{ color: D.white, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Your Review (+20 pts)</div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRating(n)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', opacity: n <= rating ? 1 : 0.3 }}>★</button>
                  ))}
                </div>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience…" rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${D.border}`, background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: D.font, resize: 'vertical', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: D.muted, cursor: 'pointer' }}>
                    <input type="checkbox" checked={stillHidden} onChange={e => setStillHidden(e.target.checked)} style={{ accentColor: D.teal }} />
                    Still a hidden gem?
                  </label>
                  <button onClick={submitReview} disabled={submittingR || !reviewText.trim()}
                    style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg,${D.teal},#3A7BD5)`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: submittingR ? 'not-allowed' : 'pointer', fontFamily: D.font }}>
                    {submittingR ? '…' : 'Post Review'}
                  </button>
                </div>
              </div>
            )}

            {reviews === null && <div style={{ color: D.muted, fontSize: 13 }}>Loading reviews…</div>}
            {reviews?.length === 0 && <div style={{ color: D.muted, fontSize: 13 }}>No reviews yet. Be the first!</div>}
            {reviews?.map(r => (
              <div key={r.id} style={{ padding: '10px 0', borderTop: `1px solid ${D.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ color: D.muted, fontSize: 12 }}>{r.userName || 'Explorer'}</div>
                  <div style={{ color: D.gold, fontSize: 12 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{r.review}</div>
                {r.stillHidden && <div style={{ color: D.success, fontSize: 11, marginTop: 3 }}>✓ Still hidden</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function LeaderboardTab() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(20).then(l => { setLeaders(l); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', color: D.muted, padding: 40 }}>Loading leaderboard…</div>;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: D.serif, fontSize: 24, color: D.white, fontWeight: 900 }}>🏆 Top Explorers</div>
        <div style={{ color: D.muted, fontSize: 14 }}>Community leaders who found the best hidden places</div>
      </div>
      {leaders.map((l, i) => {
        const level = getLevelInfo(l.points || 0);
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        return (
          <div key={l.uid} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, marginBottom: 8, background: i < 3 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i < 3 ? D.gold + '33' : D.border}`, transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
            <div style={{ fontSize: i < 3 ? 24 : 16, minWidth: 32, textAlign: 'center', color: D.muted }}>{medal}</div>
            {l.photoURL
              ? <img src={l.photoURL} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${LEVEL_COLORS[level.name]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{level.badge}</div>}
            <div style={{ flex: 1 }}>
              <div style={{ color: D.white, fontWeight: 600, fontSize: 14 }}>{l.displayName || 'Explorer'}</div>
              <div style={{ color: LEVEL_COLORS[level.name], fontSize: 12 }}>{level.badge} {level.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: D.gold, fontWeight: 700, fontSize: 15 }}>{(l.points || 0).toLocaleString()} pts</div>
              <div style={{ color: D.muted, fontSize: 11 }}>{l.approvedCount || 0} approved</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Community() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('pending');
  const [pending, setPending]   = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [pendingLastDoc, setPendingLastDoc]   = useState(null);
  const [approvedLastDoc, setApprovedLastDoc] = useState(null);
  const [hasMoreP, setHasMoreP] = useState(true);
  const [hasMoreA, setHasMoreA] = useState(true);

  const loadPending = useCallback(async (reset = false) => {
    setLoading(true);
    const { docs, lastDoc } = await getSubmissions('pending', 12, reset ? null : pendingLastDoc);
    const items = docs.map(d => ({ id: d.id, ...d.data() }));
    setPending(prev => reset ? items : [...prev, ...items]);
    setPendingLastDoc(lastDoc);
    setHasMoreP(docs.length === 12);
    setLoading(false);
  }, [pendingLastDoc]);

  const loadApproved = useCallback(async (reset = false) => {
    setLoading(true);
    const { docs, lastDoc } = await getSubmissions('approved', 12, reset ? null : approvedLastDoc);
    const items = docs.map(d => ({ id: d.id, ...d.data() }));
    setApproved(prev => reset ? items : [...prev, ...items]);
    setApprovedLastDoc(lastDoc);
    setHasMoreA(docs.length === 12);
    setLoading(false);
  }, [approvedLastDoc]);

  useEffect(() => { loadPending(true); loadApproved(true); }, []);

  const handleVote = async (subId, vote) => {
    if (!user) { navigate('/login'); return; }
    await voteOnSubmission(subId, user.uid, vote);
    // Re-fetch to get updated vote counts
    const { docs } = await getSubmissions('pending', 50);
    setPending(docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleReviewSubmit = () => {
    showToast('Review posted! +20 pts 🎉');
  };

  const counts = { pending: pending.length };

  return (
    <div style={{ minHeight: '100vh', background: D.navy, fontFamily: D.font, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
          <div>
            <h1 style={{ fontFamily: D.serif, color: D.white, fontSize: 22, fontWeight: 900, margin: 0 }}>Community Hidden Places</h1>
            <p style={{ color: D.muted, fontSize: 13, margin: 0 }}>Discover & verify secret spots found by real explorers</p>
          </div>
        </div>
        <button onClick={() => navigate('/submit')} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${D.gold},#e8960a)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
          + Submit Place
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: 10, flexWrap: 'wrap', borderBottom: `1px solid ${D.border}` }}>
        <Tab label="🗳️ Pending Review" active={tab === 'pending'} onClick={() => setTab('pending')} badge={counts.pending} />
        <Tab label="✅ Approved Places" active={tab === 'approved'} onClick={() => setTab('approved')} />
        <Tab label="🏆 Leaderboard" active={tab === 'leaderboard'} onClick={() => setTab('leaderboard')} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {tab === 'pending' && (
          <>
            {!user && (
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(0,210,255,0.08)', border: `1px solid ${D.teal}33`, color: D.teal, fontSize: 14, marginBottom: 20 }}>
                <strong>Sign in to vote</strong> on whether these are real hidden gems!{' '}
                <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: D.teal, textDecoration: 'underline', cursor: 'pointer', fontFamily: D.font, fontSize: 14 }}>Log in →</button>
              </div>
            )}
            {pending.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 60, color: D.muted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
                <div style={{ fontSize: 16 }}>No pending submissions right now.</div>
                <button onClick={() => navigate('/submit')} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 10, border: `1px solid ${D.gold}44`, background: 'rgba(201,168,76,0.08)', color: D.gold, fontSize: 14, cursor: 'pointer', fontFamily: D.font }}>Be the first to submit!</button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {pending.map(sub => (
                <PendingCard key={sub.id} sub={sub} userId={user?.uid} onVote={handleVote} />
              ))}
            </div>
            {hasMoreP && pending.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button onClick={() => loadPending()} disabled={loading} style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${D.border}`, background: 'transparent', color: D.muted, fontSize: 14, cursor: 'pointer', fontFamily: D.font }}>
                  {loading ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'approved' && (
          <>
            {approved.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 60, color: D.muted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
                <div>No approved places yet. Start voting on pending ones!</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
              {approved.map(sub => (
                <ApprovedCard key={sub.id} sub={sub} userId={user?.uid} onReviewSubmit={handleReviewSubmit} />
              ))}
            </div>
            {hasMoreA && approved.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button onClick={() => loadApproved()} disabled={loading} style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${D.border}`, background: 'transparent', color: D.muted, fontSize: 14, cursor: 'pointer', fontFamily: D.font }}>
                  {loading ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'leaderboard' && <LeaderboardTab />}
      </div>
    </div>
  );
}
