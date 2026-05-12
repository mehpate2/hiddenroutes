import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const D = {
  navy:'#0A0F1E', teal:'#00D2FF', tealDim:'rgba(0,210,255,0.18)',
  gold:'#FFB347', white:'#FFFFFF', off:'#E8E4DC',
  muted:'#6B7A9A', border:'rgba(255,255,255,0.12)',
  glass:'rgba(255,255,255,0.07)', glassH:'rgba(255,255,255,0.13)',
  font:"'Inter',system-ui,sans-serif", serif:"'Playfair Display',Georgia,serif",
};

const PLAN_COLORS = { free:'rgba(107,122,154,0.25)', explorer:'rgba(0,210,255,0.2)', pro:'rgba(255,179,71,0.2)' };
const PLAN_TEXT   = { free:D.muted, explorer:D.teal, pro:D.gold };
const PLAN_LABEL  = { free:'FREE', explorer:'EXPLORER', pro:'PRO' };

function Avatar({ user, size = 32 }) {
  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (user?.photoURL) {
    return <img src={user.photoURL} alt="avatar" style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', border:`2px solid ${D.teal}44` }} />;
  }
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'linear-gradient(135deg,#00D2FF,#3A7BD5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.35, fontWeight:700, color:'#fff' }}>
      {initials}
    </div>
  );
}

function useMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return m;
}

export default function NavBarAuth({ view, onNav, savedCount }) {
  const navigate = useNavigate();
  const { user, plan, logout } = useAuth();
  const mobile = useMobile();
  const [menu, setMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { label:'Explore',   icon:'🗺️',  view:'states' },
    { label:'Plan Route',icon:'🛣️',  view:'route' },
    { label:'Saved',     icon:'❤️',  view:'saved',  badge:savedCount },
    { label:'Near Me',   icon:'📍',  view:'nearme' },
    { label:'Discover',  icon:'🌟',  view:'discover' },
  ];

  const ns = { position:'fixed', top:0, left:0, right:0, zIndex:900, backdropFilter:'blur(16px)', background:'rgba(10,15,30,0.88)', borderBottom:`1px solid ${D.border}`, fontFamily:D.font };
  const ls = (active) => ({ color:active?D.teal:D.off, background:active?D.tealDim:'transparent', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:D.font, padding:'8px 14px', borderRadius:8, display:'flex', alignItems:'center', gap:5, transition:'all 0.2s', minHeight:44 });

  if (mobile) return (
    <nav style={{ ...ns, padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ fontSize:19, fontWeight:900, fontFamily:D.serif, color:D.gold, cursor:'pointer' }} onClick={() => navigate('/')}>◈ ExploreAI</div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {user && <Avatar user={user} />}
        <button onClick={() => setMenu(m => !m)} style={{ background:'none', border:'none', color:D.white, fontSize:22, cursor:'pointer', padding:6 }}>{menu ? '✕' : '☰'}</button>
      </div>
      {menu && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:D.navy, padding:'8px 12px', display:'flex', flexDirection:'column', gap:2, borderBottom:`1px solid rgba(255,255,255,0.1)` }}>
          {navLinks.map(l => (
            <button key={l.view} onClick={() => { onNav(l.view); setMenu(false); }} style={ls(view === l.view)}>
              {l.icon} {l.label} {l.badge ? <span style={{ background:D.gold, color:'#000', borderRadius:10, padding:'1px 6px', fontSize:10 }}>{l.badge}</span> : null}
            </button>
          ))}
          <div style={{ height:1, background:D.border, margin:'4px 0' }} />
          {user ? (
            <>
              <button onClick={() => { navigate('/dashboard'); setMenu(false); }} style={ls(false)}>📊 Dashboard</button>
              <button onClick={() => { navigate('/community'); setMenu(false); }} style={ls(false)}>🗺️ Community</button>
              <button onClick={() => { navigate('/discover');  setMenu(false); }} style={ls(false)}>🔍 Discover</button>
              <button onClick={() => { navigate('/submit');    setMenu(false); }} style={ls(false)}>📍 Submit Place</button>
              <button onClick={() => { navigate('/profile');   setMenu(false); }} style={ls(false)}>🌟 My Profile</button>
              <button onClick={() => { navigate('/settings');  setMenu(false); }} style={ls(false)}>⚙️ Settings</button>
              <button onClick={async () => { await logout(); navigate('/'); setMenu(false); }} style={ls(false)}>🚪 Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => { navigate('/login');  setMenu(false); }} style={ls(false)}>🔑 Login</button>
              <button onClick={() => { navigate('/signup'); setMenu(false); }} style={ls(false)}>✨ Get Started</button>
            </>
          )}
        </div>
      )}
    </nav>
  );

  return (
    <nav style={{ ...ns, padding:'0 28px', display:'flex', alignItems:'center', height:60, gap:4 }}>
      <div style={{ fontSize:19, fontWeight:900, fontFamily:D.serif, color:D.gold, cursor:'pointer', marginRight:8 }} onClick={() => navigate('/')}>◈ ExploreAI</div>

      {navLinks.map(l => (
        <button key={l.view} onClick={() => onNav(l.view)} style={ls(view === l.view)}>
          {l.icon} {l.label}
          {l.badge ? <span style={{ background:D.gold, color:'#000', borderRadius:10, padding:'1px 6px', fontSize:10, marginLeft:2 }}>{l.badge}</span> : null}
        </button>
      ))}

      <div style={{ flex:1 }} />

      {/* Community nav buttons */}
      <button onClick={() => navigate('/community')} style={{ ...ls(false), color: D.gold }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = D.gold}>
        🗺️ Community
      </button>
      <button onClick={() => navigate('/submit')} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#C9A84C,#e8960a)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:D.font, minHeight:44 }}>
        + Submit
      </button>

      {user && <NotificationBell />}

      {user ? (
        <div ref={userMenuRef} style={{ position:'relative' }}>
          {/* User button */}
          <button onClick={() => setUserMenu(v => !v)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 10px 5px 5px', borderRadius:22, border:`1px solid ${D.border}`, background: userMenu ? D.glassH : D.glass, cursor:'pointer', transition:'all 0.2s', backdropFilter:'blur(12px)' }}>
            <Avatar user={user} />
            <span style={{ fontSize:13, fontWeight:600, color:D.white, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user.displayName?.split(' ')[0] || 'Explorer'}
            </span>
            <span style={{ fontSize:10, fontWeight:700, color:PLAN_TEXT[plan]||D.muted, background:PLAN_COLORS[plan]||'rgba(107,122,154,0.2)', padding:'2px 7px', borderRadius:10 }}>
              {PLAN_LABEL[plan] || 'FREE'}
            </span>
            <span style={{ fontSize:10, color:D.muted }}>▾</span>
          </button>

          {/* Dropdown */}
          {userMenu && (
            <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, width:200, background:'#111827', border:`1px solid ${D.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,0.5)', animation:'fadeIn 0.15s ease', zIndex:999 }}>
              <div style={{ padding:'12px 16px', borderBottom:`1px solid rgba(255,255,255,0.07)` }}>
                <div style={{ fontSize:13, fontWeight:700, color:D.white, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.displayName || 'Explorer'}</div>
                <div style={{ fontSize:11, color:D.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
              </div>
              {[
                { icon:'📊', label:'Dashboard',       action: () => navigate('/dashboard') },
                { icon:'❤️', label:'Saved Places',    action: () => onNav('saved') },
                { icon:'🛣️', label:'My Routes',       action: () => onNav('route') },
                { icon:'🌟', label:'My Profile',       action: () => navigate('/profile') },
                { icon:'🗺️', label:'Community',        action: () => navigate('/community') },
                { icon:'🔍', label:'Discover Feed',   action: () => navigate('/discover') },
                { icon:'⚙️', label:'Settings',        action: () => navigate('/settings') },
                { icon:'🔴', label:'Reddit Import',   action: () => navigate('/admin/import') },
              ].map(item => (
                <button key={item.label} onClick={() => { item.action(); setUserMenu(false); }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:'none', border:'none', cursor:'pointer', color:D.off, fontSize:13, fontFamily:D.font, textAlign:'left', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
              <div style={{ borderTop:`1px solid rgba(255,255,255,0.07)` }}>
                <button onClick={async () => { await logout(); navigate('/'); setUserMenu(false); }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:'none', border:'none', cursor:'pointer', color:'rgba(239,68,68,0.8)', fontSize:13, fontFamily:D.font, textAlign:'left', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate('/login')}
            style={{ background:'none', border:`1px solid ${D.border}`, borderRadius:9, padding:'8px 16px', color:D.white, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:D.font }}>
            Login
          </button>
          <button onClick={() => navigate('/signup')}
            style={{ background:'linear-gradient(135deg,#00D2FF,#3A7BD5)', border:'none', borderRadius:9, padding:'8px 18px', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:D.font, boxShadow:'0 2px 12px rgba(0,210,255,0.3)' }}>
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
}
