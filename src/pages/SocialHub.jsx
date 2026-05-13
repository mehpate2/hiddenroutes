/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecentSocialSubmissions, getSocialStats, getSocialLeaderboard } from '../lib/social';

const D = {
  navy: '#0A0F1E', glass: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)',
  white: '#FFFFFF', muted: '#6B7A9A', teal: '#00D2FF', gold: '#C9A84C',
  font: "'Inter',system-ui,sans-serif", serif: "'Playfair Display',Georgia,serif",
  success: '#22c55e',
};

const P_CFG = {
  instagram: { icon: '📸', color: '#fd1d1d', label: 'Instagram' },
  tiktok:    { icon: '🎵', color: '#fe2c55', label: 'TikTok'    },
  snapchat:  { icon: '👻', color: '#FFFC00', label: 'Snapchat'  },
};

const CAT_EMOJI = { nature: '🌿', beach: '🏖️', historic: '🏛️', hidden: '💎', viewpoint: '👁️', local: '☕' };

function StatPill({ icon, value, label, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 12px', background: D.glass, borderRadius: 14, border: `1px solid ${D.border}` }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || D.white, fontFamily: D.serif }}>{value}</div>
      <div style={{ color: D.muted, fontSize: 11 }}>{label}</div>
    </div>
  );
}

function PlaceCard({ place }) {
  const pcfg = P_CFG[place.platform] || P_CFG.instagram;
  return (
    <div style={{ background: D.glass, border: `1px solid ${D.border}`, borderRadius: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: pcfg.color + '22', border: `1px solid ${pcfg.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{pcfg.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: D.white, fontWeight: 700, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name || 'Hidden Place'}</div>
        <div style={{ color: D.muted, fontSize: 11, marginBottom: 4 }}>{place.city ? `${place.city}, ` : ''}{place.state || ''}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: pcfg.color, border: `1px solid ${pcfg.color}44`, borderRadius: 4, padding: '1px 6px' }}>{pcfg.label}</span>
          <span style={{ fontSize: 10, color: D.muted }}>by {place.username || '@explorer'}</span>
        </div>
      </div>
    </div>
  );
}

export default function SocialHub() {
  const navigate = useNavigate();
  const [recent, setRecent]   = useState([]);
  const [stats, setStats]     = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getRecentSocialSubmissions(12),
      getSocialStats(),
      getSocialLeaderboard(5),
    ]).then(([r, s, l]) => {
      setRecent(r);
      setStats(s);
      setLeaders(l);
      setLoading(false);
    });
  }, []);

  const total = stats?.total || 0;
  const byP   = stats?.byPlatform || { instagram: 0, tiktok: 0, snapchat: 0 };

  return (
    <div style={{ minHeight: '100vh', background: D.navy, fontFamily: D.font, color: D.white, paddingBottom: 60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', background: 'rgba(10,15,30,0.85)', borderBottom: `1px solid ${D.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
        <div style={{ fontFamily: D.serif, fontSize: 17, fontWeight: 900 }}>#hiddenroutes Community</div>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate('/submit/social')} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#833ab4,#fd1d1d)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
          + Share a Place
        </button>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,rgba(131,58,180,0.15),rgba(253,29,29,0.08),rgba(252,176,69,0.05))', border: '1px solid rgba(131,58,180,0.2)', borderRadius: 20, padding: '32px 28px', marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>#hiddenroutes</div>
          <h1 style={{ fontFamily: D.serif, fontSize: 28, fontWeight: 900, margin: '0 0 8px', color: D.white }}>Discover Together</h1>
          <p style={{ color: D.muted, fontSize: 14, margin: '0 0 20px', lineHeight: 1.7, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            Every post tagged <strong style={{ color: D.teal }}>#hiddenroutes</strong> on Instagram, TikTok, or Snapchat gets added to our shared map. Join thousands of explorers finding America's secrets.
          </p>
          <div style={{ display: 'inline-flex', gap: 6, background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.2)', borderRadius: 12, padding: '8px 16px' }}>
            <span style={{ color: D.teal, fontWeight: 800, fontSize: 20 }}>{total.toLocaleString()}</span>
            <span style={{ color: D.muted, fontSize: 13, alignSelf: 'center' }}>places shared so far</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 28 }}>
          <StatPill icon="📸" value={byP.instagram} label="Instagram" color="#fd1d1d" />
          <StatPill icon="🎵" value={byP.tiktok}    label="TikTok"    color="#fe2c55" />
          <StatPill icon="👻" value={byP.snapchat}   label="Snapchat"  color="#FFFC00" />
          <StatPill icon="🗺️" value={total}          label="Total"     color={D.teal}  />
        </div>

        {/* Platform breakdown bar */}
        {total > 0 && (
          <div style={{ marginBottom: 28, background: D.glass, border: `1px solid ${D.border}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: D.muted, letterSpacing: 0.8, marginBottom: 10 }}>PLATFORM BREAKDOWN</div>
            <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 }}>
              {Object.entries(byP).map(([p, n]) => {
                const pct = total > 0 ? (n / total) * 100 : 0;
                return pct > 0 ? <div key={p} style={{ width: `${pct}%`, background: P_CFG[p]?.color + 'cc', transition: 'width 0.5s ease' }} /> : null;
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {Object.entries(byP).map(([p, n]) => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: D.muted }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: P_CFG[p]?.color }} />
                  {P_CFG[p]?.label} {total > 0 ? Math.round((n / total) * 100) : 0}%
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent imports */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: D.serif, fontSize: 18, fontWeight: 900, color: D.white, marginBottom: 14 }}>
            Recent Imports {loading && <span style={{ fontSize: 12, color: D.muted, fontFamily: D.font, fontWeight: 400 }}>Loading…</span>}
          </div>
          {!loading && recent.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: D.muted }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📍</div>
              <div>No social imports yet — be the first!</div>
              <button onClick={() => navigate('/submit/social')} style={{ marginTop: 14, padding: '9px 20px', borderRadius: 10, border: `1px solid rgba(131,58,180,0.4)`, background: 'rgba(131,58,180,0.08)', color: '#c084fc', fontSize: 13, cursor: 'pointer', fontFamily: D.font }}>Submit Your Post →</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {recent.map(p => <PlaceCard key={p.id} place={p} />)}
          </div>
        </div>

        {/* Top Social Explorers */}
        {leaders.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: D.serif, fontSize: 18, fontWeight: 900, color: D.white, marginBottom: 14 }}>🏆 Top Social Explorers</div>
            {leaders.map((l, i) => (
              <div key={l.username} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, marginBottom: 8, background: i === 0 ? 'rgba(255,255,255,0.06)' : D.glass, border: `1px solid ${i === 0 ? D.gold + '33' : D.border}` }}>
                <div style={{ fontSize: i < 3 ? 22 : 14, minWidth: 28, textAlign: 'center', color: D.muted }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#833ab4,#fd1d1d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📸</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: D.white, fontWeight: 600, fontSize: 14 }}>{l.username}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    {l.platforms.map(p => <span key={p} style={{ fontSize: 14 }}>{P_CFG[p]?.icon}</span>)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: D.gold, fontWeight: 700, fontSize: 15 }}>{l.count}</div>
                  <div style={{ color: D.muted, fontSize: 11 }}>places</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Join CTA */}
        <div style={{ background: 'linear-gradient(135deg,rgba(131,58,180,0.12),rgba(253,29,29,0.08))', border: '1px solid rgba(131,58,180,0.25)', borderRadius: 20, padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🌎</div>
          <div style={{ fontFamily: D.serif, fontSize: 20, fontWeight: 900, color: D.white, marginBottom: 8 }}>Join the #hiddenroutes Community</div>
          <p style={{ color: D.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 20, maxWidth: 420, margin: '0 auto 20px' }}>
            Every explorer who shares a hidden place earns points, gets featured on the leaderboard, and helps thousands of others discover secret spots.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/settings/social')} style={{ padding: '11px 22px', borderRadius: 11, border: '1px solid rgba(131,58,180,0.4)', background: 'rgba(131,58,180,0.1)', color: '#c084fc', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
              Connect Accounts
            </button>
            <button onClick={() => navigate('/submit/social')} style={{ padding: '11px 22px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#833ab4,#fd1d1d)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
              Submit a Post →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
