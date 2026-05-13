/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { connectSocialAccount, disconnectSocialAccount, getSocialAccounts } from '../lib/social';

const D = {
  navy: '#0A0F1E', glass: 'rgba(255,255,255,0.05)', glassH: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.12)', white: '#FFFFFF', muted: '#6B7A9A',
  font: "'Inter',system-ui,sans-serif", serif: "'Playfair Display',Georgia,serif",
  success: '#22c55e', teal: '#00D2FF', gold: '#C9A84C',
};

const PLATFORMS = {
  instagram: {
    name: 'Instagram',
    icon: '📸',
    gradient: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)',
    watchMsg: 'Watching for #hiddenroutes posts',
    instructions: [
      'Post your hidden place photo on Instagram',
      'Add #hiddenroutes anywhere in your caption',
      'Tag the exact location in your post',
      'We detect it and add it to the map!',
    ],
    tooltip: 'Post any hidden place photo on Instagram with #hiddenroutes and we\'ll automatically add it to the map with your name credited.',
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    gradient: 'linear-gradient(135deg,#010101,#fe2c55)',
    watchMsg: 'Watching for #hiddenroutes videos',
    instructions: [
      'Film your hidden place TikTok video',
      'Add #hiddenroutes to your caption',
      'Include the location in the video or caption',
      'We add it to the map instantly!',
    ],
    tooltip: 'Post a TikTok video of a hidden place with #hiddenroutes in caption and we\'ll add it to the map instantly.',
  },
  snapchat: {
    name: 'Snapchat',
    icon: '👻',
    gradient: 'linear-gradient(135deg,#FFFC00,#FFE600)',
    watchMsg: 'Watching for location snaps',
    instructions: [
      'Snap your hidden place with location pinned',
      'Share it to your Snapchat Story',
      'Mention #hiddenroutes in your snap text',
      'We capture it and add it to the map!',
    ],
    tooltip: 'Share location-tagged snaps with #hiddenroutes to contribute hidden places to the map.',
  },
};

// ─── Connect Modal ─────────────────────────────────────────────────────────────
function ConnectModal({ platform, onConfirm, onClose, loading }) {
  const cfg = PLATFORMS[platform];
  const [username, setUsername] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#111827', borderRadius: 20, padding: 32, maxWidth: 440, width: '100%', border: `1px solid ${D.border}`, animation: 'popIn 0.25s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>{cfg.icon}</div>
          <h2 style={{ fontFamily: D.serif, color: D.white, fontSize: 20, fontWeight: 900, margin: '0 0 4px' }}>Connect {cfg.name}</h2>
          <p style={{ color: D.muted, fontSize: 13, margin: 0 }}>How to share hidden places from {cfg.name}</p>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 24 }}>
          {cfg.instructions.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>

        {/* Username input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: 0.8, marginBottom: 6 }}>YOUR {cfg.name.toUpperCase()} USERNAME</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={`@your${platform}username`}
            onKeyDown={e => e.key === 'Enter' && username.trim() && onConfirm(username)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${D.border}`, background: 'rgba(255,255,255,0.06)', color: D.white, fontSize: 14, outline: 'none', fontFamily: D.font, boxSizing: 'border-box' }}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${D.border}`, background: 'transparent', color: D.muted, fontSize: 13, cursor: 'pointer', fontFamily: D.font }}>Cancel</button>
          <button
            onClick={() => username.trim() && onConfirm(username)}
            disabled={!username.trim() || loading}
            style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: username.trim() ? cfg.gradient : 'rgba(255,255,255,0.06)', color: username.trim() ? '#fff' : D.muted, fontSize: 13, fontWeight: 700, cursor: username.trim() ? 'pointer' : 'not-allowed', fontFamily: D.font }}>
            {loading ? 'Connecting…' : `Connect ${cfg.name}`}
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

// ─── Platform Card ─────────────────────────────────────────────────────────────
function PlatformCard({ platform, account, onConnect, onDisconnect }) {
  const cfg = PLATFORMS[platform];
  const connected = account?.connected === true;
  const [showTip, setShowTip] = useState(false);

  return (
    <div style={{ background: D.glass, border: `1px solid ${connected ? '#22c55e33' : D.border}`, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, transition: 'border-color 0.3s', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{cfg.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: D.white, fontWeight: 700, fontSize: 17 }}>{cfg.name}</div>
          {connected
            ? <div style={{ color: D.success, fontSize: 12, fontWeight: 600 }}>● Connected</div>
            : <div style={{ color: D.muted, fontSize: 12 }}>Not connected</div>}
        </div>
        <button onClick={() => setShowTip(p => !p)}
          style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${D.border}`, background: showTip ? 'rgba(255,255,255,0.1)' : 'transparent', color: D.muted, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</button>
      </div>

      {/* Tooltip */}
      {showTip && (
        <div style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${D.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          {cfg.tooltip}
        </div>
      )}

      {/* Connected state */}
      {connected && account && (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{cfg.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: D.white, fontWeight: 700, fontSize: 14 }}>{account.username}</div>
            <div style={{ color: D.muted, fontSize: 11 }}>{cfg.watchMsg}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: D.gold, fontWeight: 700, fontSize: 15 }}>{account.postsImported || 0}</div>
            <div style={{ color: D.muted, fontSize: 10 }}>imported</div>
          </div>
        </div>
      )}

      {/* Hashtag reminder */}
      {connected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: D.muted }}>
          <span style={{ background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)', borderRadius: 6, padding: '2px 8px', color: D.teal, fontWeight: 700 }}>#hiddenroutes</span>
          <span>Use this tag on your posts</span>
        </div>
      )}

      {/* Action button */}
      {connected
        ? <button onClick={() => onDisconnect(platform)}
            style={{ padding: '10px 0', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: D.font, transition: 'all 0.2s' }}>
            Disconnect {cfg.name}
          </button>
        : <button onClick={() => onConnect(platform)}
            style={{ padding: '11px 0', borderRadius: 10, border: 'none', background: cfg.gradient, color: platform === 'snapchat' ? '#111' : '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: D.font, transition: 'all 0.2s' }}>
            Connect {cfg.name}
          </button>}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function SocialConnect() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts]     = useState({});
  const [modal, setModal]           = useState(null);  // platform key
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getSocialAccounts(user.uid).then(a => { setAccounts(a); setLoading(false); });
  }, [user]);

  const handleConnect = async (platform, rawUsername) => {
    setConnecting(true);
    try {
      await connectSocialAccount(user.uid, platform, rawUsername);
      const updated = await getSocialAccounts(user.uid);
      setAccounts(updated);
      setModal(null);
      showToast(`Connected! Start posting with #hiddenroutes to add places to the map 🎉`);
    } catch (e) {
      showToast('Connection failed: ' + e.message, 'error');
    } finally { setConnecting(false); }
  };

  const handleDisconnect = async (platform) => {
    await disconnectSocialAccount(user.uid, platform);
    const updated = await getSocialAccounts(user.uid);
    setAccounts(updated);
    showToast(`${PLATFORMS[platform].name} disconnected.`);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: D.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(0,210,255,0.2)', borderTopColor: D.teal, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: D.navy, fontFamily: D.font, color: D.white, paddingBottom: 60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {modal && (
        <ConnectModal
          platform={modal}
          loading={connecting}
          onConfirm={username => handleConnect(modal, username)}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', background: 'rgba(10,15,30,0.85)', borderBottom: `1px solid ${D.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
        <div style={{ fontFamily: D.serif, fontSize: 18, fontWeight: 900, color: D.white }}>Connected Accounts</div>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate('/submit/social')} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#833ab4,#fd1d1d)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
          📸 Submit a Post
        </button>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        {/* Hero banner */}
        <div style={{ background: 'linear-gradient(135deg,rgba(131,58,180,0.12),rgba(253,29,29,0.08),rgba(252,176,69,0.08))', border: '1px solid rgba(131,58,180,0.25)', borderRadius: 20, padding: '28px 28px', marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📱</div>
          <h1 style={{ fontFamily: D.serif, fontSize: 26, fontWeight: 900, margin: '0 0 8px', color: D.white }}>Share Hidden Places from Social</h1>
          <p style={{ color: D.muted, fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>
            Post with <strong style={{ color: D.teal }}>#hiddenroutes</strong> on any platform and your discovery automatically appears on the map. Earn points and build your explorer reputation.
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['🏆', '+50 pts', 'per imported post'], ['🗺️', 'Auto-mapped', 'with your credit'], ['👥', 'Leaderboard', 'top explorers']].map(([icon, val, desc]) => (
              <div key={val} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20 }}>{icon}</div>
                <div style={{ color: D.gold, fontWeight: 700, fontSize: 13 }}>{val}</div>
                <div style={{ color: D.muted, fontSize: 11 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
          {Object.keys(PLATFORMS).map(p => (
            <PlatformCard
              key={p}
              platform={p}
              account={accounts[p]}
              onConnect={key => setModal(key)}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>

        {/* Manual submission CTA */}
        <div style={{ background: D.glass, border: `1px solid ${D.border}`, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: D.white, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Already posted with #hiddenroutes?</div>
            <div style={{ color: D.muted, fontSize: 13 }}>Paste your caption or URL and we'll extract the place automatically using AI.</div>
          </div>
          <button onClick={() => navigate('/submit/social')}
            style={{ padding: '11px 22px', borderRadius: 11, border: 'none', background: `linear-gradient(135deg,${D.teal},#3A7BD5)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: D.font, flexShrink: 0 }}>
            Submit a Post →
          </button>
        </div>
      </div>
    </div>
  );
}
