import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTonightSkyData } from '../utils/nightExplorer';

const DARK_SKY_PLACES = [
  {
    name:'Cherry Springs State Park',
    state:'PA', region:'Pennsylvania',
    lat:41.66, lng:-77.82,
    category:'viewpoint',
    description:'One of the darkest skies on the East Coast. Gold-tier dark sky park with a dedicated stargazing field.',
    nightScore:92,
    icon:'🌌',
    tags:['Bortle 2','Gold Dark Sky Park','Milky Way'],
  },
  {
    name:'Big Bend National Park',
    state:'TX', region:'Texas',
    lat:29.25, lng:-103.25,
    category:'viewpoint',
    description:'Certified International Dark Sky Park with over 800,000 stars visible on a clear night.',
    nightScore:90,
    icon:'🏜️',
    tags:['Bortle 1','Desert Sky','Milky Way Core'],
  },
  {
    name:'Natural Bridges National Monument',
    state:'UT', region:'Utah',
    lat:37.60, lng:-110.00,
    category:'viewpoint',
    description:'First International Dark Sky Park designated by the IDA. Stunning canyon silhouettes under the stars.',
    nightScore:94,
    icon:'🪨',
    tags:['First Dark Sky Park','Canyon Views','Zero Light Pollution'],
  },
  {
    name:'Tomales Bay',
    state:'CA', region:'California',
    lat:38.15, lng:-122.89,
    category:'beach',
    description:'Famous for bioluminescent kayaking — paddle through glowing blue water on dark moon nights.',
    nightScore:78,
    icon:'🌊',
    tags:['Bioluminescence','Kayaking','Blue Glow'],
  },
  {
    name:'Headlands International Dark Sky Park',
    state:'MI', region:'Michigan',
    lat:45.76, lng:-84.72,
    category:'viewpoint',
    description:'Only dark sky preserve in Michigan. Northern lights visible here multiple times per year.',
    nightScore:85,
    icon:'🌲',
    tags:['Aurora Borealis','Lake Views','Dark Sky Park'],
  },
  {
    name:'McDonald Observatory',
    state:'TX', region:'Texas',
    lat:30.68, lng:-104.02,
    category:'viewpoint',
    description:'Professional observatory in the Davis Mountains. Public star parties run by astronomers.',
    nightScore:91,
    icon:'🔭',
    tags:['Professional Observatory','Star Parties','Davis Mountains'],
  },
  {
    name:'Chaco Culture National Historical Park',
    state:'NM', region:'New Mexico',
    lat:36.06, lng:-107.96,
    category:'viewpoint',
    description:'Ancient Puebloan ruins aligned with celestial events — same skies the ancients used for navigation.',
    nightScore:93,
    icon:'🏺',
    tags:['Ancient Astronomy','Bortle 1','Cultural Heritage'],
  },
  {
    name:'Mosquito Bay',
    state:'PR', region:'Puerto Rico',
    lat:18.07, lng:-65.44,
    category:'beach',
    description:'The brightest bioluminescent bay in the world. Every stroke of a paddle glows electric blue.',
    nightScore:88,
    icon:'✨',
    tags:['World\'s Brightest Bio Bay','Dinoflagellates','Electric Blue'],
  },
  {
    name:'Kobuk Valley',
    state:'AK', region:'Alaska',
    lat:67.55, lng:-159.15,
    category:'nature',
    description:'Arctic wilderness above the Arctic Circle. Winter months bring aurora nearly every clear night.',
    nightScore:96,
    icon:'🌟',
    tags:['Arctic Aurora','Remote Wilderness','Extreme Dark Sky'],
  },
];

const EXPERIENCE_FILTERS = [
  { label:'All',           value:'all',    icon:'🌙' },
  { label:'Stargazing',    value:'stars',  icon:'🌌' },
  { label:'Bioluminescence', value:'bio',  icon:'🌊' },
  { label:'Aurora',        value:'aurora', icon:'🟣' },
  { label:'Observatory',   value:'obs',    icon:'🔭' },
];

const FILTER_MAP = {
  stars:  p => !['beach'].includes(p.category),
  bio:    p => p.tags.some(t => t.toLowerCase().includes('bio') || t.toLowerCase().includes('glow')),
  aurora: p => p.tags.some(t => t.toLowerCase().includes('aurora') || p.lat >= 45),
  obs:    p => p.tags.some(t => t.toLowerCase().includes('observatory') || t.toLowerCase().includes('star part')),
};

function NightScoreBadge({ score }) {
  const color = score >= 80 ? '#9B59B6' : score >= 60 ? '#2B9FAA' : '#1D9E75';
  return (
    <div style={{ background:`${color}22`, border:`1px solid ${color}55`,
      borderRadius:20, padding:'3px 10px', fontSize:11, color, fontWeight:700 }}>
      🌙 {score}
    </div>
  );
}

export default function NightExplorer() {
  const navigate = useNavigate();
  const [filter,  setFilter]  = useState('all');
  const sky = getTonightSkyData();

  const filtered = filter === 'all' ? DARK_SKY_PLACES
    : DARK_SKY_PLACES.filter(FILTER_MAP[filter] || (() => true));

  return (
    <div style={{ minHeight:'100vh', background:'#05070e', fontFamily:'system-ui', position:'relative', overflow:'hidden' }}>

      {/* Starfield background */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:'radial-gradient(ellipse at top, #0d1a3a 0%, #05070e 60%)' }} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ position:'relative', zIndex:1, padding:'20px 20px 0' }}>
        <button onClick={() => navigate(-1)} style={{
          background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:8, color:'rgba(255,255,255,0.6)', padding:'8px 14px',
          fontSize:13, cursor:'pointer', fontFamily:'system-ui', marginBottom:20 }}>
          ← Back
        </button>

        <div style={{ textAlign:'center', paddingBottom:24 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🌙</div>
          <h1 style={{ margin:'0 0 8px', fontSize:28, fontWeight:700,
            color:'#e8e4dc', fontFamily:'Georgia, serif' }}>
            Night Explorer
          </h1>
          <p style={{ margin:0, fontSize:14, color:'rgba(255,255,255,0.45)', maxWidth:440, marginInline:'auto' }}>
            Discover hidden places at night — from glowing bays to Bortle 1 dark skies
          </p>
        </div>

        {/* ── Tonight's sky strip ─────────────────────────────── */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:14, padding:'14px 16px', marginBottom:20, maxWidth:560, marginInline:'auto' }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
            letterSpacing:'0.1em', fontWeight:600, marginBottom:10 }}>🌐 Tonight's Sky Conditions</div>
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:24 }}>{sky.moon.icon}</span>
              <div>
                <div style={{ fontSize:13, color:'#e8e4dc', fontWeight:600 }}>{sky.moon.name}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                  {sky.moon.illumination}% illuminated · {sky.moon.darkSky ? 'Good for stars' : 'Brighter sky'}
                </div>
              </div>
            </div>
            {sky.meteors.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:22 }}>☄️</span>
                <div>
                  <div style={{ fontSize:13, color:'#c9a84c', fontWeight:600 }}>
                    {sky.meteors[0].name} Active
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                    Peak: {sky.meteors[0].peak} · {sky.meteors[0].rate}/hr
                  </div>
                </div>
              </div>
            )}
            <div style={{ marginLeft:'auto', textAlign:'right' }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>Dark sky score</div>
              <div style={{ fontSize:20, fontWeight:700,
                color: sky.moon.darkSky ? '#9B59B6' : '#8a8272' }}>
                {sky.moon.score}/10
              </div>
            </div>
          </div>
        </div>

        {/* ── Experience filters ──────────────────────────────── */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginBottom:20 }}>
          {EXPERIENCE_FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              padding:'7px 16px', borderRadius:20, cursor:'pointer', fontSize:13,
              fontFamily:'system-ui', display:'flex', alignItems:'center', gap:5, transition:'all 0.15s',
              background: filter === f.value ? 'rgba(155,89,182,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${filter === f.value ? '#9B59B6' : 'rgba(255,255,255,0.1)'}`,
              color: filter === f.value ? '#c084fc' : 'rgba(255,255,255,0.5)' }}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Place cards ────────────────────────────────────────── */}
      <div style={{ position:'relative', zIndex:1, padding:'0 16px 40px', maxWidth:680, marginInline:'auto' }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textTransform:'uppercase',
          letterSpacing:'0.08em', marginBottom:12, fontWeight:600 }}>
          {filtered.length} dark sky destinations
        </div>

        {filtered.map(place => (
          <div key={place.name} style={{ background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(255,255,255,0.08)', borderRadius:14,
            overflow:'hidden', marginBottom:12, transition:'border-color 0.2s' }}>

            {/* Card header */}
            <div style={{ padding:'16px 16px 12px',
              background:'linear-gradient(135deg,rgba(155,89,182,0.08),transparent)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:28 }}>{place.icon}</span>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:'#e8e4dc',
                      fontFamily:'Georgia, serif', marginBottom:2 }}>{place.name}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>
                      {place.region}, {place.state}
                    </div>
                  </div>
                </div>
                <NightScoreBadge score={place.nightScore} />
              </div>
            </div>

            {/* Description */}
            <div style={{ padding:'0 16px 12px' }}>
              <p style={{ margin:'0 0 10px', fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                {place.description}
              </p>

              {/* Tags */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                {place.tags.map(tag => (
                  <span key={tag} style={{ background:'rgba(155,89,182,0.1)',
                    border:'1px solid rgba(155,89,182,0.25)', borderRadius:20,
                    padding:'2px 8px', fontSize:11, color:'#c084fc' }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:8 }}>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, display:'block', padding:'9px 12px', borderRadius:8,
                    background:'linear-gradient(135deg,#3b1d6e,#1a0a2a)', color:'white',
                    fontSize:13, fontWeight:600, textAlign:'center', textDecoration:'none' }}>
                  🌙 Navigate at Night
                </a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.state)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)',
                    background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.5)',
                    fontSize:13, textDecoration:'none', whiteSpace:'nowrap', display:'flex',
                    alignItems:'center', gap:4 }}>
                  📍 View
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
