/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const D = {
  navy:'#0A0F1E', teal:'#00D2FF', gold:'#FFB347',
  white:'#FFFFFF', muted:'#6B7A9A', border:'rgba(255,255,255,0.12)',
  font:"'Inter',system-ui,sans-serif", serif:"'Playfair Display',Georgia,serif",
};

const BG_URL = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80&fit=crop';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// Eye open icon
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// Eye closed icon
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function TextField({ label, type = 'text', value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8, marginBottom: 6 }}>
        {label.toUpperCase()}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', padding: '13px 16px', borderRadius: 11, border: `1px solid ${focused ? '#00D2FF66' : D.border}`, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 15, outline: 'none', fontFamily: D.font, transition: 'border-color 0.2s', backdropFilter: 'blur(8px)', minHeight: 50, boxSizing: 'border-box' }}
      />
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow]       = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8, marginBottom: 6 }}>
        {label.toUpperCase()}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ width: '100%', padding: '13px 48px 13px 16px', borderRadius: 11, border: `1px solid ${focused ? '#00D2FF66' : D.border}`, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 15, outline: 'none', fontFamily: D.font, transition: 'border-color 0.2s', backdropFilter: 'blur(8px)', minHeight: 50, boxSizing: 'border-box' }}
        />
        {/* Eye toggle button */}
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: show ? D.teal : 'rgba(255,255,255,0.35)', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
          tabIndex={-1}
          title={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>or continue with</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
    </div>
  );
}

function Spinner() {
  return <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />;
}

function friendlyError(code) {
  const map = {
    'auth/wrong-password':          'Incorrect password. Try again.',
    'auth/invalid-credential':      'Incorrect email or password.',
    'auth/user-not-found':          'No account with that email.',
    'auth/invalid-email':           'Please enter a valid email.',
    'auth/too-many-requests':       'Too many attempts. Try again later.',
    'auth/network-request-failed':  'Network error. Check your connection.',
    'auth/popup-closed-by-user':    'Google sign-in cancelled.',
  };
  return map[code] || code || 'Something went wrong. Please try again.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, resetPassword } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [shake,    setShake]    = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const triggerShake = (msg) => {
    setError(msg); setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { triggerShake('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      triggerShake(friendlyError(err.code || err.message));
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      await loginWithGoogle();
      navigate('/app');
    } catch (err) {
      triggerShake(friendlyError(err.code || err.message));
    } finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!email) { triggerShake('Enter your email first.'); return; }
    try { await resetPassword(email); setForgotSent(true); }
    catch (err) { triggerShake(friendlyError(err.code || err.message)); }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: D.font, position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <img src={BG_URL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(2px)' }} />
      </div>

      {/* Logo */}
      <div style={{ position: 'absolute', top: 28, left: 36, cursor: 'pointer', zIndex: 10 }} onClick={() => navigate('/')}>
        <span style={{ fontFamily: D.serif, fontSize: 22, fontWeight: 900, color: D.gold }}>◈ ExploreAI</span>
      </div>

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 5, width: '100%', maxWidth: 420, margin: '0 24px',
        background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(28px)',
        border: `1px solid ${D.border}`, borderRadius: 24, padding: '40px 36px',
        animation: shake ? 'shake 0.5s ease' : 'fadeIn 0.4s ease',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        <h1 style={{ fontFamily: D.serif, fontSize: 28, fontWeight: 900, color: D.white, marginBottom: 6, textAlign: 'center' }}>Welcome Back Explorer</h1>
        <p style={{ color: D.muted, fontSize: 14, textAlign: 'center', marginBottom: 28 }}>Sign in to continue your journey</p>

        {forgotSent && (
          <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#22c55e', textAlign: 'center' }}>
            ✓ Reset email sent! Check your inbox.
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <TextField    label="Email"    type="email" value={email}    onChange={setEmail}    placeholder="you@example.com" />
          <PasswordField label="Password"              value={password} onChange={setPassword} placeholder="Your password" />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: D.muted }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: D.teal }} />
              Remember me
            </label>
            <button type="button" onClick={handleForgot} style={{ background: 'none', border: 'none', color: D.teal, fontSize: 13, cursor: 'pointer', fontFamily: D.font, padding: 0 }}>
              Forgot password?
            </button>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, fontFamily: D.font, background: 'linear-gradient(135deg,#00D2FF,#3A7BD5)', color: '#fff', boxShadow: '0 4px 20px rgba(0,210,255,0.35)', transition: 'all 0.2s', minHeight: 52, opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><Spinner /> Signing in…</> : 'Sign In →'}
          </button>
        </form>

        <Divider />

        <button onClick={handleGoogle} disabled={loading}
          style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: `1px solid ${D.border}`, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: D.font, background: 'rgba(255,255,255,0.05)', color: D.white, transition: 'all 0.2s', minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, backdropFilter: 'blur(8px)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
          <GoogleIcon /> Sign in with Google
        </button>

        <p style={{ textAlign: 'center', color: D.muted, fontSize: 14, marginTop: 24 }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: D.teal, textDecoration: 'none', fontWeight: 600 }}>Sign Up</Link>
        </p>
      </div>

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
      `}</style>
    </div>
  );
}
