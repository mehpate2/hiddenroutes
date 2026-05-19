import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { calculateSilenceScore } from '../utils/silenceScore';

const PREVIEW_SIZE = 360;

export default function ShareableCard({ place, photo, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [copied,      setCopied]      = useState(false);
  const cardRef = useRef(null);

  const silence  = calculateSilenceScore(place);
  const shareUrl = `${window.location.origin}/app`;
  const shareText = `🗺 Found a hidden gem: ${place.name} in ${place.state || ''}! Discovered on HiddenRoutes ✦`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, useCORS: true, allowTaint: false,
        backgroundColor: '#0D0F14',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${(place.name || 'place').replace(/\s+/g, '-').toLowerCase()}-hiddenroutes.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('Download failed. Try a screenshot instead.');
    }
    setDownloading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const emailUrl    = `mailto:?subject=${encodeURIComponent(`Hidden gem: ${place.name}`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:3000,
      background:'rgba(0,0,0,0.92)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, fontFamily:'system-ui' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{ background:'#0d0f18', border:'1px solid #1e2130',
        borderRadius:20, overflow:'hidden', width:'100%', maxWidth:420 }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #1e2130',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#e8e4dc' }}>✦ Share This Place</div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.07)',
            border:'1px solid rgba(255,255,255,0.15)', borderRadius:8,
            color:'rgba(255,255,255,0.6)', width:30, height:30, cursor:'pointer', fontSize:16,
            display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        {/* Card Preview */}
        <div style={{ padding:16, display:'flex', justifyContent:'center' }}>
          <div style={{ width:PREVIEW_SIZE, height:PREVIEW_SIZE, overflow:'hidden',
            borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', flexShrink:0 }}>
            {/* The actual card element — html2canvas captures this at scale:3 for 1080px output */}
            <div ref={cardRef} style={{
              width:PREVIEW_SIZE, height:PREVIEW_SIZE,
              background:'#0D0F14', position:'relative', overflow:'hidden',
              fontFamily:'Georgia, serif',
            }}>
              {/* Background photo */}
              {photo && (
                <img src={photo} alt=""
                  style={{ width:'100%', height:'65%', objectFit:'cover', display:'block',
                    filter:'brightness(0.65)', position:'absolute', top:0, left:0 }}
                  crossOrigin="anonymous" />
              )}
              {!photo && (
                <div style={{ width:'100%', height:'65%', position:'absolute', top:0, left:0,
                  background:`linear-gradient(135deg,#1a2035,#0d0f18)`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:64 }}>
                  🗺
                </div>
              )}

              {/* Gradient overlay */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'70%',
                background:'linear-gradient(transparent,#0D0F14 60%)' }} />

              {/* Content */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'20px 22px' }}>
                <div style={{ fontSize:9, letterSpacing:'0.25em', color:'#c9a84c',
                  marginBottom:6, textTransform:'uppercase', fontFamily:'system-ui' }}>
                  ◈ Hidden Gem
                </div>
                <div style={{ fontSize:22, fontWeight:700, color:'#F5F0E8',
                  lineHeight:1.15, marginBottom:5 }}>
                  {place.name}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)',
                  marginBottom:10, fontFamily:'system-ui' }}>
                  {[place.state, place.category].filter(Boolean).join(' · ')}
                </div>

                {/* Stats row */}
                <div style={{ display:'flex', gap:14, marginBottom:12,
                  fontFamily:'system-ui', fontSize:10, flexWrap:'wrap' }}>
                  <span style={{ color:'#4ade80' }}>{silence.icon} {silence.label} {silence.score}/10</span>
                  {place.rating && <span style={{ color:'#FFD700' }}>⭐ {place.rating}/5</span>}
                  {place.state && <span style={{ color:'#2B9FAA' }}>📍 {place.state}</span>}
                </div>

                {/* Branding */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.1)',
                  fontFamily:'system-ui' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#c9a84c', letterSpacing:'0.1em' }}>
                    ◈ HIDDENROUTES
                  </div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>
                    hiddenroutes.app
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding:'0 16px 16px' }}>
          {/* Download */}
          <button onClick={handleDownload} disabled={downloading}
            style={{ width:'100%', padding:'11px', marginBottom:8, borderRadius:9,
              background:'linear-gradient(135deg,#c9a84c,#FFD700)', color:'#1a1200',
              border:'none', fontSize:13, fontWeight:700, cursor: downloading ? 'not-allowed' : 'pointer',
              fontFamily:'system-ui', opacity: downloading ? 0.7 : 1 }}>
            {downloading ? '⏳ Generating…' : '⬇ Download as PNG'}
          </button>

          {/* Social share row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'9px', borderRadius:8, background:'#128C7E', color:'white',
                textDecoration:'none', fontSize:12, fontWeight:600 }}>
              💬 WhatsApp
            </a>
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'9px', borderRadius:8, background:'#000', color:'white',
                textDecoration:'none', fontSize:12, fontWeight:600, border:'1px solid #333' }}>
              𝕏 Twitter/X
            </a>
            <a href={emailUrl}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'9px', borderRadius:8, background:'#111318', color:'rgba(255,255,255,0.7)',
                textDecoration:'none', fontSize:12, fontWeight:600, border:'1px solid #1e2130' }}>
              ✉️ Email
            </a>
            <button onClick={handleCopy}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'9px', borderRadius:8, background:'#111318', color: copied ? '#4ade80' : 'rgba(255,255,255,0.7)',
                border:'1px solid #1e2130', fontSize:12, fontWeight:600,
                cursor:'pointer', fontFamily:'system-ui' }}>
              {copied ? '✓ Copied!' : '🔗 Copy Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
