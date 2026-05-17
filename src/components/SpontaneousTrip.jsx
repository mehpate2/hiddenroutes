import { useState } from 'react';
import { findSpontaneousTrip } from '../utils/spontaneousTrip';

const DRIVE_OPTIONS = [
  { label:'1 hr',  hours:1, icon:'🚗' },
  { label:'2 hrs', hours:2, icon:'🚙' },
  { label:'3 hrs', hours:3, icon:'🛻' },
  { label:'Any',   hours:5, icon:'🗺️' },
];

const VIBE_OPTIONS = [
  { label:'Nature',    value:'nature',    icon:'🌲' },
  { label:'Waterfall', value:'waterfall', icon:'💧' },
  { label:'Hidden',    value:'hidden',    icon:'✦'  },
  { label:'Views',     value:'viewpoint', icon:'🔭' },
  { label:'Beach',     value:'beach',     icon:'🏖️' },
  { label:'Any',       value:'any',       icon:'🎲' },
];

export default function SpontaneousTrip({ onClose }) {
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [driveTime, setDriveTime] = useState(2);
  const [vibe,      setVibe]      = useState('any');
  const [step,      setStep]      = useState('options');

  const findTrip = async () => {
    setLoading(true); setError(null); setStep('loading');
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;
      const categories = vibe === 'any'
        ? ['nature', 'waterfall', 'hidden', 'viewpoint', 'beach', 'cave']
        : [vibe];

      const trip = await findSpontaneousTrip(latitude, longitude, { maxDriveHours: driveTime, categories });
      if (trip) { setResult(trip); setStep('result'); }
      else      { setError('No perfect places found nearby. Try increasing drive time!'); setStep('options'); }
    } catch {
      setError('Could not get your location. Please enable location access.');
      setStep('options');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setStep('options'); setError(null); };

  const S = { fontFamily:'system-ui' };

  return (
    <div style={{ background:'#0D0F14', border:'1px solid #1e2130', borderRadius:16,
      overflow:'hidden', ...S }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#1a0a2a,#0D0F14)',
        padding:'20px', borderBottom:'1px solid #1e2130',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:28, marginBottom:4 }}>🎲</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#e8e4dc',
            fontFamily:'Georgia, serif', marginBottom:2 }}>Surprise Me</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>
            Find the perfect hidden place for right now
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.07)',
            border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'rgba(255,255,255,0.6)',
            width:32, height:32, cursor:'pointer', fontSize:16, display:'flex',
            alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            ×
          </button>
        )}
      </div>

      {/* ── Options step ──────────────────────────────────────── */}
      {step === 'options' && (
        <div style={{ padding:20 }}>
          {error && (
            <div style={{ background:'rgba(220,38,38,0.1)', border:'1px solid #dc2626',
              borderRadius:8, padding:'10px 12px', marginBottom:16,
              fontSize:13, color:'#fca5a5' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Drive time */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
              letterSpacing:'0.08em', fontWeight:600, marginBottom:8 }}>🚗 How far will you drive?</div>
            <div style={{ display:'flex', gap:8 }}>
              {DRIVE_OPTIONS.map(opt => (
                <button key={opt.hours} onClick={() => setDriveTime(opt.hours)} style={{
                  flex:1, padding:'8px 4px', cursor:'pointer', fontFamily:'system-ui',
                  background: driveTime === opt.hours ? '#2B9FAA' : '#111318',
                  border: `1px solid ${driveTime === opt.hours ? '#2B9FAA' : '#1e2130'}`,
                  borderRadius:8, color: driveTime === opt.hours ? 'white' : 'rgba(255,255,255,0.5)',
                  fontSize:12, transition:'all 0.15s' }}>
                  <div style={{ fontSize:16 }}>{opt.icon}</div>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
              letterSpacing:'0.08em', fontWeight:600, marginBottom:8 }}>✨ What's your vibe?</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {VIBE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setVibe(opt.value)} style={{
                  padding:'6px 12px', cursor:'pointer', fontFamily:'system-ui', fontSize:12,
                  display:'flex', alignItems:'center', gap:4, borderRadius:20, transition:'all 0.15s',
                  background: vibe === opt.value ? 'rgba(201,168,76,0.12)' : '#111318',
                  border: `1px solid ${vibe === opt.value ? '#c9a84c' : '#1e2130'}`,
                  color: vibe === opt.value ? '#c9a84c' : 'rgba(255,255,255,0.5)' }}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={findTrip} disabled={loading} style={{
            width:'100%', padding:14, border:'none', borderRadius:10, cursor:'pointer',
            background:'linear-gradient(135deg,#7C3AED,#2B9FAA)', color:'white',
            fontSize:15, fontWeight:600, fontFamily:'system-ui',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <span>🎲</span> Find My Perfect Adventure
          </button>
        </div>
      )}

      {/* ── Loading step ──────────────────────────────────────── */}
      {step === 'loading' && (
        <div style={{ padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:16, display:'inline-block',
            animation:'spin 1s linear infinite' }}>🌍</div>
          <div style={{ fontSize:15, color:'#e8e4dc', marginBottom:8 }}>
            Finding your perfect adventure…
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>
            Checking weather, crowds &amp; perfect moments
          </div>
        </div>
      )}

      {/* ── Result step ───────────────────────────────────────── */}
      {step === 'result' && result && (
        <div>
          <div style={{ padding:'16px 20px', background:'linear-gradient(135deg,#0a1a0a,#0D0F14)',
            borderBottom:'1px solid #1e2130' }}>
            <div style={{ fontSize:11, color:'#1D9E75', textTransform:'uppercase',
              letterSpacing:'0.1em', fontWeight:600, marginBottom:6 }}>
              ✓ Perfect Match Found
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:'#e8e4dc',
              fontFamily:'Georgia, serif', marginBottom:4 }}>
              {result.name}
            </div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>
              {[result.region, result.state].filter(Boolean).join(' · ') || result.address || ''}
            </div>
          </div>

          {/* Trip summary stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
            gap:1, background:'#1e2130', borderBottom:'1px solid #1e2130' }}>
            {[
              { icon:'🚗', value:result.driveTime,           label:'Drive Time' },
              { icon:'📍', value:`${result.distance} mi`,    label:'Distance'   },
              { icon:'⭐', value:`${result.momentScore}/100`, label:'Score'      },
            ].map(item => (
              <div key={item.label} style={{ background:'#0D0F14', padding:'12px 8px', textAlign:'center' }}>
                <div style={{ fontSize:18 }}>{item.icon}</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#e8e4dc' }}>{item.value}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding:'16px 20px' }}>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.6, marginBottom:12 }}>
              {result.description}
            </p>

            {/* Conditions */}
            {result.moment && (
              <div style={{ background:'#111318', border:'1px solid #1e2130', borderRadius:8,
                padding:'10px 12px', marginBottom:12 }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:6,
                  textTransform:'uppercase', letterSpacing:'0.06em' }}>Right Now Conditions</div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', fontSize:12,
                  color:'rgba(255,255,255,0.5)' }}>
                  <span>{result.moment.weather?.icon} {result.moment.weather?.label}</span>
                  <span>👥 Crowd: {result.moment.crowdScore}/10</span>
                  <span>{result.moment.season?.icon} {result.moment.season?.name}</span>
                </div>
                {result.events.length > 0 && (
                  <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                    {result.events.map((e, i) => (
                      <span key={i} style={{ background:'#1e2130', padding:'2px 8px',
                        borderRadius:10, fontSize:11, color:'#c9a84c' }}>
                        {e.icon} {e.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', gap:8 }}>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${result.lat},${result.lng}`}
                target="_blank" rel="noopener noreferrer"
                style={{ flex:2, display:'block', padding:12, borderRadius:8, textDecoration:'none',
                  background:'linear-gradient(135deg,#7C3AED,#2B9FAA)', color:'white',
                  fontSize:13, fontWeight:600, textAlign:'center' }}>
                🚗 Let&apos;s Go! {result.driveTime} away
              </a>
              <button onClick={reset} style={{
                flex:1, background:'#111318', color:'rgba(255,255,255,0.5)',
                border:'1px solid #1e2130', padding:12, borderRadius:8,
                fontSize:13, cursor:'pointer', fontFamily:'system-ui' }}>
                🎲 Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
