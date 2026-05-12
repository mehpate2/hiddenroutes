/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 * Unauthorized copying, modification, distribution,
 * or use of this software is strictly prohibited.
 * Built with Claude AI — confidential and private.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp, increment } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { getLevelInfo, subscribeNotifications, POINTS } from '../lib/community';

const AuthContext = createContext(null);

export const PLANS = {
  free:     { id: 'free',     name: 'Free',         price: 0,     statesLimit: 3,        placesLimit: 5,        routes: 0,        savedLimit: 0        },
  explorer: { id: 'explorer', name: 'Explorer',     price: 4.99,  statesLimit: 50,       placesLimit: 25,       routes: 3,        savedLimit: 20       },
  pro:      { id: 'pro',      name: 'Pro Traveler', price: 12.99, statesLimit: 50,       placesLimit: Infinity, routes: Infinity, savedLimit: Infinity },
};

async function createUserDoc(user, extraData = {}) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      plan: 'free',
      statesExplored: [],
      savedPlaces: [],
      routesPlanned: 0,
      // Community fields
      points:           0,
      submissionsCount: 0,
      approvedCount:    0,
      reviewsCount:     0,
      badges:           [],
      lastLoginDate:    new Date().toDateString(),
      createdAt:        serverTimestamp(),
      ...extraData,
    });
  }
}

async function getUserPlan(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data().plan || 'free') : 'free';
  } catch { return 'free'; }
}

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null);
  const [plan, setPlan]             = useState('free');
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [userPoints, setUserPoints] = useState(0);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let unsubNotif = null;
    let unsubUser  = null;
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await getUserPlan(u.uid);
        setPlan(p);

        // Real-time user doc listener — keeps points current mid-session
        unsubUser = onSnapshot(doc(db, 'users', u.uid), (snap) => {
          if (snap.exists()) setUserPoints(snap.data().points || 0);
        });

        // Real-time notifications
        unsubNotif = subscribeNotifications(u.uid, setNotifications);

        // Daily login points
        try {
          const today = new Date().toDateString();
          const snap  = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists() && snap.data()?.lastLoginDate !== today) {
            await updateDoc(doc(db, 'users', u.uid), {
              points:        increment(POINTS.dailyLogin),
              lastLoginDate: today,
            });
          }
        } catch {}
      } else {
        setPlan('free');
        setNotifications([]);
        setUserPoints(0);
        if (unsubNotif) { unsubNotif(); unsubNotif = null; }
        if (unsubUser)  { unsubUser();  unsubUser  = null; }
      }
      setLoading(false);
    });
    return () => { unsub(); if (unsubNotif) unsubNotif(); if (unsubUser) unsubUser(); };
  }, []);

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const p = await getUserPlan(cred.user.uid);
    setPlan(p);
    showToast('Welcome back! ✈️');
    return cred;
  }

  async function signup(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await firebaseUpdateProfile(cred.user, { displayName });
    await createUserDoc(cred.user, { displayName });
    try { await sendEmailVerification(cred.user); } catch {}
    setPlan('free');
    showToast('Account created! Check your email to verify 📧');
    return cred;
  }

  async function logout() {
    await signOut(auth);
    setPlan('free');
    showToast('Logged out. Safe travels! 👋', 'info');
  }

  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    await createUserDoc(cred.user);
    const p = await getUserPlan(cred.user.uid);
    setPlan(p);
    showToast('Welcome! 🌎');
    return cred;
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
    showToast('Reset email sent! Check your inbox 📧');
  }

  async function updateUserPlan(newPlan, extraFields = {}) {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), {
      plan: newPlan,
      updatedAt: serverTimestamp(),
      ...extraFields,
    }, { merge: true });
    setPlan(newPlan);
  }

  async function updateProfile(data) {
    if (!user) return;
    if (data.displayName || data.photoURL) {
      await firebaseUpdateProfile(user, {
        displayName: data.displayName || user.displayName,
        photoURL: data.photoURL || user.photoURL,
      });
    }
    await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    showToast('Profile updated!');
  }

  const planData        = PLANS[plan] || PLANS.free;
  const canAccessState  = (idx) => idx < planData.statesLimit;
  const canSave         = (count) => count < planData.savedLimit;
  const levelInfo       = getLevelInfo(userPoints);
  const unreadCount     = notifications.length;

  return (
    <AuthContext.Provider value={{
      user, plan, planData, loading, toast,
      login, signup, logout, loginWithGoogle, resetPassword,
      updateUserPlan, updateProfile,
      canAccessState, canSave,
      showToast,
      isConfigured: true,
      notifications, unreadCount,
      userPoints, levelInfo,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
