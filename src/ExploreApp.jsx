/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { useState, useEffect, useRef, useContext, createContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import NavBarAuth from './components/NavBarAuth';
import UpgradeModal from './components/UpgradeModal';
import { getDiscoverFeed } from './lib/community';

const KEY    = import.meta.env.VITE_ANTHROPIC_API_KEY;
const HAIKU  = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-4-6';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

// ─── Design tokens ──────────────────────────────────────────────────────────
const D = {
  navy:'#0A0F1E', navyLight:'#111827',
  teal:'#00D2FF', tealDim:'rgba(0,210,255,0.18)',
  gold:'#FFB347', goldDim:'rgba(255,179,71,0.18)',
  white:'#FFFFFF', off:'#E8E4DC',
  muted:'#6B7A9A', border:'rgba(255,255,255,0.12)',
  glass:'rgba(255,255,255,0.07)', glassH:'rgba(255,255,255,0.13)',
  imgPlaceholder:'#1a1a2e',
  font:"'Inter', system-ui, sans-serif",
  serif:"'Playfair Display', Georgia, serif",
};

const CATEGORIES = ['All','Nature','History','Food','Adventure','Art'];
const CAT_COLOR  = { Nature:'#22c55e', History:'#f59e0b', Food:'#ef4444', Adventure:'#3b82f6', Art:'#a855f7' };
const CAT_EMOJI  = { Nature:'🌿', History:'🏛️', Food:'🍽️', Adventure:'⚡', Art:'🎨' };
const CAT_KW     = { Nature:'wilderness trail forest scenic', History:'ancient ruins historic architecture', Food:'restaurant local cuisine farm', Adventure:'mountain vista overlook adventure', Art:'art gallery culture museum' };

export const US_STATES = [
  { name:'Alabama',abbr:'AL',emoji:'🌿',center:[32.8,-86.8],regions:['North Alabama','South Alabama'] },
  { name:'Alaska',abbr:'AK',emoji:'🏔️',center:[64.2,-153.5],regions:['Southeast Alaska','Southcentral','Interior Alaska','Southwest Alaska','Arctic','Far North'] },
  { name:'Arizona',abbr:'AZ',emoji:'🌵',center:[34.0,-111.1],regions:['Greater Phoenix','Tucson & Southern AZ','Grand Canyon Country','Sedona & Verde Valley'] },
  { name:'Arkansas',abbr:'AR',emoji:'💎',center:[34.8,-92.2],regions:['Ozark Mountains','Arkansas Delta'] },
  { name:'California',abbr:'CA',emoji:'🌊',center:[37.2,-119.4],regions:['San Francisco Bay Area','Greater Los Angeles','San Diego','Central Valley','Sierra Nevada','Wine Country','Central Coast','Redwood Coast'] },
  { name:'Colorado',abbr:'CO',emoji:'⛷️',center:[39.0,-105.5],regions:['Denver & Front Range','Rocky Mountain Parks','Western Slope','San Juan Mountains'] },
  { name:'Connecticut',abbr:'CT',emoji:'🍂',center:[41.6,-72.7],regions:['Coast & Harbors','River Valley & Hills'] },
  { name:'Delaware',abbr:'DE',emoji:'🦅',center:[38.9,-75.5],regions:['Northern Delaware','Southern Delaware'] },
  { name:'Florida',abbr:'FL',emoji:'🌴',center:[27.8,-81.7],regions:['South Florida & Keys','Central Florida','Northwest Panhandle','Northeast Florida'] },
  { name:'Georgia',abbr:'GA',emoji:'🍑',center:[32.9,-83.4],regions:['Atlanta Metro','North Georgia Mountains','Coastal Georgia','Middle Georgia'] },
  { name:'Hawaii',abbr:'HI',emoji:'🌺',center:[20.8,-156.3],regions:["O'ahu",'Maui','Big Island',"Kaua'i"] },
  { name:'Idaho',abbr:'ID',emoji:'🥔',center:[44.1,-114.7],regions:['Northern Panhandle','Sun Valley & Central Mountains','Snake River Plain','Eastern Idaho'] },
  { name:'Illinois',abbr:'IL',emoji:'🌆',center:[40.4,-88.9],regions:['Chicago Metro','Northern Illinois','Central Illinois','Southern Illinois'] },
  { name:'Indiana',abbr:'IN',emoji:'🏁',center:[40.3,-86.1],regions:['Indianapolis Region','Northern Indiana','Southern Indiana','East Central Indiana'] },
  { name:'Iowa',abbr:'IA',emoji:'🌽',center:[42.0,-93.2],regions:['Eastern Iowa','Western Iowa'] },
  { name:'Kansas',abbr:'KS',emoji:'🌻',center:[38.5,-98.4],regions:['Eastern Kansas','Western Kansas'] },
  { name:'Kentucky',abbr:'KY',emoji:'🐎',center:[37.7,-84.9],regions:['Bluegrass Region','Appalachian East','Western Kentucky','Bourbon Trail'] },
  { name:'Louisiana',abbr:'LA',emoji:'🎷',center:[31.2,-91.8],regions:['New Orleans & Gulf Coast','Cajun Country','North Louisiana','Red River Valley'] },
  { name:'Maine',abbr:'ME',emoji:'🦞',center:[44.7,-69.4],regions:['Mid-Coast & Acadia','Western Mountains & Lakes'] },
  { name:'Maryland',abbr:'MD',emoji:'🦀',center:[39.1,-76.8],regions:['Chesapeake Bay','Western Mountains','Southern Maryland','Eastern Shore'] },
  { name:'Massachusetts',abbr:'MA',emoji:'🏛️',center:[42.2,-71.5],regions:['Greater Boston','Cape Cod & Islands','Pioneer Valley','Berkshires'] },
  { name:'Michigan',abbr:'MI',emoji:'🚗',center:[44.3,-85.4],regions:['Lower Peninsula','Upper Peninsula','Great Lakes Shore','Detroit Metro'] },
  { name:'Minnesota',abbr:'MN',emoji:'❄️',center:[46.4,-93.1],regions:['Twin Cities Metro','North Shore & Boundary Waters','Prairie Southwest','Central Lakes'] },
  { name:'Mississippi',abbr:'MS',emoji:'🎸',center:[32.7,-89.7],regions:['Delta Blues Region','Gulf Coast'] },
  { name:'Missouri',abbr:'MO',emoji:'🌉',center:[38.3,-92.5],regions:['Ozark Highlands','St. Louis Metro','Kansas City Metro','Missouri River Valley'] },
  { name:'Montana',abbr:'MT',emoji:'🦌',center:[46.9,-110.4],regions:['Glacier Country','Gold West Country','Yellowstone Country','Russell Country','Missouri River Country','Custer Country'] },
  { name:'Nebraska',abbr:'NE',emoji:'🌾',center:[41.5,-99.9],regions:['Sandhills & Panhandle','Omaha & Eastern Nebraska'] },
  { name:'Nevada',abbr:'NV',emoji:'🎰',center:[39.3,-116.6],regions:['Las Vegas & Mojave','Reno & Lake Tahoe','Great Basin','Rural Nevada'] },
  { name:'New Hampshire',abbr:'NH',emoji:'🍁',center:[43.5,-71.6],regions:['White Mountains','Lakes Region & Seacoast'] },
  { name:'New Jersey',abbr:'NJ',emoji:'🌃',center:[40.3,-74.5],regions:['Pine Barrens & Jersey Shore','Delaware Water Gap & North Jersey'] },
  { name:'New Mexico',abbr:'NM',emoji:'🌶️',center:[34.8,-106.2],regions:['Santa Fe & High Desert','Albuquerque Metro','White Sands & South','Carlsbad & Southeast'] },
  { name:'New York',abbr:'NY',emoji:'🗽',center:[42.9,-75.5],regions:['New York City','Hudson Valley','Catskills & Adirondacks','Finger Lakes','Long Island','North Country'] },
  { name:'North Carolina',abbr:'NC',emoji:'🏔️',center:[35.6,-79.8],regions:['Blue Ridge & Asheville','Outer Banks & Coast','Piedmont Triad','Triangle & Eastern NC'] },
  { name:'North Dakota',abbr:'ND',emoji:'🌾',center:[47.5,-100.5],regions:['Badlands & West','Red River Valley & East'] },
  { name:'Ohio',abbr:'OH',emoji:'🎡',center:[40.4,-82.7],regions:['Cleveland & Lake Erie','Columbus Metro','Amish Country & SE Ohio','Cincinnati & SW Ohio'] },
  { name:'Oklahoma',abbr:'OK',emoji:'🌪️',center:[35.6,-96.9],regions:['Tulsa & Green Country','Oklahoma City Metro','Ouachita Mountains','Panhandle & Plains'] },
  { name:'Oregon',abbr:'OR',emoji:'🌲',center:[44.1,-120.5],regions:['Portland & Columbia Gorge','Oregon Coast','Crater Lake & Cascades','Eastern Oregon'] },
  { name:'Pennsylvania',abbr:'PA',emoji:'🔔',center:[41.2,-77.2],regions:['Philadelphia Region','Pittsburgh & Laurel Highlands','Pennsylvania Dutch Country','Pocono Mountains'] },
  { name:'Rhode Island',abbr:'RI',emoji:'⚓',center:[41.7,-71.5],regions:['Newport & Narragansett Bay','Providence & Blackstone Valley'] },
  { name:'South Carolina',abbr:'SC',emoji:'🌙',center:[33.9,-80.9],regions:['Grand Strand & Coast','Lowcountry & Charleston','Upcountry','Midlands'] },
  { name:'South Dakota',abbr:'SD',emoji:'🗿',center:[44.4,-100.2],regions:['Black Hills & Badlands','East River Prairie'] },
  { name:'Tennessee',abbr:'TN',emoji:'🎸',center:[35.9,-86.7],regions:['Nashville & Middle TN','Great Smoky Mountains','Memphis & West TN','East TN Valleys'] },
  { name:'Texas',abbr:'TX',emoji:'⭐',center:[31.1,-100.1],regions:['Big Bend & Trans-Pecos','Texas Hill Country','Gulf Coast & Houston','Dallas–Fort Worth','San Antonio & South Texas','East Texas Piney Woods'] },
  { name:'Utah',abbr:'UT',emoji:'🏜️',center:[39.3,-111.1],regions:['Zion & Southwest Utah','Arches & Moab','Salt Lake City & Wasatch','Bryce & Capitol Reef'] },
  { name:'Vermont',abbr:'VT',emoji:'🍁',center:[44.1,-72.7],regions:['Green Mountain Highlands','Northeast Kingdom'] },
  { name:'Virginia',abbr:'VA',emoji:'🎠',center:[37.5,-79.0],regions:['Blue Ridge & Shenandoah','Hampton Roads & Coastal','Northern Virginia','Southwest Virginia'] },
  { name:'Washington',abbr:'WA',emoji:'☕',center:[47.4,-121.5],regions:['Puget Sound & Seattle','Olympic Peninsula','Cascades & Mt. Rainier','Eastern Washington'] },
  { name:'West Virginia',abbr:'WV',emoji:'⛰️',center:[38.9,-80.5],regions:['New River & Monongahela','Eastern Panhandle'] },
  { name:'Wisconsin',abbr:'WI',emoji:'🧀',center:[44.6,-89.9],regions:['Door Peninsula & Northeast','Milwaukee & Southeast','Northwoods Lakes','Driftless Region'] },
  { name:'Wyoming',abbr:'WY',emoji:'🦬',center:[43.1,-107.3],regions:['Yellowstone & Grand Teton','Wind River Range','Thunder Basin & Northeast','Flaming Gorge & Southwest'] },
];

// ─── Storage ────────────────────────────────────────────────────────────────
function localGet(k, fb=[]) { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(fb)); } catch { return fb; } }
function localSet(k, v)     { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

function getCachedPlaces(abbr) {
  try {
    const raw = localStorage.getItem(`places_${abbr}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(`places_${abbr}`); return null; }
    return data;
  } catch { return null; }
}
function setCachedPlaces(abbr, data) {
  try { localStorage.setItem(`places_${abbr}`, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function hav(a, b, c, d) {
  const R=3959, t=x=>x*Math.PI/180, dL=t(c-a), dG=t(d-b);
  const x = Math.sin(dL/2)**2 + Math.cos(t(a))*Math.cos(t(c))*Math.sin(dG/2)**2;
  return R*2*Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function unsplash(query, w=800, h=600, sig=1) {
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(query)}&sig=${sig}`;
}

function getNeighbors(state, n=2) {
  return [...US_STATES]
    .filter(s => s.abbr !== state.abbr)
    .sort((a,b) =>
      hav(state.center[0],state.center[1],a.center[0],a.center[1]) -
      hav(state.center[0],state.center[1],b.center[0],b.center[1])
    ).slice(0, n);
}

async function geocode(q) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=us&limit=5`, { headers:{'Accept-Language':'en'} });
    const d = await r.json();
    return d.map(x => ({ label: x.display_name.split(',').slice(0,3).join(','), lat:+x.lat, lng:+x.lon }));
  } catch { return []; }
}

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { headers:{'Accept-Language':'en'} });
    const d = await r.json();
    return d.address?.state || null;
  } catch { return null; }
}

function loadLeaflet() {
  return new Promise(res => {
    if (window.L) { res(window.L); return; }
    const l = document.createElement('link'); l.rel='stylesheet'; l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(l);
    const s = document.createElement('script'); s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload=()=>res(window.L); document.head.appendChild(s);
  });
}

function pin(L, color) {
  return L.divIcon({ className:'',
    html:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="30" height="44" style="filter:drop-shadow(0 0 8px ${color})"><path fill="${color}" stroke="rgba(0,0,0,0.25)" stroke-width="1" d="M16 0C7.2 0 0 7.2 0 16c0 12 16 32 16 32s16-20 16-32C32 7.2 24.8 0 16 0z"/><circle fill="white" cx="16" cy="14" r="7"/></svg>`,
    iconSize:[30,44], iconAnchor:[15,44], popupAnchor:[0,-46] });
}
function userPin(L) {
  return L.divIcon({ className:'',
    html:`<div style="width:20px;height:20px;background:${D.teal};border:3px solid white;border-radius:50%;animation:userPulse 2s infinite;"></div>`,
    iconSize:[20,20], iconAnchor:[10,10] });
}

// ─── API ────────────────────────────────────────────────────────────────────
async function callAPI(model, prompt, maxTok=2048) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify({ model, max_tokens:maxTok, messages:[{role:'user',content:prompt}] }),
  });
  if (!r.ok) { const t=await r.text(); throw new Error(`API ${r.status}: ${t.slice(0,100)}`); }
  const d = await r.json();
  const m = d.content[0].text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('No JSON array in response');
  return JSON.parse(m[0]);
}

async function fetchRegion(stateAbbr, stateName, region) {
  const k = `region_${stateAbbr}_${region}`;
  try {
    const raw = localStorage.getItem(k);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch {}
  const places = await callAPI(HAIKU,
    `List exactly 15 hidden gems in the ${region} region of ${stateName}, USA. ONLY a JSON array, no markdown. Each: {"name":"str","lat":n,"lng":n,"category":"Nature|History|Food|Adventure|Art","description":"2 sentences.","localTip":"1 sentence.","rating":n}`,
    2048
  );
  const tagged = places.map(p => ({ ...p, _region:region }));
  try { localStorage.setItem(k, JSON.stringify({ data:tagged, ts:Date.now() })); } catch {}
  return tagged;
}

async function fetchAllRegionsParallel(state, onBatch) {
  const cached = getCachedPlaces(state.abbr);
  if (cached) { onBatch(cached, true); return cached; }
  const promises = state.regions.map(region =>
    fetchRegion(state.abbr, state.name, region)
      .then(places => { onBatch(places, false); return places; })
      .catch(err  => { console.warn(`Region ${region} failed:`, err); return []; })
  );
  const results = await Promise.allSettled(promises);
  const all = results.flatMap(r => r.status==='fulfilled' ? r.value : []);
  setCachedPlaces(state.abbr, all);
  return all;
}

function preloadNeighbors(state) {
  getNeighbors(state, 2).forEach(neighbor => {
    if (getCachedPlaces(neighbor.abbr)) return;
    fetchAllRegionsParallel(neighbor, () => {}).catch(() => {});
  });
}

async function fetchRouteStream(startName, endName, dist, onPlace, signal) {
  let res;
  try {
    res = await fetch('/api/get-route-places', {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startName, endName, dist }),
    });
  } catch (err) {
    throw new Error('Could not reach API server. Make sure it is running.');
  }

  let data;
  try { data = await res.json(); } catch { throw new Error('Invalid response from API server.'); }
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);

  // Reveal places one at a time for streaming feel
  for (const place of (data.places || [])) {
    if (signal?.aborted) break;
    onPlace(place);
    await new Promise(r => setTimeout(r, 120));
  }
}

// ─── App Context ─────────────────────────────────────────────────────────────
const AppCtx = createContext({ saved:[], toggleSave:()=>{}, isSaved:()=>false });

function useMobile() {
  const [m,setM] = useState(()=>window.innerWidth<768);
  useEffect(()=>{ const h=()=>setM(window.innerWidth<768); window.addEventListener('resize',h); return()=>window.removeEventListener('resize',h); },[]);
  return m;
}

// ─── UI Primitives ──────────────────────────────────────────────────────────
function Stars({ rating=0, size=14 }) {
  return <span style={{display:'inline-flex',gap:2}}>{[1,2,3,4,5].map(i=><span key={i} style={{fontSize:size,color:i<=Math.round(rating)?D.gold:'rgba(255,255,255,0.2)'}}>★</span>)}</span>;
}

function Btn({ children, onClick, variant='teal', style:s={}, ...rest }) {
  const [hov,setHov]=useState(false);
  const v={ teal:{background:'linear-gradient(135deg,#00D2FF,#3A7BD5)',color:'#fff',boxShadow:hov?'0 0 28px rgba(0,210,255,0.7)':'0 0 14px rgba(0,210,255,0.35)'},
             gold:{background:'linear-gradient(135deg,#FFB347,#e67e22)',color:'#fff',boxShadow:hov?'0 0 28px rgba(255,179,71,0.7)':'0 0 14px rgba(255,179,71,0.35)'},
             glass:{background:hov?D.glassH:D.glass,color:D.white,border:`1px solid ${D.border}`,backdropFilter:'blur(20px)',boxShadow:'none'} };
  return <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{padding:'12px 24px',borderRadius:12,border:'none',cursor:'pointer',fontSize:14,fontWeight:600,fontFamily:D.font,transition:'all 0.25s',display:'inline-flex',alignItems:'center',gap:8,minHeight:48,...v[variant],transform:hov?'scale(1.03)':'scale(1)',...s}} {...rest}>{children}</button>;
}

function Badge({ cat }) {
  const c=CAT_COLOR[cat]||'#64748b';
  return <span style={{fontSize:10,fontWeight:700,color:c,background:`${c}22`,padding:'3px 9px',borderRadius:20,letterSpacing:0.4}}>{CAT_EMOJI[cat]||'📍'} {(cat||'').toUpperCase()}</span>;
}

function SkeletonCard() {
  return <div style={{marginBottom:6,borderRadius:10,overflow:'hidden',background:'rgba(255,255,255,0.04)',padding:'10px 12px'}}>
    <div style={{height:11,width:'60%',borderRadius:6,marginBottom:6,background:'linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.06) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite linear'}}/>
    <div style={{height:9,width:'85%',borderRadius:6,marginBottom:4,background:'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s 0.15s infinite linear'}}/>
    <div style={{height:9,width:'70%',borderRadius:6,background:'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s 0.3s infinite linear'}}/>
  </div>;
}

function Skeleton({ h=90 }) {
  return <div style={{height:h,borderRadius:12,marginBottom:8,background:'linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite linear'}}/>;
}

function LazyImg({ src, alt, style:s={}, detailSize=false, category='' }) {
  const [loaded,setLoaded]=useState(false);
  const [errored,setErrored]=useState(false);
  const [cur,setCur]=useState(src);
  const col=CAT_COLOR[category]||'#334155';
  useEffect(()=>{ setLoaded(false); setErrored(false); setCur(src); },[src]);
  const fallbackGradient=`linear-gradient(135deg,${col}33 0%,${col}11 50%,#0A0F1E 100%)`;
  return (
    <div style={{position:'relative',overflow:'hidden',backgroundColor:D.imgPlaceholder,...s}}>
      {!loaded&&!errored&&<div style={{position:'absolute',inset:0,background:`linear-gradient(90deg,${D.imgPlaceholder} 25%,#1e2040 50%,${D.imgPlaceholder} 75%)`,backgroundSize:'200% 100%',animation:'shimmer 1.6s infinite linear'}}/>}
      {errored&&<div style={{position:'absolute',inset:0,background:fallbackGradient,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:32,opacity:0.5}}>{CAT_EMOJI[category]||'📍'}</span></div>}
      {!errored&&<img src={cur} alt={alt} loading="lazy"
        onLoad={()=>setLoaded(true)}
        onError={()=>setErrored(true)}
        style={{width:'100%',height:'100%',objectFit:'cover',display:'block',opacity:loaded?1:0,transition:'opacity 0.5s ease',filter:loaded?'none':'blur(8px)',transform:loaded?'scale(1)':'scale(1.04)'}}/>}
    </div>
  );
}

// ─── Place Detail Modal ──────────────────────────────────────────────────────
function PlaceModal({ place, stateName, onClose }) {
  const { toggleSave, isSaved }=useContext(AppCtx);
  const mobile=useMobile();
  const [tab,setTab]=useState('overview');
  const [copied,setCopied]=useState(false);
  const col=CAT_COLOR[place.category]||'#64748b';
  const kw=CAT_KW[place.category]||'travel usa';
  const heroSrc=unsplash(`${place.name} ${stateName||''} ${kw}`, 800, 500);
  const galleryImgs=[1,2,3,4].map(i=>unsplash(`${place.name} ${kw}`, 400, 300, i));
  const mapsUrl=`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  const lat=place.lat??0, lng=place.lng??0;
  const coord=`${Math.abs(lat).toFixed(4)}°${lat>=0?'N':'S'}, ${Math.abs(lng).toFixed(4)}°${lng>=0?'E':'W'}`;
  const saved_=isSaved(place);
  const handleShare=()=>{ if(navigator.share)navigator.share({title:place.name,text:place.description,url:window.location.href}); else{navigator.clipboard.writeText(`${place.name} — ${place.description}\nGPS: ${coord}`);setCopied(true);setTimeout(()=>setCopied(false),2000);} };
  const sheet={background:'#111827',...(mobile?{width:'100%',maxHeight:'92vh',borderRadius:'20px 20px 0 0',animation:'slideUp 0.35s cubic-bezier(0.4,0,0.2,1)'}:{width:440,height:'100vh',animation:'slideRight 0.35s cubic-bezier(0.4,0,0.2,1)'}),display:'flex',flexDirection:'column',overflow:'hidden'};
  const tabBtn=(t,label)=><button onClick={()=>setTab(t)} style={{flex:1,padding:'11px 0',background:'none',border:'none',borderBottom:`2px solid ${tab===t?D.teal:'transparent'}`,color:tab===t?D.teal:'rgba(255,255,255,0.4)',fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:D.font,transition:'all 0.2s'}}>{label}</button>;
  return (
    <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)',display:'flex',alignItems:'flex-end',justifyContent:mobile?'center':'flex-end'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={sheet}>
        <div style={{position:'relative',height:220,flexShrink:0}}>
          <LazyImg src={heroSrc} alt={place.name} style={{width:'100%',height:220}} detailSize={true} category={place.category}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 30%,#111827 100%)'}}/>
          <button onClick={onClose} style={{position:'absolute',top:12,right:12,width:34,height:34,borderRadius:'50%',background:'rgba(0,0,0,0.7)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
          <div style={{position:'absolute',top:12,right:54,display:'flex',gap:6}}>
            <button onClick={()=>toggleSave(place)} style={{width:34,height:34,borderRadius:'50%',background:'rgba(0,0,0,0.7)',border:'1px solid rgba(255,255,255,0.2)',color:saved_?'#ef4444':'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'color 0.2s'}}>{saved_?'❤️':'🤍'}</button>
            <button onClick={handleShare} style={{width:34,height:34,borderRadius:'50%',background:'rgba(0,0,0,0.7)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{copied?'✓':'↗'}</button>
          </div>
          <div style={{position:'absolute',bottom:12,left:16}}><Badge cat={place.category}/>{place._region&&<span style={{marginLeft:8,fontSize:10,color:'rgba(255,255,255,0.5)'}}>· {place._region}</span>}</div>
        </div>
        <div style={{padding:'14px 20px 0',flexShrink:0}}>
          <h2 style={{fontFamily:D.serif,fontSize:22,fontWeight:700,color:D.white,margin:'0 0 6px',lineHeight:1.2}}>{place.name}</h2>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Stars rating={place.rating||4} size={16}/>
            {place.distanceFromRoute!=null&&<span style={{fontSize:11,color:D.gold,fontWeight:600}}>· {typeof place.distanceFromRoute==='number'?place.distanceFromRoute.toFixed(1):place.distanceFromRoute} mi off route</span>}
          </div>
        </div>
        <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.1)',margin:'12px 0 0',flexShrink:0}}>
          {tabBtn('overview','Overview')}{tabBtn('photos','Photos')}{tabBtn('getting','Getting There')}{tabBtn('tips','Local Tips')}
        </div>
        <div style={{flex:1,overflowY:'auto',padding:20}}>
          {tab==='overview'&&<div style={{animation:'fadeIn 0.25s ease'}}>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:14,lineHeight:1.7,marginBottom:16}}>{place.description}</p>
            {place.whyDetour&&<div style={{background:D.tealDim,border:`1px solid ${D.teal}44`,borderRadius:12,padding:'12px 14px'}}>
              <div style={{fontSize:10,fontWeight:700,color:D.teal,letterSpacing:1,marginBottom:4}}>✨ WHY IT'S WORTH THE DETOUR</div>
              <p style={{color:D.off,fontSize:13,margin:0,lineHeight:1.55}}>{place.whyDetour}</p>
            </div>}
          </div>}
          {tab==='photos'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,animation:'fadeIn 0.25s ease'}}>
            {galleryImgs.map((src,i)=><LazyImg key={i} src={src} alt={`${place.name} photo ${i+1}`} style={{height:140,borderRadius:10,overflow:'hidden'}} category={place.category}/>)}
          </div>}
          {tab==='getting'&&<div style={{animation:'fadeIn 0.25s ease'}}>
            <div style={{background:D.glass,border:`1px solid ${D.border}`,borderRadius:12,padding:'14px 16px',marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.4)',letterSpacing:1,marginBottom:6}}>📍 GPS COORDINATES</div>
              <code style={{color:D.teal,fontSize:13,letterSpacing:0.5}}>{coord}</code>
            </div>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',padding:14,borderRadius:12,background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',color:'#fff',textDecoration:'none',fontWeight:700,fontSize:14,fontFamily:D.font,minHeight:48}}>🗺️ Open in Google Maps</a>
          </div>}
          {tab==='tips'&&<div style={{animation:'fadeIn 0.25s ease'}}>
            <div style={{background:D.goldDim,border:`1px solid ${D.gold}44`,borderRadius:12,padding:'14px 16px'}}>
              <div style={{fontSize:10,fontWeight:700,color:D.gold,letterSpacing:1,marginBottom:6}}>💡 LOCAL INSIDER TIP</div>
              <p style={{color:D.off,fontSize:13,margin:0,lineHeight:1.6}}>{place.localTip}</p>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}

// ─── State Grid ──────────────────────────────────────────────────────────────
function StateGrid({ onSelect, planData }) {
  const mobile=useMobile(); const [q,setQ]=useState('');
  const filtered=US_STATES.filter(s=>s.name.toLowerCase().includes(q.toLowerCase())||s.abbr.toLowerCase().includes(q.toLowerCase()));
  const [upgradeModal, setUpgradeModal] = useState(false);
  return (
    <div style={{height:'100vh',overflowY:'auto',background:D.navy,paddingTop:70,fontFamily:D.font}}>
      {upgradeModal && <UpgradeModal onClose={()=>setUpgradeModal(false)}/>}
      <div style={{padding:'24px 24px 16px',maxWidth:1300,margin:'0 auto'}}>
        <h2 style={{fontFamily:D.serif,fontSize:32,fontWeight:700,color:D.white,marginBottom:6}}>Choose a State</h2>
        <p style={{color:D.muted,marginBottom:20}}>
          {planData.statesLimit < 50
            ? <span>Free plan: <strong style={{color:D.gold}}>{planData.statesLimit} states</strong> — <span style={{color:D.teal,cursor:'pointer',textDecoration:'underline'}} onClick={()=>setUpgradeModal(true)}>Upgrade to unlock all 50</span></span>
            : 'Click any state to discover its hidden gems'
          }
        </p>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filter states…" style={{padding:'11px 18px',fontSize:14,background:D.glass,border:`1px solid ${D.border}`,borderRadius:12,color:D.white,outline:'none',fontFamily:D.font,maxWidth:300,backdropFilter:'blur(10px)'}}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:mobile?'repeat(3,1fr)':'repeat(auto-fill,minmax(130px,1fr))',gap:10,padding:'0 24px 60px',maxWidth:1300,margin:'0 auto'}}>
        {filtered.map((s,i)=><StateCard key={s.abbr} state={s} locked={i >= planData.statesLimit} onClick={()=>{
          if(i >= planData.statesLimit){setUpgradeModal(true);return;}
          onSelect(s);
        }}/>)}
      </div>
    </div>
  );
}

function StateCard({ state, onClick, locked }) {
  const [hov,setHov]=useState(false);
  return <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{background:locked?'rgba(255,255,255,0.03)':hov?'rgba(0,210,255,0.1)':D.glass,border:`1px solid ${locked?'rgba(255,255,255,0.05)':hov?D.teal+'88':D.border}`,borderRadius:12,padding:'16px 8px',cursor:'pointer',transition:'all 0.2s',transform:(!locked&&hov)?'translateY(-3px) scale(1.03)':'none',boxShadow:(!locked&&hov)?'0 8px 24px rgba(0,210,255,0.2)':'none',display:'flex',flexDirection:'column',alignItems:'center',gap:6,fontFamily:D.font,color:'inherit',minHeight:44,backdropFilter:'blur(10px)',position:'relative',opacity:locked?0.5:1}}>
    {locked&&<div style={{position:'absolute',top:4,right:4,fontSize:10}}>🔒</div>}
    <span style={{fontSize:24}}>{state.emoji}</span>
    <span style={{fontSize:11,fontWeight:700,color:locked?D.muted:D.white,textAlign:'center',lineHeight:1.3}}>{state.name}</span>
    <span style={{fontSize:9,color:D.muted,letterSpacing:0.4}}>{state.abbr} · {state.regions.length}R</span>
  </button>;
}

// ─── Map Explore ─────────────────────────────────────────────────────────────
function communityPin(L, gold='#C9A84C') {
  return L.divIcon({ className:'', html:`<div style="width:22px;height:22px;border-radius:50%;background:${gold};border:2px solid #fff;box-shadow:0 0 8px ${gold}99;display:flex;align-items:center;justify-content:center;font-size:11px;">🌟</div>`, iconSize:[22,22], iconAnchor:[11,11] });
}

function MapExplore({ state, onModal, userLocation }) {
  const mobile=useMobile();
  const mapRef=useRef(null), mapDivRef=useRef(null), markersRef=useRef([]);
  const [places,setPlaces]=useState([]);
  const [loading,setLoading]=useState(true);
  const [loadedCount,setLoadedCount]=useState(0);
  const [error,setError]=useState(null);
  const [search,setSearch]=useState(''), [cat,setCat]=useState('All');
  const [drawerOpen,setDrawerOpen]=useState(false);
  const touchY=useRef(0);
  const total=state.regions.length;
  const filtered=places.filter(p=>(cat==='All'||p.category===cat)&&p.name.toLowerCase().includes(search.toLowerCase()));
  const sorted=userLocation?[...filtered].sort((a,b)=>hav(userLocation.lat,userLocation.lng,a.lat,a.lng)-hav(userLocation.lat,userLocation.lng,b.lat,b.lng)):filtered;

  useEffect(()=>{
    let cancel=false, map=null;
    const accumulated=[];
    const addMarkers=(L,newPlaces)=>{ newPlaces.forEach(p=>{ const c=CAT_COLOR[p.category]||'#64748b'; const mk=L.marker([p.lat,p.lng],{icon:pin(L,c)}).addTo(map); mk.bindTooltip(p.name,{direction:'top',offset:[0,-40]}); mk.on('click',()=>onModal(p,state.name)); markersRef.current.push({marker:mk,place:p}); }); };
    const addCommunityMarkers=async(L)=>{
      try {
        const { docs } = await getDiscoverFeed(50);
        docs.forEach(d=>{
          const sub=d.data();
          if(sub.state!==state.name) return;
          if(!sub.coordinates?.lat||!sub.coordinates?.lng) return;
          const mk=L.marker([sub.coordinates.lat,sub.coordinates.lng],{icon:communityPin(L)}).addTo(map);
          mk.bindTooltip(`🌟 ${sub.name} (community)`,{direction:'top',offset:[0,-14]});
          mk.on('click',()=>onModal({
            name:sub.name, lat:sub.coordinates.lat, lng:sub.coordinates.lng,
            category:sub.category, description:sub.description,
            localTip:sub.localTip||'Community verified hidden gem!',
            rating:4.5, isCommunity:true,
          }, state.name));
        });
      } catch {}
    };
    const init=async()=>{
      const L=await loadLeaflet(); if(cancel)return;
      map=L.map(mapDivRef.current).setView(state.center,7); mapRef.current=map;
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20}).addTo(map);
      if(userLocation){ L.marker([userLocation.lat,userLocation.lng],{icon:userPin(L)}).addTo(map).bindTooltip('You are here'); map.setView([userLocation.lat,userLocation.lng],10); }
      const onBatch=(places,fromFullCache)=>{
        if(cancel)return;
        if(fromFullCache){ setPlaces(places); setLoading(false); setLoadedCount(total); addMarkers(L,places); return; }
        accumulated.push(...places); setPlaces([...accumulated]); setLoadedCount(n=>n+1); addMarkers(L,places);
      };
      try { await fetchAllRegionsParallel(state, onBatch); if(!cancel){ setLoading(false); } }
      catch(e) { if(!cancel){ setError(e.message); setLoading(false); } }
      preloadNeighbors(state);
      if(!cancel) addCommunityMarkers(L);
    };
    init().catch(e=>{ if(!cancel){setError(e.message);setLoading(false);} });
    return()=>{ cancel=true; markersRef.current=[]; if(map)map.remove(); mapRef.current=null; };
  },[state]);

  useEffect(()=>{ markersRef.current.forEach(({marker,place:p})=>{ const ok=(cat==='All'||p.category===cat)&&p.name.toLowerCase().includes(search.toLowerCase()); marker.setOpacity(ok?1:0.1); }); },[cat,search]);

  const progress=total>0?loadedCount/total:0;
  const showSkeleton=loading&&places.length===0;
  const sidebar=(
    <div style={{display:'flex',flexDirection:'column',height:'100%',fontFamily:D.font}}>
      <div style={{padding:'14px 16px 12px',borderBottom:`1px solid ${D.border}`,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:22}}>{state.emoji}</span>
          <div style={{flex:1}}>
            <h3 style={{color:D.white,fontSize:16,fontWeight:700,margin:0,fontFamily:D.serif}}>{state.name}</h3>
            <p style={{color:D.muted,fontSize:10,margin:0}}>{loading?`Loading ${loadedCount} of ${total} regions · ${places.length} places found`:`${total} regions · ${places.length} places`}</p>
          </div>
        </div>
        {loading&&(<div style={{marginTop:8,height:3,background:'rgba(255,255,255,0.1)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:`linear-gradient(90deg,${D.teal},#3A7BD5)`,width:`${progress*100}%`,transition:'width 0.4s ease'}}/></div>)}
      </div>
      <div style={{padding:'9px 14px',borderBottom:`1px solid ${D.border}`,flexShrink:0}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search places…" style={{width:'100%',padding:'9px 12px',fontSize:13,background:D.glass,border:`1px solid ${D.border}`,borderRadius:9,color:D.white,outline:'none',fontFamily:D.font,backdropFilter:'blur(10px)',minHeight:44}}/>
      </div>
      <div style={{padding:'7px 14px',borderBottom:`1px solid ${D.border}`,display:'flex',gap:5,flexWrap:'wrap',flexShrink:0}}>
        {CATEGORIES.map(c=>{const a=cat===c;const col=c==='All'?D.teal:CAT_COLOR[c];return(<button key={c} onClick={()=>setCat(c)} style={{padding:'5px 10px',borderRadius:20,fontSize:10,fontWeight:700,cursor:'pointer',background:a?col:'rgba(255,255,255,0.06)',border:`1px solid ${a?col:D.border}`,color:a?'#fff':D.muted,minHeight:44,fontFamily:D.font,transition:'all 0.15s'}}>{c==='All'?'🗺️':CAT_EMOJI[c]} {c}</button>);})}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'6px 14px'}}>
        {showSkeleton&&Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>)}
        {error&&<p style={{color:'#ef4444',fontSize:12,textAlign:'center',marginTop:24}}>{error}</p>}
        {sorted.map(p=><SidebarCard key={`${p.name}-${p.lat}`} place={p} onClick={()=>{onModal(p,state.name);if(mobile)setDrawerOpen(false);if(mapRef.current)mapRef.current.setView([p.lat,p.lng],13,{animate:true});}} userLoc={userLocation}/>)}
        {loading&&places.length>0&&Array.from({length:Math.max(0,total-loadedCount)*3}).map((_,i)=><SkeletonCard key={`sk-${i}`}/>)}
        {!loading&&sorted.length===0&&!error&&<p style={{color:D.muted,textAlign:'center',marginTop:24,fontSize:12}}>No places match</p>}
      </div>
    </div>
  );

  if (mobile) return (
    <div style={{position:'relative',height:'100vh',overflow:'hidden',background:D.navy}}>
      <div ref={mapDivRef} style={{width:'100%',height:'100%'}}/>
      <button onClick={()=>setDrawerOpen(v=>!v)} style={{position:'absolute',top:70,left:14,zIndex:600,width:44,height:44,borderRadius:11,background:'rgba(17,19,24,0.9)',border:`1px solid ${D.border}`,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 12px rgba(0,0,0,0.4)'}}>{drawerOpen?'✕':'☰'}</button>
      {loading&&places.length===0&&<div style={{position:'absolute',top:70,right:14,zIndex:600,background:'rgba(17,19,24,0.9)',border:`1px solid ${D.border}`,borderRadius:10,padding:'8px 12px',fontSize:11,color:D.teal,display:'flex',alignItems:'center',gap:6}}><span style={{width:10,height:10,borderRadius:'50%',border:`2px solid rgba(0,210,255,0.3)`,borderTopColor:D.teal,animation:'spin 0.7s linear infinite',display:'inline-block'}}/> Loading…</div>}
      <div onTouchStart={e=>{touchY.current=e.touches[0].clientY;}} onTouchEnd={e=>{if(e.changedTouches[0].clientY-touchY.current>80)setDrawerOpen(false);}}
        style={{position:'absolute',left:0,right:0,bottom:0,height:'80%',background:'#111318',borderRadius:'18px 18px 0 0',transform:drawerOpen?'translateY(0)':'translateY(100%)',transition:'transform 0.3s cubic-bezier(0.4,0,0.2,1)',zIndex:500,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'center',padding:'10px',flexShrink:0}}><div style={{width:40,height:4,background:D.border,borderRadius:2}}/></div>
        {sidebar}
      </div>
    </div>
  );
  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:D.navy,paddingTop:60}}>
      <div style={{width:316,flexShrink:0,height:'100%',background:'#111318',borderRight:`1px solid ${D.border}`,overflow:'hidden',display:'flex',flexDirection:'column'}}>{sidebar}</div>
      <div style={{flex:1,position:'relative'}}><div ref={mapDivRef} style={{width:'100%',height:'100%'}}/></div>
    </div>
  );
}

function SidebarCard({ place, onClick, userLoc }) {
  const [hov,setHov]=useState(false); const col=CAT_COLOR[place.category]||'#64748b';
  const dist=userLoc?hav(userLoc.lat,userLoc.lng,place.lat,place.lng):null;
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:'9px 11px 9px 13px',borderRadius:9,cursor:'pointer',background:hov?D.glassH:'transparent',border:`1px solid ${hov?D.border:'transparent'}`,borderLeft:`4px solid ${hov?col:col+'55'}`,transition:'all 0.15s',marginBottom:4,minHeight:44,boxShadow:hov?`0 2px 12px ${col}22`:'none'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
        <span style={{fontSize:12}}>{CAT_EMOJI[place.category]||'📍'}</span>
        <span style={{fontWeight:600,fontSize:11,color:D.white,flex:1,lineHeight:1.3}}>{place.name}</span>
        {dist!=null&&<span style={{fontSize:9,color:D.muted,marginRight:3}}>{dist<10?dist.toFixed(1):Math.round(dist)}mi</span>}
        <span style={{fontSize:8,fontWeight:700,color:col,background:`${col}22`,padding:'2px 6px',borderRadius:4,letterSpacing:0.3,flexShrink:0}}>{(place.category||'').slice(0,3).toUpperCase()}</span>
      </div>
      <p style={{fontSize:10,color:D.muted,margin:0,lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{place.description}</p>
      <Stars rating={place.rating||4} size={11}/>
    </div>
  );
}

// ─── Route Planner ───────────────────────────────────────────────────────────
function LocationInput({ label, value, onChange, onSelect }) {
  const [results,setResults]=useState([]); const [open,setOpen]=useState(false); const deb=useRef(null);
  const search=useCallback(v=>{ clearTimeout(deb.current); if(v.length<3){setResults([]);setOpen(false);return;} deb.current=setTimeout(async()=>{ const r=await geocode(v); setResults(r); setOpen(r.length>0); },350); },[]);
  return (
    <div style={{position:'relative',marginBottom:12}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:D.muted,letterSpacing:1,marginBottom:5}}>{label}</label>
      <input value={value} onChange={e=>{onChange(e.target.value);search(e.target.value);}} onBlur={()=>setTimeout(()=>setOpen(false),180)} placeholder={`Enter ${label.toLowerCase()}…`}
        style={{width:'100%',padding:'13px 16px',fontSize:14,background:D.glass,border:`1px solid ${D.border}`,borderRadius:12,color:D.white,outline:'none',fontFamily:D.font,backdropFilter:'blur(10px)',minHeight:48}}/>
      {open&&<div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:200,background:'#1a2035',border:`1px solid ${D.border}`,borderRadius:10,marginTop:4,overflow:'hidden',boxShadow:'0 12px 40px rgba(0,0,0,0.5)'}}>
        {results.map((r,i)=><div key={i} onMouseDown={()=>{onChange(r.label);onSelect(r);setOpen(false);}} style={{padding:'11px 16px',cursor:'pointer',color:D.off,fontSize:13}} onMouseEnter={e=>e.currentTarget.style.background=D.glassH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>📍 {r.label}</div>)}
      </div>}
    </div>
  );
}

function RoutePlanner({ onModal, planData }) {
  const mobile=useMobile();
  const mapDivRef=useRef(null), mapRef=useRef(null), markersRef=useRef([]), lineRef=useRef(null);
  const abortRef=useRef(null);
  const [startTxt,setStartTxt]=useState(''), [endTxt,setEndTxt]=useState('');
  const [startC,setStartC]=useState(null), [endC,setEndC]=useState(null);
  const [places,setPlaces]=useState([]), [loading,setLoading]=useState(false), [error,setError]=useState(null);
  const [summary,setSummary]=useState(null), [panelOpen,setPanelOpen]=useState(true);
  const [routeCount, setRouteCount] = useState(0);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(()=>{
    let cancel=false;
    const init=async()=>{ const L=await loadLeaflet(); if(cancel)return; const map=L.map(mapDivRef.current).setView([39,-98],4); mapRef.current=map; L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20}).addTo(map); };
    init();
    return()=>{ cancel=true; if(mapRef.current){mapRef.current.remove();mapRef.current=null;} markersRef.current=[]; };
  },[]);

  // Countdown effect for rate-limit errors
  useEffect(()=>{
    if(countdown<=0) return;
    const t=setTimeout(()=>setCountdown(c=>c-1),1000);
    return()=>clearTimeout(t);
  },[countdown]);

  const handleFind=async()=>{
    if(planData.routes !== Infinity && routeCount >= planData.routes) { setUpgradeModal(true); return; }
    if(!startC||!endC){setError('Select both locations from autocomplete suggestions.');return;}
    if(countdown>0){setError(`Rate limited — please wait ${countdown}s before trying again.`);return;}

    // Check sessionStorage cache
    const cacheKey=`route:${startTxt.trim().toLowerCase()}|${endTxt.trim().toLowerCase()}`;
    const cached=sessionStorage.getItem(cacheKey);

    if(abortRef.current) abortRef.current.abort();
    abortRef.current=new AbortController();
    setError(null); setLoading(true); setPlaces([]);
    const L=window.L; const map=mapRef.current;
    if(!L||!map){setLoading(false);return;}
    markersRef.current.forEach(({marker})=>marker.remove()); markersRef.current=[];
    if(lineRef.current){lineRef.current.remove();lineRef.current=null;}
    const dist=hav(startC.lat,startC.lng,endC.lat,endC.lng);
    const hrs=dist/65, h=Math.floor(hrs), m=Math.round((hrs-h)*60);
    setSummary({dist:Math.round(dist),time:`${h}h ${m}m`,stops:0});
    const line=L.polyline([[startC.lat,startC.lng],[endC.lat,endC.lng]],{color:D.teal,weight:4,opacity:0.85,dashArray:'12,6'}).addTo(map);
    lineRef.current=line;
    const startMk=L.marker([startC.lat,startC.lng],{icon:pin(L,'#22c55e')}).addTo(map).bindTooltip('Start: '+startTxt);
    const endMk=L.marker([endC.lat,endC.lng],{icon:pin(L,'#ef4444')}).addTo(map).bindTooltip('End: '+endTxt);
    markersRef.current.push({marker:startMk,place:null},{marker:endMk,place:null});
    map.fitBounds([[startC.lat,startC.lng],[endC.lat,endC.lng]],{padding:[60,60]});

    const addPlaceToMap=(place)=>{
      const col=CAT_COLOR[place.category]||'#64748b';
      const mk=L.marker([place.lat,place.lng],{icon:pin(L,col)}).addTo(map);
      mk.bindTooltip(place.name,{direction:'top',offset:[0,-40]}); mk.on('click',()=>onModal(place,null)); markersRef.current.push({marker:mk,place});
    };

    // Serve from cache instantly
    if(cached){
      try{
        const places=JSON.parse(cached);
        places.forEach(p=>{ addPlaceToMap(p); });
        setPlaces(places); setSummary(s=>s?{...s,stops:places.length}:s);
        setLoading(false); setRouteCount(c=>c+1); return;
      }catch{}
    }

    let count=0;
    try {
      await fetchRouteStream(startTxt, endTxt, dist, (place)=>{
        count++; setPlaces(ps=>{
          const next=[...ps,place];
          if(count===6) try{ sessionStorage.setItem(cacheKey,JSON.stringify(next)); }catch{}
          return next;
        });
        setSummary(s=>s?{...s,stops:count}:s);
        addPlaceToMap(place);
      }, abortRef.current.signal);
      setRouteCount(c => c+1);
      setLoading(false);
    } catch(e) {
      if(e.name!=='AbortError'){
        const msg=e.message||'';
        setError(msg);
        if(msg.toLowerCase().includes('rate limit')||msg.toLowerCase().includes('too many')||msg.includes('429')){
          setCountdown(30);
        }
      }
      setLoading(false);
    }
  };

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:D.navy,paddingTop:60,fontFamily:D.font,flexDirection:mobile?'column':'row'}}>
      {upgradeModal && <UpgradeModal onClose={()=>setUpgradeModal(false)}/>}
      <div style={{width:mobile?'100%':360,flexShrink:0,height:mobile?panelOpen?'55%':'56px':'100%',background:'#111318',borderRight:mobile?'none':`1px solid ${D.border}`,borderBottom:mobile?`1px solid ${D.border}`:'none',display:'flex',flexDirection:'column',overflow:'hidden',transition:'height 0.3s'}}>
        <div style={{padding:'16px 18px',borderBottom:`1px solid ${D.border}`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h2 style={{fontFamily:D.serif,fontSize:20,fontWeight:700,color:D.white,margin:0}}>🛣️ Plan a Route</h2>
            <p style={{color:D.muted,fontSize:11,margin:'2px 0 0'}}>
              {planData.routes===0?'Route planning requires Explorer plan':planData.routes===Infinity?'Unlimited routes':''+routeCount+' / '+planData.routes+' routes used today'}
            </p>
          </div>
          {mobile&&<button onClick={()=>setPanelOpen(v=>!v)} style={{background:'none',border:`1px solid ${D.border}`,color:D.white,borderRadius:8,padding:'6px 10px',cursor:'pointer',fontSize:13}}>{panelOpen?'▲':'▼'}</button>}
        </div>
        <div style={{padding:'16px 18px',flex:1,overflowY:'auto'}}>
          {planData.routes===0 ? (
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontSize:48,marginBottom:16}}>🛣️</div>
              <h3 style={{color:D.white,fontFamily:D.serif,marginBottom:8}}>Route Planning Locked</h3>
              <p style={{color:D.muted,fontSize:13,marginBottom:20}}>Upgrade to Explorer to plan up to 3 routes per day, or go Pro for unlimited.</p>
              <Btn onClick={()=>setUpgradeModal(true)} variant="teal">Upgrade Now</Btn>
            </div>
          ) : (
            <>
              <LocationInput label="START LOCATION" value={startTxt} onChange={setStartTxt} onSelect={r=>setStartC({lat:r.lat,lng:r.lng})}/>
              <LocationInput label="END LOCATION" value={endTxt} onChange={setEndTxt} onSelect={r=>setEndC({lat:r.lat,lng:r.lng})}/>
              {error&&<p style={{color:'#ef4444',fontSize:12,marginBottom:10,lineHeight:1.4}}>
                {error}{countdown>0?` Retry in ${countdown}s…`:''}
              </p>}
              <Btn onClick={handleFind} disabled={loading||countdown>0} variant="teal" style={{width:'100%',justifyContent:'center',marginBottom:16,opacity:(loading||countdown>0)?0.6:1,cursor:(loading||countdown>0)?'not-allowed':'pointer'}}>
                {loading
                  ? <><span style={{width:16,height:16,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',animation:'spin 0.7s linear infinite',display:'inline-block'}}/> Discovering stops… (10–15s)</>
                  : countdown>0
                    ? `⏳ Wait ${countdown}s…`
                    : '✨ Find Places Along Route'}
              </Btn>
              {summary&&<div style={{background:D.glass,border:`1px solid ${D.border}`,borderRadius:12,padding:'12px 16px',marginBottom:16,backdropFilter:'blur(10px)'}}>
                <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                  {[{l:'Distance',v:`${summary.dist} mi`},{l:'Drive Time',v:summary.time},{l:'Stops Found',v:summary.stops}].map(x=><div key={x.l}><div style={{fontSize:9,color:D.muted,letterSpacing:1,fontWeight:700}}>{x.l}</div><div style={{fontSize:18,fontWeight:700,color:D.teal}}>{x.v}</div></div>)}
                </div>
              </div>}
              {places.map((p,i)=>(
                <div key={i} onClick={()=>onModal(p,null)}
                  style={{background:D.glass,border:`1px solid ${D.border}`,borderRadius:12,padding:'12px 14px',marginBottom:8,cursor:'pointer',backdropFilter:'blur(10px)',transition:'border-color 0.2s',animation:'fadeIn 0.3s ease'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=D.teal+'88'} onMouseLeave={e=>e.currentTarget.style.borderColor=D.border}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}><Badge cat={p.category}/>{p.distanceFromRoute!=null&&<span style={{fontSize:10,color:D.gold,fontWeight:600}}>{typeof p.distanceFromRoute==='number'?p.distanceFromRoute.toFixed(1):p.distanceFromRoute} mi off route</span>}</div>
                  <div style={{fontWeight:700,fontSize:13,color:D.white,marginBottom:3}}>{p.name}</div>
                  <p style={{fontSize:11,color:D.muted,margin:'0 0 4px',lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{p.description}</p>
                  {p.whyDetour&&<p style={{fontSize:10,color:D.teal,margin:0,fontStyle:'italic'}}>✨ {p.whyDetour}</p>}
                </div>
              ))}
              {loading&&[1,2].map(i=><Skeleton key={i} h={100}/>)}
            </>
          )}
        </div>
      </div>
      <div style={{flex:1,position:'relative'}}><div ref={mapDivRef} style={{width:'100%',height:'100%'}}/></div>
    </div>
  );
}

// ─── Saved Places ────────────────────────────────────────────────────────────
function SavedPlaces({ onModal }) {
  const { saved, toggleSave }=useContext(AppCtx); const mobile=useMobile();
  if(!saved.length) return <div style={{height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:D.navy,paddingTop:60,fontFamily:D.font,textAlign:'center',padding:'80px 24px'}}><div style={{fontSize:64,marginBottom:16}}>🤍</div><h2 style={{fontFamily:D.serif,fontSize:28,color:D.white,marginBottom:8}}>No Saved Places Yet</h2><p style={{color:D.muted,fontSize:15}}>Heart any place to save it here.</p></div>;
  return (
    <div style={{height:'100vh',overflowY:'auto',background:D.navy,paddingTop:80,fontFamily:D.font}}>
      <div style={{padding:'0 24px 16px',maxWidth:1200,margin:'0 auto'}}>
        <h2 style={{fontFamily:D.serif,fontSize:32,fontWeight:700,color:D.white,marginBottom:4}}>❤️ Saved Places</h2>
        <p style={{color:D.muted,marginBottom:24}}>{saved.length} place{saved.length!==1?'s':''} saved</p>
        <div style={{display:'grid',gridTemplateColumns:mobile?'1fr':'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {saved.map((p,i)=>(
            <div key={i} onClick={()=>onModal(p,null)}
              style={{background:D.glass,border:`1px solid ${D.border}`,borderRadius:16,overflow:'hidden',cursor:'pointer',backdropFilter:'blur(10px)',transition:'transform 0.2s,border-color 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.02)';e.currentTarget.style.borderColor=D.teal+'88';}} onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.borderColor=D.border;}}>
              <LazyImg src={unsplash(`${p.name} ${CAT_KW[p.category]||'travel'}`)} alt={p.name} style={{height:180,overflow:'hidden'}} category={p.category}/>
              <div style={{padding:'12px 14px'}}>
                <Badge cat={p.category}/>
                <h3 style={{fontFamily:D.serif,fontSize:16,fontWeight:700,color:D.white,margin:'6px 0 4px'}}>{p.name}</h3>
                <p style={{fontSize:12,color:D.muted,margin:'0 0 8px',lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{p.description}</p>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <Stars rating={p.rating||4} size={13}/>
                  <button onClick={e=>{e.stopPropagation();toggleSave(p);}} style={{background:'none',border:'none',color:'#ef4444',fontSize:18,cursor:'pointer'}}>❤️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Explore App ────────────────────────────────────────────────────────
export default function ExploreApp() {
  const { user, plan, planData } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(()=>localGet('exploreai_saved',[]));
  const [view, setView] = useState('states');
  const [mapState, setMapState] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [modal, setModal] = useState(null);

  const toggleSave=(place)=>{
    setSaved(prev=>{
      const key=`${place.name}_${place.lat}`;
      const exists=prev.some(p=>`${p.name}_${p.lat}`===key);
      const next=exists?prev.filter(p=>`${p.name}_${p.lat}`!==key):[...prev,place];
      localSet('exploreai_saved',next); return next;
    });
  };
  const isSaved=(place)=>saved.some(p=>`${p.name}_${p.lat}`===`${place.name}_${place.lat}`);

  const handleNav=(v)=>{
    if(v==='nearme'){
      if(!navigator.geolocation){alert('Geolocation not supported.');return;}
      navigator.geolocation.getCurrentPosition(async pos=>{
        const sn=await reverseGeocode(pos.coords.latitude,pos.coords.longitude);
        const state=US_STATES.find(s=>s.name.toLowerCase()===sn?.toLowerCase());
        if(state){setUserLoc({lat:pos.coords.latitude,lng:pos.coords.longitude});setMapState(state);setView('map');}
        else setView('states');
      },()=>setView('states'));
      return;
    }
    if(v==='discover'){ navigate('/discover'); return; }
    setView(v);
  };

  const handleSearch=(q)=>{
    const s=US_STATES.find(st=>st.name.toLowerCase().includes(q.toLowerCase())||st.abbr.toLowerCase()===q.toLowerCase());
    if(s){setMapState(s);setView('map');} else setView('states');
  };

  return (
    <AppCtx.Provider value={{saved,toggleSave,isSaved}}>
      <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:'#0A0F1E',color:'#FFFFFF'}}>
        <NavBarAuth view={view} onNav={handleNav} savedCount={saved.length}/>
        {view==='states'&&<StateGrid onSelect={s=>{setMapState(s);setView('map');}} planData={planData}/>}
        {view==='map'&&mapState&&<MapExplore state={mapState} onModal={(p,sn)=>setModal({place:p,stateName:sn})} userLocation={userLoc}/>}
        {view==='route'&&<RoutePlanner onModal={(p,sn)=>setModal({place:p,stateName:sn})} planData={planData}/>}
        {view==='saved'&&<SavedPlaces onModal={(p,sn)=>setModal({place:p,stateName:sn})}/>}
        {modal&&<PlaceModal place={modal.place} stateName={modal.stateName} onClose={()=>setModal(null)}/>}
      </div>
    </AppCtx.Provider>
  );
}
