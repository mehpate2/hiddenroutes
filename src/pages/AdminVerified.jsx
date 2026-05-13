/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { californiaVerifiedPlaces } from '../data/california_verified';
import { geocodeAddress } from '../utils/geocode';
import { saveVerifiedPlace, getVerifiedPlaceIds } from '../lib/verified';

const D = {
  navy: '#0A0F1E', navyLight: '#111827',
  purple: '#8B5CF6', purpleDim: 'rgba(139,92,246,0.1)',
  teal: '#00D2FF', gold: '#C9A84C',
  white: '#FFFFFF', muted: '#6B7A9A', border: 'rgba(255,255,255,0.12)',
  glass: 'rgba(255,255,255,0.05)',
  font: "'Inter',system-ui,sans-serif", serif: "'Playfair Display',Georgia,serif",
  success: '#22c55e', error: '#ef4444', warn: '#f59e0b',
};

const CAT_COLOR = {
  nature: '#22c55e', beach: '#38bdf8', historic: '#f59e0b',
  hidden: '#8B5CF6', viewpoint: '#00D2FF', local: '#f97316',
};
const CAT_EMOJI = {
  nature: '🌿', beach: '🏖️', historic: '🏛️',
  hidden: '💎', viewpoint: '👁️', local: '☕',
};

// ─── Place Card ────────────────────────────────────────────────────────────────
function PlaceCard({ place, status, coords }) {
  const col = CAT_COLOR[place.category] || D.muted;
  const statusEl = status === 'saved'
    ? <span style={{ color: D.success, fontSize: 11, fontWeight: 700 }}>✅ Saved</span>
    : status === 'exists'
    ? <span style={{ color: D.teal,    fontSize: 11, fontWeight: 700 }}>↩ Already imported</span>
    : status === 'failed'
    ? <span style={{ color: D.error,   fontSize: 11, fontWeight: 700 }}>❌ Failed</span>
    : status === 'geocoding'
    ? <span style={{ color: D.warn,    fontSize: 11 }}>🔄 Geocoding…</span>
    : status === 'saving'
    ? <span style={{ color: D.teal,    fontSize: 11 }}>💾 Saving…</span>
    : <span style={{ color: D.muted,   fontSize: 11 }}>⏳ Pending</span>;

  const finalCoords = coords || place.coordinates;

  return (
    <div style={{ padding: '10px 12px', borderRadius: 10, background: D.glass, border: `1px solid ${status === 'saved' ? D.success + '44' : status === 'failed' ? D.error + '33' : D.border}`, transition: 'border-color 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 13 }}>{CAT_EMOJI[place.category] || '📍'}</span>
            <span style={{ color: D.white, fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</span>
          </div>
          <div style={{ color: D.muted, fontSize: 10, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.address}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: col, border: `1px solid ${col}44`, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase' }}>{place.category}</span>
            <span style={{ fontSize: 9, color: D.muted, border: `1px solid ${D.border}`, borderRadius: 4, padding: '1px 5px' }}>{place.type}</span>
          </div>
          {finalCoords && (
            <div style={{ color: D.purple, fontSize: 9, marginTop: 3 }}>
              📍 {finalCoords.lat.toFixed(4)}, {finalCoords.lng.toFixed(4)}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>{statusEl}</div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminVerified() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin]     = useState(null);
  const [statuses, setStatuses]   = useState({});   // { [id]: 'pending'|'geocoding'|'saving'|'saved'|'exists'|'failed' }
  const [coords, setCoords]       = useState({});   // { [id]: { lat, lng } }
  const [running, setRunning]     = useState(false);
  const [done, setDone]           = useState(false);
  const [existingIds, setExisting] = useState(new Set());
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      setIsAdmin(!!(snap.exists() && snap.data()?.isAdmin === true));
    });
    getVerifiedPlaceIds().then(ids => setExisting(ids));
  }, [user]);

  const savedCount  = Object.values(statuses).filter(s => s === 'saved').length;
  const existsCount = Object.values(statuses).filter(s => s === 'exists').length;
  const failedCount = Object.values(statuses).filter(s => s === 'failed').length;
  const doneCount   = savedCount + existsCount + failedCount;
  const progress    = californiaVerifiedPlaces.length > 0 ? doneCount / californiaVerifiedPlaces.length : 0;

  const setStat = useCallback((id, st) => {
    setStatuses(prev => ({ ...prev, [id]: st }));
  }, []);

  const setCoord = useCallback((id, c) => {
    setCoords(prev => ({ ...prev, [id]: c }));
  }, []);

  const runImport = useCallback(async () => {
    if (running) return;
    setRunning(true);
    cancelRef.current = false;

    for (const place of californiaVerifiedPlaces) {
      if (cancelRef.current) break;

      // Already in Firestore?
      if (existingIds.has(place.id)) {
        setStat(place.id, 'exists');
        continue;
      }

      let finalCoords = place.coordinates || null;

      // Geocode if no coords
      if (!finalCoords) {
        setStat(place.id, 'geocoding');
        finalCoords = await geocodeAddress(place.address);
        if (finalCoords) setCoord(place.id, finalCoords);
        await new Promise(r => setTimeout(r, 1100)); // Nominatim: 1 req/sec
      }

      setStat(place.id, 'saving');
      try {
        const result = await saveVerifiedPlace({ ...place, coordinates: finalCoords });
        setStat(place.id, result.exists ? 'exists' : 'saved');
        if (result.exists) setExisting(prev => new Set([...prev, place.id]));
      } catch {
        setStat(place.id, 'failed');
      }
    }

    setRunning(false);
    setDone(true);
  }, [running, existingIds, setStat, setCoord]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (isAdmin === null) return (
    <div style={{ minHeight: '100vh', background: D.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(139,92,246,0.2)', borderTopColor: D.purple, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!isAdmin) return (
    <div style={{ minHeight: '100vh', background: D.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: D.font }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <div style={{ color: D.white, fontFamily: D.serif, fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Admin Access Required</div>
        <button onClick={() => navigate('/app')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${D.purple},#6d28d9)`, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>Back to App</button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: D.navy, fontFamily: D.font, paddingBottom: 60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ padding: '16px 22px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
          <div>
            <h1 style={{ fontFamily: D.serif, color: D.white, fontSize: 19, fontWeight: 900, margin: 0 }}>
              📍 Verified California Places
              <span style={{ marginLeft: 8, fontSize: 10, color: D.purple, background: D.purpleDim, border: `1px solid ${D.purple}44`, borderRadius: 5, padding: '2px 6px', verticalAlign: 'middle' }}>PERSONAL COLLECTION</span>
            </h1>
            <p style={{ color: D.muted, fontSize: 11, margin: 0 }}>64 curated locations — geocoded and saved to Firestore</p>
          </div>
        </div>
        {running && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: D.purple, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: D.purple, display: 'inline-block', animation: 'spin 1.2s linear infinite' }} />
            Importing… {doneCount}/{californiaVerifiedPlaces.length}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'Total', value: californiaVerifiedPlaces.length, color: D.white, icon: '📍' },
            { label: 'Saved',  value: savedCount,  color: D.success, icon: '✅' },
            { label: 'Exists', value: existsCount, color: D.teal,    icon: '↩' },
            { label: 'Failed', value: failedCount, color: D.error,   icon: '❌' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '12px 16px', background: D.glass, borderRadius: 12, border: `1px solid ${D.border}`, minWidth: 80 }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: D.serif }}>{s.value}</div>
              <div style={{ color: D.muted, fontSize: 11 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {(running || done) && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: D.muted, marginBottom: 6 }}>
              <span>{running ? 'Geocoding & importing…' : done ? 'Import complete!' : ''}</span>
              <span>{doneCount} / {californiaVerifiedPlaces.length}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg,${D.purple},#6d28d9)`, borderRadius: 3, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* Import button */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={runImport}
            disabled={running}
            style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: running ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${D.purple},#6d28d9)`, color: running ? D.muted : '#fff', fontWeight: 700, fontSize: 14, cursor: running ? 'not-allowed' : 'pointer', fontFamily: D.font, display: 'flex', alignItems: 'center', gap: 8 }}>
            {running
              ? <><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Importing {doneCount}/{californiaVerifiedPlaces.length}…</>
              : done ? '↺ Re-import All' : '🚀 Import All to Map'}
          </button>
          {done && (
            <p style={{ color: D.success, fontSize: 12, marginTop: 8 }}>
              ✅ Import complete — {savedCount} new places added, {existsCount} already existed. Visit the California map to see purple pins.
            </p>
          )}
        </div>

        {/* Place grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
          {californiaVerifiedPlaces.map(place => (
            <PlaceCard
              key={place.id}
              place={place}
              status={statuses[place.id] || (existingIds.has(place.id) ? 'exists' : 'pending')}
              coords={coords[place.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
