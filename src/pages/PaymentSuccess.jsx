import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const D = {
  navy:'#0A0F1E', teal:'#00D2FF', gold:'#FFB347',
  white:'#FFFFFF', muted:'#6B7A9A', border:'rgba(255,255,255,0.12)',
  font:"'Inter',system-ui,sans-serif", serif:"'Playfair Display',Georgia,serif",
};

const PLAN_META = {
  explorer: {
    label: 'Explorer',
    article: 'an',
    color: D.teal,
    glow: 'rgba(0,210,255,0.25)',
    message: 'All 50 states are now unlocked. Time to discover hidden gems waiting across America. ✈️',
  },
  pro: {
    label: 'Pro Traveler',
    article: 'a',
    color: D.gold,
    glow: 'rgba(255,179,71,0.25)',
    message: 'Unlimited states, unlimited routes, unlimited adventures. The whole of hidden America is yours. 🌎',
  },
  free: {
    label: 'Explorer',
    article: 'an',
    color: D.teal,
    glow: 'rgba(0,210,255,0.25)',
    message: 'Your account is ready. Start exploring hidden America today!',
  },
};

// Animated SVG checkmark
function AnimatedCheck({ color }) {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ display:'block' }}>
      <circle cx="28" cy="28" r="26" stroke={color} strokeWidth="2.5" fill={`${color}15`} />
      <path
        d="M16 28.5 L23.5 36 L40 20"
        stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: 40,
          strokeDashoffset: 0,
          animation: 'drawCheck 0.5s 0.3s cubic-bezier(0.4,0,0.2,1) both',
        }}
      />
    </svg>
  );
}

// Floating confetti pieces
const CONFETTI_COLORS = [D.teal, D.gold, '#22c55e', '#a855f7', '#ef4444', '#3b82f6'];

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUserPlan } = useAuth();

  const planId    = searchParams.get('plan') || 'explorer';
  const sessionId = searchParams.get('session_id');
  const meta      = PLAN_META[planId] || PLAN_META.explorer;

  const [planUpdated, setPlanUpdated] = useState(false);
  const [countdown, setCountdown]     = useState(8);

  // Update Firestore plan as soon as we land here (Stripe confirmed payment)
  useEffect(() => {
    if (!user || planUpdated) return;
    updateUserPlan(planId)
      .then(() => setPlanUpdated(true))
      .catch(console.error);
  }, [user, planId, planUpdated]);

  // Countdown + auto-redirect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); navigate('/app'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Stable confetti positions (computed once)
  const confetti = Array.from({ length: 24 }, (_, i) => ({
    left:   `${(i / 24) * 100}%`,
    size:   6 + (i % 5) * 4,
    round:  i % 3 === 0,
    color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    dur:    7 + (i % 6) * 1.5,
    delay:  i * 0.18,
  }));

  return (
    <div style={{
      height:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:D.navy, fontFamily:D.font, color:D.white,
      textAlign:'center', padding:'0 24px', position:'relative', overflow:'hidden',
    }}>
      <style>{`
        @keyframes drawCheck {
          from { stroke-dashoffset: 40; }
          to   { stroke-dashoffset: 0;  }
        }
        @keyframes successPop {
          0%   { opacity:0; transform:scale(0.7);  }
          60%  { opacity:1; transform:scale(1.08); }
          100% { opacity:1; transform:scale(1);    }
        }
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes countdownShrink {
          from { width:100%; }
          to   { width:0%;   }
        }
      `}</style>

      {/* Confetti */}
      {confetti.map((c, i) => (
        <div key={i} style={{
          position:'absolute', left:c.left, bottom:'-10%',
          width:c.size, height:c.size,
          borderRadius: c.round ? '50%' : 3,
          background: c.color,
          opacity: 0.65,
          animation: `floatUp ${c.dur}s ${c.delay}s infinite linear`,
          pointerEvents:'none',
        }} />
      ))}

      {/* Radial glow */}
      <div style={{
        position:'absolute', width:500, height:500, borderRadius:'50%',
        background:`radial-gradient(circle,${meta.glow},transparent 70%)`,
        pointerEvents:'none',
      }} />

      {/* Card */}
      <div style={{
        position:'relative', zIndex:5, maxWidth:520,
        background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)',
        border:'1px solid rgba(255,255,255,0.1)', borderRadius:24,
        padding:'48px 40px',
        animation:'successPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {/* Animated checkmark */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
          <div style={{
            width:96, height:96, borderRadius:'50%',
            background:`${meta.color}18`,
            border:`2px solid ${meta.color}55`,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 0 48px ${meta.glow}`,
            animation:'successPop 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            <AnimatedCheck color={meta.color} />
          </div>
        </div>

        {/* Payment confirmed badge */}
        <div style={{
          display:'inline-block', background:'rgba(34,197,94,0.14)',
          border:'1px solid rgba(34,197,94,0.4)', borderRadius:30,
          padding:'5px 18px', marginBottom:18,
          fontSize:11, fontWeight:800, color:'#22c55e', letterSpacing:1,
          animation:'fadeSlideUp 0.4s 0.4s ease both',
        }}>
          ✓ PAYMENT CONFIRMED
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily:D.serif, fontSize:38, fontWeight:900, color:D.white,
          marginBottom:14, lineHeight:1.1,
          animation:'fadeSlideUp 0.4s 0.5s ease both',
        }}>
          You're now {meta.article}{' '}
          <span style={{ color:meta.color }}>{meta.label}</span>!
        </h1>

        {/* Message */}
        <p style={{
          color:'rgba(255,255,255,0.65)', fontSize:16, lineHeight:1.75,
          marginBottom:36, maxWidth:400, margin:'0 auto 36px',
          animation:'fadeSlideUp 0.4s 0.6s ease both',
        }}>
          {meta.message}
        </p>

        {/* Session ID (subtle, for support reference) */}
        {sessionId && (
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.18)', marginBottom:24, fontFamily:'monospace', letterSpacing:0.5 }}>
            ref: {sessionId.slice(0, 24)}…
          </div>
        )}

        {/* Buttons */}
        <div style={{
          display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap',
          animation:'fadeSlideUp 0.4s 0.7s ease both',
        }}>
          <button onClick={() => navigate('/app')} style={{
            padding:'16px 36px', borderRadius:14, border:'none', cursor:'pointer',
            fontSize:15, fontWeight:700, fontFamily:D.font,
            background: meta.color === D.gold
              ? 'linear-gradient(135deg,#FFB347,#e67e22)'
              : 'linear-gradient(135deg,#00D2FF,#3A7BD5)',
            color:'#fff', minHeight:54,
            boxShadow:`0 4px 24px ${meta.glow}`,
          }}>
            Start Exploring →
          </button>
          <button onClick={() => navigate('/dashboard')} style={{
            padding:'16px 28px', borderRadius:14, border:`1px solid ${D.border}`,
            cursor:'pointer', fontSize:15, fontWeight:600, fontFamily:D.font,
            background:'rgba(255,255,255,0.07)', color:D.white,
            backdropFilter:'blur(12px)', minHeight:54,
          }}>
            Dashboard
          </button>
        </div>

        {/* Countdown bar */}
        <div style={{ marginTop:28, animation:'fadeSlideUp 0.4s 0.8s ease both' }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginBottom:8 }}>
            Redirecting in {countdown}s…
          </div>
          <div style={{ height:2, background:'rgba(255,255,255,0.08)', borderRadius:1, overflow:'hidden', maxWidth:200, margin:'0 auto' }}>
            <div style={{
              height:'100%', background:meta.color, borderRadius:1,
              animation:`countdownShrink ${countdown <= 8 ? 8 : countdown}s linear forwards`,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
