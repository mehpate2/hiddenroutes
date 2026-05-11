import { useNavigate } from 'react-router-dom';

const D = {
  navy:'#0A0F1E', teal:'#00D2FF', gold:'#FFB347',
  white:'#FFFFFF', muted:'#6B7A9A', border:'rgba(255,255,255,0.12)',
  font:"'Inter',system-ui,sans-serif", serif:"'Playfair Display',Georgia,serif",
};

const COMPARE = [
  { feature: 'States available',     free: '3 states',     paid: 'All 50 states' },
  { feature: 'Places per state',     free: '5 places',     paid: '25 places' },
  { feature: 'Route planning',       free: '✕',            paid: '3 routes/day' },
  { feature: 'Save places',          free: '✕',            paid: 'Up to 20' },
  { feature: 'No watermark',         free: '✕',            paid: '✓' },
];

export default function UpgradeModal({ onClose, feature }) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/choose-plan');
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, zIndex:3000, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:D.font }}>
      <div style={{ width:'100%', maxWidth:460, background:'linear-gradient(145deg,#111827,#0d1526)', border:`1px solid rgba(0,210,255,0.25)`, borderRadius:24, padding:'36px 32px', animation:'fadeIn 0.3s ease', boxShadow:'0 0 60px rgba(0,210,255,0.15), 0 32px 80px rgba(0,0,0,0.6)', position:'relative' }}>
        {/* Close */}
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.07)', border:`1px solid ${D.border}`, color:D.white, fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🗺️</div>
          <h2 style={{ fontFamily:D.serif, fontSize:26, fontWeight:900, color:D.white, margin:'0 0 8px', lineHeight:1.2 }}>
            Unlock All 50 States
          </h2>
          <p style={{ color:D.muted, fontSize:14, lineHeight:1.6, maxWidth:320, margin:'0 auto' }}>
            {feature
              ? `${feature} requires the Explorer plan. Upgrade to unlock it.`
              : 'Upgrade to Explorer and discover hidden gems across the entire country.'}
          </p>
        </div>

        {/* Comparison table */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${D.border}`, borderRadius:14, overflow:'hidden', marginBottom:24 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'10px 16px', background:'rgba(255,255,255,0.06)', borderBottom:`1px solid ${D.border}` }}>
            <span style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:0.5 }}>FEATURE</span>
            <span style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:0.5, textAlign:'center' }}>FREE</span>
            <span style={{ fontSize:11, fontWeight:700, color:D.teal, letterSpacing:0.5, textAlign:'center' }}>EXPLORER</span>
          </div>
          {COMPARE.map((row, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'11px 16px', borderBottom: i < COMPARE.length - 1 ? `1px solid rgba(255,255,255,0.05)` : 'none' }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>{row.feature}</span>
              <span style={{ fontSize:12, color:row.free==='✕'?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.5)', textAlign:'center' }}>{row.free}</span>
              <span style={{ fontSize:12, color:row.paid==='✕'?'rgba(255,255,255,0.2)':D.teal, fontWeight:600, textAlign:'center' }}>{row.paid}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={handleUpgrade}
          style={{ width:'100%', padding:'15px 0', borderRadius:13, border:'none', cursor:'pointer', fontSize:15, fontWeight:700, fontFamily:D.font, background:'linear-gradient(135deg,#00D2FF,#3A7BD5)', color:'#fff', boxShadow:'0 4px 24px rgba(0,210,255,0.4)', marginBottom:12, minHeight:52 }}>
          Upgrade to Explorer — $4.99/mo
        </button>

        <button onClick={onClose}
          style={{ width:'100%', padding:'11px 0', borderRadius:13, border:'none', cursor:'pointer', fontSize:13, fontFamily:D.font, background:'transparent', color:D.muted }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
