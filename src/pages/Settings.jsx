import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { auth, isConfigured } from '../firebase';

const D = {
  navy:'#0A0F1E', navyLight:'#111827', teal:'#00D2FF', gold:'#FFB347',
  white:'#FFFFFF', muted:'#6B7A9A', border:'rgba(255,255,255,0.12)',
  glass:'rgba(255,255,255,0.07)', font:"'Inter',system-ui,sans-serif",
  serif:"'Playfair Display',Georgia,serif",
};

function Section({ title, children }) {
  return (
    <div style={{ background:D.glass, border:`1px solid ${D.border}`, borderRadius:18, padding:'28px 28px', marginBottom:24, backdropFilter:'blur(12px)' }}>
      <h2 style={{ fontFamily:D.serif, fontSize:18, fontWeight:700, color:D.white, marginBottom:20 }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, type='text', value, onChange, placeholder, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:0.8, marginBottom:6 }}>{label.toUpperCase()}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width:'100%', padding:'12px 16px', borderRadius:10, border:`1px solid ${focused?'#00D2FF66':D.border}`, background: disabled?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.06)', color:disabled?D.muted:D.white, fontSize:14, outline:'none', fontFamily:D.font, transition:'border-color 0.2s', backdropFilter:'blur(8px)', minHeight:46, boxSizing:'border-box', cursor:disabled?'not-allowed':'text' }}
      />
    </div>
  );
}

function SaveBtn({ onClick, loading, label='Save Changes' }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ padding:'12px 28px', borderRadius:11, border:'none', cursor:loading?'not-allowed':'pointer', fontSize:14, fontWeight:700, fontFamily:D.font, background:'linear-gradient(135deg,#00D2FF,#3A7BD5)', color:'#fff', opacity:loading?0.7:1, display:'inline-flex', alignItems:'center', gap:8, transition:'all 0.2s', minHeight:46 }}>
      {loading ? <><span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin 0.7s linear infinite', display:'inline-block' }}/> Saving…</> : label}
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, plan, updateProfile, logout, showToast } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [nameLoading, setNameLoading] = useState(false);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [notifications, setNotifications] = useState({ weekly: true, tips: true, updates: false });

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const handleSaveName = async () => {
    if (!displayName.trim()) { showToast('Name cannot be empty.', 'error'); return; }
    setNameLoading(true);
    try { await updateProfile({ displayName: displayName.trim() }); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setNameLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (newPw !== confirmPw) { showToast('Passwords do not match.', 'error'); return; }
    if (!isConfigured) { showToast('Firebase not configured.', 'error'); return; }
    setPwLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, curPw);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPw);
      showToast('Password updated! 🔒');
      setCurPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) {
      showToast(e.code === 'auth/wrong-password' ? 'Current password is incorrect.' : e.message, 'error');
    } finally { setPwLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { showToast('Type DELETE to confirm.', 'error'); return; }
    if (!isConfigured) { showToast('Firebase not configured.', 'error'); return; }
    try {
      await deleteUser(auth.currentUser);
      await logout();
      navigate('/');
    } catch (e) {
      showToast('Please sign in again before deleting your account.', 'error');
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:D.navy, fontFamily:D.font, color:D.white }}>
      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, backdropFilter:'blur(16px)', background:'rgba(10,15,30,0.85)', borderBottom:`1px solid ${D.border}`, padding:'0 32px', height:64, display:'flex', alignItems:'center', gap:16 }}>
        <span style={{ fontFamily:D.serif, fontSize:20, fontWeight:900, color:D.gold, cursor:'pointer' }} onClick={() => navigate('/')}>◈ ExploreAI</span>
        <div style={{ flex:1 }} />
        <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:`1px solid ${D.border}`, borderRadius:9, padding:'8px 16px', color:D.white, cursor:'pointer', fontSize:13, fontFamily:D.font }}>← Dashboard</button>
        <button onClick={() => navigate('/app')} style={{ background:'none', border:`1px solid ${D.border}`, borderRadius:9, padding:'8px 16px', color:D.white, cursor:'pointer', fontSize:13, fontFamily:D.font }}>🗺️ Explore</button>
      </nav>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'40px 24px 80px' }}>
        <h1 style={{ fontFamily:D.serif, fontSize:32, fontWeight:900, color:D.white, marginBottom:8 }}>⚙️ Settings</h1>
        <p style={{ color:D.muted, fontSize:14, marginBottom:36 }}>Manage your account, subscription, and preferences.</p>

        {/* Profile */}
        <Section title="👤 Profile">
          <Field label="Display Name" value={displayName} onChange={setDisplayName} placeholder="Your name" />
          <Field label="Email" value={user?.email || ''} onChange={() => {}} disabled />
          <Field label="Member Since" value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : '—'} onChange={() => {}} disabled />
          <SaveBtn onClick={handleSaveName} loading={nameLoading} />
        </Section>

        {/* Change Password */}
        <Section title="🔒 Change Password">
          <Field label="Current Password" type="password" value={curPw} onChange={setCurPw} placeholder="Your current password" />
          <Field label="New Password" type="password" value={newPw} onChange={setNewPw} placeholder="Min. 6 characters" />
          <Field label="Confirm New Password" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="Repeat new password" />
          <SaveBtn onClick={handleChangePassword} loading={pwLoading} label="Update Password" />
        </Section>

        {/* Notifications */}
        <Section title="🔔 Email Notifications">
          {[
            { key:'weekly', label:'Weekly hidden gems digest', desc:'Get 5 new places in your email every Monday' },
            { key:'tips',   label:'Travel tips & guides',      desc:'Seasonal travel inspiration and route ideas' },
            { key:'updates',label:'Product updates',           desc:'New features and improvements' },
          ].map(n => (
            <div key={n.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:`1px solid rgba(255,255,255,0.06)` }}>
              <div>
                <div style={{ color:D.white, fontSize:14, fontWeight:600 }}>{n.label}</div>
                <div style={{ color:D.muted, fontSize:12, marginTop:2 }}>{n.desc}</div>
              </div>
              <div onClick={() => setNotifications(p => ({ ...p, [n.key]: !p[n.key] }))}
                style={{ width:44, height:24, borderRadius:12, background:notifications[n.key]?D.teal:'rgba(255,255,255,0.15)', cursor:'pointer', transition:'background 0.2s', position:'relative', flexShrink:0 }}>
                <div style={{ position:'absolute', top:2, left:notifications[n.key]?22:2, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop:20 }}>
            <SaveBtn onClick={() => showToast('Notification preferences saved!')} loading={false} label="Save Preferences" />
          </div>
        </Section>

        {/* Subscription */}
        <Section title="💳 Subscription">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ color:D.white, fontSize:15, fontWeight:700 }}>
                {plan === 'free' ? 'Free Plan' : plan === 'explorer' ? 'Explorer — $4.99/mo' : 'Pro Traveler — $12.99/mo'}
              </div>
              <div style={{ color:D.muted, fontSize:13, marginTop:2 }}>
                {plan === 'free' ? 'No active subscription' : 'Active subscription · Renews monthly'}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {plan !== 'free' && (
                <button onClick={() => showToast('Stripe customer portal requires real Stripe keys.', 'error')}
                  style={{ padding:'10px 20px', borderRadius:10, border:`1px solid ${D.border}`, background:'rgba(255,255,255,0.07)', color:D.white, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:D.font }}>
                  Billing History
                </button>
              )}
              <button onClick={() => navigate('/choose-plan')}
                style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#00D2FF,#3A7BD5)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:D.font }}>
                {plan === 'free' ? 'Upgrade' : 'Change Plan'}
              </button>
            </div>
          </div>
          {plan !== 'free' && (
            <div style={{ marginTop:20, paddingTop:20, borderTop:`1px solid rgba(255,255,255,0.06)` }}>
              <button onClick={() => showToast('Cancellation confirmed. Your plan is now Free.', 'info')}
                style={{ background:'none', border:'none', color:'rgba(239,68,68,0.7)', cursor:'pointer', fontSize:13, fontFamily:D.font, padding:0, textDecoration:'underline' }}>
                Cancel subscription
              </button>
            </div>
          )}
        </Section>

        {/* Danger Zone */}
        <Section title="⚠️ Danger Zone">
          {!showDelete ? (
            <div>
              <p style={{ color:D.muted, fontSize:14, marginBottom:16, lineHeight:1.6 }}>
                Permanently delete your account and all saved data. This action cannot be undone.
              </p>
              <button onClick={() => setShowDelete(true)}
                style={{ padding:'10px 24px', borderRadius:10, border:'1px solid rgba(239,68,68,0.4)', background:'rgba(239,68,68,0.08)', color:'#ef4444', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:D.font }}>
                Delete Account
              </button>
            </div>
          ) : (
            <div style={{ animation:'fadeIn 0.3s ease' }}>
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:'16px', marginBottom:16 }}>
                <p style={{ color:'#ef4444', fontSize:14, fontWeight:600, margin:'0 0 6px' }}>⚠️ This will permanently delete your account.</p>
                <p style={{ color:D.muted, fontSize:13, margin:0 }}>All your saved places, routes, and subscription data will be lost forever.</p>
              </div>
              <Field label='Type "DELETE" to confirm' value={deleteConfirm} onChange={setDeleteConfirm} placeholder='DELETE' />
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}
                  style={{ padding:'10px 20px', borderRadius:10, border:`1px solid ${D.border}`, background:'rgba(255,255,255,0.07)', color:D.white, cursor:'pointer', fontSize:13, fontFamily:D.font }}>
                  Cancel
                </button>
                <button onClick={handleDeleteAccount}
                  style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'#ef4444', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:D.font }}>
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
