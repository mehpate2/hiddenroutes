import { useState, useEffect } from 'react';
import { getRealPhoto } from '../utils/realPhotos';
import { getPlaceImage, getFallbackImage } from '../utils/imageHelper';

export default function RealPhoto({ place, stateName, height = 220, style = {}, showBadge = true, category }) {
  const cat = category || place?.category || 'default';
  const fallbackSrc = getPlaceImage(cat, 0, 800, 500);

  const [src, setSrc] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [isWiki, setIsWiki] = useState(false);
  const [errored, setErrored] = useState(false);

  const placeName = place?.name;
  const placeState = stateName || place?.stateName || place?.state || '';

  useEffect(() => {
    if (!placeName) { setSrc(fallbackSrc); return; }
    let cancelled = false;
    setSrc(null); setLoaded(false); setIsWiki(false); setErrored(false);

    getRealPhoto({ name: placeName, stateName: placeState })
      .then(url => {
        if (cancelled) return;
        if (url) { setSrc(url); setIsWiki(true); }
        else { setSrc(fallbackSrc); }
      })
      .catch(() => { if (!cancelled) setSrc(fallbackSrc); });

    return () => { cancelled = true; };
  }, [placeName, placeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const h = typeof height === 'number' ? `${height}px` : height;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: h, backgroundColor: '#0A0F1E', ...style }}>
      {!loaded && !errored && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, #0A0F1E 25%, #1e2040 50%, #0A0F1E 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.6s infinite linear',
        }} />
      )}
      {errored && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: '#1a1a2e',
        }}>
          <span style={{ fontSize: 32, opacity: 0.4 }}>📍</span>
        </div>
      )}
      {!errored && src && (
        <img
          src={src}
          alt={placeName}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (src !== fallbackSrc) { setSrc(fallbackSrc); setIsWiki(false); }
            else {
              const alt = getFallbackImage(cat);
              if (src !== alt) { setSrc(alt); setIsWiki(false); }
              else setErrored(true);
            }
          }}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />
      )}
      {showBadge && isWiki && loaded && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          borderRadius: 6, padding: '2px 8px',
          fontSize: 9, color: 'rgba(255,255,255,0.65)',
          userSelect: 'none',
        }}>
          📷 Wikipedia
        </div>
      )}
    </div>
  );
}
