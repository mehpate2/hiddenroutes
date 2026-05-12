/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  SUBREDDITS, saveRedditPlaces, getRedditPlaces, getRedditStats,
  approveRedditPlace, rejectRedditPlace, updateRedditPlace,
  approveAllHighConfidence, rejectAllLowConfidence,
  getAutoImportSettings, saveAutoImportSettings,
} from '../lib/reddit';

const D = {
  navy: '#0A0F1E', teal: '#00D2FF', gold: '#C9A84C', orange: '#F97316',
  white: '#FFFFFF', muted: '#6B7A9A', border: 'rgba(255,255,255,0.12)',
  font: "'Inter',system-ui,sans-serif", serif: "'Playfair Display',Georgia,serif",
  success: '#22c55e', error: '#ef4444', warn: '#f59e0b',
};

const CONF_COLOR = { high: D.success, medium: D.warn, low: D.error };
const CAT_EMOJI  = { nature:'🌿', waterfall:'💧', cave:'🕳️', viewpoint:'👁️', beach:'🏖️', trail:'🥾', forest:'🌲', lake:'🏞️' };

function unsplash(q, w = 400, h = 240) {
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(q)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: `1px solid ${D.border}`, minWidth: 90 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || D.white, fontFamily: D.serif }}>{value}</div>
      <div style={{ color: D.muted, fontSize: 12 }}>{label}</div>
    </div>
  );
}

function SubredditRow({ sub, onImport, progress }) {
  const st = progress?.status || 'idle';
  const isScanning = st === 'scanning';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}`, marginBottom: 6 }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: D.white, fontWeight: 600, fontSize: 14 }}>r/{sub}</div>
        {isScanning && progress.detail && (
          <div style={{ color: D.muted, fontSize: 12, marginTop: 2 }}>{progress.detail}</div>
        )}
        {st === 'done' && (
          <div style={{ color: D.success, fontSize: 12, marginTop: 2 }}>
            ✓ {progress.postsScanned} posts scanned · {progress.found} places found
          </div>
        )}
        {st === 'error' && <div style={{ color: D.error, fontSize: 12, marginTop: 2 }}>⚠️ {progress.error}</div>}
        {isScanning && (
          <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress.pct || 0}%`, background: `linear-gradient(90deg,${D.teal},#3A7BD5)`, borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        )}
      </div>
      <button
        onClick={() => onImport(sub)}
        disabled={isScanning}
        style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: isScanning ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg,${D.teal},#3A7BD5)`, color: isScanning ? D.muted : '#fff', fontSize: 13, fontWeight: 700, cursor: isScanning ? 'not-allowed' : 'pointer', fontFamily: D.font, whiteSpace: 'nowrap', minWidth: 100 }}>
        {isScanning ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            Scanning…
          </span>
        ) : st === 'done' ? '↺ Re-import' : 'Import'}
      </button>
    </div>
  );
}

function EditModal({ place, onSave, onClose }) {
  const [form, setForm] = useState({
    name:        place.name        || '',
    description: place.description || '',
    state:       place.state       || '',
    city:        place.city        || '',
    why_hidden:  place.why_hidden  || '',
    local_tip:   place.local_tip   || '',
    category:    place.category    || 'nature',
  });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = (style = {}) => ({
    width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${D.border}`,
    background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, outline: 'none',
    fontFamily: D.font, boxSizing: 'border-box', ...style,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#111827', border: `1px solid ${D.border}`, borderRadius: 20, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ color: D.white, fontWeight: 700, fontSize: 16, fontFamily: D.serif }}>Edit Place</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        {[
          { label: 'Name',        key: 'name' },
          { label: 'State',       key: 'state' },
          { label: 'Nearest City',key: 'city' },
          { label: 'Category',    key: 'category' },
        ].map(({ label, key }) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, color: D.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</label>
            <input value={form[key]} onChange={set(key)} style={inp()} />
          </div>
        ))}
        {[
          { label: 'Description', key: 'description', rows: 3 },
          { label: 'Why Hidden',  key: 'why_hidden',  rows: 2 },
          { label: 'Local Tip',   key: 'local_tip',   rows: 2 },
        ].map(({ label, key, rows }) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, color: D.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</label>
            <textarea value={form[key]} onChange={set(key)} rows={rows} style={{ ...inp(), resize: 'vertical', lineHeight: 1.5 }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={() => onSave(form)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${D.teal},#3A7BD5)`, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>Save & Approve</button>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${D.border}`, background: 'transparent', color: D.muted, cursor: 'pointer', fontFamily: D.font }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function PlaceCard({ place, onApprove, onReject, onEdit }) {
  const [imgErr, setImgErr] = useState(false);
  const photoQ = `${place.name} ${place.state} ${place.category} hidden`;
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: `1px solid ${D.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {!imgErr
        ? <img src={unsplash(photoQ)} alt="" onError={() => setImgErr(true)} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: 100, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{CAT_EMOJI[place.category] || '📍'}</div>
      }
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Badges row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: CONF_COLOR[place.confidence] || D.muted, border: `1px solid ${CONF_COLOR[place.confidence] || D.muted}44`, borderRadius: 6, padding: '2px 7px', textTransform: 'uppercase' }}>
            {place.confidence}
          </span>
          <span style={{ fontSize: 10, color: D.orange, border: `1px solid ${D.orange}44`, borderRadius: 6, padding: '2px 7px' }}>
            r/{place.subreddit}
          </span>
          <span style={{ fontSize: 10, color: D.muted, border: `1px solid ${D.border}`, borderRadius: 6, padding: '2px 7px' }}>
            {CAT_EMOJI[place.category] || '📍'} {place.category}
          </span>
        </div>

        <div style={{ color: D.white, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{place.name}</div>
        <div style={{ color: D.muted, fontSize: 12, marginBottom: 6 }}>{place.city ? `${place.city}, ` : ''}{place.state}</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5, marginBottom: 6, flex: 1 }}>
          {place.description?.substring(0, 120)}{place.description?.length > 120 ? '…' : ''}
        </div>
        {place.why_hidden && (
          <div style={{ color: D.teal, fontSize: 11, marginBottom: 6 }}>🔍 {place.why_hidden.substring(0, 80)}</div>
        )}

        {/* Coords + upvotes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 11, color: D.muted }}>
          <span>
            {place.coordinates?.lat ? `📍 ${place.coordinates.lat.toFixed(2)}, ${place.coordinates.lng.toFixed(2)}` : '📍 No coords'}
          </span>
          <span>▲ {(place.upvotes || 0).toLocaleString()} upvotes</span>
        </div>
        {place.source_url && (
          <a href={place.source_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: D.orange, display: 'block', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}>
            🔗 View Reddit Post ↗
          </a>
        )}

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          <button onClick={() => onApprove(place.id)}
            style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: 'rgba(34,197,94,0.15)', color: D.success, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
            ✓ Approve
          </button>
          <button onClick={() => onReject(place.id)}
            style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.12)', color: D.error, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
            ✗ Reject
          </button>
          <button onClick={() => onEdit(place)}
            style={{ padding: '8px 0', borderRadius: 8, border: `1px solid ${D.teal}44`, background: 'rgba(0,210,255,0.06)', color: D.teal, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
            ✎ Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Auto-import settings panel ───────────────────────────────────────────────
function AutoImportPanel() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { getAutoImportSettings().then(setSettings); }, []);

  const handleSchedule = async () => {
    setSaving(true);
    const tomorrow3am = new Date();
    tomorrow3am.setDate(tomorrow3am.getDate() + 1);
    tomorrow3am.setHours(3, 0, 0, 0);
    await saveAutoImportSettings({
      enabled:    true,
      lastRun:    null,
      nextRun:    tomorrow3am.toISOString(),
      subreddits: SUBREDDITS,
    });
    setSettings(await getAutoImportSettings());
    setSaving(false);
  };

  const handleDisable = async () => {
    await saveAutoImportSettings({ enabled: false });
    setSettings(await getAutoImportSettings());
  };

  const lastRun = settings?.lastRun
    ? new Date(settings.lastRun).toLocaleString()
    : 'Never';
  const nextRun = settings?.nextRun
    ? new Date(settings.nextRun).toLocaleString()
    : '—';

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}`, borderRadius: 16, padding: 20, marginTop: 24 }}>
      <div style={{ color: D.white, fontWeight: 700, fontSize: 15, fontFamily: D.serif, marginBottom: 14 }}>
        🕐 Auto-Import Schedule
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: `1px solid ${D.border}` }}>
          <div style={{ color: D.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>Last Run</div>
          <div style={{ color: D.white, fontSize: 13, marginTop: 3 }}>{lastRun}</div>
        </div>
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: `1px solid ${D.border}` }}>
          <div style={{ color: D.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>Next Run</div>
          <div style={{ color: settings?.enabled ? D.teal : D.muted, fontSize: 13, marginTop: 3 }}>{nextRun}</div>
        </div>
      </div>
      <div style={{ color: D.muted, fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
        {settings?.enabled
          ? `✅ Auto-import is enabled across ${settings.subreddits?.length || SUBREDDITS.length} subreddits. For production, add a Vercel cron job pointing to /api/reddit-import.`
          : 'Schedule a daily import at 3 AM across all subreddits. Requires a Vercel cron job in production.'}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSchedule} disabled={saving} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${D.teal},#3A7BD5)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
          {saving ? '…' : settings?.enabled ? '↺ Reset Schedule' : '📅 Schedule Daily Import'}
        </button>
        {settings?.enabled && (
          <button onClick={handleDisable} style={{ padding: '9px 16px', borderRadius: 10, border: `1px solid ${D.error}44`, background: 'transparent', color: D.error, fontSize: 13, cursor: 'pointer', fontFamily: D.font }}>
            Disable
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminImport() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [isAdmin, setIsAdmin]   = useState(null); // null=checking
  const [tab, setTab]           = useState('all');
  const [places, setPlaces]     = useState([]);
  const [stats, setStats]       = useState({ total: 0, pending: 0, approved: 0, rejected: 0, highConfidence: 0 });
  const [progress, setProgress] = useState({}); // { [subreddit]: { status, pct, detail, postsScanned, found, error } }
  const [editing, setEditing]   = useState(null);
  const [bulkMsg, setBulkMsg]   = useState('');
  const cancelRef = useRef(false);

  // Admin check
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data()?.isAdmin === true) setIsAdmin(true);
      else setIsAdmin(false);
    });
  }, [user]);

  const refreshPlaces = async () => {
    let filter = {};
    if (tab === 'pending')  filter.status = 'pending';
    if (tab === 'approved') filter.status = 'approved';
    if (tab === 'high')     filter = { status: 'pending', conf: 'high' };
    const p = await getRedditPlaces(filter);
    setPlaces(p);
  };

  const refreshStats = async () => {
    const s = await getRedditStats();
    setStats(s);
  };

  useEffect(() => { refreshPlaces(); }, [tab]);
  useEffect(() => { refreshStats(); }, []);

  // ── Import single subreddit ──────────────────────────────────────────────
  const importSubreddit = async (sub) => {
    cancelRef.current = false;
    setProgress(p => ({ ...p, [sub]: { status: 'scanning', pct: 5, detail: 'Fetching Reddit posts…' } }));
    try {
      const res = await fetch('/api/reddit-import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subreddit: sub, limit: 100 }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setProgress(p => ({ ...p, [sub]: { status: 'scanning', pct: 70, detail: `AI extracting from ${data.postsScanned} posts…` } }));

      if (!cancelRef.current) {
        const saved = await saveRedditPlaces(data.places || [], sub);
        setProgress(p => ({ ...p, [sub]: { status: 'done', postsScanned: data.postsScanned, found: saved.length } }));
        await refreshPlaces();
        await refreshStats();
      }
    } catch (err) {
      setProgress(p => ({ ...p, [sub]: { status: 'error', error: err.message } }));
    }
  };

  const handleApprove = async (id) => {
    await approveRedditPlace(id);
    setPlaces(p => p.filter(x => x.id !== id));
    await refreshStats();
  };

  const handleReject = async (id) => {
    await rejectRedditPlace(id);
    setPlaces(p => p.filter(x => x.id !== id));
    await refreshStats();
  };

  const handleEditSave = async (form) => {
    await updateRedditPlace(editing.id, form);
    await approveRedditPlace(editing.id);
    setEditing(null);
    setPlaces(p => p.filter(x => x.id !== editing.id));
    await refreshStats();
  };

  const handleBulkApprove = async () => {
    const n = await approveAllHighConfidence();
    setBulkMsg(`✅ Approved ${n} high-confidence places`);
    setTimeout(() => setBulkMsg(''), 3000);
    await refreshPlaces(); await refreshStats();
  };

  const handleBulkReject = async () => {
    const n = await rejectAllLowConfidence();
    setBulkMsg(`🗑️ Rejected ${n} low-confidence places`);
    setTimeout(() => setBulkMsg(''), 3000);
    await refreshPlaces(); await refreshStats();
  };

  // ── Render guards ──────────────────────────────────────────────────────────
  if (isAdmin === null) return (
    <div style={{ minHeight: '100vh', background: D.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,210,255,0.2)', borderTopColor: D.teal, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!isAdmin) return (
    <div style={{ minHeight: '100vh', background: D.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: D.font }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <div style={{ color: D.white, fontFamily: D.serif, fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Admin Access Required</div>
        <div style={{ color: D.muted, marginBottom: 20 }}>Set <code style={{ color: D.teal }}>users/{user?.uid}.isAdmin = true</code> in Firestore Console.</div>
        <button onClick={() => navigate('/app')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${D.teal},#3A7BD5)`, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
          Back to App
        </button>
      </div>
    </div>
  );

  const TABS = [
    { id: 'all',      label: `All (${stats.total})` },
    { id: 'pending',  label: `Pending (${stats.pending})` },
    { id: 'high',     label: `⭐ High Confidence (${stats.highConfidence})` },
    { id: 'approved', label: `✅ Approved (${stats.approved})` },
  ];

  const scanning = SUBREDDITS.filter(s => progress[s]?.status === 'scanning');

  return (
    <div style={{ minHeight: '100vh', background: D.navy, fontFamily: D.font, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
          <div>
            <h1 style={{ fontFamily: D.serif, color: D.white, fontSize: 22, fontWeight: 900, margin: 0 }}>
              Reddit Places Import
              <span style={{ marginLeft: 8, fontSize: 12, color: D.orange, background: 'rgba(249,115,22,0.15)', border: `1px solid ${D.orange}44`, borderRadius: 6, padding: '2px 8px', verticalAlign: 'middle' }}>ADMIN</span>
            </h1>
            <p style={{ color: D.muted, fontSize: 13, margin: 0 }}>Discover hidden gems from Reddit communities</p>
          </div>
        </div>
        {scanning.length > 0 && (
          <button onClick={() => { cancelRef.current = true; setProgress(p => { const n = { ...p }; scanning.forEach(s => { n[s] = { status: 'idle' }; }); return n; }); }}
            style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${D.error}44`, background: 'rgba(239,68,68,0.08)', color: D.error, fontSize: 13, cursor: 'pointer', fontFamily: D.font }}>
            ✕ Cancel Import
          </button>
        )}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatBox label="Total Found"  value={stats.total}          color={D.white} />
          <StatBox label="Pending"      value={stats.pending}        color={D.warn} />
          <StatBox label="Approved"     value={stats.approved}       color={D.success} />
          <StatBox label="Rejected"     value={stats.rejected}       color={D.error} />
          <StatBox label="High Conf."   value={stats.highConfidence} color={D.teal} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left: Subreddit import panel */}
          <div>
            <div style={{ color: D.white, fontWeight: 700, fontSize: 15, marginBottom: 12, fontFamily: D.serif }}>Import from Subreddits</div>
            {SUBREDDITS.map(sub => (
              <SubredditRow key={sub} sub={sub} onImport={importSubreddit} progress={progress[sub]} />
            ))}
            <AutoImportPanel />
          </div>

          {/* Right: Places review */}
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding: '8px 14px', borderRadius: 9, border: `1px solid ${tab === t.id ? D.teal : D.border}`, background: tab === t.id ? `${D.teal}18` : 'transparent', color: tab === t.id ? D.teal : D.muted, fontSize: 12, fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer', fontFamily: D.font }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Bulk actions */}
            {(tab === 'pending' || tab === 'all' || tab === 'high') && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={handleBulkApprove} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: 'rgba(34,197,94,0.12)', color: D.success, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
                  ✓ Approve All High Confidence
                </button>
                <button onClick={handleBulkReject} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: 'rgba(239,68,68,0.08)', color: D.error, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
                  ✗ Reject All Low Confidence
                </button>
                {bulkMsg && <span style={{ color: D.muted, fontSize: 13 }}>{bulkMsg}</span>}
              </div>
            )}

            {/* Place cards grid */}
            {places.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: D.muted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <div>No places here. Import from a subreddit to get started!</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                {places.map(p => (
                  <PlaceCard
                    key={p.id}
                    place={p}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onEdit={setEditing}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <EditModal
          place={editing}
          onSave={handleEditSave}
          onClose={() => setEditing(null)}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
