/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { markNotificationRead, markAllNotificationsRead } from '../lib/community';

const D = {
  navy: '#0A0F1E', teal: '#00D2FF', gold: '#C9A84C',
  white: '#FFFFFF', muted: '#6B7A9A', border: 'rgba(255,255,255,0.12)',
  font: "'Inter',system-ui,sans-serif",
  success: '#22c55e', error: '#ef4444',
};

const TYPE_ICON = {
  submission_received: '📬',
  place_approved:      '✅',
  place_rejected:      '❌',
  review_helpful:      '👍',
  default:             '🔔',
};

export default function NotificationBell() {
  const { user, notifications, unreadCount } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const handleOpen = () => setOpen(o => !o);

  const handleClick = async (notif) => {
    await markNotificationRead(notif.id);
    setOpen(false);
    if (notif.placeId) navigate('/community');
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead(user.uid);
  };

  const ts = (notif) => {
    if (!notif.createdAt?.seconds) return '';
    const d = new Date(notif.createdAt.seconds * 1000);
    const diff = Date.now() - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button onClick={handleOpen}
        style={{ position: 'relative', background: open ? 'rgba(0,210,255,0.12)' : 'rgba(255,255,255,0.07)', border: `1px solid ${open ? D.teal + '44' : D.border}`, borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: 16 }}>
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: D.error, color: '#fff', borderRadius: 10, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: D.font, padding: '0 4px', border: '2px solid #0A0F1E' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', top: 46, right: 0, width: 320, maxHeight: 400, overflowY: 'auto', background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(24px)', border: `1px solid ${D.border}`, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 1000, animation: 'fadeIn 0.15s ease' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${D.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: D.white, fontWeight: 700, fontSize: 14 }}>Notifications</div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} style={{ background: 'none', border: 'none', color: D.teal, fontSize: 12, cursor: 'pointer', fontFamily: D.font }}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: D.muted, fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
              No new notifications
            </div>
          )}

          {notifications.map(n => (
            <div key={n.id} onClick={() => handleClick(n)}
              style={{ padding: '12px 16px', borderBottom: `1px solid ${D.border}`, cursor: 'pointer', background: 'transparent', transition: 'background 0.15s', display: 'flex', gap: 10, alignItems: 'flex-start' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_ICON[n.type] || TYPE_ICON.default}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: D.white, fontSize: 13, lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ color: D.muted, fontSize: 11, marginTop: 2 }}>{ts(n)}</div>
              </div>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: D.teal, flexShrink: 0, marginTop: 4 }} />
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
