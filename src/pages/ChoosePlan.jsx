import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

const D = {
  navy:'#0A0F1E', navyLight:'#111827', teal:'#00D2FF', gold:'#FFB347',
  white:'#FFFFFF', muted:'#6B7A9A', border:'rgba(255,255,255,0.12)',
  glass:'rgba(255,255,255,0.07)', font:"'Inter',system-ui,sans-serif",
  serif:"'Playfair Display',Georgia,serif",
};

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0', period: '/month', color: D.muted,
    desc: 'Perfect for curious travelers',
    features: [
      { ok: true,  text: 'Explore 3 states' },
      { ok: true,  text: '5 places per state' },
      { ok: true,  text: 'AI discovery' },
      { ok: false, text: 'Route planning' },
      { ok: false, text: 'Save places' },
      { ok: false, text: 'All 50 states' },
    ],
    cta: 'Start Exploring Free',
    priceId: null,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    price: '$4.99', period: '/month', color: D.teal,
    badge: '⭐ Most Popular', highlight: true,
    desc: 'For the regular road tripper',
    features: [
      { ok: true, text: 'All 50 states' },
      { ok: true, text: '25 places per state' },
      { ok: true, text: 'Route planning (3/day)' },
      { ok: true, text: 'Save up to 20 places' },
      { ok: true, text: 'No watermark' },
      { ok: true, text: 'Email support' },
    ],
    cta: 'Get Explorer — $4.99/mo',
    priceId: import.meta.env.VITE_STRIPE_EXPLORER_PRICE_ID,
  },
  {
    id: 'pro',
    name: 'Pro Traveler',
    price: '$12.99', period: '/month', color: D.gold,
    desc: 'For the serious adventurer',
    features: [
      { ok: true, text: 'Everything in Explorer' },
      { ok: true, text: 'Unlimited route planning' },
      { ok: true, text: 'Save unlimited places' },
      { ok: true, text: 'Places along route' },
      { ok: true, text: 'Offline map access' },
      { ok: true, text: 'Priority AI + early access' },
    ],
    cta: 'Go Pro — $12.99/mo',
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
  },
];

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const isStripeConfigured =
  import.meta.env.VITE_STRIPE_PUBLIC_KEY &&
  !import.meta.env.VITE_STRIPE_PUBLIC_KEY.startsWith('pk_test_your');

export default function ChoosePlan() {
  const navigate = useNavigate();
  const { user, updateUserPlan, showToast } = useAuth();
  const [loading, setLoading] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelect = async (plan) => {
    setErrorMsg('');

    // Free plan — just set plan and go
    if (plan.id === 'free') {
      if (user) await updateUserPlan('free');
      navigate('/app');
      return;
    }

    // No user — send to signup first
    if (!user) {
      navigate(`/signup?plan=${plan.id}`);
      return;
    }

    setLoading(plan.id);

    // ── Demo mode (Stripe not yet configured) ──────────────────────────────
    if (!isStripeConfigured) {
      showToast('Demo mode: Stripe keys not set — granting plan directly.', 'info');
      await updateUserPlan(plan.id);
      navigate(`/payment/success?plan=${plan.id}`);
      setLoading(null);
      return;
    }

    // ── Real Stripe checkout ───────────────────────────────────────────────
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          planId:  plan.id,
          userId:  user.uid,
          email:   user.email,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('API not available locally. Run `vercel dev` instead of `npm run dev` to test payments.');
      }

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      // Redirect to Stripe-hosted checkout page
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message);
      showToast('Checkout failed: ' + err.message, 'error');
      setLoading(null);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:D.navy, fontFamily:D.font, color:D.white, padding:'0 24px 80px' }}>

      {/* Header */}
      <div style={{ textAlign:'center', padding:'80px 0 56px' }}>
        <div style={{ cursor:'pointer', marginBottom:32, display:'inline-block' }} onClick={() => navigate('/')}>
          <span style={{ fontFamily:D.serif, fontSize:22, fontWeight:900, color:D.gold }}>◈ ExploreAI</span>
        </div>
        <h1 style={{ fontFamily:D.serif, fontSize:42, fontWeight:900, color:D.white, marginBottom:14, lineHeight:1.1 }}>
          Choose Your Adventure
        </h1>
        <p style={{ color:D.muted, fontSize:17, maxWidth:480, margin:'0 auto' }}>
          {user ? `Welcome, ${user.displayName?.split(' ')[0] || 'Explorer'}! ` : ''}
          Pick the plan that matches your travel spirit.
        </p>

        {/* Demo mode notice */}
        {!isStripeConfigured && (
          <div style={{ display:'inline-block', marginTop:20, background:'rgba(255,179,71,0.12)', border:'1px solid rgba(255,179,71,0.35)', borderRadius:10, padding:'8px 18px', fontSize:13, color:D.gold }}>
            ⚠️ Demo mode — add real Stripe keys to enable live payments
          </div>
        )}

        {/* Test card info (shown when Stripe is configured) */}
        {isStripeConfigured && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginTop:20, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:10, padding:'10px 20px', fontSize:13 }}>
            <span style={{ fontSize:18 }}>💳</span>
            <span style={{ color:'rgba(255,255,255,0.6)' }}>
              Test card: <strong style={{ color:'#fff', letterSpacing:1, fontFamily:'monospace' }}>4242 4242 4242 4242</strong>
              {' '}· Exp <strong style={{ color:'#fff', fontFamily:'monospace' }}>12/29</strong>
              {' '}· CVC <strong style={{ color:'#fff', fontFamily:'monospace' }}>123</strong>
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <div style={{ maxWidth:560, margin:'0 auto 28px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:12, padding:'12px 18px', fontSize:14, color:'#ef4444', textAlign:'center' }}>
          {errorMsg}
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display:'flex', gap:24, maxWidth:1100, margin:'0 auto', flexWrap:'wrap', justifyContent:'center', alignItems:'stretch' }}>
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} loading={loading} onSelect={handleSelect} />
        ))}
      </div>

      {/* Fine print */}
      <p style={{ textAlign:'center', color:D.muted, fontSize:13, marginTop:40, maxWidth:500, margin:'40px auto 0', lineHeight:1.7 }}>
        No hidden fees. Cancel anytime. Paid plans renew monthly.
        Secured by <span style={{ color:D.white }}>Stripe</span>.{' '}
        <span style={{ color:D.teal, cursor:'pointer' }} onClick={() => navigate('/app')}>
          Skip for now →
        </span>
      </p>
    </div>
  );
}

function PlanCard({ plan, loading, onSelect }) {
  const [hov, setHov] = useState(false);
  const isLoading = loading === plan.id;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 260, maxWidth: 340,
        borderRadius: 22, padding: '36px 28px',
        position: 'relative',
        background: plan.highlight
          ? 'linear-gradient(145deg,rgba(0,210,255,0.13),rgba(58,123,213,0.1))'
          : 'rgba(255,255,255,0.06)',
        border: `1px solid ${
          plan.highlight ? '#00D2FF66' :
          hov ? 'rgba(255,255,255,0.22)' :
          'rgba(255,255,255,0.1)'}`,
        backdropFilter: 'blur(16px)',
        transform: plan.highlight || hov ? 'scale(1.03)' : 'scale(1)',
        transition: 'all 0.3s',
        boxShadow: plan.highlight
          ? '0 0 48px rgba(0,210,255,0.18)'
          : hov ? '0 12px 40px rgba(0,0,0,0.3)' : 'none',
        animation: 'fadeIn 0.5s ease',
      }}>

      {/* Badge */}
      {plan.badge && (
        <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#00D2FF,#3A7BD5)', borderRadius:20, padding:'4px 18px', fontSize:11, fontWeight:700, color:'#fff', whiteSpace:'nowrap', letterSpacing:0.5 }}>
          {plan.badge}
        </div>
      )}

      {/* Plan name + price */}
      <div style={{ fontSize:11, fontWeight:800, color:plan.color, letterSpacing:1.4, marginBottom:10, textTransform:'uppercase' }}>{plan.name}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
        <span style={{ fontFamily:D.serif, fontSize:48, fontWeight:900, color:'#fff', lineHeight:1 }}>{plan.price}</span>
        <span style={{ color:'rgba(255,255,255,0.38)', fontSize:14 }}>{plan.period}</span>
      </div>
      <p style={{ color:'rgba(255,255,255,0.48)', fontSize:13, marginBottom:28 }}>{plan.desc}</p>

      {/* Feature list */}
      <div style={{ marginBottom:30 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: f.ok ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
              color: f.ok ? '#22c55e' : 'rgba(255,255,255,0.2)',
            }}>
              {f.ok ? '✓' : '✕'}
            </span>
            <span style={{ color: f.ok ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)', fontSize:13, lineHeight:1.4 }}>
              {f.text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button
        onClick={() => onSelect(plan)}
        disabled={!!loading}
        style={{
          width:'100%', padding:'15px 0', borderRadius:13, border:'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize:14, fontWeight:700, fontFamily:D.font,
          background: plan.highlight
            ? 'linear-gradient(135deg,#00D2FF,#3A7BD5)'
            : plan.id === 'pro'
              ? 'linear-gradient(135deg,#FFB347,#e67e22)'
              : 'rgba(255,255,255,0.1)',
          color:'#fff', minHeight:52,
          boxShadow: plan.highlight ? '0 4px 24px rgba(0,210,255,0.4)' : 'none',
          transition: 'all 0.2s',
          opacity: loading && !isLoading ? 0.5 : 1,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
        {isLoading ? (
          <>
            <span style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
            Processing…
          </>
        ) : plan.cta}
      </button>

      {/* Stripe badge on paid plans */}
      {plan.id !== 'free' && (
        <div style={{ textAlign:'center', marginTop:12, fontSize:11, color:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="rgba(255,255,255,0.3)"/></svg>
          Secured by Stripe
        </div>
      )}
    </div>
  );
}
