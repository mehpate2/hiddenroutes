import { useState, useEffect, useRef } from 'react';
import {
  startSafetyTrip, updateLocation,
  checkInSafe, completeTrip, sendSOS,
} from '../utils/safetySystem';

export default function SafetyCheckIn({ place }) {
  const [step,           setStep]           = useState('prompt');
  const [tripId,         setTripId]         = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [form,           setForm]           = useState({
    returnTime: '', buddyEmails: [''],
    emergencyContact: '', vehicleInfo: '', notes: '',
  });
  const [checkInMessage, setCheckInMessage] = useState('');
  const [timeLeft,       setTimeLeft]       = useState(null);
  const [sosConfirm,     setSosConfirm]     = useState(false);
  const locationInterval = useRef(null);

  useEffect(() => {
    if (tripId && step === 'active') {
      locationInterval.current = setInterval(() => {
        navigator.geolocation?.getCurrentPosition(pos => {
          updateLocation(tripId, pos.coords.latitude, pos.coords.longitude);
        });
      }, 5 * 60 * 1000);
    }
    return () => clearInterval(locationInterval.current);
  }, [tripId, step]);

  useEffect(() => {
    if (!form.returnTime || step !== 'active') return;
    const update = () => {
      const diff = new Date(form.returnTime) - new Date();
      if (diff <= 0) {
        setTimeLeft('OVERDUE');
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setTimeLeft(`${h}h ${m}m remaining`);
      }
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [form.returnTime, step]);

  const handleStart = async () => {
    if (!form.returnTime) { alert('Please set your expected return time'); return; }
    if (!form.buddyEmails[0]) { alert('Please add at least one safety buddy email'); return; }
    setLoading(true);
    try {
      const lat = place.lat ?? place.coordinates?.lat;
      const lng = place.lng ?? place.coordinates?.lng;
      const id = await startSafetyTrip({
        placeName: place.name,
        coordinates: { lat, lng },
        destination: place.address,
        returnTime: form.returnTime,
        buddyEmails: form.buddyEmails.filter(Boolean),
        emergencyContact: form.emergencyContact,
        vehicleInfo: form.vehicleInfo,
        notes: form.notes,
      });
      setTripId(id);
      setStep('active');
    } catch {
      alert('Failed to start safety check-in');
    }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (!tripId) return;
    await checkInSafe(tripId, checkInMessage);
    setCheckInMessage('');
    alert('✅ Check-in sent to your buddies!');
  };

  const handleComplete = async () => {
    if (!tripId) return;
    await completeTrip(tripId);
    setStep('complete');
    clearInterval(locationInterval.current);
  };

  const handleSOS = async () => {
    if (!sosConfirm) {
      setSosConfirm(true);
      setTimeout(() => setSosConfirm(false), 5000);
      return;
    }
    navigator.geolocation?.getCurrentPosition(async pos => {
      await sendSOS(tripId, { lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStep('sos');
    });
  };

  const inputStyle = {
    width: '100%', background: '#111318', border: '1px solid #1e2130',
    color: '#e8e4dc', padding: '8px 10px', borderRadius: 6,
    fontSize: 13, fontFamily: 'system-ui', boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: 11, color: '#5a5a65', textTransform: 'uppercase',
    letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: 6,
  };

  if (step === 'prompt') return (
    <div style={{ background: '#0a0f0a', border: '1px solid #1D9E7544',
      borderRadius: 12, padding: '14px 16px', margin: '12px 0', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>🤝</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>Buddy Safety System</div>
          <div style={{ fontSize: 11, color: '#5a5a65' }}>Let someone know where you are</div>
        </div>
        <button onClick={() => setStep('setup')} style={{
          marginLeft: 'auto', background: '#1D9E75', color: 'white',
          border: 'none', padding: '6px 12px', borderRadius: 6,
          fontSize: 12, cursor: 'pointer', fontFamily: 'system-ui', fontWeight: 600 }}>
          Set Up →
        </button>
      </div>
      <div style={{ fontSize: 11, color: '#3a5a3a', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>✓ Share live location</span>
        <span>✓ Auto check-in alerts</span>
        <span>✓ SOS emergency button</span>
      </div>
    </div>
  );

  if (step === 'setup') return (
    <div style={{ background: '#080B14', border: '1px solid #1D9E7544',
      borderRadius: 12, overflow: 'hidden', margin: '12px 0', fontFamily: 'system-ui' }}>
      <div style={{ background: '#0a1a0a', padding: '12px 16px',
        borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤝</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>Safety Check-In Setup</div>
          <div style={{ fontSize: 11, color: '#5a5a65' }}>{place.name}</div>
        </div>
        <button onClick={() => setStep('prompt')} style={{
          marginLeft: 'auto', background: 'none', border: 'none',
          color: '#5a5a65', cursor: 'pointer', fontSize: 18 }}>×</button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>⏰ Expected Return Time *</label>
          <input type="datetime-local" value={form.returnTime}
            onChange={e => setForm({ ...form, returnTime: e.target.value })}
            style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>👥 Safety Buddy Emails *</label>
          {form.buddyEmails.map((email, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input type="email" placeholder="friend@email.com" value={email}
                onChange={e => {
                  const emails = [...form.buddyEmails];
                  emails[i] = e.target.value;
                  setForm({ ...form, buddyEmails: emails });
                }}
                style={{ ...inputStyle, flex: 1 }} />
              {i === form.buddyEmails.length - 1 && (
                <button onClick={() => setForm({ ...form, buddyEmails: [...form.buddyEmails, ''] })}
                  style={{ background: '#111318', border: '1px solid #1e2130',
                    color: '#4ade80', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 16 }}>
                  +
                </button>
              )}
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#3a5a3a', marginTop: 4 }}>
            They will get a tracking link by email
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>🆘 Emergency Contact Phone</label>
          <input type="tel" placeholder="+1 (555) 000-0000" value={form.emergencyContact}
            onChange={e => setForm({ ...form, emergencyContact: e.target.value })}
            style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>🚗 Vehicle Info (optional)</label>
          <input type="text" placeholder="Red Toyota Camry, plate ABC123" value={form.vehicleInfo}
            onChange={e => setForm({ ...form, vehicleInfo: e.target.value })}
            style={inputStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>📝 Trip Notes (optional)</label>
          <textarea placeholder="Trail I'm taking, gear I have, any details…"
            value={form.notes} rows={2}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <button onClick={handleStart} disabled={loading} style={{
          width: '100%', padding: 12, background: '#1D9E75', color: 'white',
          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'system-ui', opacity: loading ? 0.7 : 1 }}>
          {loading ? '⏳ Starting…' : '✓ Start Safety Check-In'}
        </button>
        <div style={{ fontSize: 11, color: '#3a3a45', textAlign: 'center', marginTop: 8 }}>
          Your buddies will receive a tracking link and be notified if you don't check in.
        </div>
      </div>
    </div>
  );

  if (step === 'active') return (
    <div style={{ background: '#080B14', border: '1px solid #1D9E75',
      borderRadius: 12, overflow: 'hidden', margin: '12px 0', fontFamily: 'system-ui' }}>
      <div style={{ background: 'linear-gradient(135deg,#0a1a0a,#080B14)',
        padding: '12px 16px', borderBottom: '1px solid #1D9E7544' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80',
            boxShadow: '0 0 6px #4ade80' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>
            Safety Check-In Active
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12,
            color: timeLeft === 'OVERDUE' ? '#ef4444' : '#5a5a65' }}>
            {timeLeft || 'Calculating…'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#3a5a3a', marginTop: 4 }}>
          Your buddies are tracking your adventure
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#5a5a65', textTransform: 'uppercase',
            letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>
            Send a Check-In Update
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="text" placeholder="All good! At the waterfall now…"
              value={checkInMessage}
              onChange={e => setCheckInMessage(e.target.value)}
              style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleCheckIn} style={{
              background: '#1D9E75', color: 'white', border: 'none',
              padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
              fontSize: 12, fontFamily: 'system-ui', fontWeight: 600 }}>
              Send ✓
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {['✅ All good!', '🥾 On the trail', '🏕 Setting up camp', '🚗 Heading back'].map(msg => (
            <button key={msg} onClick={async () => {
              await checkInSafe(tripId, msg);
              alert(`✓ Sent: "${msg}"`);
            }} style={{
              background: '#111318', border: '1px solid #1e2130',
              color: '#8a8272', padding: '6px 10px', borderRadius: 20,
              fontSize: 11, cursor: 'pointer', fontFamily: 'system-ui' }}>
              {msg}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleComplete} style={{
            flex: 1, background: '#111318', color: '#4ade80',
            border: '1px solid #1D9E75', padding: 10, borderRadius: 8,
            fontSize: 13, cursor: 'pointer', fontFamily: 'system-ui', fontWeight: 600 }}>
            ✓ I'm Home Safe
          </button>
          <button onClick={handleSOS} style={{
            flex: 1, background: sosConfirm ? '#dc2626' : '#2a0a0a',
            color: '#ef4444', border: '1px solid #dc2626', padding: 10,
            borderRadius: 8, fontSize: 13, cursor: 'pointer',
            fontFamily: 'system-ui', fontWeight: 600 }}>
            {sosConfirm ? '⚠️ TAP AGAIN TO CONFIRM SOS' : '🆘 Send SOS'}
          </button>
        </div>
        {sosConfirm && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#ef4444', textAlign: 'center' }}>
            This will alert ALL your buddies and emergency contacts immediately
          </div>
        )}
      </div>
    </div>
  );

  if (step === 'complete') return (
    <div style={{ background: '#0a1a0a', border: '1px solid #1D9E75',
      borderRadius: 12, padding: 20, margin: '12px 0',
      textAlign: 'center', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#4ade80', marginBottom: 4 }}>
        Welcome back, Explorer!
      </div>
      <div style={{ fontSize: 13, color: '#3a5a3a', marginBottom: 12 }}>
        Your buddies have been notified you're home safe.
      </div>
      <button onClick={() => setStep('prompt')} style={{
        background: '#111318', color: '#8a8272', border: '1px solid #1e2130',
        padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
        fontSize: 13, fontFamily: 'system-ui' }}>
        Close
      </button>
    </div>
  );

  if (step === 'sos') return (
    <div style={{ background: '#1a0000', border: '2px solid #dc2626',
      borderRadius: 12, padding: 20, margin: '12px 0',
      textAlign: 'center', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🆘</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
        SOS Alert Sent!
      </div>
      <div style={{ fontSize: 13, color: '#fca5a5', marginBottom: 16 }}>
        All your safety buddies and emergency contacts have been notified with your exact GPS location.
      </div>
      <a href="tel:911" style={{
        display: 'block', background: '#dc2626', color: 'white',
        padding: 12, borderRadius: 8, fontSize: 15, fontWeight: 700,
        textDecoration: 'none', marginBottom: 8 }}>
        📞 Call 911
      </a>
      <a href="tel:18007733673" style={{
        display: 'block', background: '#111318', color: '#8a8272',
        border: '1px solid #1e2130', padding: 10, borderRadius: 8,
        fontSize: 13, textDecoration: 'none' }}>
        📞 National Search &amp; Rescue: 1-800-773-3673
      </a>
    </div>
  );

  return null;
}
