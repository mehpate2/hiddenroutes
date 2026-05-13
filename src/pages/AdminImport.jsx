/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  SUBREDDITS,
  savePipelineResult,
  getPipelineStats,
  getRedditPlaces,
  approveRedditPlace,
  rejectRedditPlace,
  updateRedditPlace,
  approveAllHighConfidence,
  rejectAllLowConfidence,
  getLastPipelineRun,
  saveLastPipelineRun,
} from '../lib/reddit';

const D = {
  navy: '#0A0F1E', navyLight: '#111827',
  teal: '#00D2FF', gold: '#C9A84C', orange: '#F97316',
  white: '#FFFFFF', muted: '#6B7A9A', border: 'rgba(255,255,255,0.12)',
  glass: 'rgba(255,255,255,0.05)',
  font: "'Inter',system-ui,sans-serif", serif: "'Playfair Display',Georgia,serif",
  success: '#22c55e', error: '#ef4444', warn: '#f59e0b',
};

const CONF_COLOR  = { high: D.success, medium: D.warn, low: D.error };
const CAT_EMOJI   = { nature:'🌿', waterfall:'💧', cave:'🕳️', viewpoint:'👁️', beach:'🏖️', trail:'🥾', forest:'🌲', lake:'🏞️', history:'🏛️' };
const SCORE_COLOR = s => s >= 90 ? '#FFD700' : s >= 70 ? D.success : s >= 50 ? D.warn : D.error;
const SCORE_LABEL = s => s >= 90 ? '🏆 Legendary' : s >= 70 ? '⭐ Verified' : s >= 50 ? '📋 Review' : '✗ Low';
const QUEUE_DELAY = 5000; // ms between subreddits
const CACHE_TTL   = 3600000; // 1 hour

// ─── Session cache helpers ─────────────────────────────────────────────────────
function getCached(sub) {
  try {
    const raw = sessionStorage.getItem(`reddit_raw_${sub}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(`reddit_raw_${sub}`); return null; }
    return data;
  } catch { return null; }
}
function setCache(sub, data) {
  try { sessionStorage.setItem(`reddit_raw_${sub}`, JSON.stringify({ data, ts: Date.now() })); } catch {}
}
function timeAgo(ts) {
  if (!ts) return null;
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function unsplash(q, w = 400, h = 220) {
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(q)}`;
}

// ─── Score Circle ─────────────────────────────────────────────────────────────
function ScoreCircle({ score, size = 48 }) {
  const r = size / 2 - 5, circ = 2 * Math.PI * r, dash = (score / 100) * circ, col = SCORE_COLOR(score);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={4} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize: size*0.28, fontWeight:800, color:col, fontFamily:D.serif }}>{score}</div>
    </div>
  );
}

// ─── Score Breakdown Bar ──────────────────────────────────────────────────────
function ScoreBar({ label, value, max, color }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:D.muted, marginBottom:2 }}>
        <span>{label}</span><span style={{ color: color || D.teal }}>{value}/{max}</span>
      </div>
      <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${(value/max)*100}%`, background: color || D.teal, borderRadius:2, transition:'width 0.5s ease' }} />
      </div>
    </div>
  );
}

// ─── Stat Box ──────────────────────────────────────────────────────────────────
function StatBox({ label, value, color, icon }) {
  return (
    <div style={{ textAlign:'center', padding:'14px 12px', background:D.glass, borderRadius:14, border:`1px solid ${D.border}`, minWidth:80 }}>
      {icon && <div style={{ fontSize:18, marginBottom:3 }}>{icon}</div>}
      <div style={{ fontSize:22, fontWeight:800, color: color || D.white, fontFamily:D.serif }}>{value}</div>
      <div style={{ color:D.muted, fontSize:11 }}>{label}</div>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ place, onSave, onClose }) {
  const [form, setForm] = useState({
    name: place.name || '', description: place.description || '',
    state: place.state || '', city: place.city || '',
    why_hidden: place.why_hidden || '', local_tip: place.local_tip || '',
    category: place.category || 'nature',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = (extra = {}) => ({ width:'100%', padding:'9px 12px', borderRadius:9, border:`1px solid ${D.border}`, background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:13, outline:'none', fontFamily:D.font, boxSizing:'border-box', ...extra });
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:D.navyLight, border:`1px solid ${D.border}`, borderRadius:20, padding:28, maxWidth:520, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ color:D.white, fontWeight:700, fontSize:16, fontFamily:D.serif }}>Edit Place</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:D.muted, fontSize:20, cursor:'pointer' }}>✕</button>
        </div>
        {[{l:'Name',k:'name'},{l:'State',k:'state'},{l:'City',k:'city'},{l:'Category',k:'category'}].map(({l,k}) => (
          <div key={k} style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:11, color:D.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:0.8 }}>{l}</label>
            <input value={form[k]} onChange={set(k)} style={inp()} />
          </div>
        ))}
        {[{l:'Description',k:'description',r:3},{l:'Why Hidden',k:'why_hidden',r:2},{l:'Local Tip',k:'local_tip',r:2}].map(({l,k,r}) => (
          <div key={k} style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:11, color:D.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:0.8 }}>{l}</label>
            <textarea value={form[k]} onChange={set(k)} rows={r} style={{ ...inp(), resize:'vertical', lineHeight:1.5 }} />
          </div>
        ))}
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={() => onSave(form)} style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', background:`linear-gradient(135deg,${D.teal},#3A7BD5)`, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:D.font }}>Save & Approve</button>
          <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:10, border:`1px solid ${D.border}`, background:'transparent', color:D.muted, cursor:'pointer', fontFamily:D.font }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Place Card ────────────────────────────────────────────────────────────────
function PlaceCard({ place, onApprove, onReject, onEdit }) {
  const [imgErr, setImgErr] = useState(false);
  const score = place.score || 0, bd = place.scoreBreakdown || {};
  return (
    <div style={{ background:D.glass, borderRadius:16, border:`1px solid ${SCORE_COLOR(score)}30`, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {!imgErr
        ? <img src={unsplash(`${place.name} ${place.state} ${place.category}`)} alt="" onError={() => setImgErr(true)} style={{ width:'100%', height:130, objectFit:'cover', display:'block' }} />
        : <div style={{ width:'100%', height:70, background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{CAT_EMOJI[place.category]||'📍'}</div>
      }
      <div style={{ padding:'10px 12px', flex:1, display:'flex', flexDirection:'column', gap:5 }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
          <ScoreCircle score={score} size={44} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:D.white, fontWeight:700, fontSize:12, lineHeight:1.3 }}>{place.name}</div>
            <div style={{ color:D.muted, fontSize:10 }}>{place.city ? `${place.city}, ` : ''}{place.state}</div>
            <div style={{ fontSize:10, fontWeight:700, color:SCORE_COLOR(score), marginTop:1 }}>{SCORE_LABEL(score)}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          <span style={{ fontSize:9, fontWeight:700, color:CONF_COLOR[place.confidence], border:`1px solid ${CONF_COLOR[place.confidence]}44`, borderRadius:5, padding:'1px 5px', textTransform:'uppercase' }}>{place.confidence}</span>
          <span style={{ fontSize:9, color:D.orange, border:`1px solid ${D.orange}44`, borderRadius:5, padding:'1px 5px' }}>r/{place.subreddit}</span>
          {place.beenThereCount >= 1 && <span style={{ fontSize:9, color:D.success, border:`1px solid ${D.success}44`, borderRadius:5, padding:'1px 5px' }}>✓{place.beenThereCount}</span>}
        </div>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10, lineHeight:1.4, flex:1 }}>
          {(place.description||'').slice(0,90)}{(place.description?.length||0)>90?'…':''}
        </div>
        {bd.upvotes !== undefined && (
          <div style={{ padding:'6px 8px', background:'rgba(0,0,0,0.25)', borderRadius:7 }}>
            <ScoreBar label="Upvotes"    value={bd.upvotes}    max={30} color={D.teal} />
            <ScoreBar label="Engagement" value={bd.engagement} max={20} color='#3b82f6' />
            <ScoreBar label="Community"  value={bd.community}  max={20} color={D.gold} />
            <ScoreBar label="AI"         value={bd.ai}         max={30} color='#a78bfa' />
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:D.muted }}>
          <span>{place.coordinates?.lat ? `📍 ${place.coordinates.lat.toFixed(2)},${place.coordinates.lng.toFixed(2)}` : '📍 No coords'}</span>
          <span>▲{(place.upvotes||0).toLocaleString()}</span>
        </div>
        {place.source_url && <a href={place.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:9, color:D.orange, textDecoration:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>🔗 Reddit Post ↗</a>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
          <button onClick={() => onApprove(place.id)} style={{ padding:'6px 0', borderRadius:6, border:'none', background:'rgba(34,197,94,0.12)', color:D.success, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:D.font }}>✓</button>
          <button onClick={() => onReject(place.id)}  style={{ padding:'6px 0', borderRadius:6, border:'none', background:'rgba(239,68,68,0.09)', color:D.error,   fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:D.font }}>✗</button>
          <button onClick={() => onEdit(place)}        style={{ padding:'6px 0', borderRadius:6, border:`1px solid ${D.teal}44`, background:'rgba(0,210,255,0.05)', color:D.teal, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:D.font }}>✎</button>
        </div>
      </div>
    </div>
  );
}

// ─── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(targetMs) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!targetMs) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, Math.ceil((targetMs - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return remaining;
}

// ─── Subreddit Card ────────────────────────────────────────────────────────────
function SubredditCard({ sub, stat, queuePos, isActive, anyRunning, onRun, onQueue }) {
  const st = stat?.status || 'idle';
  const countdown = useCountdown(stat?.retryAt || 0);
  const cached = getCached(sub);

  const statusIcon  = { idle:'○', queued:'⏳', running:'🔄', done:'✅', error:'❌', ratelimited:'⏱️' }[st] || '○';
  const statusColor = { idle:D.muted, queued:D.warn, running:D.teal, done:D.success, error:D.error, ratelimited:D.warn }[st] || D.muted;
  const isRunning   = st === 'running' || isActive;
  const isQueued    = st === 'queued';
  const canRun      = !anyRunning && st !== 'queued';

  return (
    <div style={{ padding:'10px 12px', borderRadius:10, background:D.glass, border:`1px solid ${isRunning ? D.teal+'55' : isQueued ? D.warn+'33' : D.border}`, marginBottom:5, transition:'border-color 0.3s' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11 }}>{statusIcon}</span>
            <span style={{ color:D.white, fontWeight:600, fontSize:12 }}>r/{sub}</span>
            {cached && <span style={{ fontSize:9, color:D.success, background:`${D.success}15`, padding:'1px 5px', borderRadius:4 }}>cached</span>}
            {queuePos > 0 && <span style={{ fontSize:9, color:D.warn }}>#{queuePos} in queue</span>}
          </div>
          {stat?.message && (
            <div style={{ color:D.muted, fontSize:10, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{stat.message}</div>
          )}
          {isRunning && stat?.pct > 0 && (
            <div style={{ marginTop:4, height:2, borderRadius:1, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${stat.pct}%`, background:`linear-gradient(90deg,${D.teal},#3A7BD5)`, borderRadius:1, transition:'width 0.4s' }} />
            </div>
          )}
          {st === 'done' && stat?.summary && (
            <div style={{ display:'flex', gap:6, marginTop:3, flexWrap:'wrap' }}>
              <span style={{ fontSize:9, color:D.success }}>✓{stat.summary.autoApproved} approved</span>
              <span style={{ fontSize:9, color:D.warn }}>📋{stat.summary.pendingReview} pending</span>
              {stat.lastRun && <span style={{ fontSize:9, color:D.muted }}>{timeAgo(stat.lastRun)}</span>}
            </div>
          )}
          {st === 'ratelimited' && countdown > 0 && (
            <div style={{ color:D.warn, fontSize:10, marginTop:2 }}>⏱️ Retry in {countdown}s</div>
          )}
          {st === 'error' && stat?.error && (
            <div style={{ color:D.error, fontSize:10, marginTop:2 }}>⚠️ {stat.error.slice(0, 60)}</div>
          )}
        </div>
        <div style={{ display:'flex', gap:5, flexShrink:0 }}>
          {canRun && (
            <button onClick={() => onRun(sub)}
              style={{ padding:'5px 12px', borderRadius:7, border:'none', background:`linear-gradient(135deg,${D.teal},#3A7BD5)`, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:D.font, whiteSpace:'nowrap' }}>
              {st === 'done' ? '↺' : '▶'}
            </button>
          )}
          {!anyRunning && !isQueued && (
            <button onClick={() => onQueue(sub)}
              style={{ padding:'5px 10px', borderRadius:7, border:`1px solid ${D.gold}44`, background:'rgba(201,168,76,0.08)', color:D.gold, fontSize:11, cursor:'pointer', fontFamily:D.font }}>
              +Q
            </button>
          )}
          {isQueued && (
            <span style={{ fontSize:10, color:D.warn, padding:'5px 8px' }}>queued</span>
          )}
          {isRunning && (
            <span style={{ fontSize:10, color:D.teal, padding:'5px 8px', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', border:'2px solid rgba(0,210,255,0.2)', borderTopColor:D.teal, animation:'spin 0.7s linear infinite', display:'inline-block' }} />
              running
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Queue Status Bar ──────────────────────────────────────────────────────────
function QueueBar({ queue, activeSubreddit, subStats }) {
  if (!activeSubreddit && queue.length === 0) return null;
  const all    = activeSubreddit ? [activeSubreddit, ...queue] : queue;
  const etaSec = queue.length * (QUEUE_DELAY / 1000 + 90); // ~90s per sub

  return (
    <div style={{ padding:'10px 14px', background:'rgba(0,210,255,0.06)', border:`1px solid ${D.teal}33`, borderRadius:12, marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ color:D.teal, fontWeight:700, fontSize:12 }}>Import Queue</span>
        {queue.length > 0 && <span style={{ color:D.muted, fontSize:11 }}>~{Math.ceil(etaSec / 60)}m remaining</span>}
      </div>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
        {all.map((sub, i) => {
          const isAct = sub === activeSubreddit;
          return (
            <span key={sub} style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background: isAct ? `${D.teal}22` : 'rgba(255,255,255,0.05)', border:`1px solid ${isAct ? D.teal+'55' : D.border}`, color: isAct ? D.teal : D.muted, display:'flex', alignItems:'center', gap:4 }}>
              {isAct && <span style={{ width:6, height:6, borderRadius:'50%', background:D.teal, animation:'pulseBadge 1.2s ease-in-out infinite', display:'inline-block' }} />}
              r/{sub}
              {isAct ? ' (running)' : ' (waiting)'}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminImport() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [isAdmin, setIsAdmin]       = useState(null);
  const [tab, setTab]               = useState('pending');
  const [places, setPlaces]         = useState([]);
  const [stats, setStats]           = useState({ total:0, pending:0, approved:0, rejected:0, autoApproved:0, highConfidence:0, avgScore:0 });
  const [lastRun, setLastRun]       = useState(null);
  const [subStats, setSubStats]     = useState({}); // { [sub]: { status, pct, message, summary, lastRun, error, retryAt } }
  const [queue, setQueue]           = useState([]); // waiting subs
  const [activeSubreddit, setActive] = useState(null);
  const [editing, setEditing]       = useState(null);
  const [bulkMsg, setBulkMsg]       = useState('');
  const [liveQueue, setLiveQueue]   = useState([]);

  const sseRefs       = useRef({});
  const queueRef      = useRef([]);
  const processingRef = useRef(false);
  const activeRef     = useRef(null);

  // ── Admin check ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getDoc(doc(db, 'users', user.uid)).then(snap => setIsAdmin(!!(snap.exists() && snap.data()?.isAdmin === true)));
  }, [user]);

  const refreshStats = useCallback(async () => {
    const [s, lr] = await Promise.all([getPipelineStats(), getLastPipelineRun()]);
    setStats(s); setLastRun(lr);
  }, []);

  const refreshPlaces = useCallback(async () => {
    let filter = {};
    if (tab === 'pending')  filter = { status: 'pending' };
    if (tab === 'approved') filter = { status: 'approved' };
    if (tab === 'high')     filter = { status: 'pending', conf: 'high' };
    setPlaces(await getRedditPlaces(filter));
  }, [tab]);

  useEffect(() => { refreshPlaces(); }, [tab]);
  useEffect(() => { refreshStats(); }, []);

  // ── Set sub status helper ─────────────────────────────────────────────────
  const setStat = useCallback((sub, patch) => {
    setSubStats(prev => ({ ...prev, [sub]: { ...(prev[sub] || {}), ...patch } }));
  }, []);

  // ── Run pipeline for one sub (returns Promise) ────────────────────────────
  const runOne = useCallback((sub) => new Promise((resolve) => {
    // Check session cache
    const cached = getCached(sub);
    if (cached) {
      setStat(sub, { status: 'done', message: 'Loaded from cache', summary: cached.summary, lastRun: cached.ts, pct: 100 });
      resolve();
      return;
    }

    if (sseRefs.current[sub]) sseRefs.current[sub].close();
    setStat(sub, { status: 'running', pct: 5, message: `Connecting to r/${sub}…`, error: null, retryAt: null });

    const es = new EventSource(`/api/reddit-pipeline?subreddit=${encodeURIComponent(sub)}&limit=100`);
    sseRefs.current[sub] = es;

    es.onmessage = async (e) => {
      const data = JSON.parse(e.data);

      if (data.type === 'status') {
        setStat(sub, { message: data.message });
      } else if (data.type === 'progress') {
        const pct = Math.round((data.processed / data.total) * 100);
        setStat(sub, { pct, message: `${data.processed}/${data.total} posts…` });
      } else if (data.type === 'place') {
        const place = data.place;
        const id = await savePipelineResult(place).catch(() => null);
        if (id) {
          setLiveQueue(q => [{ ...place, id }, ...q].slice(0, 30));
          if (tab === 'pending'  && place.verdict === 'pending')       setPlaces(p => [{ ...place, id }, ...p]);
          if (tab === 'approved' && place.verdict === 'auto_approved') setPlaces(p => [{ ...place, id, status: 'approved' }, ...p]);
        }
      } else if (data.type === 'done') {
        const summary = data.summary;
        const cacheEntry = { summary, ts: Date.now() };
        setCache(sub, cacheEntry);
        setStat(sub, { status: 'done', pct: 100, message: 'Complete', summary, lastRun: Date.now() });
        es.close(); delete sseRefs.current[sub];
        saveLastPipelineRun({ lastRunAt: new Date(), lastSummary: summary, enabled: lastRun?.enabled || false }).catch(() => {});
        await refreshStats();
        resolve();
      } else if (data.type === 'error') {
        const is429 = data.message?.includes('rate limit') || data.message?.includes('429');
        const retryAt = is429 ? Date.now() + 60000 : null;
        setStat(sub, { status: is429 ? 'ratelimited' : 'error', message: data.message, error: data.message, retryAt, pct: 0 });
        es.close(); delete sseRefs.current[sub];
        resolve(); // don't block queue on error
      }
    };

    es.onerror = () => {
      setStat(sub, { status: 'error', message: 'Connection failed', error: 'SSE connection lost' });
      es.close(); delete sseRefs.current[sub];
      resolve();
    };
  }), [tab, lastRun, setStat]);

  // ── Queue processor ───────────────────────────────────────────────────────
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const sub = queueRef.current[0];
      queueRef.current = queueRef.current.slice(1);
      setQueue([...queueRef.current]);
      activeRef.current = sub;
      setActive(sub);

      await runOne(sub);

      activeRef.current = null;
      setActive(null);

      if (queueRef.current.length > 0) {
        // Show countdown between subs
        setStat(queueRef.current[0], { status: 'queued', message: `Starting in ${QUEUE_DELAY / 1000}s…` });
        await new Promise(r => setTimeout(r, QUEUE_DELAY));
      }
    }

    processingRef.current = false;
    await refreshStats();
  }, [runOne, setStat, refreshStats]);

  // ── Add to queue ──────────────────────────────────────────────────────────
  const enqueue = useCallback((subs) => {
    const newSubs = (Array.isArray(subs) ? subs : [subs]).filter(s => !queueRef.current.includes(s) && activeRef.current !== s);
    if (newSubs.length === 0) return;
    queueRef.current = [...queueRef.current, ...newSubs];
    setQueue([...queueRef.current]);
    newSubs.forEach(s => setStat(s, { status: 'queued', message: 'Waiting in queue…' }));
    processQueue();
  }, [processQueue, setStat]);

  // ── Run single immediately ────────────────────────────────────────────────
  const runImmediate = useCallback((sub) => {
    if (processingRef.current) { enqueue(sub); return; }
    queueRef.current = [sub, ...queueRef.current.filter(s => s !== sub)];
    setQueue([...queueRef.current]);
    processQueue();
  }, [processQueue, enqueue]);

  // ── Run all subreddits ────────────────────────────────────────────────────
  const runAll = useCallback(() => { enqueue([...SUBREDDITS]); }, [enqueue]);

  // ── Place actions ─────────────────────────────────────────────────────────
  const handleApprove = async id => { await approveRedditPlace(id); setPlaces(p => p.filter(x => x.id !== id)); await refreshStats(); };
  const handleReject  = async id => { await rejectRedditPlace(id);  setPlaces(p => p.filter(x => x.id !== id)); await refreshStats(); };
  const handleEditSave = async form => {
    await updateRedditPlace(editing.id, form);
    await approveRedditPlace(editing.id);
    setEditing(null); setPlaces(p => p.filter(x => x.id !== editing.id)); await refreshStats();
  };
  const handleBulkApprove = async () => {
    const n = await approveAllHighConfidence();
    setBulkMsg(`✅ Approved ${n} high-confidence places`);
    setTimeout(() => setBulkMsg(''), 3500);
    await refreshPlaces(); await refreshStats();
  };
  const handleBulkReject = async () => {
    const n = await rejectAllLowConfidence();
    setBulkMsg(`🗑️ Rejected ${n} low-confidence places`);
    setTimeout(() => setBulkMsg(''), 3500);
    await refreshPlaces(); await refreshStats();
  };

  useEffect(() => () => Object.values(sseRefs.current).forEach(es => es.close()), []);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (isAdmin === null) return (
    <div style={{ minHeight:'100vh', background:D.navy, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid rgba(0,210,255,0.15)', borderTopColor:D.teal, animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!isAdmin) return (
    <div style={{ minHeight:'100vh', background:D.navy, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:D.font }}>
      <div style={{ textAlign:'center', padding:40 }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🔒</div>
        <div style={{ color:D.white, fontFamily:D.serif, fontSize:22, fontWeight:900, marginBottom:8 }}>Admin Access Required</div>
        <div style={{ color:D.muted, marginBottom:20 }}>Set <code style={{ color:D.teal }}>users/{user?.uid}.isAdmin = true</code> in Firestore.</div>
        <button onClick={() => navigate('/app')} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${D.teal},#3A7BD5)`, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:D.font }}>Back to App</button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const anyRunning = !!activeSubreddit || processingRef.current;
  const TABS = [
    { id:'pending',  label:`📋 Pending (${stats.pending})` },
    { id:'high',     label:`⭐ High Conf (${stats.highConfidence})` },
    { id:'approved', label:`✅ Approved (${stats.approved})` },
    { id:'all',      label:`All (${stats.total})` },
  ];

  return (
    <div style={{ minHeight:'100vh', background:D.navy, fontFamily:D.font, paddingBottom:60 }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseBadge{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}
      `}</style>

      {/* Header */}
      <div style={{ padding:'16px 22px', borderBottom:`1px solid ${D.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate('/app')} style={{ background:'none', border:'none', color:D.muted, fontSize:20, cursor:'pointer', padding:4 }}>←</button>
          <div>
            <h1 style={{ fontFamily:D.serif, color:D.white, fontSize:19, fontWeight:900, margin:0 }}>
              🤖 Automated Pipeline
              <span style={{ marginLeft:8, fontSize:10, color:D.orange, background:'rgba(249,115,22,0.12)', border:`1px solid ${D.orange}44`, borderRadius:5, padding:'2px 6px', verticalAlign:'middle' }}>ADMIN</span>
            </h1>
            <p style={{ color:D.muted, fontSize:11, margin:0 }}>Zero-manual-approval Reddit hidden places pipeline</p>
          </div>
        </div>
        {anyRunning && (
          <div style={{ display:'flex', alignItems:'center', gap:6, color:D.teal, fontSize:12 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:D.teal, display:'inline-block', animation:'pulseBadge 1.2s ease-in-out infinite' }} />
            Importing r/{activeSubreddit}… please wait
          </div>
        )}
      </div>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'18px 16px' }}>

        {/* Stats */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:18 }}>
          <StatBox label="Total"         value={stats.total}         color={D.white}   icon="🗃️" />
          <StatBox label="Pending"       value={stats.pending}       color={D.warn}    icon="📋" />
          <StatBox label="Auto-Approved" value={stats.autoApproved}  color={D.success} icon="🤖" />
          <StatBox label="Approved"      value={stats.approved}      color={D.success} icon="✅" />
          <StatBox label="Avg Score"     value={stats.avgScore || 0} color={D.teal}    icon="📊" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'290px 1fr', gap:18, alignItems:'start' }}>

          {/* Left: queue + subreddits */}
          <div>
            {/* Queue status bar */}
            <QueueBar queue={queue} activeSubreddit={activeSubreddit} subStats={subStats} />

            {/* Run all button */}
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <button onClick={runAll} disabled={anyRunning}
                style={{ flex:1, padding:'9px 0', borderRadius:9, border:'none', background: anyRunning ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${D.gold},#e67e22)`, color: anyRunning ? D.muted : '#fff', fontWeight:700, fontSize:12, cursor: anyRunning ? 'not-allowed' : 'pointer', fontFamily:D.font }}>
                {anyRunning ? `Importing r/${activeSubreddit}… please wait` : '🚀 Queue All Subreddits'}
              </button>
            </div>

            {/* Subreddit list */}
            <div style={{ color:D.muted, fontSize:11, marginBottom:6, display:'flex', justifyContent:'space-between' }}>
              <span>Subreddits ({SUBREDDITS.length})</span>
              <span style={{ color:D.success }}>{Object.values(subStats).filter(s => s.status === 'done').length} done this session</span>
            </div>
            <div style={{ maxHeight:460, overflowY:'auto', paddingRight:3 }}>
              {SUBREDDITS.map((sub, i) => (
                <SubredditCard
                  key={sub}
                  sub={sub}
                  stat={subStats[sub]}
                  queuePos={queue.indexOf(sub) + 1}
                  isActive={activeSubreddit === sub}
                  anyRunning={anyRunning}
                  onRun={runImmediate}
                  onQueue={enqueue}
                />
              ))}
            </div>

            {/* Live feed */}
            {liveQueue.length > 0 && (
              <div style={{ marginTop:14, padding:'10px 12px', background:D.glass, borderRadius:12, border:`1px solid ${D.success}33` }}>
                <div style={{ color:D.success, fontWeight:700, fontSize:11, marginBottom:6 }}>🔴 Live — {liveQueue.length} found this session</div>
                <div style={{ maxHeight:150, overflowY:'auto' }}>
                  {liveQueue.slice(0, 25).map((p, i) => (
                    <div key={i} style={{ padding:'3px 0', borderBottom:`1px solid rgba(255,255,255,0.04)`, animation:'fadeIn 0.3s ease' }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ color:D.white, fontSize:10 }}>{p.name}</span>
                        <span style={{ fontSize:9, fontWeight:700, color:SCORE_COLOR(p.score||0) }}>{p.score}</span>
                      </div>
                      <div style={{ color:D.muted, fontSize:9 }}>
                        {p.state} · {p.verdict === 'auto_approved' ? <span style={{ color:D.success }}>auto-approved</span> : <span style={{ color:D.warn }}>pending</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: place review */}
          <div>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:12 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding:'7px 11px', borderRadius:8, border:`1px solid ${tab === t.id ? D.teal : D.border}`, background: tab === t.id ? `${D.teal}18` : 'transparent', color: tab === t.id ? D.teal : D.muted, fontSize:11, fontWeight: tab === t.id ? 700 : 400, cursor:'pointer', fontFamily:D.font }}>
                  {t.label}
                </button>
              ))}
            </div>

            {(tab === 'pending' || tab === 'all' || tab === 'high') && (
              <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
                <button onClick={handleBulkApprove} style={{ padding:'7px 12px', borderRadius:7, border:'none', background:'rgba(34,197,94,0.1)', color:D.success, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:D.font }}>✓ Approve All High Conf</button>
                <button onClick={handleBulkReject}  style={{ padding:'7px 12px', borderRadius:7, border:'none', background:'rgba(239,68,68,0.08)', color:D.error,   fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:D.font }}>✗ Reject All Low Conf</button>
                {bulkMsg && <span style={{ color:D.muted, fontSize:11 }}>{bulkMsg}</span>}
              </div>
            )}

            {places.length === 0 ? (
              <div style={{ textAlign:'center', padding:'50px 20px', color:D.muted }}>
                <div style={{ fontSize:44, marginBottom:10 }}>🔍</div>
                <div style={{ fontSize:14, marginBottom:5 }}>No places here yet</div>
                <div style={{ fontSize:11 }}>Run a subreddit pipeline to discover hidden gems</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
                {places.map(p => (
                  <PlaceCard key={p.id} place={p} onApprove={handleApprove} onReject={handleReject} onEdit={setEditing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editing && <EditModal place={editing} onSave={handleEditSave} onClose={() => setEditing(null)} />}
    </div>
  );
}
