/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitSocialPost, getSocialAccounts } from '../lib/social';
import { geocodeAddress } from '../utils/geocode';

const D = {
  navy: '#0A0F1E', glass: 'rgba(255,255,255,0.05)', glassH: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.12)', white: '#FFFFFF', muted: '#6B7A9A',
  font: "'Inter',system-ui,sans-serif", serif: "'Playfair Display',Georgia,serif",
  teal: '#00D2FF', gold: '#C9A84C', success: '#22c55e', error: '#ef4444',
};

const PLATFORM_CFG = {
  instagram: { name: 'Instagram', icon: '📸', color: '#fd1d1d', gradient: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', placeholder: 'Paste your Instagram caption here...' },
  tiktok:    { name: 'TikTok',    icon: '🎵', color: '#fe2c55', gradient: 'linear-gradient(135deg,#010101,#fe2c55)', placeholder: 'Paste your TikTok caption or video description...' },
  snapchat:  { name: 'Snapchat',  icon: '👻', color: '#FFFC00', gradient: 'linear-gradient(135deg,#FFFC00,#FFE600)', placeholder: 'Describe your Snapchat location story...' },
};

function PlatformTab({ platform, active, onClick }) {
  const cfg = PLATFORM_CFG[platform];
  return (
    <button onClick={onClick} style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${active ? cfg.color + '66' : D.border}`, background: active ? cfg.color + '14' : 'transparent', color: active ? '#fff' : D.muted, fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer', fontFamily: D.font, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
      {cfg.icon} {cfg.name}
    </button>
  );
}

export default function SocialSubmit() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [platform, setPlatform] = useState('instagram');
  const [caption, setCaption]   = useState('');
  const [location, setLocation] = useState('');
  const [postUrl, setPostUrl]   = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const cfg = PLATFORM_CFG[platform];

  const handleSubmit = async () => {
    if (!caption.trim()) { showToast('Please paste your caption', 'error'); return; }
    if (!confirmed)       { showToast('Please confirm you posted with #hiddenroutes', 'error'); return; }
    if (!user)            { navigate('/login'); return; }

    setSubmitting(true);
    try {
      // 1. Ask AI to extract place from caption
      const resp = await fetch('/api/extract-social-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, platform, location }),
      });
      const extracted = await resp.json();
      if (!extracted.name) throw new Error('Could not identify a specific place in your caption. Please add more location details.');

      // 2. Geocode if we have an address but no coords from AI
      let coords = extracted.coordinates || null;
      if (!coords && (location.trim() || extracted.city)) {
        const addr = location.trim() || `${extracted.city}, ${extracted.state}, USA`;
        coords = await geocodeAddress(addr);
      }

      // 3. Get username from connected account or fallback to display name
      const accounts = await getSocialAccounts(user.uid);
      const username = accounts[platform]?.username || `@${(user.displayName || 'explorer').toLowerCase().replace(/\s+/g, '')}`;

      // 4. Save to Firestore
      const docId = await submitSocialPost({
        platform,
        username,
        userId: user.uid,
        caption,
        postUrl: postUrl.trim() || null,
        name: extracted.name,
        description: extracted.description || '',
        state: extracted.state || '',
        city: extracted.city || '',
        category: extracted.category || 'nature',
        whyHidden: extracted.whyHidden || '',
        coordinates: coords,
        score: extracted.score || 0,
      });

      setResult({ ...extracted, coords, score: extracted.score || 0, docId });
      showToast('Your post was imported to the map! +50 pts 🎉');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: D.navy, fontFamily: D.font, color: D.white, paddingBottom: 60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', background: 'rgba(10,15,30,0.85)', borderBottom: `1px solid ${D.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
        <div style={{ fontFamily: D.serif, fontSize: 17, fontWeight: 900, color: D.white }}>Import from Social Media</div>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>

        {result ? (
          // ── Success state ──────────────────────────────────────────────────
          <div style={{ animation: 'fadeIn 0.4s ease', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🗺️</div>
            <h2 style={{ fontFamily: D.serif, fontSize: 24, color: D.white, marginBottom: 8 }}>Added to the Map!</h2>
            <p style={{ color: D.muted, fontSize: 14, marginBottom: 24 }}>
              <strong style={{ color: D.white }}>{result.name}</strong> was extracted from your {cfg.name} post and {result.score >= 70 ? 'automatically approved' : 'added for review'}.
            </p>
            <div style={{ background: D.glass, border: `1px solid ${D.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ color: D.white, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{result.name}</div>
              {result.state && <div style={{ color: D.muted, fontSize: 13, marginBottom: 6 }}>{result.city ? `${result.city}, ` : ''}{result.state}</div>}
              {result.description && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6, margin: '0 0 10px' }}>{result.description}</p>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: D.success, fontWeight: 700 }}>
                  {result.score >= 70 ? '✅ Auto-approved' : '⏳ Pending review'}
                </span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)', color: D.teal }}>AI Score: {result.score}/100</span>
                {result.coords && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: D.glass, border: `1px solid ${D.border}`, color: D.muted }}>📍 Geocoded</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setResult(null); setCaption(''); setLocation(''); setPostUrl(''); setConfirmed(false); }}
                style={{ padding: '10px 22px', borderRadius: 10, border: `1px solid ${D.border}`, background: 'transparent', color: D.muted, fontSize: 13, cursor: 'pointer', fontFamily: D.font }}>
                Submit Another
              </button>
              <button onClick={() => navigate('/app')}
                style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${D.teal},#3A7BD5)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
                View on Map →
              </button>
            </div>
          </div>
        ) : (
          // ── Form ───────────────────────────────────────────────────────────
          <>
            {/* Platform tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {Object.keys(PLATFORM_CFG).map(p => <PlatformTab key={p} platform={p} active={platform === p} onClick={() => setPlatform(p)} />)}
            </div>

            {/* Instruction banner */}
            <div style={{ background: cfg.color + '10', border: `1px solid ${cfg.color}33`, borderRadius: 12, padding: '12px 16px', marginBottom: 22, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>{cfg.icon}</span>
              <div>
                <div style={{ color: D.white, fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Paste your {PLATFORM_CFG[platform].name} post</div>
                <div style={{ color: D.muted, fontSize: 12, lineHeight: 1.5 }}>Our AI reads your caption and automatically extracts the hidden place, location, and what makes it special.</div>
              </div>
            </div>

            {/* Caption */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: 0.8, marginBottom: 6 }}>CAPTION OR DESCRIPTION</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder={cfg.placeholder}
                rows={5}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${D.border}`, background: D.glass, color: D.white, fontSize: 13, outline: 'none', fontFamily: D.font, resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
              />
            </div>

            {/* Location */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: 0.8, marginBottom: 6 }}>LOCATION (address, city, or coordinates)</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Burney Falls, CA or 40.88, -121.65"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${D.border}`, background: D.glass, color: D.white, fontSize: 13, outline: 'none', fontFamily: D.font, boxSizing: 'border-box' }}
              />
            </div>

            {/* Post URL */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: 0.8, marginBottom: 6 }}>POST URL (optional)</label>
              <input
                value={postUrl}
                onChange={e => setPostUrl(e.target.value)}
                placeholder={`https://${platform === 'tiktok' ? 'tiktok.com' : platform === 'snapchat' ? 'snapchat.com' : 'instagram.com'}/p/...`}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${D.border}`, background: D.glass, color: D.white, fontSize: 13, outline: 'none', fontFamily: D.font, boxSizing: 'border-box' }}
              />
            </div>

            {/* Confirm checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, cursor: 'pointer' }} onClick={() => setConfirmed(p => !p)}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${confirmed ? D.teal : D.border}`, background: confirmed ? D.teal + '22' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
                {confirmed && <span style={{ color: D.teal, fontSize: 13 }}>✓</span>}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.5 }}>I posted this on {PLATFORM_CFG[platform].name} with <strong style={{ color: D.teal }}>#hiddenroutes</strong></span>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={submitting || !caption.trim() || !confirmed}
              style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: submitting || !caption.trim() || !confirmed ? 'rgba(255,255,255,0.06)' : cfg.gradient, color: submitting || !caption.trim() || !confirmed ? D.muted : platform === 'snapchat' ? '#111' : '#fff', fontSize: 15, fontWeight: 700, cursor: submitting || !caption.trim() || !confirmed ? 'not-allowed' : 'pointer', fontFamily: D.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting
                ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Analyzing with AI…</>
                : `${cfg.icon} Import to Map`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
