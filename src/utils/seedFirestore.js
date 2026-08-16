/**
 * seedFirestore.js
 * Run this script to seed default initial data into your new Firebase Firestore Database.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const projectId = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID ? import.meta.env.VITE_FIREBASE_PROJECT_ID : 'smart-school-management-9ffe3';

const firebaseConfig = {
  apiKey: "AIzaSyANTZA3cfuBMhX_awV0r3ppHwSTsKrr4A0",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.firebasestorage.app`,
  messagingSenderId: "827262974475",
  appId: "1:827262974475:web:683d931e25440c3247a50e",
  measurementId: "G-MCCHNGMS6M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const initialSuperAdmin = {
  email: 'muhammadsaadweb10@gmail.com',
  name: 'Muhammad Saad',
  role: 'superAdmin',
  status: 'Active',
  schoolId: 'SYSTEM',
  schoolName: 'System Super Admin'
};

const initialSchools = [
  {
    id: 'SCH-101',
    schoolId: 'SCH-101',
    name: 'Green Valley High School',
    code: 'GVHS',
    email: 'admin@greenvalley.edu',
    phone: '+92 300 1234567',
    address: '123 Education Avenue, Lahore',
    city: 'Lahore',
    principalName: 'Dr. Ahmad Khan',
    subscriptionPlan: 'Enterprise',
    subscriptionStatus: 'Active',
    maxStudents: 1000,
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

export async function seedInitialData() {
  console.log('[Seed] Seeding initial Super Admin & School data into Firestore...');
  try {
    // 1. Seed Super Admin Profile in Firestore
    await setDoc(doc(db, 'users', 'superadmin_default'), initialSuperAdmin);
    console.log('[Seed] Super Admin profile seeded to Firestore (users/superadmin_default)');

    // 2. Seed Initial Schools
    for (const school of initialSchools) {
      await setDoc(doc(doc(db, 'schools', school.id).path), school);
      console.log(`[Seed] School ${school.name} seeded to Firestore.`);
    }

    return true;
  } catch (error) {
    console.error('[Seed] Error seeding data:', error);
    return false;
  }
}
