import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReferralCode, getReferralStats, getLeaderboard } from '../utils/referral';

const D = {
  navy:'#0A0F1E', white:'#FFFFFF', muted:'#6B7A9A',
  gold:'#c9a84c', border:'rgba(255,255,255,0.12)',
  font:"system-ui,'Inter',sans-serif", serif:"Georgia,serif",
};

function StatBox({ icon, value, label }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${D.border}`,
      borderRadius:14, padding:'18px 14px', textAlign:'center' }}>
      <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:24, fontWeight:800, color:'#e8e4dc', fontFamily:D.serif }}>{value}</div>
      <div style={{ fontSize:12, color:D.muted, marginTop:4 }}>{label}</div>
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:16 }}>
      <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(201,168,76,0.15)',
        border:'1px solid rgba(201,168,76,0.4)', display:'flex', alignItems:'center',
        justifyContent:'center', flexShrink:0, fontSize:14, fontWeight:700, color:D.gold }}>
        {num}
      </div>
      <div>
        <div style={{ fontSize:14, fontWeight:600, color:'#e8e4dc', marginBottom:2 }}>{title}</div>
        <div style={{ fontSize:13, color:D.muted, lineHeight:1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function Referral() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code,        setCode]        = useState('');
  const [stats,       setStats]       = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied,      setCopied]      = useState(false);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.all([
      getReferralCode(user.uid),
      getReferralStats(user.uid),
      getLeaderboard(),
    ]).then(([c, s, lb]) => {
      setCode(c);
      setStats(s);
      setLeaderboard(lb);
      setLoading(false);
    });
  }, [user]);

  const referralLink = `${window.location.origin}/signup?ref=${code}`;
  const shareText    = `I use HiddenRoutes to find secret hidden places across the US 🗺️ Join me and get 1 month free! ${referralLink}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:D.navy, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid rgba(201,168,76,0.3)',
        borderTopColor:D.gold, animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:D.navy, fontFamily:D.font, color:D.white, paddingBottom:60 }}>
      {/* Nav */}
      <nav style={{ padding:'0 24px', height:60, display:'flex', alignItems:'center', gap:12,
        borderBottom:`1px solid ${D.border}`, backdropFilter:'blur(16px)',
        background:'rgba(10,15,30,0.85)', position:'sticky', top:0, zIndex:100 }}>
        <span style={{ fontFamily:D.serif, fontSize:20, fontWeight:900, color:D.gold,
          cursor:'pointer' }} onClick={() => navigate('/')}>◈ ExploreAI</span>
        <div style={{ flex:1 }} />
        <button onClick={() => navigate(-1)} style={{ background:'none', border:`1px solid ${D.border}`,
          borderRadius:8, padding:'7px 14px', color:D.white, cursor:'pointer', fontSize:13, fontFamily:D.font }}>
          ← Back
        </button>
      </nav>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'40px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:56, marginBottom:12 }}>🎁</div>
          <h1 style={{ fontFamily:D.serif, fontSize:32, fontWeight:900, color:D.white, marginBottom:8 }}>
            Invite Friends, Explore Free
          </h1>
          <p style={{ color:D.muted, fontSize:15, lineHeight:1.6 }}>
            Share your link — you both get <strong style={{ color:D.gold }}>1 month Explorer free</strong>.
            No limit — invite 12 friends = 1 year free!
          </p>
        </div>

        {/* Referral link box */}
        <div style={{ background:'rgba(201,168,76,0.06)', border:`1px solid ${D.gold}44`,
          borderRadius:16, padding:'20px 24px', marginBottom:24 }}>
          <div style={{ fontSize:12, color:D.gold, fontWeight:700, textTransform:'uppercase',
            letterSpacing:'0.08em', marginBottom:10 }}>Your Referral Link</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ flex:1, background:'rgba(255,255,255,0.06)', border:`1px solid ${D.border}`,
              borderRadius:8, padding:'10px 14px', fontSize:13, color:'rgba(255,255,255,0.7)',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {referralLink}
            </div>
            <button onClick={handleCopy} style={{
              padding:'10px 16px', borderRadius:8, border:'none', flexShrink:0,
              background: copied ? '#1D9E75' : D.gold, color: copied ? 'white' : '#1a1200',
              fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:D.font, transition:'all 0.2s' }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{ fontSize:12, color:D.muted, marginTop:8 }}>
            Referral code: <strong style={{ color:D.gold }}>{code}</strong>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
            <StatBox icon="👥" value={stats.referralCount || 0}         label="Friends Invited" />
            <StatBox icon="✅" value={stats.successfulReferrals || 0}   label="Joined"          />
            <StatBox icon="📅" value={stats.successfulReferrals || 0}   label="Months Earned"   />
            <StatBox icon="⭐" value={(stats.referralCount || 0) * 100}  label="Points Earned"   />
          </div>
        )}

        {/* How it works */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${D.border}`,
          borderRadius:16, padding:'24px', marginBottom:24 }}>
          <div style={{ fontFamily:D.serif, fontSize:17, fontWeight:700, color:D.white, marginBottom:16 }}>
            How It Works
          </div>
          <Step num="1" title="Share your unique link"
            desc="Copy your personal link above or share via WhatsApp, Twitter, or email" />
          <Step num="2" title="Friend signs up with your link"
            desc="They click your link and create their HiddenRoutes account" />
          <Step num="3" title="You both get 1 month Explorer free!"
            desc="Both accounts are upgraded instantly — no credit card needed" />
          <div style={{ background:'rgba(201,168,76,0.08)', border:`1px solid ${D.gold}33`,
            borderRadius:10, padding:'12px 16px', marginTop:4 }}>
            <div style={{ fontSize:13, color:D.gold, fontWeight:600 }}>
              🎯 No limit — invite 12 friends and get a full year free!
            </div>
          </div>
        </div>

        {/* Share buttons */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, color:D.muted, textTransform:'uppercase',
            letterSpacing:'0.08em', fontWeight:600, marginBottom:12 }}>Share via</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'12px', borderRadius:10, background:'#128C7E', color:'white',
                textDecoration:'none', fontSize:13, fontWeight:600 }}>
              💬 WhatsApp
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'12px', borderRadius:10, background:'#000',
                border:'1px solid #333', color:'white',
                textDecoration:'none', fontSize:13, fontWeight:600 }}>
              𝕏 Twitter / X
            </a>
            <a href={`mailto:?subject=${encodeURIComponent('Join me on HiddenRoutes — get 1 month free!')}&body=${encodeURIComponent(shareText)}`}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'12px', borderRadius:10, background:'rgba(255,255,255,0.06)',
                border:`1px solid ${D.border}`, color:D.white,
                textDecoration:'none', fontSize:13, fontWeight:600 }}>
              ✉️ Email
            </a>
            <button onClick={handleCopy}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'12px', borderRadius:10, background:'rgba(255,255,255,0.06)',
                border:`1px solid ${D.border}`, color: copied ? '#4ade80' : D.white,
                fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:D.font }}>
              🔗 {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${D.border}`,
            borderRadius:16, padding:'24px' }}>
            <div style={{ fontFamily:D.serif, fontSize:17, fontWeight:700, color:D.white, marginBottom:14 }}>
              🏆 Top Referrers This Month
            </div>
            {leaderboard.slice(0, 5).map((entry, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12,
                padding:'10px 0', borderBottom:`1px solid ${D.border}` }}>
                <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                  background: i === 0 ? 'rgba(255,215,0,0.2)' : i === 1 ? 'rgba(192,192,192,0.2)' : 'rgba(205,127,50,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14, fontWeight:700, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32' }}>
                  {i + 1}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:D.white, fontWeight:600 }}>
                    {entry.fromUser || `Explorer #${i + 1}`}
                  </div>
                </div>
                <div style={{ fontSize:13, color:D.gold, fontWeight:700 }}>
                  {entry.referralCount} referrals
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
