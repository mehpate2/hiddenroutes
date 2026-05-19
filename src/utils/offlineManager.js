const DB_NAME = 'hiddenroutes_offline';
const DB_VERSION = 1;

export function initOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('states'))   db.createObjectStore('states',   { keyPath: 'abbr' });
      if (!db.objectStoreNames.contains('places'))   db.createObjectStore('places',   { keyPath: 'id'   });
      if (!db.objectStoreNames.contains('weather'))  db.createObjectStore('weather',  { keyPath: 'key'  });
      if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata', { keyPath: 'key'  });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror  = () => reject(request.error);
  });
}

export async function downloadStateForOffline(stateAbbr, stateName, places) {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['states', 'places', 'metadata'], 'readwrite');
    tx.objectStore('states').put({
      abbr: stateAbbr, name: stateName,
      placesCount: places.length,
      downloadedAt: new Date().toISOString(),
      size: JSON.stringify(places).length,
    });
    places.forEach(place => tx.objectStore('places').put({ ...place, _stateAbbr: stateAbbr }));
    tx.objectStore('metadata').put({
      key: `state_${stateAbbr}_downloaded`,
      value: true,
      timestamp: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror    = () => reject(tx.error);
  });
}

export async function getOfflinePlaces(stateAbbr) {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(['places'], 'readonly').objectStore('places').getAll();
    request.onsuccess = () => resolve(request.result.filter(p => p._stateAbbr === stateAbbr));
    request.onerror   = () => reject(request.error);
  });
}

export async function isStateDownloaded(stateAbbr) {
  const db = await initOfflineDB();
  return new Promise(resolve => {
    const request = db.transaction(['states'], 'readonly').objectStore('states').get(stateAbbr);
    request.onsuccess = () => resolve(!!request.result);
    request.onerror   = () => resolve(false);
  });
}

export async function getDownloadedStates() {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(['states'], 'readonly').objectStore('states').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

export async function deleteOfflineState(stateAbbr) {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['states', 'places'], 'readwrite');
    tx.objectStore('states').delete(stateAbbr);
    const store = tx.objectStore('places');
    const req   = store.getAll();
    req.onsuccess = () => req.result.filter(p => p._stateAbbr === stateAbbr).forEach(p => store.delete(p.id));
    tx.oncomplete = () => resolve(true);
    tx.onerror    = () => reject(tx.error);
  });
}

export async function getStorageInfo() {
  const states = await getDownloadedStates();
  let totalSize = 0;
  states.forEach(s => { totalSize += s.size || 0; });
  return { statesDownloaded: states.length, totalSizeMB: (totalSize / 1024 / 1024).toFixed(1), states };
}

export function isOffline() {
  return !navigator.onLine;
}

export function onConnectivityChange(callback) {
  window.addEventListener('online',  () => callback(true));
  window.addEventListener('offline', () => callback(false));
}
