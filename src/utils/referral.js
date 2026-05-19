import { db, auth } from '../firebase';
import {
  doc, getDoc, setDoc, updateDoc, increment,
  collection, addDoc, getDocs, query, where,
} from 'firebase/firestore';

export async function getReferralCode(userId) {
  const ref  = doc(db, 'referrals', userId);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data().code;

  const code = 'HR' + userId.slice(-6).toUpperCase();
  await setDoc(ref, {
    userId, code,
    referralCount: 0, successfulReferrals: 0, rewardsClaimed: 0,
    createdAt: new Date(),
  });
  return code;
}

export async function getReferralStats(userId) {
  const ref  = doc(db, 'referrals', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { referralCount: 0, successfulReferrals: 0, rewardsClaimed: 0 };
  return snap.data();
}

export async function processReferral(referralCode, newUserId) {
  if (!referralCode) return;
  const snap = await getDocs(query(collection(db, 'referrals'), where('code', '==', referralCode)));
  if (snap.empty) return;

  const referrerDoc = snap.docs[0];
  const referrerId  = referrerDoc.data().userId;

  await addDoc(collection(db, 'referral_signups'), {
    referrerId, referralCode, newUserId,
    status: 'pending', signedUpAt: new Date(),
  });

  await updateDoc(doc(db, 'referrals', referrerId), { referralCount: increment(1) });

  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await updateDoc(doc(db, 'users', newUserId),  { plan: 'explorer', planExpiry: expiry, referredBy: referrerId });
  await updateDoc(doc(db, 'users', referrerId), { plan: 'explorer', planExpiry: expiry, points: increment(100) });

  await addDoc(collection(db, 'notifications'), {
    userId: referrerId,
    type: 'referral_success',
    message: 'Someone used your referral code! You both get 1 month Explorer free 🎉',
    read: false,
    createdAt: new Date(),
  });
}

export async function getLeaderboard() {
  try {
    const snap = await getDocs(collection(db, 'referrals'));
    return snap.docs
      .map(d => d.data())
      .filter(d => d.referralCount > 0)
      .sort((a, b) => b.referralCount - a.referralCount)
      .slice(0, 10);
  } catch {
    return [];
  }
}
