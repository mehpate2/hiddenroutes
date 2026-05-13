/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import {
  collection, doc, addDoc, getDocs, getDoc, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export const SUBREDDITS = [
  'hiking', 'CampingAndHiking', 'HiddenGems', 'offbeat', 'roadtrip',
  'travel', 'PNWhikers', 'socalhiking', 'Colorado', 'alaska',
  'hawaii', 'camping', 'NationalParks', 'backpacking',
];

// ─── Save ─────────────────────────────────────────────────────────────────────
export async function saveRedditPlaces(places, subreddit) {
  const saved = [];
  for (const place of places) {
    try {
      // Dedup by name + state
      const q = query(
        collection(db, 'reddit_places'),
        where('name', '==', place.name),
        where('state', '==', place.state),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) continue;

      const docRef = await addDoc(collection(db, 'reddit_places'), {
        name:        place.name        || '',
        description: place.description || '',
        state:       place.state       || '',
        city:        place.city        || '',
        coordinates: place.coordinates || null,
        category:    place.category    || 'nature',
        why_hidden:  place.why_hidden  || '',
        local_tip:   place.local_tip   || '',
        confidence:  place.confidence  || 'medium',
        source_url:  place.source_url  || '',
        upvotes:     place.upvotes     || 0,
        subreddit:   subreddit,
        importedAt:  serverTimestamp(),
        status:      'pending',
        approvedAt:  null,
        approveCount: 0,
        rejectCount:  0,
        addedToMap:   false,
      });
      saved.push({ id: docRef.id, ...place });
    } catch (err) {
      console.warn('[reddit] save failed:', err.message);
    }
  }
  return saved;
}

// ─── Read ─────────────────────────────────────────────────────────────────────
export async function getRedditPlaces({ status, stateFilter, conf } = {}) {
  const constraints = [];
  if (status)      constraints.push(where('status',     '==', status));
  if (stateFilter) constraints.push(where('state',      '==', stateFilter));
  if (conf)        constraints.push(where('confidence', '==', conf));
  constraints.push(limit(50));

  const q = query(collection(db, 'reddit_places'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
}

export async function getApprovedRedditPlacesForState(stateName) {
  const q = query(
    collection(db, 'reddit_places'),
    where('status', '==', 'approved'),
    where('state',  '==', stateName),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export async function approveRedditPlace(id) {
  await updateDoc(doc(db, 'reddit_places', id), {
    status:     'approved',
    approvedAt: serverTimestamp(),
    addedToMap: true,
  });
}

export async function rejectRedditPlace(id) {
  await updateDoc(doc(db, 'reddit_places', id), { status: 'rejected' });
}

export async function updateRedditPlace(id, data) {
  await updateDoc(doc(db, 'reddit_places', id), data);
}

export async function approveAllHighConfidence() {
  const q = query(
    collection(db, 'reddit_places'),
    where('status',     '==', 'pending'),
    where('confidence', '==', 'high'),
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => approveRedditPlace(d.id)));
  return snap.size;
}

export async function rejectAllLowConfidence() {
  const q = query(
    collection(db, 'reddit_places'),
    where('status',     '==', 'pending'),
    where('confidence', '==', 'low'),
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => rejectRedditPlace(d.id)));
  return snap.size;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function getRedditStats() {
  const snap = await getDocs(collection(db, 'reddit_places'));
  const docs = snap.docs.map(d => d.data());
  return {
    total:          docs.length,
    pending:        docs.filter(d => d.status === 'pending').length,
    approved:       docs.filter(d => d.status === 'approved').length,
    rejected:       docs.filter(d => d.status === 'rejected').length,
    highConfidence: docs.filter(d => d.confidence === 'high' && d.status === 'pending').length,
  };
}

export async function getRedditDiscoverStats() {
  const snap = await getDocs(collection(db, 'reddit_places'));
  const docs = snap.docs.map(d => d.data());
  const approved = docs.filter(d => d.status === 'approved');
  const mostUpvoted = approved.reduce((best, d) => (!best || d.upvotes > best.upvotes) ? d : best, null);
  const newest = approved.reduce((best, d) => (!best || (d.importedAt?.seconds || 0) > (best.importedAt?.seconds || 0)) ? d : best, null);

  const subCounts = {};
  docs.forEach(d => { if (d.subreddit) subCounts[d.subreddit] = (subCounts[d.subreddit] || 0) + 1; });
  const top = Object.entries(subCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    total:        approved.length,
    mostUpvoted,
    newest,
    topSubreddit: top ? { name: top[0], count: top[1] } : null,
  };
}

// ─── Pipeline save (with score + dedup) ──────────────────────────────────────
export async function savePipelineResult(place) {
  try {
    // Name+state dedup
    const nameQ = query(collection(db, 'reddit_places'), where('name', '==', place.name), where('state', '==', place.state), limit(1));
    const nameSnap = await getDocs(nameQ);
    if (!nameSnap.empty) return null;

    const docRef = await addDoc(collection(db, 'reddit_places'), {
      name:           place.name         || '',
      description:    place.description  || '',
      state:          place.state        || '',
      city:           place.city         || '',
      coordinates:    place.coordinates  || null,
      coordSource:    place.coordSource  || 'none',
      category:       place.category     || 'nature',
      why_hidden:     place.why_hidden   || '',
      local_tip:      place.local_tip    || '',
      confidence:     place.confidence   || 'medium',
      source_url:     place.source_url   || '',
      upvotes:        place.upvotes      || 0,
      commentCount:   place.commentCount || 0,
      subreddit:      place.subreddit    || '',
      score:          place.score        || 0,
      scoreBreakdown: place.scoreBreakdown || {},
      hiddenness:     place.hiddenness   || 0,
      beenThereCount: place.beenThereCount || 0,
      photosFound:    place.photosFound  || 0,
      photos:         place.photos       || [],
      verdict:        place.verdict      || 'pending',
      status:         place.verdict === 'auto_approved' ? 'approved' : place.verdict === 'auto_rejected' ? 'rejected' : 'pending',
      importedAt:     serverTimestamp(),
      approvedAt:     place.verdict === 'auto_approved' ? serverTimestamp() : null,
      addedToMap:     place.verdict === 'auto_approved',
      pipelineRun:    true,
    });
    return docRef.id;
  } catch (err) {
    console.warn('[pipeline] save failed:', err.message);
    return null;
  }
}

export async function getPipelineStats() {
  const snap = await getDocs(collection(db, 'reddit_places'));
  const docs = snap.docs.map(d => d.data());
  return {
    total:         docs.length,
    pending:       docs.filter(d => d.status === 'pending').length,
    approved:      docs.filter(d => d.status === 'approved').length,
    rejected:      docs.filter(d => d.status === 'rejected').length,
    autoApproved:  docs.filter(d => d.verdict === 'auto_approved').length,
    highConfidence: docs.filter(d => d.confidence === 'high' && d.status === 'pending').length,
    avgScore:      docs.length ? Math.round(docs.reduce((s, d) => s + (d.score || 0), 0) / docs.length) : 0,
  };
}

export async function getLastPipelineRun() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'redditPipeline'));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

export async function saveLastPipelineRun(data) {
  await setDoc(doc(db, 'settings', 'redditPipeline'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ─── Auto-import settings ─────────────────────────────────────────────────────
export async function getAutoImportSettings() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'autoImport'));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

export async function saveAutoImportSettings(data) {
  await setDoc(doc(db, 'settings', 'autoImport'), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
