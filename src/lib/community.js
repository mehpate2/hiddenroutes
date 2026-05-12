/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, arrayUnion,
  arrayRemove, increment, onSnapshot, startAfter,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

// ─── Points ──────────────────────────────────────────────────────────────────
export const POINTS = {
  submit:        10,
  approved:      50,
  review:        20,
  reviewHelpful: 5,
  dailyLogin:    2,
  firstState:    100,
};

export const LEVELS = [
  { name: 'Explorer',   min: 0,    color: '#00D2FF', badge: '🧭' },
  { name: 'Pathfinder', min: 200,  color: '#3b82f6', badge: '🗺️' },
  { name: 'Legend',     min: 1000, color: '#a855f7', badge: '⭐' },
  { name: 'Master',     min: 5000, color: '#FFB347', badge: '👑' },
];

export function getLevelInfo(points = 0) {
  let level = LEVELS[0];
  for (const l of LEVELS) { if (points >= l.min) level = l; }
  const idx  = LEVELS.indexOf(level);
  const next = LEVELS[idx + 1];
  const pct  = next
    ? Math.round(((points - level.min) / (next.min - level.min)) * 100)
    : 100;
  return { ...level, nextMin: next?.min ?? null, pct };
}

// ─── Badge awarding ───────────────────────────────────────────────────────────
const BADGE_THRESHOLDS = [
  { id: 'pathfinder', check: (d) => (d.points || 0) >= 200  },
  { id: 'legend',     check: (d) => (d.points || 0) >= 1000 },
  { id: 'master',     check: (d) => (d.points || 0) >= 5000 },
  { id: 'approved_1', check: (d) => (d.approvedCount || 0) >= 1  },
  { id: 'approved_5', check: (d) => (d.approvedCount || 0) >= 5  },
  { id: 'reviewer',   check: (d) => (d.reviewsCount  || 0) >= 5  },
];

async function checkAndGrantBadges(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return;
    const d = snap.data();
    const existing = d.badges || [];
    const newBadges = BADGE_THRESHOLDS
      .filter(b => !existing.includes(b.id) && b.check(d))
      .map(b => b.id);
    if (newBadges.length > 0) {
      await updateDoc(doc(db, 'users', uid), { badges: arrayUnion(...newBadges) });
    }
  } catch {}
}

// ─── User points / badges ─────────────────────────────────────────────────────
export async function awardPoints(uid, pts, reason) {
  const ref2 = doc(db, 'users', uid);
  await updateDoc(ref2, {
    points:           increment(pts),
    [`pointsLog.${Date.now()}`]: { pts, reason },
  });
  await checkAndGrantBadges(uid);
}

export async function getUserStats(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return { points: 0, submissions: 0, approved: 0, reviews: 0 };
  const d = snap.data();
  return {
    points:      d.points      || 0,
    submissions: d.submissionsCount || 0,
    approved:    d.approvedCount    || 0,
    reviews:     d.reviewsCount     || 0,
    badges:      d.badges           || [],
    level:       getLevelInfo(d.points || 0),
  };
}

// ─── Photo upload ─────────────────────────────────────────────────────────────
export async function uploadPlacePhoto(uid, file) {
  const path = `community/${uid}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ─── Submissions ──────────────────────────────────────────────────────────────
export async function submitPlace(uid, userName, userAvatar, data) {
  const docRef = await addDoc(collection(db, 'submissions'), {
    userId:      uid,
    userName,
    userAvatar:  userAvatar || '',
    name:        data.name,
    description: data.description,
    category:    data.category,
    coordinates: data.coordinates,
    photos:      data.photos || [],
    gpsVerified: data.gpsVerified || false,
    status:      'pending',
    confirmVotes: [],
    rejectVotes:  [],
    state:        data.state    || '',
    region:       data.region   || '',
    difficulty:   data.difficulty || 'Easy',
    bestTime:     data.bestTime   || '',
    localTip:     data.localTip   || '',
    isHidden:     true,
    aiVerified:   false,
    aiScore:      null,
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp(),
  });

  // Award points + increment counter
  await updateDoc(doc(db, 'users', uid), {
    points:           increment(POINTS.submit),
    submissionsCount: increment(1),
  });
  await checkAndGrantBadges(uid);

  // First submission badge
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (userSnap.exists() && (userSnap.data().submissionsCount || 0) === 1) {
    await updateDoc(doc(db, 'users', uid), { badges: arrayUnion('first_submit') });
  }

  // Notification for submitter
  await addNotification(uid, {
    type:    'submission_received',
    message: `Your place "${data.name}" is under review!`,
    placeId: docRef.id,
  });

  return docRef.id;
}

export async function getSubmissions(status = 'pending', pageSize = 20, lastDoc = null) {
  let q = query(
    collection(db, 'submissions'),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );
  if (lastDoc) q = query(q, startAfter(lastDoc));
  const snap = await getDocs(q);
  return { docs: snap.docs, lastDoc: snap.docs[snap.docs.length - 1] || null };
}

export async function getSubmissionById(id) {
  const snap = await getDoc(doc(db, 'submissions', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getUserSubmissions(uid) {
  const q = query(
    collection(db, 'submissions'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Voting ───────────────────────────────────────────────────────────────────
export async function voteOnSubmission(submissionId, uid, vote) {
  const ref2 = doc(db, 'submissions', submissionId);
  const snap = await getDoc(ref2);
  if (!snap.exists()) return;
  const d = snap.data();

  const alreadyConfirmed = (d.confirmVotes || []).includes(uid);
  const alreadyRejected  = (d.rejectVotes  || []).includes(uid);

  let update = {};
  if (vote === 'confirm') {
    if (alreadyConfirmed) return; // no double vote
    update = {
      confirmVotes: arrayUnion(uid),
      ...(alreadyRejected ? { rejectVotes: arrayRemove(uid) } : {}),
    };
  } else {
    if (alreadyRejected) return;
    update = {
      rejectVotes: arrayUnion(uid),
      ...(alreadyConfirmed ? { confirmVotes: arrayRemove(uid) } : {}),
    };
  }
  await updateDoc(ref2, { ...update, updatedAt: serverTimestamp() });

  // Auto-approve / reject threshold
  const freshSnap = await getDoc(ref2);
  const fd = freshSnap.data();
  const cv = (fd.confirmVotes || []).length;
  const rv = (fd.rejectVotes  || []).length;

  if (cv >= 5 && fd.status === 'pending') {
    await updateDoc(ref2, { status: 'approved', updatedAt: serverTimestamp() });
    await updateDoc(doc(db, 'users', fd.userId), {
      points:        increment(POINTS.approved),
      approvedCount: increment(1),
    });
    await checkAndGrantBadges(fd.userId);
    await addNotification(fd.userId, {
      type:    'place_approved',
      message: `Congratulations! "${fd.name}" was approved by the community! +${POINTS.approved} pts`,
      placeId: submissionId,
    });
  } else if (rv >= 5 && fd.status === 'pending') {
    await updateDoc(ref2, { status: 'rejected', updatedAt: serverTimestamp() });
    await addNotification(fd.userId, {
      type:    'place_rejected',
      message: `"${fd.name}" was not approved by the community this time.`,
      placeId: submissionId,
    });
  }
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export async function addReview(placeId, uid, userName, data) {
  const docRef = await addDoc(collection(db, 'reviews'), {
    placeId,
    userId:      uid,
    userName,
    rating:      data.rating,
    review:      data.review,
    photos:      data.photos   || [],
    stillHidden: data.stillHidden ?? true,
    helpfulVotes: [],
    createdAt:   serverTimestamp(),
  });

  await updateDoc(doc(db, 'users', uid), {
    points:       increment(POINTS.review),
    reviewsCount: increment(1),
  });

  return docRef.id;
}

export async function getReviews(placeId) {
  const q = query(
    collection(db, 'reviews'),
    where('placeId', '==', placeId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function markReviewHelpful(reviewId, uid) {
  const ref2 = doc(db, 'reviews', reviewId);
  const snap = await getDoc(ref2);
  if (!snap.exists()) return;
  const d = snap.data();
  if ((d.helpfulVotes || []).includes(uid)) return;
  await updateDoc(ref2, { helpfulVotes: arrayUnion(uid) });
  if (d.userId !== uid) {
    await updateDoc(doc(db, 'users', d.userId), {
      points: increment(POINTS.reviewHelpful),
    });
  }
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export async function getLeaderboard(n = 20) {
  const q = query(
    collection(db, 'users'),
    where('points', '>', 0),
    orderBy('points', 'desc'),
    limit(n),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({
    rank: i + 1,
    uid:  d.id,
    ...d.data(),
    level: getLevelInfo(d.data().points || 0),
  }));
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function addNotification(uid, data) {
  await addDoc(collection(db, 'notifications'), {
    uid,
    ...data,
    read:      false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeNotifications(uid, cb) {
  const q = query(
    collection(db, 'notifications'),
    where('uid', '==', uid),
    where('read', '==', false),
    orderBy('createdAt', 'desc'),
    limit(20),
  );
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, 'notifications', id), { read: true });
}

export async function markAllNotificationsRead(uid) {
  const q = query(
    collection(db, 'notifications'),
    where('uid', '==', uid),
    where('read', '==', false),
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { read: true })));
}

// ─── Discover feed ────────────────────────────────────────────────────────────
export async function getDiscoverFeed(pageSize = 12, lastDoc = null) {
  let q = query(
    collection(db, 'submissions'),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );
  if (lastDoc) q = query(q, startAfter(lastDoc));
  const snap = await getDocs(q);
  return { docs: snap.docs, lastDoc: snap.docs[snap.docs.length - 1] || null };
}

// ─── AI verify helper (calls backend) ────────────────────────────────────────
export async function verifyPlaceWithAI(name, description, category, coordinates) {
  const res = await fetch('/api/verify-place', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, description, category, coordinates }),
  });
  if (!res.ok) return { score: 0, verdict: 'error', reason: 'AI service unavailable' };
  return res.json();
}
