import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { watchTrip } from '../utils/safetySystem';

function formatTime(ts) {
  if (!ts) return 'Unknown';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(ts) {
  if (!ts) return 'Unknown';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function useCountdown(returnTime) {
  const [label, setLabel] = useState('');
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    if (!returnTime) return;
    const update = () => {
      const diff = new Date(returnTime) - new Date();
      if (diff <= 0) {
        setOverdue(true);
        const over = Math.abs(diff);
        const h = Math.floor(over / 3600000);
        const m = Math.floor((over % 3600000) / 60000);
        setLabel(h > 0 ? `${h}h ${m}m overdue` : `${m}m overdue`);
      } else {
        setOverdue(false);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setLabel(h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`);
      }
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [returnTime]);

  return { label, overdue };
}

const STATUS_META = {
  active:      { color: '#4ade80', label: 'Active — On Adventure', dot: true  },
  checked_in:  { color: '#2B9FAA', label: 'Checked In — All Good', dot: true  },
  completed:   { color: '#8a8272', label: 'Trip Complete — Home Safe', dot: false },
  SOS:         { color: '#ef4444', label: '🆘 SOS EMERGENCY', dot: true  },
};

export default function BuddyTracker() {
  const { tripId } = useParams();
  const [trip,    setTrip]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const { label: countdownLabel, overdue } = useCountdown(trip?.expectedReturnTime);

  useEffect(() => {
    if (!tripId) { setError('No trip ID provided'); setLoading(false); return; }
    const unsub = watchTrip(tripId, data => {
      setTrip(data);
      setLoading(false);
    });
    return unsub;
  }, [tripId]);

  const meta = STATUS_META[trip?.status] || STATUS_META.active;
  const isSOS      = trip?.status === 'SOS';
  const isComplete = trip?.status === 'completed';
  const isOverdue  = overdue && !isComplete && !isSOS;

  const loc = trip?.currentLocation || trip?.placeCoordinates;
  const mapsUrl = loc
    ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
    : loc && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip?.placeName || '')}`;

  return (
    <div style={{ minHeight: '100vh', background: '#05070e', fontFamily: 'system-ui',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>

      {/* Brand */}
      <div style={{ fontSize: 13, color: '#c9a84c', fontWeight: 700,
        letterSpacing: '0.1em', marginBottom: 24 }}>◈ ExploreAI — Buddy Safety Tracker</div>

      {loading && (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 60 }}>
          Loading trip…
        </div>
      )}

      {error && (
        <div style={{ color: '#ef4444', fontSize: 14, marginTop: 60 }}>
          ⚠️ {error}
        </div>
      )}

      {trip && (
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* SOS Banner */}
          {isSOS && (
            <div style={{ background: '#1a0000', border: '2px solid #dc2626',
              borderRadius: 12, padding: '16px 20px', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🆘</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>
                EMERGENCY — {trip.userName} has sent an SOS!
              </div>
              <div style={{ fontSize: 13, color: '#fca5a5', marginBottom: 12 }}>
                Last known location:{' '}
                {trip.sosLocation
                  ? `${trip.sosLocation.lat.toFixed(5)}, ${trip.sosLocation.lng.toFixed(5)}`
                  : trip.placeName}
              </div>
              <a href="tel:911" style={{
                display: 'block', background: '#dc2626', color: 'white',
                padding: 12, borderRadius: 8, fontSize: 15, fontWeight: 700,
                textDecoration: 'none', marginBottom: 8 }}>
                📞 Call 911 Immediately
              </a>
              {trip.sosLocation && (
                <a href={`https://www.google.com/maps?q=${trip.sosLocation.lat},${trip.sosLocation.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', background: '#2a0a0a', color: '#ef4444',
                    border: '1px solid #dc2626', padding: 10, borderRadius: 8,
                    fontSize: 13, textDecoration: 'none' }}>
                  📍 Share GPS Location with 911
                </a>
              )}
            </div>
          )}

          {/* Overdue Banner */}
          {isOverdue && (
            <div style={{ background: '#1a0a00', border: '1px solid #f97316',
              borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fb923c', marginBottom: 4 }}>
                ⚠️ {trip.userName} is overdue — {countdownLabel}
              </div>
              <div style={{ fontSize: 12, color: '#fdba74' }}>
                They were expected back at {new Date(trip.expectedReturnTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} and have not checked in.
                Consider contacting them or local authorities.
              </div>
              {trip.emergencyContact && (
                <a href={`tel:${trip.emergencyContact.replace(/\D/g, '')}`}
                  style={{ display: 'inline-block', marginTop: 8, background: '#f97316',
                    color: '#fff', padding: '5px 12px', borderRadius: 6,
                    fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                  📞 Call Emergency Contact
                </a>
              )}
            </div>
          )}

          {/* Main card */}
          <div style={{ background: '#0d0f18', border: `1px solid ${meta.color}44`,
            borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>

            {/* Header */}
            <div style={{ background: `linear-gradient(135deg,${meta.color}11,transparent)`,
              padding: '18px 20px', borderBottom: '1px solid #1e2130' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {meta.dot && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%',
                    background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
                )}
                <span style={{ fontSize: 12, fontWeight: 700, color: meta.color,
                  textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {meta.label}
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e8e4dc',
                fontFamily: 'Georgia, serif', marginBottom: 4 }}>
                {trip.userName}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                🏔 {trip.placeName}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 1, background: '#1e2130' }}>
              {[
                {
                  label: 'Expected Return',
                  value: trip.expectedReturnTime
                    ? new Date(trip.expectedReturnTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : 'Not set',
                  sub: trip.expectedReturnTime
                    ? new Date(trip.expectedReturnTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    : '',
                },
                {
                  label: isComplete ? 'Status' : 'Time Remaining',
                  value: isComplete ? '✅ Home Safe' : (countdownLabel || '—'),
                  sub: '',
                },
                {
                  label: 'Last Check-In',
                  value: trip.lastCheckIn ? formatTime(trip.lastCheckIn) : 'Starting',
                  sub: trip.lastMessage || '',
                },
                {
                  label: 'Trip Started',
                  value: trip.startedAt ? formatTime(trip.startedAt) : '—',
                  sub: '',
                },
              ].map(item => (
                <div key={item.label} style={{ background: '#0d0f18', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e4dc' }}>
                    {item.value}
                  </div>
                  {item.sub && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                      {item.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Vehicle & notes */}
            {(trip.vehicleInfo || trip.notes) && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #1e2130' }}>
                {trip.vehicleInfo && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                    🚗 {trip.vehicleInfo}
                  </div>
                )}
                {trip.notes && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    📝 {trip.notes}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map / Location */}
          {loc && (
            <div style={{ background: '#0d0f18', border: '1px solid #1e2130',
              borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                📍 {trip.currentLocation ? 'Live Location' : 'Destination'}
              </div>
              <div style={{ fontSize: 13, color: '#e8e4dc', marginBottom: 4 }}>
                {trip.placeName}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
              </div>
              <a href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', background: '#2B9FAA', color: 'white',
                  padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  textAlign: 'center', textDecoration: 'none' }}>
                🗺 Open in Google Maps
              </a>
            </div>
          )}

          {/* Emergency contact */}
          {trip.emergencyContact && (
            <div style={{ background: '#0d0f18', border: '1px solid #1e2130',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  Emergency Contact
                </div>
                <div style={{ fontSize: 13, color: '#e8e4dc' }}>{trip.emergencyContact}</div>
              </div>
              <a href={`tel:${trip.emergencyContact.replace(/\D/g, '')}`}
                style={{ background: '#1D9E75', color: 'white', padding: '7px 14px',
                  borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                📞 Call
              </a>
            </div>
          )}

          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
            Updates automatically · Powered by ExploreAI
          </div>
        </div>
      )}
    </div>
  );
}
