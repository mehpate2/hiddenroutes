import { useEffect, useState } from 'react';

const COLORS = {
  success: { bg:'rgba(34,197,94,0.15)',  border:'rgba(34,197,94,0.4)',  text:'#22c55e',  icon:'✓' },
  error:   { bg:'rgba(239,68,68,0.15)',  border:'rgba(239,68,68,0.4)',  text:'#ef4444',  icon:'✕' },
  info:    { bg:'rgba(0,210,255,0.12)',  border:'rgba(0,210,255,0.35)', text:'#00D2FF',  icon:'ℹ' },
};

export default function Toast({ msg, type = 'success' }) {
  const [visible, setVisible] = useState(false);
  const c = COLORS[type] || COLORS.info;

  useEffect(() => {
    // Mount → fade in
    const t1 = setTimeout(() => setVisible(true), 20);
    // After 3s → fade out
    const t2 = setTimeout(() => setVisible(false), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : 24}px)`,
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14,
      padding: '13px 20px', backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease, transform 0.3s ease',
      fontFamily: "'Inter',system-ui,sans-serif", maxWidth: 420, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${c.text}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c.text, flexShrink: 0 }}>{c.icon}</span>
      <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{msg}</span>
    </div>
  );
}
