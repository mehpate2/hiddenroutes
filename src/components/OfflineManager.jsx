import { useState, useEffect } from 'react';
import {
  isStateDownloaded, downloadStateForOffline,
  deleteOfflineState, getStorageInfo, isOffline,
} from '../utils/offlineManager';

export function OfflineBanner() {
  const [offline, setOffline] = useState(isOffline());
  useEffect(() => {
    const onOnline  = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);
  if (!offline) return null;
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9999,
      background:'linear-gradient(135deg,#1a0a00,#2a1500)',
      borderBottom:'1px solid #f97316', padding:'8px 20px',
      display:'flex', alignItems:'center', gap:8, fontSize:13, fontFamily:'system-ui' }}>
      <span style={{ fontSize:16 }}>📵</span>
      <span style={{ color:'#fb923c', fontWeight:600 }}>You're offline</span>
      <span style={{ color:'rgba(255,255,255,0.5)' }}>— showing downloaded places only</span>
    </div>
  );
}

export default function OfflineManager({ stateAbbr, stateName, places = [] }) {
  const [downloaded, setDownloaded] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [progress,   setProgress]   = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);

  useEffect(() => {
    if (!stateAbbr) return;
    isStateDownloaded(stateAbbr).then(setDownloaded);
    getStorageInfo().then(setStorageInfo);
  }, [stateAbbr]);

  const handleDownload = async () => {
    if (!places.length) { alert('Load some places first, then download.'); return; }
    setLoading(true);
    setProgress('Saving places…');
    try {
      await downloadStateForOffline(stateAbbr, stateName, places);
      setDownloaded(true);
      setProgress(null);
      const info = await getStorageInfo();
      setStorageInfo(info);
    } catch {
      alert('Download failed. Please try again.');
      setProgress(null);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Remove ${stateName} offline data?`)) return;
    setLoading(true);
    try {
      await deleteOfflineState(stateAbbr);
      setDownloaded(false);
      const info = await getStorageInfo();
      setStorageInfo(info);
    } catch {
      alert('Failed to delete. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ background:'#0a0f14', border:`1px solid ${downloaded ? '#1D9E75' : '#1e2130'}`,
      borderRadius:12, padding:'14px 16px', fontFamily:'system-ui', margin:'12px 0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <span style={{ fontSize:18 }}>{downloaded ? '✅' : '📵'}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color: downloaded ? '#4ade80' : '#e8e4dc' }}>
            {downloaded ? `${stateName} available offline` : 'Download for Offline'}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>
            {downloaded
              ? `${places.length} places saved · ${((JSON.stringify(places).length) / 1024).toFixed(0)} KB`
              : `${places.length} places ready to download`}
          </div>
        </div>
        {downloaded ? (
          <button onClick={handleDelete} disabled={loading}
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
              color:'#ef4444', padding:'6px 12px', borderRadius:7, fontSize:12,
              cursor:'pointer', fontFamily:'system-ui', fontWeight:600 }}>
            🗑 Remove
          </button>
        ) : (
          <button onClick={handleDownload} disabled={loading || !places.length}
            style={{ background: loading ? '#111318' : '#1D9E75', color:'white',
              border:'none', padding:'7px 14px', borderRadius:7, fontSize:12,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'system-ui', fontWeight:600 }}>
            {loading ? (progress || '…') : '⬇ Download'}
          </button>
        )}
      </div>
      {storageInfo && storageInfo.statesDownloaded > 0 && (
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)',
          borderTop:'1px solid #1e2130', paddingTop:8 }}>
          💾 {storageInfo.statesDownloaded} state{storageInfo.statesDownloaded !== 1 ? 's' : ''} stored · {storageInfo.totalSizeMB} MB used
        </div>
      )}
    </div>
  );
}
