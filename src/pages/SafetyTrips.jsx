import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserTrips, getBuddyTrips, completeTrip } from '../utils/safetySystem';

function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ago`;
  if (h >= 1)  return `${h}h ago`;
  return `${m}m ago`;
}

function formatReturn(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_COLOR = {
  active:     '#4ade80',
  checked_in: '#2B9FAA',
  completed:  '#8a8272',
  SOS:        '#ef4444',
};
const STATUS_LABEL = {
  active:     '● Active',
  checked_in: '✓ Checked In',
  completed:  '✓ Complete',
  SOS:        '🆘 SOS',
};

function TripCard({ trip, showTrack = true }) {
  const navigate = useNavigate();
  const color = STATUS_COLOR[trip.status] || '#8a8272';
  const isOverdue = trip.expectedReturnTime &&
    new Date(trip.expectedReturnTime) < new Date() &&
    trip.status === 'active';

  return (
    <div style={{ background: '#0d0f18', border: `1px solid ${isOverdue ? '#f97316' : '#1e2130'}`,
      borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e4dc', marginBottom: 2 }}>
            {trip.placeName}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            Started {timeAgo(trip.startedAt)} · {trip.buddyEmails?.length || 0} buddy{trip.buddyEmails?.length !== 1 ? 's' : ''}
          </div>
        </div>
        <span style={{ background: `${color}22`, border: `1px solid ${color}55`,
          borderRadius: 20, padding: '3px 10px', fontSize: 11, color, fontWeight: 600,
          flexShrink: 0 }}>
          {STATUS_LABEL[trip.status] || trip.status}
        </span>
      </div>

      {isOverdue && (
        <div style={{ fontSize: 12, color: '#fb923c', background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.3)', borderRadius: 6,
          padding: '6px 10px', marginBottom: 8 }}>
          ⚠️ Overdue — expected return: {formatReturn(trip.expectedReturnTime)}
        </div>
      )}

      {trip.lastMessage && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)',
          background: '#111318', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
          💬 {trip.lastMessage}
        </div>
      )}

      {showTrack && (
        <button onClick={() => navigate(`/track/${trip.id}`)}
          style={{ background: '#111318', border: '1px solid #1e2130',
            color: '#2B9FAA', padding: '7px 14px', borderRadius: 7,
            fontSize: 12, cursor: 'pointer', fontFamily: 'system-ui', fontWeight: 600 }}>
          🗺 View Tracking Page
        </button>
      )}
    </div>
  );
}

const TABS = ['Active Trips', 'Past Trips', 'Buddy Requests'];

export default function SafetyTrips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab,          setTab]          = useState(0);
  const [myTrips,      setMyTrips]      = useState([]);
  const [buddyTrips,   setBuddyTrips]   = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserTrips(user.uid),
      getBuddyTrips(user.email),
    ]).then(([mine, buddy]) => {
      setMyTrips(mine.sort((a, b) => {
        const ta = a.startedAt?.toMillis?.() || 0;
        const tb = b.startedAt?.toMillis?.() || 0;
        return tb - ta;
      }));
      setBuddyTrips(buddy.filter(t => t.userId !== user.uid).sort((a, b) => {
        const ta = a.startedAt?.toMillis?.() || 0;
        const tb = b.startedAt?.toMillis?.() || 0;
        return tb - ta;
      }));
      setLoading(false);
    });
  }, [user]);

  const active = myTrips.filter(t => ['active', 'checked_in'].includes(t.status));
  const past   = myTrips.filter(t => ['completed', 'SOS'].includes(t.status));
  const buddyActive = buddyTrips.filter(t => ['active', 'checked_in', 'SOS'].includes(t.status));

  const tabData = [
    { items: active,      empty: 'No active trips. Open a place to start a safety check-in.' },
    { items: past,        empty: 'No past trips yet.' },
    { items: buddyActive, empty: 'No one has added you as a safety buddy yet.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#05070e', fontFamily: 'system-ui', color: '#e8e4dc' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, color: 'rgba(255,255,255,0.6)', padding: '8px 14px',
          fontSize: 13, cursor: 'pointer', fontFamily: 'system-ui', marginBottom: 20 }}>
          ← Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>🤝</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700,
              fontFamily: 'Georgia, serif', color: '#e8e4dc' }}>My Safety Trips</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Track your adventures and buddy requests
            </p>
          </div>
        </div>

        {/* Summary badges */}
        {!loading && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {active.length > 0 && (
              <span style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#4ade80' }}>
                ● {active.length} active
              </span>
            )}
            {buddyActive.length > 0 && (
              <span style={{ background: 'rgba(43,159,170,0.12)', border: '1px solid rgba(43,159,170,0.3)',
                borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#2B9FAA' }}>
                👥 {buddyActive.length} buddy active
              </span>
            )}
            <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {past.length} completed
            </span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, background: '#111318',
          borderRadius: 10, padding: 4, marginBottom: 16 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 7, border: 'none',
              background: tab === i ? '#1e2130' : 'transparent',
              color: tab === i ? '#e8e4dc' : 'rgba(255,255,255,0.4)',
              fontSize: 12, fontWeight: tab === i ? 600 : 400,
              cursor: 'pointer', fontFamily: 'system-ui', transition: 'all 0.15s' }}>
              {t}
              {i === 2 && buddyActive.length > 0 && (
                <span style={{ marginLeft: 4, background: '#2B9FAA', color: '#fff',
                  borderRadius: 10, padding: '1px 5px', fontSize: 10 }}>
                  {buddyActive.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '30px 0', textAlign: 'center' }}>
            Loading trips…
          </div>
        ) : tabData[tab].items.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13,
            padding: '40px 0', textAlign: 'center', lineHeight: 1.6 }}>
            {tabData[tab].empty}
          </div>
        ) : (
          tabData[tab].items.map(trip => (
            <TripCard key={trip.id} trip={trip} showTrack />
          ))
        )}

        {tab === 0 && !loading && (
          <button onClick={() => navigate('/app')} style={{
            width: '100%', marginTop: 12, padding: 12,
            background: 'linear-gradient(135deg,#1D9E75,#2B9FAA)',
            color: 'white', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui' }}>
            + Start a New Safety Check-In
          </button>
        )}
      </div>
    </div>
  );
}
