/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const D = {
  navy:'#0A0F1E', teal:'#00D2FF', gold:'#FFB347',
  white:'#FFFFFF', muted:'#6B7A9A', border:'rgba(255,255,255,0.12)',
  font:"'Inter',system-ui,sans-serif", serif:"'Playfair Display',Georgia,serif",
};

const BG_URL = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80&fit=crop';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function InlineError({ msg }) {
  if (!msg) return null;
  return <div style={{ marginTop:5, fontSize:12, color:'#ef4444', display:'flex', alignItems:'center', gap:4 }}>⚠️ {msg}</div>;
}

function Field({ label, type, value, onChange, placeholder, error, onBlur }) {
  const [focused, setFocused] = useState(false);
  const hasErr = !!error;
  return (
    <div style={{ marginBottom: hasErr ? 6 : 14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:0.8, marginBottom:6 }}>{label.toUpperCase()}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        style={{ width:'100%', padding:'13px 16px', borderRadius:11, border:`1px solid ${hasErr?'rgba(239,68,68,0.6)':focused?'#00D2FF66':D.border}`, background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:14, outline:'none', fontFamily:D.font, transition:'border-color 0.2s', backdropFilter:'blur(8px)', minHeight:48, boxSizing:'border-box' }}
      />
      <InlineError msg={error} />
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, mismatch, error, onBlur }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const hasErr = mismatch || !!error;
  return (
    <div style={{ marginBottom: hasErr ? 6 : 14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:0.8, marginBottom:6 }}>{label.toUpperCase()}</label>
      <div style={{ position:'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          style={{ width:'100%', padding:'13px 48px 13px 16px', borderRadius:11, border:`1px solid ${hasErr?'rgba(239,68,68,0.6)':focused?'#00D2FF66':D.border}`, background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:14, outline:'none', fontFamily:D.font, transition:'border-color 0.2s', backdropFilter:'blur(8px)', minHeight:48, boxSizing:'border-box' }}
        />
        <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1} title={show?'Hide password':'Show password'}
          style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color: show?D.teal:'rgba(255,255,255,0.35)', padding:4, display:'flex', alignItems:'center', justifyContent:'center', transition:'color 0.2s' }}>
          {show ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>
      {mismatch && <InlineError msg="Passwords do not match" />}
      {!mismatch && error && <InlineError msg={error} />}
    </div>
  );
}

function Spinner() {
  return <span style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin 0.7s linear infinite', display:'inline-block' }} />;
}

function Divider() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'18px 0' }}>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.1)' }} />
      <span style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>or continue with</span>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.1)' }} />
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use':    'An account with this email already exists.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/network-request-failed':  'Network error. Check your connection.',
    'auth/popup-closed-by-user':    'Google sign-up was cancelled.',
    'auth/operation-not-allowed':   'Email/Password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
    'auth/too-many-requests':       'Too many attempts. Try again later.',
    'auth/internal-error':          'Authentication error. Please try again.',
  };
  return map[code] || code || 'Something went wrong. Please try again.';
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, loginWithGoogle, isConfigured } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Inline field errors
  const [nameErr, setNameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  const triggerShake = (msg) => {
    setError(msg); setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const validateName = (v = name) => {
    const e = !v.trim() ? 'Full name is required.' : '';
    setNameErr(e); return !e;
  };
  const validateEmail = (v = email) => {
    const e = !v ? 'Email is required.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address.' : '';
    setEmailErr(e); return !e;
  };
  const validatePassword = (v = password) => {
    const e = v.length < 8 ? 'Password must be at least 8 characters.' : '';
    setPasswordErr(e); return !e;
  };

  const redirectAfterSignup = () => {
    const plan = searchParams.get('plan');
    navigate(plan ? `/choose-plan?plan=${plan}` : '/choose-plan');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const ok = validateName() & validateEmail() & validatePassword();
    if (!ok) return;
    if (password !== confirm) { triggerShake('Passwords do not match.'); return; }
    if (!agreed) { triggerShake('Please agree to the Terms & Privacy Policy.'); return; }
    setLoading(true); setError('');
    try {
      await signup(email, password, name.trim());
      setVerificationSent(true);
      setTimeout(() => redirectAfterSignup(), 2000);
    } catch (err) {
      triggerShake(friendlyError(err.code || err.message));
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (!agreed) { triggerShake('Please agree to the Terms & Privacy Policy first.'); return; }
    setLoading(true); setError('');
    try {
      await loginWithGoogle();
      redirectAfterSignup();
    } catch (err) {
      triggerShake(friendlyError(err.code || err.message));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:D.font, position:'relative', overflow:'hidden', padding:'24px 0' }}>
      {/* Background */}
      <div style={{ position:'fixed', inset:0 }}>
        <img src={BG_URL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        <div style={{ position:'absolute', inset:0, background:'rgba(10,15,30,0.72)', backdropFilter:'blur(2px)' }} />
      </div>

      {/* Logo */}
      <div style={{ position:'fixed', top:28, left:36, cursor:'pointer', zIndex:10 }} onClick={() => navigate('/')}>
        <span style={{ fontFamily:D.serif, fontSize:22, fontWeight:900, color:D.gold }}>◈ ExploreAI</span>
      </div>

      {/* Card */}
      <div style={{
        position:'relative', zIndex:5, width:'100%', maxWidth:440, margin:'80px 24px 40px',
        background:'rgba(10,15,30,0.88)', backdropFilter:'blur(28px)',
        border:`1px solid ${D.border}`, borderRadius:24, padding:'36px 36px',
        animation: shake ? 'shake 0.5s ease' : 'fadeIn 0.4s ease',
        boxShadow:'0 32px 80px rgba(0,0,0,0.5)',
      }}>
        <h1 style={{ fontFamily:D.serif, fontSize:27, fontWeight:900, color:D.white, marginBottom:6, textAlign:'center' }}>Create Your Account</h1>
        <p style={{ color:D.muted, fontSize:14, textAlign:'center', marginBottom:26 }}>Start exploring hidden America today</p>

        {!isConfigured && (
          <div style={{ background:'rgba(255,179,71,0.12)', border:'1px solid rgba(255,179,71,0.4)', borderRadius:10, padding:'10px 14px', marginBottom:18, fontSize:12, color:'#FFB347', lineHeight:1.5 }}>
            ⚠️ Firebase not configured — add real keys to .env to enable auth.
          </div>
        )}

        {verificationSent && (
          <div style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.4)', borderRadius:10, padding:'10px 14px', marginBottom:18, fontSize:13, color:'#22c55e', textAlign:'center', lineHeight:1.5 }}>
            ✓ Account created! Check your email to verify, then redirecting…
          </div>
        )}

        {error && (
          <div style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:10, padding:'10px 14px', marginBottom:18, fontSize:13, color:'#ef4444' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <Field label="Full Name" type="text" value={name} onChange={v=>{setName(v);if(nameErr)setNameErr('');}} placeholder="Jane Smith" error={nameErr} onBlur={()=>validateName()} />
          <Field label="Email" type="email" value={email} onChange={v=>{setEmail(v);if(emailErr)setEmailErr('');}} placeholder="you@example.com" error={emailErr} onBlur={()=>validateEmail()} />
          <PasswordField label="Password" value={password} onChange={v=>{setPassword(v);if(passwordErr)validatePassword(v);}} placeholder="Min. 8 characters" error={passwordErr} onBlur={()=>validatePassword()} />
          <PasswordField label="Confirm Password" value={confirm} onChange={setConfirm} placeholder="Repeat password" mismatch={confirm.length > 0 && confirm !== password} />

          <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', fontSize:13, color:D.muted, marginBottom:22, marginTop:6, lineHeight:1.5 }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ accentColor:D.teal, marginTop:2, flexShrink:0 }} />
            I agree to the{' '}
            <span style={{ color:D.teal, cursor:'pointer' }}>Terms of Service</span>
            {' '}&amp;{' '}
            <span style={{ color:D.teal, cursor:'pointer' }}>Privacy Policy</span>
          </label>

          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'14px 0', borderRadius:12, border:'none', cursor:loading?'not-allowed':'pointer', fontSize:15, fontWeight:700, fontFamily:D.font, background:'linear-gradient(135deg,#00D2FF,#3A7BD5)', color:'#fff', boxShadow:'0 4px 20px rgba(0,210,255,0.35)', transition:'all 0.2s', minHeight:52, opacity:loading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading ? <><Spinner />Creating account…</> : 'Create Account →'}
          </button>
        </form>

        <Divider />

        <button onClick={handleGoogle} disabled={loading}
          style={{ width:'100%', padding:'13px 0', borderRadius:12, border:`1px solid ${D.border}`, cursor:loading?'not-allowed':'pointer', fontSize:14, fontWeight:600, fontFamily:D.font, background:'rgba(255,255,255,0.05)', color:D.white, transition:'all 0.2s', minHeight:50, display:'flex', alignItems:'center', justifyContent:'center', gap:10, backdropFilter:'blur(8px)' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
          <GoogleIcon /> Sign up with Google
        </button>

        <p style={{ textAlign:'center', color:D.muted, fontSize:14, marginTop:22 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:D.teal, textDecoration:'none', fontWeight:600 }}>Sign In</Link>
        </p>
      </div>

      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }`}</style>
    </div>
  );
}
