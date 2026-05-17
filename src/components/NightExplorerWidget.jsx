import { useState, useEffect } from 'react';
import { getNightExplorerData } from '../utils/nightExplorer';

function NightScoreRing({ score }) {
  const color = score >= 80 ? '#9B59B6' : score >= 60 ? '#2B9FAA' : score >= 40 ? '#1D9E75' : '#8a8272';
  const label = score >= 80 ? 'MAGICAL' : score >= 60 ? 'GREAT' : score >= 40 ? 'GOOD' : 'FAIR';
  return (
    <div style={{ width:80, height:80, borderRadius:'50%', flexShrink:0,
      background:`conic-gradient(${color} ${score*3.6}deg, #1e2130 0deg)`,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:64, height:64, borderRadius:'50%', background:'#080a10',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:18, fontWeight:700, color, fontFamily:'system-ui', lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:8, color, fontFamily:'system-ui', fontWeight:600, letterSpacing:'0.05em' }}>{label}</div>
      </div>
    </div>
  );
}

export default function NightExplorerWidget({ place }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(true);

  const lat = place?.lat ?? place?.coordinates?.lat;
  const lng = place?.lng ?? place?.coordinates?.lng;

  useEffect(() => {
    if (!lat || !lng) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    setData(null);
    getNightExplorerData(place).then(result => {
      if (!active) return;
      setData(result);
      setLoading(false);
    });
    return () => { active = false; };
  }, [place.name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lat || !lng) return null;

  if (loading) return (
    <div style={{ background:'#080a10', border:'1px solid #1e2130', borderRadius:12,
      padding:'16px', margin:'0 0 12px', fontFamily:'system-ui' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8,
        color:'rgba(255,255,255,0.35)', fontSize:13 }}>
        <span>🌙</span> Analyzing tonight's sky…
      </div>
    </div>
  );

  if (!data) return null;

  const { moon, lightPollution, stargazingScore, bio, meteors, aurora, experiences, nightScore, bestNight, weather } = data;
  const navDest = `${lat},${lng}`;

  const scoreColor = nightScore >= 80 ? '#9B59B6' : nightScore >= 60 ? '#2B9FAA' : nightScore >= 40 ? '#1D9E75' : '#8a8272';

  return (
    <div style={{ background:'#080a10', border:`1px solid ${nightScore >= 80 ? '#9B59B6' : '#1e2130'}`,
      borderRadius:12, overflow:'hidden', margin:'0 0 12px', fontFamily:'system-ui' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div onClick={() => setExpanded(e => !e)} style={{
        background: nightScore >= 80 ? 'linear-gradient(135deg,#1a0a2a,#080a10)' : '#0d0f18',
        padding:'14px 16px', borderBottom: expanded ? '1px solid #1e2130' : 'none',
        display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
        <NightScoreRing score={nightScore} />
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <span style={{ fontSize:14 }}>🌙</span>
            <span style={{ fontSize:13, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase',
              color: nightScore >= 80 ? '#9B59B6' : '#e8e4dc' }}>
              Night Explorer
            </span>
          </div>
          <div style={{ fontSize:14, color:'#e8e4dc', fontWeight:500, marginBottom:3 }}>
            {moon.icon} {moon.name} · {weather.icon} {weather.label}
          </div>
          <div style={{ fontSize:11, color: nightScore >= 80 ? '#c084fc' : 'rgba(255,255,255,0.35)' }}>
            {nightScore >= 80 ? '⚡ Magical night conditions!' :
             nightScore >= 60 ? 'Great night to visit' :
             nightScore >= 40 ? 'Decent night conditions' : 'Check back for better nights'}
          </div>
        </div>
        <div style={{ color:'rgba(255,255,255,0.3)', fontSize:16 }}>{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div>
          {/* ── Quick stats row ───────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
            gap:1, background:'#1e2130', borderBottom:'1px solid #1e2130' }}>
            {[
              { icon:'🔭', label:'Stargazing', value:`${stargazingScore}/100` },
              { icon:'💡', label:'Dark Sky',   value:`${lightPollution}/10`   },
              { icon:moon.icon, label:'Moon',  value:`${moon.illumination}%`  },
            ].map(item => (
              <div key={item.label} style={{ background:'#080a10', padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontSize:18 }}>{item.icon}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#e8e4dc' }}>{item.value}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding:'14px 16px' }}>

            {/* ── Special events ─────────────────────────────── */}
            {(meteors.length > 0 || bio.likely || aurora.likely) && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
                  letterSpacing:'0.08em', marginBottom:8, fontWeight:600 }}>✨ Tonight's Special Events</div>

                {meteors.map((m, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                    background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)',
                    borderRadius:8, marginBottom:6 }}>
                    <span style={{ fontSize:18 }}>☄️</span>
                    <div>
                      <div style={{ fontSize:12, color:'#c9a84c', fontWeight:600 }}>
                        {m.name} Meteor Shower — Peak {m.peak}
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                        Up to {m.rate} meteors/hour in dark skies
                      </div>
                    </div>
                  </div>
                ))}

                {bio.likely && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                    background:'rgba(0,255,200,0.06)', border:'1px solid rgba(0,255,200,0.25)',
                    borderRadius:8, marginBottom:6 }}>
                    <span style={{ fontSize:18 }}>🌊</span>
                    <div>
                      <div style={{ fontSize:12, color:'#00e5b0', fontWeight:600 }}>
                        Bioluminescence Likely — {bio.spot}
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                        Blue glowing waves in peak season
                      </div>
                    </div>
                  </div>
                )}

                {aurora.likely && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                    background:'rgba(155,89,182,0.1)', border:'1px solid rgba(155,89,182,0.35)',
                    borderRadius:8, marginBottom:6 }}>
                    <span style={{ fontSize:18 }}>🌌</span>
                    <div>
                      <div style={{ fontSize:12, color:'#c084fc', fontWeight:600 }}>
                        Northern Lights — {aurora.probability} Probability
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                        Check aurora forecast app for real-time Kp index
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Night experiences ───────────────────────────── */}
            {experiences.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
                  letterSpacing:'0.08em', marginBottom:8, fontWeight:600 }}>🌃 Night Experiences</div>
                {experiences.map((exp, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 10px',
                    background:'#0d0f18', border:'1px solid #1e2130', borderRadius:8, marginBottom:6 }}>
                    <span style={{ fontSize:22, lineHeight:1, flexShrink:0 }}>{exp.icon}</span>
                    <div>
                      <div style={{ fontSize:12, color:'#e8e4dc', fontWeight:600, marginBottom:2 }}>{exp.title}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.5, marginBottom:3 }}>
                        {exp.description}
                      </div>
                      <div style={{ fontSize:11, color: scoreColor, fontWeight:500 }}>
                        ● {exp.bestCondition}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Best night this week ────────────────────────── */}
            {bestNight && bestNight.score > 0 && (
              <div style={{ background:'#0d0f18', border:'1px solid #1e2130',
                borderRadius:8, padding:'10px 12px', marginBottom:14 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
                  letterSpacing:'0.06em', marginBottom:6 }}>🗓 Best Night This Week</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ fontSize:22 }}>{bestNight.icon}</div>
                  <div>
                    <div style={{ fontSize:13, color:'#e8e4dc', fontWeight:600 }}>
                      {bestNight.label} — {bestNight.label}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                      Stargazing score: {bestNight.score}/100
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Navigate ──────────────────────────────────── */}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${navDest}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display:'block', width:'100%', padding:12, borderRadius:8,
                background: nightScore >= 80 ? 'linear-gradient(135deg,#7C3AED,#9B59B6)' : '#1e2235',
                color:'white', fontSize:14, fontWeight:600, textAlign:'center',
                textDecoration:'none', boxSizing:'border-box' }}>
              🌙 {nightScore >= 80 ? 'Navigate for Magical Night →' : 'Navigate for Night Visit →'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
