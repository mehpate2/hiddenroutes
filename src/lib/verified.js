/*
 * Explore AI — Proprietary Software
 * Copyright (c) 2025 Mehul Patel. All rights reserved.
 */
import {
  collection, addDoc, getDocs, query, where, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export async function saveVerifiedPlace(place) {
  // Dedup by source id
  const q = query(collection(db, 'verified_places'), where('sourceId', '==', place.id), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) return { id: snap.docs[0].id, exists: true };

  const ref = await addDoc(collection(db, 'verified_places'), {
    sourceId:    place.id,
    name:        place.name,
    description: place.description,
    address:     place.address,
    coordinates: place.coordinates || null,
    category:    place.category,
    type:        place.type,
    source:      'personal_collection',
    verified:    true,
    state:       'California',
    addedAt:     serverTimestamp(),
  });
  return { id: ref.id, exists: false };
}

export async function getVerifiedPlacesForState(stateName) {
  const q = query(
    collection(db, 'verified_places'),
    where('verified', '==', true),
    where('state',    '==', stateName),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getVerifiedPlaceIds() {
  const snap = await getDocs(collection(db, 'verified_places'));
  const ids = new Set();
  snap.docs.forEach(d => { if (d.data().sourceId) ids.add(d.data().sourceId); });
  return ids;
}
