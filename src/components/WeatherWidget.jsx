import { useState, useEffect } from 'react';
import { getWeatherForecast, getDayLabel, getTravelAdvice, displayTemp } from '../utils/weather';

const UNIT_KEY = 'tempUnit';
function getStoredUnit() {
  try { return localStorage.getItem(UNIT_KEY) || 'F'; } catch { return 'F'; }
}

const ADVICE_COLORS = {
  great: { bg: 'rgba(29,158,117,0.12)',  border: '#1D9E75', text: '#4ade80' },
  good:  { bg: 'rgba(101,163,13,0.1)',   border: '#65a30d', text: '#86efac' },
  ok:    { bg: 'rgba(202,138,4,0.1)',    border: '#ca8a04', text: '#fde047' },
  bad:   { bg: 'rgba(220,38,38,0.1)',    border: '#dc2626', text: '#fca5a5' },
};

export default function WeatherWidget({ place }) {
  const [weather,   setWeather]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(false);
  const [unit,      setUnit]      = useState(getStoredUnit);

  // Support place.lat/lng (AI/Reddit/Community places) or place.coordinates (verified)
  const lat = place?.lat ?? place?.coordinates?.lat;
  const lng = place?.lng ?? place?.coordinates?.lng;

  useEffect(() => {
    if (lat == null || lng == null) { setLoading(false); return; }
    let cancelled = false;
    getWeatherForecast(lat, lng).then(data => {
      if (!cancelled) { setWeather(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [lat, lng]);

  const toggleUnit = () => {
    setUnit(u => {
      const next = u === 'F' ? 'C' : 'F';
      try { localStorage.setItem(UNIT_KEY, next); } catch {}
      return next;
    });
  };

  if (lat == null || lng == null) return null;

  if (loading) return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 14px',
      margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'system-ui' }}>
      <span>🌡</span> Loading weather forecast…
    </div>
  );

  if (!weather) return null;

  const advice = getTravelAdvice(weather.days);
  const today  = weather.days[0];
  const colors = ADVICE_COLORS[advice.type];
  const dt     = c => displayTemp(c, unit);

  return (
    <div style={{ margin: '0 0 12px', fontFamily: 'system-ui' }}>

      {/* Unit toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <button onClick={toggleUnit} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700,
          color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'system-ui',
          letterSpacing: 0.5,
        }}>
          {unit === 'F' ? '°F → °C' : '°C → °F'}
        </button>
      </div>

      {/* Travel advice banner */}
      <div style={{ background: colors.bg, border: `1px solid ${colors.border}`,
        borderRadius: 8, padding: '10px 14px', marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{advice.icon}</span>
        <div>
          <div style={{ color: colors.text, fontSize: 13, fontWeight: 500 }}>
            {advice.message}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>
            Plan your visit on the best weather day
          </div>
        </div>
      </div>

      {/* Today summary */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 8, padding: '12px 14px', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: 0.5 }}>
            TODAY AT THIS LOCATION
          </div>
          <span style={{ fontSize: 20 }}>{today.icon}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#e8e4dc' }}>{dt(today.maxTemp)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>High</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{dt(today.minTemp)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Low</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#38bdf8' }}>
              {today.precipitation}mm
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Rain</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#FFB347' }}>
              {today.windSpeed}mph
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Wind</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          {today.label} ·
          Sunrise {today.sunrise?.split('T')[1]?.slice(0, 5)} ·
          Sunset {today.sunset?.split('T')[1]?.slice(0, 5)}
        </div>
      </div>

      {/* 7-day forecast toggle */}
      <button onClick={() => setExpanded(v => !v)} style={{
        width: '100%', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: expanded ? '8px 8px 0 0' : 8,
        padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 12,
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', fontFamily: 'system-ui',
      }}>
        <span>📅 7-Day Forecast</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '0 0 8px 8px', borderTop: 'none', overflow: 'hidden' }}>
          {weather.days.map((day, i) => (
            <div key={day.date} style={{
              display: 'flex', alignItems: 'center', padding: '10px 14px',
              borderBottom: i < 6 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              background: day.good ? 'rgba(29,158,117,0.06)' : 'transparent',
              gap: 10,
            }}>
              <div style={{ width: 72, fontSize: 12, color: day.good ? '#4ade80' : 'rgba(255,255,255,0.45)',
                fontWeight: day.good ? 600 : 400, flexShrink: 0 }}>
                {getDayLabel(day.date)}
                {day.good && <div style={{ fontSize: 9, color: '#1D9E75', marginTop: 1 }}>✓ Good day</div>}
              </div>
              <span style={{ fontSize: 17, width: 26, flexShrink: 0 }}>{day.icon}</span>
              <div style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{day.label}</div>
              <div style={{ fontSize: 12, color: '#e8e4dc', textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontWeight: 500 }}>{dt(day.maxTemp)}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>{dt(day.minTemp)}</span>
              </div>
              {day.precipitation > 0 && (
                <div style={{ fontSize: 10, color: '#38bdf8', width: 34, textAlign: 'right', flexShrink: 0 }}>
                  💧{day.precipitation}
                </div>
              )}
            </div>
          ))}

          {weather.bestDay && (
            <div style={{ padding: '10px 14px', background: 'rgba(29,158,117,0.08)',
              borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#4ade80',
              display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🌟</span>
              <span>Best day to visit: <strong>{getDayLabel(weather.bestDay.date)} — {weather.bestDay.label}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
