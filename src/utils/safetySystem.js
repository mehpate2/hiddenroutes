import { db, auth } from '../firebase';
import {
  collection, addDoc, updateDoc,
  doc, getDoc, getDocs, query,
  where, onSnapshot, serverTimestamp,
} from 'firebase/firestore';

export async function startSafetyTrip(tripData) {
  const user = auth.currentUser;
  if (!user) return null;

  const trip = await addDoc(collection(db, 'safety_trips'), {
    userId: user.uid,
    userName: user.displayName,
    userPhoto: user.photoURL,
    placeName: tripData.placeName,
    placeCoordinates: tripData.coordinates,
    destination: tripData.destination,
    expectedReturnTime: tripData.returnTime,
    buddyEmails: tripData.buddyEmails,
    status: 'active',
    lastCheckIn: serverTimestamp(),
    currentLocation: null,
    startedAt: serverTimestamp(),
    notes: tripData.notes || '',
    emergencyContact: tripData.emergencyContact,
    vehicleInfo: tripData.vehicleInfo || '',
  });

  await notifyBuddies(trip.id, tripData, user);
  return trip.id;
}

export async function updateLocation(tripId, lat, lng) {
  await updateDoc(doc(db, 'safety_trips', tripId), {
    currentLocation: { lat, lng },
    lastCheckIn: serverTimestamp(),
  });
}

export async function checkInSafe(tripId, message) {
  await updateDoc(doc(db, 'safety_trips', tripId), {
    lastCheckIn: serverTimestamp(),
    status: 'checked_in',
    lastMessage: message || 'All good!',
  });
}

export async function completeTrip(tripId) {
  await updateDoc(doc(db, 'safety_trips', tripId), {
    status: 'completed',
    completedAt: serverTimestamp(),
  });
}

export async function sendSOS(tripId, location) {
  await updateDoc(doc(db, 'safety_trips', tripId), {
    status: 'SOS',
    sosLocation: location,
    sosTime: serverTimestamp(),
  });

  const tripDoc = await getDoc(doc(db, 'safety_trips', tripId));
  const trip = tripDoc.data();

  await addDoc(collection(db, 'sos_alerts'), {
    tripId,
    userId: trip.userId,
    userName: trip.userName,
    location,
    placeName: trip.placeName,
    buddyEmails: trip.buddyEmails,
    emergencyContact: trip.emergencyContact,
    sentAt: serverTimestamp(),
    message: `🆘 SOS ALERT: ${trip.userName} needs help at ${trip.placeName}!`,
  });
}

export function watchTrip(tripId, callback) {
  return onSnapshot(doc(db, 'safety_trips', tripId), snap => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export async function getUserTrips(userId) {
  const snap = await getDocs(
    query(collection(db, 'safety_trips'), where('userId', '==', userId))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBuddyTrips(email) {
  const snap = await getDocs(
    query(collection(db, 'safety_trips'), where('buddyEmails', 'array-contains', email))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function notifyBuddies(tripId, tripData, user) {
  await addDoc(collection(db, 'buddy_notifications'), {
    tripId,
    type: 'trip_started',
    fromUser: user.displayName,
    fromEmail: user.email,
    toEmails: tripData.buddyEmails,
    placeName: tripData.placeName,
    returnTime: tripData.returnTime,
    trackingUrl: `${window.location.origin}/track/${tripId}`,
    sentAt: serverTimestamp(),
    message: `${user.displayName} is heading to ${tripData.placeName} and has added you as a safety buddy. Track their location: ${window.location.origin}/track/${tripId}`,
  });
}
