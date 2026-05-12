/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitPlace, uploadPlacePhoto, verifyPlaceWithAI } from '../lib/community';

const D = {
  navy: '#0A0F1E', teal: '#00D2FF', gold: '#C9A84C',
  white: '#FFFFFF', muted: '#6B7A9A', border: 'rgba(255,255,255,0.12)',
  font: "'Inter',system-ui,sans-serif", serif: "'Playfair Display',Georgia,serif",
  success: '#22c55e', error: '#ef4444',
};

const CATEGORIES = ['Nature', 'History', 'Food', 'Adventure', 'Art'];
const DIFFICULTIES = ['Easy', 'Moderate', 'Challenging'];
const BEST_TIMES = ['Dawn', 'Morning', 'Afternoon', 'Sunset', 'Night', 'Any time'];

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming',
];

function StepDot({ n, active, done }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 13, fontWeight: 700, transition: 'all 0.3s',
      background: done ? D.success : active ? D.teal : 'rgba(255,255,255,0.1)',
      color: done || active ? '#fff' : D.muted,
      boxShadow: active ? `0 0 12px ${D.teal}66` : 'none',
    }}>
      {done ? '✓' : n}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  const [foc, setFoc] = useState(false);
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${foc ? D.teal + '66' : D.border}`, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: D.font, boxSizing: 'border-box', transition: 'border-color 0.2s' }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  const [foc, setFoc] = useState(false);
  return (
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${foc ? D.teal + '66' : D.border}`, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: D.font, boxSizing: 'border-box', resize: 'vertical', transition: 'border-color 0.2s', lineHeight: 1.6 }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${D.border}`, background: '#0d1529', color: value ? '#fff' : D.muted, fontSize: 14, outline: 'none', fontFamily: D.font, boxSizing: 'border-box', cursor: 'pointer' }}
    >
      {options.map(o => <option key={o} value={o} style={{ background: '#0d1529' }}>{o}</option>)}
    </select>
  );
}

// ─── Step 1: Location ─────────────────────────────────────────────────────────
function StepLocation({ coords, setCoords, state, setState }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markerRef = useRef(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locErr, setLocErr] = useState('');

  useEffect(() => {
    if (mapInst.current) return;
    if (!window.L) return;
    const L = window.L;
    const center = coords ? [coords.lat, coords.lng] : [39.5, -98.35];
    const zoom   = coords ? 13 : 4;
    const map = L.map(mapRef.current, { zoomControl: true }).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    mapInst.current = map;

    if (coords) {
      markerRef.current = L.marker([coords.lat, coords.lng]).addTo(map);
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setCoords({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      else markerRef.current = L.marker([lat, lng]).addTo(map);
    });
  }, []);

  const handleGPS = () => {
    setLocLoading(true); setLocErr('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
        if (mapInst.current) {
          mapInst.current.setView([lat, lng], 14);
          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          else markerRef.current = window.L.marker([lat, lng]).addTo(mapInst.current);
        }
        setLocLoading(false);
      },
      (err) => { setLocErr('Could not get location: ' + err.message); setLocLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div>
      <p style={{ color: D.muted, fontSize: 14, marginBottom: 16 }}>
        Click on the map or use GPS to pin your hidden place.
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button onClick={handleGPS} disabled={locLoading} style={{ padding: '9px 16px', borderRadius: 9, border: `1px solid ${D.teal}44`, background: 'rgba(0,210,255,0.08)', color: D.teal, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: D.font }}>
          {locLoading ? '⏳ Getting location…' : '📍 Use My GPS'}
        </button>
        {coords && (
          <div style={{ padding: '9px 14px', borderRadius: 9, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: D.success, fontSize: 13, fontFamily: D.font }}>
            ✓ {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </div>
        )}
      </div>
      {locErr && <div style={{ color: D.error, fontSize: 13, marginBottom: 10 }}>⚠️ {locErr}</div>}

      <div ref={mapRef} style={{ width: '100%', height: 300, borderRadius: 12, overflow: 'hidden', border: `1px solid ${D.border}`, marginBottom: 18 }} />

      <FieldLabel>State</FieldLabel>
      <Select value={state || US_STATES[0]} onChange={setState} options={US_STATES} />
    </div>
  );
}

// ─── Step 2: Photos ───────────────────────────────────────────────────────────
function StepPhotos({ photos, setPhotos, gpsVerified, setGpsVerified }) {
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFiles = async (files) => {
    const arr = Array.from(files).slice(0, 5);
    setUploading(true);
    try {
      // Check EXIF GPS on first photo
      if (arr[0]) {
        try {
          const exifr = (await import('exifr')).default;
          const gps = await exifr.gps(arr[0]);
          if (gps && gps.latitude && gps.longitude) setGpsVerified(true);
        } catch {}
      }
      // Create object URL previews (actual upload happens at submit)
      const prev = arr.map(f => ({ file: f, url: URL.createObjectURL(f) }));
      setPreviews(prev);
      setPhotos(arr);
    } finally { setUploading(false); }
  };

  return (
    <div>
      <p style={{ color: D.muted, fontSize: 14, marginBottom: 16 }}>
        Add up to 5 photos. Photos with GPS data get a verification badge.
      </p>

      {gpsVerified && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: D.success, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          📍 GPS metadata detected — this place gets a verified badge!
        </div>
      )}

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        style={{ border: `2px dashed ${D.border}`, borderRadius: 14, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', color: D.muted, fontSize: 14, transition: 'border-color 0.2s', marginBottom: 16 }}
        onMouseEnter={e => e.currentTarget.style.borderColor = D.teal + '66'}
        onMouseLeave={e => e.currentTarget.style.borderColor = D.border}
      >
        {uploading ? '⏳ Processing…' : '📷 Click or drag photos here'}
        <br />
        <span style={{ fontSize: 12, opacity: 0.6 }}>JPEG/PNG/HEIC · max 5 photos · 10MB each</span>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

      {previews.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {previews.map((p, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={p.url} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 10, border: `1px solid ${D.border}` }} />
              <button onClick={() => { setPreviews(prev => prev.filter((_,j)=>j!==i)); setPhotos(prev => prev.filter((_,j)=>j!==i)); }}
                style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: D.error, border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Details ──────────────────────────────────────────────────────────
function StepDetails({ form, setForm }) {
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <FieldLabel>Place Name *</FieldLabel>
        <Input value={form.name} onChange={set('name')} placeholder="e.g. Devil's Punchbowl Falls" />
      </div>
      <div>
        <FieldLabel>Category *</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => set('category')(c)}
              style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${form.category === c ? D.teal : D.border}`, background: form.category === c ? `${D.teal}22` : 'transparent', color: form.category === c ? D.teal : D.muted, fontSize: 13, cursor: 'pointer', fontFamily: D.font, transition: 'all 0.2s' }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Description * (what makes it special?)</FieldLabel>
        <Textarea value={form.description} onChange={set('description')} placeholder="Describe this hidden gem in 2-4 sentences…" rows={4} />
      </div>
      <div>
        <FieldLabel>Local Tip</FieldLabel>
        <Input value={form.localTip} onChange={set('localTip')} placeholder="Best kept secret about this place…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <FieldLabel>Difficulty</FieldLabel>
          <Select value={form.difficulty} onChange={set('difficulty')} options={DIFFICULTIES} />
        </div>
        <div>
          <FieldLabel>Best Time to Visit</FieldLabel>
          <Select value={form.bestTime} onChange={set('bestTime')} options={BEST_TIMES} />
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Review & Submit ──────────────────────────────────────────────────
function StepReview({ form, coords, state, gpsVerified, photos, aiResult }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, border: `1px solid ${D.border}` }}>
        <div style={{ color: D.gold, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{form.name || '(unnamed)'}</div>
        <div style={{ color: D.muted, fontSize: 13, marginBottom: 8 }}>{form.category} · {state} · {form.difficulty}</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{form.description}</div>
        {form.localTip && <div style={{ color: D.teal, fontSize: 13, marginTop: 8 }}>💡 {form.localTip}</div>}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {coords && (
          <div style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(0,210,255,0.08)', color: D.teal, fontSize: 13 }}>
            📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </div>
        )}
        {gpsVerified && (
          <div style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', color: D.success, fontSize: 13 }}>
            ✓ GPS Verified Photo
          </div>
        )}
        <div style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: D.muted, fontSize: 13 }}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {aiResult && (
        <div style={{ padding: 14, borderRadius: 12, background: aiResult.verdict === 'approved' ? 'rgba(34,197,94,0.08)' : aiResult.verdict === 'rejected' ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)', border: `1px solid ${aiResult.verdict === 'approved' ? 'rgba(34,197,94,0.3)' : aiResult.verdict === 'rejected' ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: aiResult.verdict === 'approved' ? D.success : aiResult.verdict === 'rejected' ? D.error : '#fbbf24', marginBottom: 4 }}>
            🤖 AI Score: {aiResult.score}/100 — {aiResult.verdict.toUpperCase()}
          </div>
          <div style={{ color: D.muted, fontSize: 13 }}>{aiResult.reason}</div>
        </div>
      )}

      <div style={{ color: D.muted, fontSize: 13, lineHeight: 1.6 }}>
        ✅ Your submission earns <strong style={{ color: D.gold }}>+10 points</strong>. If approved by the community, you'll earn <strong style={{ color: D.gold }}>+50 more points!</strong>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SubmitPlace() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [coords, setCoords]         = useState(null);
  const [state, setState]           = useState('California');
  const [photos, setPhotos]         = useState([]);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [form, setForm] = useState({
    name: '', category: 'Nature', description: '',
    localTip: '', difficulty: 'Easy', bestTime: 'Any time',
  });
  const [aiResult, setAiResult]   = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);

  // Load Leaflet
  useEffect(() => {
    if (window.L) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    document.head.appendChild(script);
  }, []);

  const canNext = () => {
    if (step === 1) return !!coords;
    if (step === 3) return form.name.trim() && form.description.trim();
    return true;
  };

  const goNext = async () => {
    if (step === 3) {
      // Run AI verification before review step
      setAiLoading(true);
      try {
        const r = await verifyPlaceWithAI(form.name, form.description, form.category, coords);
        setAiResult(r);
      } catch {}
      setAiLoading(false);
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!user) { navigate('/login'); return; }
    if (!coords) { showToast('Please pin a location first', 'error'); setStep(1); return; }
    if (!form.name || !form.description) { showToast('Please fill in name & description', 'error'); setStep(3); return; }

    setSubmitting(true);
    try {
      // Upload photos first
      let photoUrls = [];
      for (const file of photos) {
        try {
          const url = await uploadPlacePhoto(user.uid, file);
          photoUrls.push(url);
        } catch (err) {
          console.warn('Photo upload failed:', err.message);
        }
      }

      await submitPlace(user.uid, user.displayName || 'Explorer', user.photoURL || '', {
        ...form, coordinates: coords, state, gpsVerified, photos: photoUrls,
      });
      setDone(true);
    } catch (err) {
      showToast('Submission failed: ' + err.message, 'error');
    } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: D.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: D.font }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: D.serif, color: D.white, fontSize: 28, marginBottom: 12 }}>Place Submitted!</h2>
          <p style={{ color: D.muted, fontSize: 15, marginBottom: 8 }}>Your hidden gem is now pending community review. You earned <strong style={{ color: D.gold }}>+10 points</strong>!</p>
          <p style={{ color: D.muted, fontSize: 14, marginBottom: 28 }}>If 5 community members confirm it, you'll earn <strong style={{ color: D.gold }}>+50 more points</strong> and it goes live on the map.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/community')} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${D.teal},#3A7BD5)`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: D.font }}>
              View Community
            </button>
            <button onClick={() => { setDone(false); setStep(1); setCoords(null); setForm({ name:'',category:'Nature',description:'',localTip:'',difficulty:'Easy',bestTime:'Any time' }); setPhotos([]); setGpsVerified(false); setAiResult(null); }} style={{ padding: '12px 24px', borderRadius: 12, border: `1px solid ${D.border}`, background: 'transparent', color: D.white, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: D.font }}>
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const STEPS = ['Location', 'Photos', 'Details', 'Review'];

  return (
    <div style={{ minHeight: '100vh', background: D.navy, fontFamily: D.font, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
        <div>
          <h1 style={{ fontFamily: D.serif, color: D.white, fontSize: 22, fontWeight: 900, margin: 0 }}>Submit Hidden Place</h1>
          <p style={{ color: D.muted, fontSize: 13, margin: 0 }}>Share a gem only locals know about</p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '24px 24px 0' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <StepDot n={i + 1} active={step === i + 1} done={step > i + 1} />
              <span style={{ fontSize: 11, color: step === i + 1 ? D.teal : D.muted, fontWeight: step === i + 1 ? 700 : 400 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 48, height: 1, background: step > i + 1 ? D.success : D.border, margin: '0 4px', marginBottom: 20 }} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: '24px auto', padding: '0 20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 18, border: `1px solid ${D.border}`, padding: '28px 24px', minHeight: 360 }}>
          {step === 1 && <StepLocation coords={coords} setCoords={setCoords} state={state} setState={setState} />}
          {step === 2 && <StepPhotos photos={photos} setPhotos={setPhotos} gpsVerified={gpsVerified} setGpsVerified={setGpsVerified} />}
          {step === 3 && <StepDetails form={form} setForm={setForm} />}
          {step === 4 && <StepReview form={form} coords={coords} state={state} gpsVerified={gpsVerified} photos={photos} aiResult={aiResult} />}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ padding: '12px 24px', borderRadius: 12, border: `1px solid ${D.border}`, background: 'transparent', color: D.white, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: D.font }}>
              ← Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button onClick={goNext} disabled={!canNext() || aiLoading}
              style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: canNext() && !aiLoading ? `linear-gradient(135deg,${D.teal},#3A7BD5)` : 'rgba(255,255,255,0.1)', color: canNext() && !aiLoading ? '#fff' : D.muted, fontSize: 14, fontWeight: 700, cursor: canNext() && !aiLoading ? 'pointer' : 'not-allowed', fontFamily: D.font, display: 'flex', alignItems: 'center', gap: 8 }}>
              {aiLoading ? '🤖 AI Checking…' : 'Next →'}
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: submitting ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,${D.gold},#e8960a)`, color: submitting ? D.muted : '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: D.font }}>
              {submitting ? '⏳ Submitting…' : '🗺️ Submit Place +10pts'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
