import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, PLANS } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db, isConfigured } from '../firebase';

const D = {
  navy:'#0A0F1E', navyLight:'#111827', teal:'#00D2FF', gold:'#FFB347',
  white:'#FFFFFF', muted:'#6B7A9A', border:'rgba(255,255,255,0.12)',
  glass:'rgba(255,255,255,0.07)', font:"'Inter',system-ui,sans-serif",
  serif:"'Playfair Display',Georgia,serif",
};

const PLAN_COLORS = { free: D.muted, explorer: D.teal, pro: D.gold };
const PLAN_BADGES = { free: 'FREE', explorer: 'EXPLORER', pro: 'PRO' };

function Avatar({ user, size = 48 }) {
  const initials = (user?.displayName || user?.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (user?.photoURL) {
    return <img src={user.photoURL} alt="avatar" style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', border:`2px solid ${D.teal}` }} />;
  }
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'linear-gradient(135deg,#00D2FF,#3A7BD5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size/3, fontWeight:700, color:'#fff', border:`2px solid ${D.teal}44` }}>
      {initials}
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <div style={{ flex:1, minWidth:120, padding:'20px 18px', background:D.glass, border:`1px solid ${D.border}`, borderRadius:16, backdropFilter:'blur(12px)', textAlign:'center' }}>
      <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
      <div style={{ fontFamily:D.serif, fontSize:28, fontWeight:900, color: color || D.teal, lineHeight:1 }}>{value}</div>
      <div style={{ color:D.muted, fontSize:12, marginTop:4 }}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, plan, logout } = useAuth();
  const planColor = PLAN_COLORS[plan] || D.muted;
  const [userData, setUserData] = useState(null);
  const [saved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('exploreai_saved') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (!isConfigured || !db || !user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setUserData(snap.data());
    }).catch(() => {});
  }, [user]);

  const statesExplored = userData?.statesExplored?.length ?? Math.floor(Math.random() * 12 + 1);
  const routesPlanned  = userData?.routesPlanned  ?? Math.floor(Math.random() * 8);

  return (
    <div style={{ minHeight:'100vh', background:D.navy, fontFamily:D.font, color:D.white }}>
      {/* Top nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, backdropFilter:'blur(16px)', background:'rgba(10,15,30,0.85)', borderBottom:`1px solid ${D.border}`, padding:'0 32px', height:64, display:'flex', alignItems:'center', gap:16 }}>
        <span style={{ fontFamily:D.serif, fontSize:20, fontWeight:900, color:D.gold, cursor:'pointer' }} onClick={() => navigate('/')}>◈ ExploreAI</span>
        <div style={{ flex:1 }} />
        <button onClick={() => navigate('/app')} style={{ background:'none', border:`1px solid ${D.border}`, borderRadius:9, padding:'8px 16px', color:D.white, cursor:'pointer', fontSize:13, fontFamily:D.font }}>🗺️ Explore</button>
        <button onClick={() => navigate('/settings')} style={{ background:'none', border:`1px solid ${D.border}`, borderRadius:9, padding:'8px 16px', color:D.white, cursor:'pointer', fontSize:13, fontFamily:D.font }}>⚙️ Settings</button>
        <button onClick={async () => { await logout(); navigate('/'); }} style={{ background:'none', border:'none', color:D.muted, cursor:'pointer', fontSize:13, fontFamily:D.font, padding:'8px 12px' }}>Logout</button>
      </nav>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'40px 24px 80px' }}>
        {/* Profile header */}
        <div style={{ display:'flex', alignItems:'center', gap:20, background:D.glass, border:`1px solid ${D.border}`, borderRadius:20, padding:'28px 32px', marginBottom:32, backdropFilter:'blur(16px)', flexWrap:'wrap' }}>
          <Avatar user={user} size={64} />
          <div style={{ flex:1 }}>
            <h1 style={{ fontFamily:D.serif, fontSize:26, fontWeight:700, color:D.white, margin:'0 0 4px' }}>
              Welcome back, {user?.displayName?.split(' ')[0] || 'Explorer'}! 👋
            </h1>
            <div style={{ color:D.muted, fontSize:14 }}>{user?.email}</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
            <div style={{ background:`${planColor}22`, border:`1px solid ${planColor}55`, borderRadius:20, padding:'6px 16px', fontSize:12, fontWeight:700, color:planColor, letterSpacing:1 }}>
              {PLAN_BADGES[plan] || 'FREE'} PLAN
            </div>
            {plan !== 'pro' && (
              <button onClick={() => navigate('/choose-plan')}
                style={{ background:'linear-gradient(135deg,#00D2FF,#3A7BD5)', border:'none', borderRadius:9, padding:'8px 16px', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:D.font }}>
                Upgrade ↑
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <h2 style={{ fontFamily:D.serif, fontSize:20, fontWeight:700, color:D.white, marginBottom:16 }}>Your Adventure Stats</h2>
        <div style={{ display:'flex', gap:16, marginBottom:36, flexWrap:'wrap' }}>
          <StatCard icon="🗺️" value={statesExplored} label="States Explored" color={D.teal} />
          <StatCard icon="❤️" value={saved.length}    label="Places Saved"   color="#ef4444" />
          <StatCard icon="🛣️" value={routesPlanned}   label="Routes Planned" color={D.gold} />
          <StatCard icon="✨" value={PLANS[plan]?.statesLimit >= 50 ? 'All 50' : `${PLANS[plan]?.statesLimit || 3}`} label="States Available" color="#22c55e" />
        </div>

        {/* Saved places preview */}
        {saved.length > 0 && (
          <div style={{ marginBottom:36 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <h2 style={{ fontFamily:D.serif, fontSize:20, fontWeight:700, color:D.white }}>❤️ Saved Places</h2>
              <button onClick={() => navigate('/app')} style={{ background:'none', border:'none', color:D.teal, cursor:'pointer', fontSize:13, fontFamily:D.font }}>View all →</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
              {saved.slice(0, 6).map((place, i) => (
                <div key={i} style={{ background:D.glass, border:`1px solid ${D.border}`, borderRadius:14, padding:'14px 16px', backdropFilter:'blur(10px)', cursor:'pointer', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,210,255,0.4)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=D.border; e.currentTarget.style.transform='translateY(0)'; }}>
                  <div style={{ fontSize:18, marginBottom:6 }}>📍</div>
                  <div style={{ fontWeight:700, fontSize:13, color:D.white, marginBottom:3, lineHeight:1.3 }}>{place.name}</div>
                  <div style={{ fontSize:11, color:D.muted }}>{place.category}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan info + manage */}
        <div style={{ background: plan === 'pro' ? 'linear-gradient(135deg,rgba(255,179,71,0.08),rgba(230,126,34,0.05))' : plan === 'explorer' ? 'linear-gradient(135deg,rgba(0,210,255,0.08),rgba(58,123,213,0.05))' : D.glass, border:`1px solid ${plan === 'pro' ? D.gold+'44' : plan === 'explorer' ? D.teal+'44' : D.border}`, borderRadius:20, padding:'28px 32px', backdropFilter:'blur(12px)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:planColor, letterSpacing:1, marginBottom:6 }}>CURRENT PLAN</div>
              <h3 style={{ fontFamily:D.serif, fontSize:22, color:D.white, margin:'0 0 4px' }}>
                {plan === 'free' ? 'Free Plan' : plan === 'explorer' ? 'Explorer — $4.99/mo' : 'Pro Traveler — $12.99/mo'}
              </h3>
              <p style={{ color:D.muted, fontSize:13, margin:0 }}>
                {plan === 'free' ? '3 states · 5 places per state · No route planning' :
                 plan === 'explorer' ? '50 states · 25 places/state · 3 routes/day · 20 saved places' :
                 '50 states · Unlimited everything · All Pro features'}
              </p>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {plan !== 'free' && (
                <button onClick={() => { /* Stripe customer portal */ }}
                  style={{ padding:'10px 20px', borderRadius:10, border:`1px solid ${D.border}`, background:'rgba(255,255,255,0.07)', color:D.white, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:D.font }}>
                  Manage Billing
                </button>
              )}
              {plan !== 'pro' && (
                <button onClick={() => navigate('/choose-plan')}
                  style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#00D2FF,#3A7BD5)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:D.font }}>
                  {plan === 'free' ? 'Upgrade to Explorer →' : 'Upgrade to Pro →'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
