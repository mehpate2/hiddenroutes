/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const D = {
  navy:'#0A0F1E', navyLight:'#111827',
  teal:'#00D2FF', tealDim:'rgba(0,210,255,0.18)',
  gold:'#FFB347', goldDim:'rgba(255,179,71,0.18)',
  white:'#FFFFFF', off:'#E8E4DC',
  muted:'#6B7A9A', border:'rgba(255,255,255,0.12)',
  glass:'rgba(255,255,255,0.07)', glassH:'rgba(255,255,255,0.13)',
  font:"'Inter', system-ui, sans-serif",
  serif:"'Playfair Display', Georgia, serif",
};

const HERO_IDS = [
  'photo-1506905925346-21bda4d32df4','photo-1469854523086-cc02fe5d8800',
  'photo-1501854140801-50d01698950b','photo-1476514525535-07fb3b4ae5f1',
  'photo-1682686580391-615b1f28e5ee','photo-1447752875215-b2761acb3c5d',
  'photo-1433086966358-54859d0ed716','photo-1472214103451-9374bd1c798e',
];

function heroUrl(id) { return `https://images.unsplash.com/${id}?w=1920&q=80&fit=crop`; }

function useMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return m;
}

function HeroSlideshow() {
  const [idx, setIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(1);
  const [crossfade, setCrossfade] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setNextIdx(i => (i + 1) % HERO_IDS.length);
      setCrossfade(true);
      setTimeout(() => { setIdx(i => (i + 1) % HERO_IDS.length); setCrossfade(false); }, 1500);
    }, 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <img src={heroUrl(HERO_IDS[idx])} alt="hero"
        style={{ position:'absolute', inset:0, width: '100%', height: '100%', objectFit: 'cover', opacity: crossfade ? 0 : 1, transition: 'opacity 1.5s ease', transform: 'scale(1.05)' }} />
      <img src={heroUrl(HERO_IDS[nextIdx])} alt="hero next"
        style={{ position:'absolute', inset:0, width: '100%', height: '100%', objectFit: 'cover', opacity: crossfade ? 1 : 0, transition: 'opacity 1.5s ease', transform: 'scale(1.05)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(10,15,30,0.5) 0%,rgba(10,15,30,0.7) 50%,rgba(10,15,30,0.98) 100%)' }} />
      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
        {HERO_IDS.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)}
            style={{ width: i === idx ? 28 : 8, height: 8, borderRadius: 4, background: i === idx ? D.gold : 'rgba(255,255,255,0.35)', transition: 'all 0.3s', cursor: 'pointer' }} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ name, price, annualPrice, features, badge, highlight, annual, ctaLabel, onCta, color }) {
  const [hov, setHov] = useState(false);
  const displayPrice = annual ? annualPrice : price;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 260, maxWidth: 360, borderRadius: 20, padding: '32px 28px', position: 'relative', cursor: 'default',
        background: highlight ? 'linear-gradient(145deg,rgba(0,210,255,0.12),rgba(58,123,213,0.1))' : D.glass,
        border: `1px solid ${highlight ? D.teal : hov ? 'rgba(255,255,255,0.2)' : D.border}`,
        backdropFilter: 'blur(20px)', transition: 'all 0.3s',
        transform: highlight || hov ? 'scale(1.03)' : 'scale(1)',
        boxShadow: highlight ? '0 0 40px rgba(0,210,255,0.2)' : hov ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
      }}>
      {badge && (
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#00D2FF,#3A7BD5)', borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
          {badge}
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: color || D.muted, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
        <span style={{ fontFamily: D.serif, fontSize: 48, fontWeight: 900, color: D.white, lineHeight: 1 }}>${displayPrice}</span>
        <span style={{ color: D.muted, fontSize: 14 }}>/mo</span>
      </div>
      {annual && price > 0 && (
        <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, marginBottom: 16 }}>Save 20% with annual billing</div>
      )}
      <div style={{ marginBottom: 28, marginTop: price === 0 ? 22 : 8 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <span style={{ color: f.locked ? D.muted : '#22c55e', fontSize: 14, marginTop: 1, flexShrink: 0 }}>{f.locked ? '✕' : '✓'}</span>
            <span style={{ color: f.locked ? D.muted : D.off, fontSize: 13, lineHeight: 1.4 }}>{f.text}</span>
          </div>
        ))}
      </div>
      <button onClick={onCta}
        style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: D.font, transition: 'all 0.2s',
          background: highlight ? 'linear-gradient(135deg,#00D2FF,#3A7BD5)' : 'rgba(255,255,255,0.1)',
          color: '#fff', minHeight: 48,
          boxShadow: highlight ? '0 4px 20px rgba(0,210,255,0.4)' : 'none',
        }}>
        {ctaLabel}
      </button>
    </div>
  );
}

const PLANS_CONFIG = [
  {
    name: 'Free', price: 0, annualPrice: 0, color: D.muted,
    features: [
      { text: 'Explore 3 states' },
      { text: '5 places per state' },
      { text: 'AI-powered discovery' },
      { text: 'Route planning', locked: true },
      { text: 'Save places', locked: true },
      { text: 'No watermark', locked: true },
    ],
    ctaLabel: 'Start Free',
  },
  {
    name: 'Explorer', price: 4.99, annualPrice: 3.99, badge: '⭐ Most Popular', highlight: true, color: D.teal,
    features: [
      { text: 'All 50 states' },
      { text: '25 places per state' },
      { text: 'Basic route planning (3/day)' },
      { text: 'Save up to 20 places' },
      { text: 'No watermark' },
      { text: 'Email support' },
    ],
    ctaLabel: 'Get Explorer',
  },
  {
    name: 'Pro Traveler', price: 12.99, annualPrice: 10.39, color: D.gold,
    features: [
      { text: 'Everything in Explorer' },
      { text: 'Unlimited route planning' },
      { text: 'Save unlimited places' },
      { text: 'Places along route' },
      { text: 'Offline map access' },
      { text: 'Priority AI + early access' },
    ],
    ctaLabel: 'Go Pro',
  },
];

const HOW_STEPS = [
  { icon: '🗺️', title: 'Choose Your State', desc: 'Click any of the 50 US states on the interactive grid and let AI unlock its hidden wonders.' },
  { icon: '✨', title: 'AI Discovers Places', desc: 'Our Claude AI scans thousands of data points to surface hidden gems, secret trails, and local favorites.' },
  { icon: '🧭', title: 'Navigate & Explore', desc: 'One tap opens any place in Google Maps with GPS coordinates. Your next adventure starts now.' },
];

const FEATURES = [
  { icon: '🏛️', title: '50 States Covered', desc: 'Every state, every region. From Alaska\'s wilderness to Florida\'s keys.' },
  { icon: '✨', title: 'AI-Powered Discovery', desc: 'Claude AI surfaces hidden gems that travel blogs always miss.' },
  { icon: '💎', title: 'Hidden Gems Only', desc: 'No tourist traps. Only authentic, off-the-beaten-path discoveries.' },
  { icon: '🛣️', title: 'Route Planning', desc: 'Plan road trips with AI-curated stops along your entire route.' },
  { icon: '📡', title: 'Offline Access (Pro)', desc: 'Download your favorites and explore without cell service.' },
  { icon: '🔄', title: 'New Places Weekly', desc: 'Our AI continuously discovers new hidden gems across the US.' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Road Tripper', rating: 5, avatar: 'SM', color: '#3b82f6', review: 'Discovered three places on our cross-country drive that weren\'t on any map app. ExploreAI found a waterfall in Utah that blew our minds. Worth every penny!' },
  { name: 'James K.', role: 'Weekend Explorer', rating: 5, avatar: 'JK', color: '#22c55e', review: 'As someone who does a new state every weekend, this app has become my bible. The AI recommendations are genuinely unique — not your typical TripAdvisor fare.' },
  { name: 'Maria L.', role: 'Travel Blogger', rating: 5, avatar: 'ML', color: '#a855f7', review: 'My readers ask how I always find places nobody else knows about. ExploreAI is my secret weapon. The route planning feature alone is worth the subscription.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mobile = useMobile();
  const [annual, setAnnual] = useState(false);
  const pricingRef = useRef(null);

  const scrollToPricing = () => pricingRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handlePlanCta = (planName) => {
    if (user) { navigate('/choose-plan'); return; }
    if (planName === 'Free') { navigate('/signup'); } else { navigate(`/signup?plan=${planName.toLowerCase()}`); }
  };

  const startFree = () => user ? navigate('/app') : navigate('/signup');

  return (
    <div style={{ fontFamily: D.font, background: D.navy, color: D.white, overflowX: 'hidden' }}>
      {/* ── Navbar ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900, backdropFilter: 'blur(16px)', background: 'rgba(10,15,30,0.8)', borderBottom: `1px solid ${D.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', height: 64 }}>
        <div style={{ fontFamily: D.serif, fontSize: 22, fontWeight: 900, color: D.gold, cursor: 'pointer' }} onClick={() => navigate('/')}>◈ ExploreAI</div>
        <div style={{ flex: 1 }} />
        {!mobile && (
          <div style={{ display: 'flex', gap: 8, marginRight: 16 }}>
            {['About', 'Pricing', 'Contact'].map(l => (
              <button key={l} onClick={l === 'Pricing' ? scrollToPricing : undefined}
                style={{ background: 'none', border: 'none', color: D.off, fontSize: 14, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, fontFamily: D.font, transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = D.white} onMouseLeave={e => e.target.style.color = D.off}>
                {l}
              </button>
            ))}
          </div>
        )}
        {user ? (
          <button onClick={() => navigate('/app')} style={{ background: 'linear-gradient(135deg,#00D2FF,#3A7BD5)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: D.font, minHeight: 44, transition: 'transform 0.2s' }} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>Open App</button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 10, padding: '10px 20px', color: D.white, fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: D.font, minHeight: 44, transition: 'transform 0.2s' }} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>Login</button>
            <button onClick={() => navigate('/signup')} style={{ background: 'linear-gradient(135deg,#00D2FF,#3A7BD5)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: D.font, minHeight: 44, transition: 'transform 0.2s' }} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>Get Started</button>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <HeroSlideshow />
        <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', padding: mobile ? '100px 24px 60px' : '100px 40px 60px', maxWidth: 900, margin: '0 auto', animation: 'fadeIn 0.8s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: D.tealDim, border: `1px solid ${D.teal}44`, borderRadius: 30, padding: '6px 18px', marginBottom: 28, backdropFilter: 'blur(10px)' }}>
            <span style={{ width: 8, height: 8, background: D.teal, borderRadius: '50%', animation: 'pulse-dot 1.5s infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: D.teal, letterSpacing: 1 }}>AI POWERED · 50 STATES · 2,500+ HIDDEN GEMS</span>
          </div>
          <h1 style={{ fontSize: mobile ? 40 : 76, fontWeight: 900, fontFamily: D.serif, color: D.white, lineHeight: 1.05, marginBottom: 20, letterSpacing: -1 }}>
            Discover Hidden America<br />
            <span style={{ background: 'linear-gradient(90deg,#00D2FF,#FFB347)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Like Never Before
            </span>
          </h1>
          <p style={{ fontSize: mobile ? 16 : 20, color: 'rgba(255,255,255,0.72)', marginBottom: 40, lineHeight: 1.65, fontWeight: 300, maxWidth: 640, margin: '0 auto 40px' }}>
            AI-powered travel discovery across all 50 states. Uncover secret trails, hidden restaurants, forgotten history, and breathtaking landscapes the guidebooks missed.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={startFree}
              style={{ padding: '16px 36px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700, fontFamily: D.font, background: 'linear-gradient(135deg,#00D2FF,#3A7BD5)', color: '#fff', boxShadow: '0 0 30px rgba(0,210,255,0.5)', transition: 'all 0.25s', minHeight: 56 }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.04)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
              Start Free →
            </button>
            <button onClick={scrollToPricing}
              style={{ padding: '16px 36px', borderRadius: 14, border: `1px solid ${D.border}`, cursor: 'pointer', fontSize: 16, fontWeight: 600, fontFamily: D.font, background: 'rgba(255,255,255,0.08)', color: D.white, backdropFilter: 'blur(12px)', transition: 'all 0.25s', minHeight: 56 }}
              onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.14)'; e.target.style.transform = 'scale(1.04)'; }} onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.transform = 'scale(1)'; }}>
              View Plans
            </button>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 5, textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8, letterSpacing: 1 }}>SCROLL TO EXPLORE</div>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom,rgba(255,255,255,0.4),transparent)', margin: '0 auto', animation: 'pulse-dot 2s infinite' }} />
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section style={{ background: D.navyLight, borderTop: `1px solid ${D.border}`, padding: '48px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 32, textAlign: 'center' }}>
          {[{ n: '50', label: 'States Covered', icon: '🏛️' }, { n: '2,500+', label: 'Hidden Places', icon: '📍' }, { n: '∞', label: 'Routes Possible', icon: '🛣️' }, { n: 'AI', label: 'Powered Discovery', icon: '✨' }].map(s => (
            <div key={s.n} style={{ padding: 24, background: D.glass, border: `1px solid ${D.border}`, borderRadius: 16, backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: mobile ? 32 : 42, fontWeight: 900, fontFamily: D.serif, color: D.teal, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: mobile ? '72px 24px' : '96px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: D.teal, letterSpacing: 2, marginBottom: 12 }}>HOW IT WORKS</div>
          <h2 style={{ fontFamily: D.serif, fontSize: mobile ? 32 : 48, fontWeight: 900, color: D.white, marginBottom: 16 }}>Three Steps to Discovery</h2>
          <p style={{ color: D.muted, fontSize: 17, maxWidth: 520, margin: '0 auto' }}>From zero to hidden gem in under 10 seconds</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3,1fr)', gap: 40 }}>
          {HOW_STEPS.map((step, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '40px 32px', background: D.glass, border: `1px solid ${D.border}`, borderRadius: 20, backdropFilter: 'blur(12px)', position: 'relative', animation: `fadeIn 0.6s ${i * 0.15}s ease both` }}>
              <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00D2FF,#3A7BD5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>{i + 1}</div>
              <div style={{ fontSize: 52, marginBottom: 20 }}>{step.icon}</div>
              <h3 style={{ fontFamily: D.serif, fontSize: 22, fontWeight: 700, color: D.white, marginBottom: 12 }}>{step.title}</h3>
              <p style={{ color: D.muted, fontSize: 14, lineHeight: 1.7 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: mobile ? '72px 24px' : '96px 40px', background: D.navyLight, borderTop: `1px solid ${D.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: D.gold, letterSpacing: 2, marginBottom: 12 }}>FEATURES</div>
            <h2 style={{ fontFamily: D.serif, fontSize: mobile ? 32 : 48, fontWeight: 900, color: D.white, marginBottom: 16 }}>Everything You Need to Explore</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ padding: '28px 24px', background: D.glass, border: `1px solid ${D.border}`, borderRadius: 16, backdropFilter: 'blur(10px)', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,210,255,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: D.serif, fontSize: 18, fontWeight: 700, color: D.white, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: D.muted, fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section ref={pricingRef} style={{ padding: mobile ? '72px 24px' : '96px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: D.teal, letterSpacing: 2, marginBottom: 12 }}>PRICING</div>
          <h2 style={{ fontFamily: D.serif, fontSize: mobile ? 32 : 48, fontWeight: 900, color: D.white, marginBottom: 16 }}>Simple, Honest Pricing</h2>
          <p style={{ color: D.muted, fontSize: 17, marginBottom: 32 }}>No hidden fees. Cancel anytime.</p>
          {/* Annual toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: D.glass, border: `1px solid ${D.border}`, borderRadius: 30, padding: '6px 20px', backdropFilter: 'blur(12px)' }}>
            <span style={{ color: !annual ? D.white : D.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' }} onClick={() => setAnnual(false)}>Monthly</span>
            <div onClick={() => setAnnual(a => !a)} style={{ width: 44, height: 24, borderRadius: 12, background: annual ? D.teal : 'rgba(255,255,255,0.15)', cursor: 'pointer', transition: 'background 0.2s', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 2, left: annual ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
            <span style={{ color: annual ? D.white : D.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' }} onClick={() => setAnnual(true)}>Annual <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 700 }}>Save 20%</span></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: mobile ? 'wrap' : 'nowrap', justifyContent: 'center', alignItems: 'stretch', paddingTop: 16 }}>
          {PLANS_CONFIG.map((plan) => (
            <PlanCard key={plan.name} {...plan} annual={annual} onCta={() => handlePlanCta(plan.name)} />
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: mobile ? '72px 24px' : '96px 40px', background: D.navyLight, borderTop: `1px solid ${D.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: D.gold, letterSpacing: 2, marginBottom: 12 }}>TESTIMONIALS</div>
            <h2 style={{ fontFamily: D.serif, fontSize: mobile ? 32 : 48, fontWeight: 900, color: D.white }}>Loved by Explorers</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3,1fr)', gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ padding: '28px 24px', background: D.glass, border: `1px solid ${D.border}`, borderRadius: 20, backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[...Array(t.rating)].map((_, j) => <span key={j} style={{ color: D.gold, fontSize: 16 }}>★</span>)}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>"{t.review}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${t.color}33`, border: `2px solid ${t.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: t.color }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: D.white, fontSize: 14 }}>{t.name}</div>
                    <div style={{ color: D.muted, fontSize: 12 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding: mobile ? '72px 24px' : '96px 40px', textAlign: 'center', background: 'linear-gradient(135deg,rgba(0,210,255,0.08),rgba(58,123,213,0.08))', borderTop: `1px solid ${D.border}` }}>
        <h2 style={{ fontFamily: D.serif, fontSize: mobile ? 32 : 52, fontWeight: 900, color: D.white, marginBottom: 16 }}>Ready to Explore Hidden America?</h2>
        <p style={{ color: D.muted, fontSize: 18, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>Join thousands of travelers discovering places you won't find anywhere else.</p>
        <button onClick={startFree}
          style={{ padding: '18px 48px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 17, fontWeight: 700, fontFamily: D.font, background: 'linear-gradient(135deg,#00D2FF,#3A7BD5)', color: '#fff', boxShadow: '0 0 40px rgba(0,210,255,0.4)', minHeight: 60 }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.04)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
          Start Free Today →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#070C1A', borderTop: `1px solid ${D.border}`, padding: mobile ? '48px 24px 32px' : '64px 40px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ fontFamily: D.serif, fontSize: 24, fontWeight: 900, color: D.gold, marginBottom: 12 }}>◈ ExploreAI</div>
              <p style={{ color: D.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>AI-powered travel discovery across all 50 US states. Find hidden gems the guidebooks missed.</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                {['🐦', '📸', '▶️'].map((icon, i) => (
                  <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: D.glass, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = D.teal} onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            {[
              { title: 'Product', links: ['About', 'Pricing', 'Features', 'Changelog'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
              { title: 'Support', links: ['Contact', 'Help Center', 'Community', 'Status'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: 1.5, marginBottom: 16 }}>{col.title.toUpperCase()}</div>
                {col.links.map(l => (
                  <div key={l} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 10, cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = D.white} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ color: D.muted, fontSize: 13 }}>© 2026 ExploreAI. All rights reserved.</div>
            <div style={{ color: D.muted, fontSize: 13 }}>Made with ❤️ for curious travelers</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
