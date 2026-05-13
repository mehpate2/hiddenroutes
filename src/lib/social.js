/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 */
import {
  collection, doc, setDoc, getDoc, getDocs, addDoc, deleteField,
  query, where, orderBy, limit, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const PLATFORMS = ['instagram', 'tiktok', 'snapchat'];

// ─── Connected Accounts ───────────────────────────────────────────────────────
export async function connectSocialAccount(uid, platform, username) {
  const clean = username.replace(/^@/, '').trim().toLowerCase();
  await setDoc(
    doc(db, 'users', uid, 'socialAccounts', platform),
    { username: `@${clean}`, connected: true, connectedAt: serverTimestamp(), postsImported: 0, watching: true },
    { merge: true },
  );
}

export async function disconnectSocialAccount(uid, platform) {
  await setDoc(
    doc(db, 'users', uid, 'socialAccounts', platform),
    { connected: false, disconnectedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function getSocialAccounts(uid) {
  const accounts = {};
  await Promise.all(PLATFORMS.map(async p => {
    const snap = await getDoc(doc(db, 'users', uid, 'socialAccounts', p));
    if (snap.exists()) accounts[p] = snap.data();
  }));
  return accounts;
}

// ─── Submissions ──────────────────────────────────────────────────────────────
export async function submitSocialPost(data) {
  const ref = await addDoc(collection(db, 'social_submissions'), {
    ...data,
    submittedAt: serverTimestamp(),
    status: (data.score || 0) >= 70 ? 'approved' : 'pending',
  });
  return ref.id;
}

export async function getApprovedSocialPlacesForState(stateName) {
  const q = query(
    collection(db, 'social_submissions'),
    where('status', '==', 'approved'),
    where('state',  '==', stateName),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getRecentSocialSubmissions(n = 12) {
  const q = query(
    collection(db, 'social_submissions'),
    where('status', '==', 'approved'),
    limit(n),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getSocialStats() {
  const snap = await getDocs(collection(db, 'social_submissions'));
  const docs = snap.docs.map(d => d.data());
  const byPlatform = { instagram: 0, tiktok: 0, snapchat: 0 };
  docs.forEach(d => { if (byPlatform[d.platform] !== undefined) byPlatform[d.platform]++; });
  return { total: docs.length, byPlatform };
}

// ─── Social Leaderboard ───────────────────────────────────────────────────────
export async function getSocialLeaderboard(n = 10) {
  const snap = await getDocs(collection(db, 'social_submissions'));
  const docs = snap.docs.map(d => d.data());
  const users = {};
  docs.forEach(d => {
    if (!d.username || !d.platform) return;
    const key = d.username;
    if (!users[key]) users[key] = { username: d.username, platforms: new Set(), count: 0 };
    users[key].count++;
    users[key].platforms.add(d.platform);
  });
  return Object.values(users)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map(u => ({ ...u, platforms: [...u.platforms] }));
}
