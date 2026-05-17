import { useState, useEffect } from 'react';
import { calculatePerfectMoment } from '../utils/perfectMoment';

function ScoreRing({ score }) {
  const color = score >= 85 ? '#FFD700' : score >= 70 ? '#1D9E75' : score >= 50 ? '#2B9FAA' : '#8a8272';
  const label = score >= 85 ? 'PERFECT' : score >= 70 ? 'GREAT' : score >= 50 ? 'GOOD' : 'FAIR';
  return (
    <div style={{ width:80, height:80, borderRadius:'50%', flexShrink:0,
      background:`conic-gradient(${color} ${score*3.6}deg, #1e2130 0deg)`,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:64, height:64, borderRadius:'50%', background:'#0D0F14',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:18, fontWeight:700, color, fontFamily:'system-ui', lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:8, color, fontFamily:'system-ui', fontWeight:600, letterSpacing:'0.05em' }}>{label}</div>
      </div>
    </div>
  );
}

export default function PerfectMomentWidget({ place }) {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  const lat = place?.lat ?? place?.coordinates?.lat;
  const lng = place?.lng ?? place?.coordinates?.lng;

  useEffect(() => {
    if (!lat || !lng) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    setData(null);
    calculatePerfectMoment(place).then(result => {
      if (!active) return;
      setData(result);
      if (result) {
        const bestIdx = result.moments.findIndex(m => m.date === result.perfectMoment.date);
        setSelectedDay(bestIdx >= 0 ? bestIdx : 0);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [place.name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lat || !lng) return null;

  if (loading) return (
    <div style={{ background:'#0D0F14', border:'1px solid #1e2130', borderRadius:12,
      padding:'16px', margin:'0 0 12px', fontFamily:'system-ui' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8,
        color:'rgba(255,255,255,0.35)', fontSize:13 }}>
        <span>⌛</span> Calculating perfect moment…
      </div>
    </div>
  );

  if (!data) return null;

  const { moments, perfectMoment, rarity } = data;
  const selected    = moments[selectedDay];
  const isPerfectDay = selected?.date === perfectMoment?.date;
  const navDest     = `${lat},${lng}`;

  return (
    <div style={{ background:'#0D0F14',
      border:`1px solid ${isPerfectDay ? '#FFD700' : '#1e2130'}`,
      borderRadius:12, overflow:'hidden', margin:'0 0 12px', fontFamily:'system-ui' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ background: isPerfectDay ? 'linear-gradient(135deg,#1a1500,#0D0F14)' : '#111318',
        padding:'14px 16px', borderBottom:'1px solid #1e2130',
        display:'flex', alignItems:'center', gap:12 }}>
        <ScoreRing score={selected?.score || 0} />
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <span style={{ fontSize:14 }}>🌟</span>
            <span style={{ fontSize:13, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase',
              color: isPerfectDay ? '#FFD700' : '#e8e4dc' }}>
              {isPerfectDay ? 'Perfect Moment' : 'Visit Score'}
            </span>
          </div>
          <div style={{ fontSize:14, color:'#e8e4dc', fontWeight:500, marginBottom:3 }}>
            {selected?.label} — {selected?.weather.label} {selected?.weather.icon}
          </div>
          <div style={{ fontSize:11, color: isPerfectDay ? '#c9a84c' : 'rgba(255,255,255,0.35)' }}>
            {isPerfectDay ? `⚡ ${rarity}` : 'Select a day to see its score'}
          </div>
        </div>
      </div>

      {/* ── 7-day score bars ────────────────────────────────────── */}
      <div style={{ display:'flex', padding:'10px 12px', gap:4,
        borderBottom:'1px solid #1e2130', overflowX:'auto' }}>
        {moments.map((m, i) => {
          const isSel  = i === selectedDay;
          const isPfct = m.date === perfectMoment?.date;
          const barCol = m.score >= 85 ? '#FFD700' : m.score >= 70 ? '#1D9E75'
                       : m.score >= 50 ? '#2B9FAA' : '#3a3a45';
          return (
            <div key={m.date} onClick={() => setSelectedDay(i)} style={{
              flex:1, minWidth:38, cursor:'pointer', textAlign:'center',
              padding:'6px 4px', borderRadius:8,
              background: isSel ? '#1e2130' : 'transparent',
              border: isPfct ? '1px solid #FFD700' : '1px solid transparent',
              transition:'all 0.15s' }}>
              <div style={{ fontSize:16, marginBottom:4 }}>{m.weather.icon}</div>
              <div style={{ height:32, background:'#1e2130', borderRadius:4,
                overflow:'hidden', display:'flex', alignItems:'flex-end', marginBottom:4 }}>
                <div style={{ width:'100%', height:`${m.score}%`, background:barCol,
                  borderRadius:3, transition:'height 0.5s ease' }}/>
              </div>
              <div style={{ fontSize:10, fontWeight: isSel ? 600 : 400,
                color: isSel ? '#e8e4dc' : 'rgba(255,255,255,0.35)' }}>
                {m.daysUntil === 0 ? 'Today' : m.daysUntil === 1 ? 'Tmrw'
                  : new Date(m.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday:'short' })}
              </div>
              {isPfct && <div style={{ fontSize:9, color:'#FFD700', fontWeight:600 }}>BEST</div>}
            </div>
          );
        })}
      </div>

      {/* ── Selected day detail ─────────────────────────────────── */}
      {selected && (
        <div style={{ padding:'12px 16px' }}>

          {/* Score breakdown */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            {[
              { label:'Weather',     icon:selected.weather.icon, value:selected.weather.label },
              { label:'Crowd Level', icon:'👥', value:`${selected.crowdScore}/10 ${selected.crowdScore >= 7 ? '(Quiet)' : selected.crowdScore >= 4 ? '(Moderate)' : '(Busy)'}` },
              { label:'Season',      icon:selected.season.icon, value:selected.season.name },
              { label:'Moon',        icon:selected.moon.icon,   value:selected.moon.name },
            ].map(item => (
              <div key={item.label} style={{ background:'#111318', border:'1px solid #1e2130',
                borderRadius:8, padding:'8px 10px' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:3,
                  textTransform:'uppercase', letterSpacing:'0.06em' }}>{item.label}</div>
                <div style={{ fontSize:12, color:'#e8e4dc', display:'flex', alignItems:'center', gap:4 }}>
                  <span>{item.icon}</span><span>{item.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Special events */}
          {selected.events.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
                letterSpacing:'0.08em', marginBottom:6, fontWeight:600 }}>✨ Special Conditions</div>
              {selected.events.map((ev, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
                  background:'#111318', borderRadius:6, marginBottom:4, border:'1px solid #1e2130' }}>
                  <span style={{ fontSize:16 }}>{ev.icon}</span>
                  <div>
                    <div style={{ fontSize:12, color:'#c9a84c', fontWeight:500 }}>{ev.label}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{ev.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Best times */}
          {selected.bestTimes.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
                letterSpacing:'0.08em', marginBottom:6, fontWeight:600 }}>⏰ Best Times to Visit</div>
              {selected.bestTimes.map((t, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'8px 10px', background:'#111318', borderRadius:6, marginBottom:4,
                  border:'1px solid #1e2130' }}>
                  <div>
                    <div style={{ fontSize:12, color:'#e8e4dc', fontWeight:500 }}>{t.label}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{t.description}</div>
                  </div>
                  <div style={{ fontSize:13, color:'#2B9FAA', fontWeight:600, flexShrink:0, marginLeft:8 }}>{t.time}</div>
                </div>
              ))}
            </div>
          )}

          {/* Season highlights */}
          {selected.season.highlights && (
            <div style={{ background:'#111318', border:'1px solid #1e2130', borderRadius:8,
              padding:'10px 12px', marginBottom:12 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:6,
                textTransform:'uppercase', letterSpacing:'0.06em' }}>
                {selected.season.icon} {selected.season.name} Highlights
              </div>
              {selected.season.highlights.map((h, i) => (
                <div key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.5)', padding:'2px 0',
                  display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'#1D9E75' }}>✓</span>{h}
                </div>
              ))}
            </div>
          )}

          {/* Navigate */}
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${navDest}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display:'block', width:'100%', padding:12, borderRadius:8,
              background: isPerfectDay ? 'linear-gradient(135deg,#c9a84c,#FFD700)' : '#2B9FAA',
              color: isPerfectDay ? '#1a1200' : 'white',
              fontSize:14, fontWeight:600, textAlign:'center', textDecoration:'none' }}>
            {isPerfectDay ? '🌟 Navigate for Perfect Moment →' : '🗺 Navigate Here →'}
          </a>
        </div>
      )}
    </div>
  );
}
