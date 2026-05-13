/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getUserSubmissions, getLevelInfo } from '../lib/community';
import { getSocialAccounts } from '../lib/social';

const D = {
  navy: '#0A0F1E', teal: '#00D2FF', gold: '#C9A84C',
  white: '#FFFFFF', muted: '#6B7A9A', border: 'rgba(255,255,255,0.12)',
  font: "'Inter',system-ui,sans-serif", serif: "'Playfair Display',Georgia,serif",
  success: '#22c55e', error: '#ef4444',
};

const LEVEL_COLORS = {
  Explorer: '#00D2FF', Pathfinder: '#3b82f6', Legend: '#a855f7', Master: '#FFB347',
};

const CAT_EMOJI = { Nature: '🌿', History: '🏛️', Food: '🍽️', Adventure: '⛰️', Art: '🎨' };

const STATUS_STYLE = {
  pending:  { color: '#6B7A9A', label: '⏳ Pending' },
  approved: { color: '#22c55e', label: '✓ Approved' },
  rejected: { color: '#ef4444', label: '✗ Rejected' },
};

const BADGE_DEFS = [
  { id: 'first_submit',   icon: '📍', name: 'First Pin',        desc: 'Submitted your first place'     },
  { id: 'approved_1',     icon: '✅', name: 'Verified Scout',   desc: 'Got a place approved'            },
  { id: 'approved_5',     icon: '🏆', name: 'Master Scout',     desc: '5 places approved'               },
  { id: 'reviewer',       icon: '💬', name: 'Reviewer',         desc: 'Left 5+ reviews'                 },
  { id: 'helpful',        icon: '👍', name: 'Helpful Voice',    desc: 'Received 10 helpful votes'       },
  { id: 'pathfinder',     icon: '🗺️', name: 'Pathfinder',      desc: 'Reached 200 points'              },
  { id: 'legend',         icon: '⭐', name: 'Legend',           desc: 'Reached 1000 points'             },
  { id: 'master',         icon: '👑', name: 'Master Explorer',  desc: 'Reached 5000 points'             },
];

function StatBox({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: `1px solid ${D.border}` }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || D.white, fontFamily: D.serif }}>{value}</div>
      <div style={{ color: D.muted, fontSize: 12, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg,${color},${color}88)`, borderRadius: 4, transition: 'width 0.8s ease' }} />
    </div>
  );
}

function BadgeGrid({ userBadges }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
      {BADGE_DEFS.map(b => {
        const earned = (userBadges || []).includes(b.id);
        return (
          <div key={b.id} style={{ padding: '12px 10px', borderRadius: 12, background: earned ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${earned ? D.gold + '44' : D.border}`, textAlign: 'center', opacity: earned ? 1 : 0.45, transition: 'all 0.2s' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{b.icon}</div>
            <div style={{ color: earned ? D.gold : D.muted, fontWeight: 700, fontSize: 12 }}>{b.name}</div>
            <div style={{ color: D.muted, fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>{b.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

function SubmissionList({ submissions }) {
  const navigate = useNavigate();
  if (!submissions.length) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: D.muted }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📍</div>
        <div>No submissions yet.</div>
        <button onClick={() => navigate('/submit')} style={{ marginTop: 14, padding: '9px 18px', borderRadius: 10, border: `1px solid ${D.gold}44`, background: 'rgba(201,168,76,0.08)', color: D.gold, fontSize: 13, cursor: 'pointer', fontFamily: D.font }}>
          Submit Your First Place
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {submissions.map(s => {
        const ss = STATUS_STYLE[s.status] || STATUS_STYLE.pending;
        const photo = s.photos?.[0];
        const ts = s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000).toLocaleDateString() : '';
        return (
          <div key={s.id} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`, alignItems: 'center' }}>
            {photo
              ? <img src={photo} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 60, height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{CAT_EMOJI[s.category] || '📍'}</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: D.white, fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
              <div style={{ color: D.muted, fontSize: 12 }}>{s.category} · {s.state} · {ts}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: ss.color, fontWeight: 600 }}>{ss.label}</span>
                {s.gpsVerified && <span style={{ fontSize: 11, color: D.success }}>📍 GPS</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: D.muted, fontSize: 12 }}>👍 {(s.confirmVotes || []).length}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UserProfile() {
  const { user, userPoints, levelInfo } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]       = useState(null);
  const [subs, setSubs]         = useState([]);
  const [socialAccts, setSocial] = useState({});
  const [tab, setTab]           = useState('overview');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    (async () => {
      const [s, submissions, social] = await Promise.all([
        getUserStats(user.uid),
        getUserSubmissions(user.uid),
        getSocialAccounts(user.uid),
      ]);
      setStats(s);
      setSubs(submissions);
      setSocial(social);
      setLoading(false);
    })();
  }, [user]);

  if (!user) return null;
  if (loading) return (
    <div style={{ minHeight: '100vh', background: D.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,210,255,0.2)', borderTopColor: D.teal, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const level   = levelInfo || getLevelInfo(userPoints || 0);
  const lvlColor = LEVEL_COLORS[level.name] || D.teal;

  return (
    <div style={{ minHeight: '100vh', background: D.navy, fontFamily: D.font, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
        <h1 style={{ fontFamily: D.serif, color: D.white, fontSize: 22, fontWeight: 900, margin: 0 }}>My Explorer Profile</h1>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
        {/* Profile hero */}
        <div style={{ background: `linear-gradient(135deg,${lvlColor}18,rgba(255,255,255,0.03))`, borderRadius: 20, border: `1px solid ${lvlColor}33`, padding: '28px 24px', marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          {user.photoURL
            ? <img src={user.photoURL} alt="" style={{ width: 72, height: 72, borderRadius: '50%', border: `3px solid ${lvlColor}`, flexShrink: 0 }} />
            : <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${lvlColor}22`, border: `3px solid ${lvlColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>{level.badge}</div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ color: D.white, fontWeight: 800, fontSize: 22, fontFamily: D.serif }}>{user.displayName || 'Explorer'}</div>
            <div style={{ color: lvlColor, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{level.badge} {level.name}</div>
            <ProgressBar pct={level.pct} color={lvlColor} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: D.muted }}>
              <span>{(userPoints || 0).toLocaleString()} pts</span>
              {level.nextMin && <span>{level.nextMin.toLocaleString()} pts → {BADGE_DEFS.find(b => b.id === Object.keys(LEVEL_COLORS).find(k => LEVEL_COLORS[k] === lvlColor)?.toLowerCase())?.name || 'next level'}</span>}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
          <StatBox label="Points"     value={(userPoints || 0).toLocaleString()} color={D.gold} />
          <StatBox label="Submitted"  value={stats?.submissions || 0}            color={D.teal} />
          <StatBox label="Approved"   value={stats?.approved    || 0}            color={D.success} />
          <StatBox label="Reviews"    value={stats?.reviews     || 0}            color='#a855f7' />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: `1px solid ${D.border}`, paddingBottom: 12 }}>
          {['overview', 'submissions', 'badges', 'social'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: tab === t ? `${D.teal}18` : 'transparent', color: tab === t ? D.teal : D.muted, fontSize: 13, fontWeight: tab === t ? 700 : 400, cursor: 'pointer', fontFamily: D.font, textTransform: 'capitalize' }}>
              {t === 'overview' ? '📊 Overview' : t === 'submissions' ? '📍 My Places' : t === 'badges' ? '🏅 Badges' : '📸 Social'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <div style={{ color: D.white, fontWeight: 700, fontSize: 16, marginBottom: 14, fontFamily: D.serif }}>How to Earn Points</div>
            {[
              { action: 'Submit a place', pts: '+10', color: D.teal },
              { action: 'Place gets approved', pts: '+50', color: D.success },
              { action: 'Write a review', pts: '+20', color: '#a855f7' },
              { action: 'Review marked helpful', pts: '+5', color: '#3b82f6' },
              { action: 'Daily login', pts: '+2', color: D.gold },
              { action: 'Discover first state', pts: '+100', color: '#ec4899' },
            ].map(r => (
              <div key={r.action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}`, marginBottom: 8 }}>
                <span style={{ color: D.muted, fontSize: 14 }}>{r.action}</span>
                <span style={{ color: r.color, fontWeight: 700, fontSize: 15 }}>{r.pts}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'submissions' && <SubmissionList submissions={subs} />}
        {tab === 'badges' && <BadgeGrid userBadges={stats?.badges || []} />}
        {tab === 'social' && (
          <div>
            {/* Connected platforms */}
            <div style={{ color: D.white, fontWeight: 700, fontSize: 15, marginBottom: 12, fontFamily: D.serif }}>Connected Platforms</div>
            {['instagram','tiktok','snapchat'].map(p => {
              const acct = socialAccts[p];
              const cfg = { instagram:{icon:'📸',name:'Instagram',gradient:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)'}, tiktok:{icon:'🎵',name:'TikTok',gradient:'linear-gradient(135deg,#010101,#fe2c55)'}, snapchat:{icon:'👻',name:'Snapchat',gradient:'linear-gradient(135deg,#FFFC00,#FFE600)'} }[p];
              return (
                <div key={p} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, marginBottom:8, background:acct?.connected?'rgba(34,197,94,0.05)':'rgba(255,255,255,0.03)', border:`1px solid ${acct?.connected?'rgba(34,197,94,0.2)':D.border}` }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:cfg.gradient, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{cfg.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:D.white, fontWeight:600, fontSize:14 }}>{cfg.name}</div>
                    <div style={{ color:acct?.connected?D.success:D.muted, fontSize:12 }}>{acct?.connected?`${acct.username} · ${acct.postsImported||0} imported`:'Not connected'}</div>
                  </div>
                  {acct?.connected && <span style={{ fontSize:18 }}>✅</span>}
                </div>
              );
            })}
            {/* Social badges */}
            <div style={{ color: D.white, fontWeight: 700, fontSize: 15, marginBottom: 12, marginTop: 24, fontFamily: D.serif }}>Social Badges</div>
            {(() => {
              const connectedCount = Object.values(socialAccts).filter(a => a?.connected).length;
              const badges = [
                { id:'social_explorer', icon:'🌐', name:'Social Explorer', desc:'Connected 2+ platforms', earned: connectedCount >= 2 },
                { id:'content_creator', icon:'🎬', name:'Content Creator',  desc:'5+ posts imported to map', earned: Object.values(socialAccts).reduce((s,a)=>s+(a?.postsImported||0),0) >= 5 },
              ];
              return (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
                  {badges.map(b => (
                    <div key={b.id} style={{ padding:'14px 12px', borderRadius:12, background:b.earned?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${b.earned?D.gold+'44':D.border}`, textAlign:'center', opacity:b.earned?1:0.4 }}>
                      <div style={{ fontSize:30, marginBottom:4 }}>{b.icon}</div>
                      <div style={{ color:b.earned?D.gold:D.muted, fontWeight:700, fontSize:12 }}>{b.name}</div>
                      <div style={{ color:D.muted, fontSize:11, marginTop:2 }}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{ marginTop:20 }}>
              <button onClick={() => navigate('/settings/social')} style={{ padding:'10px 22px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#833ab4,#fd1d1d)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:D.font }}>
                Manage Social Accounts →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
