/**
 * firebase/config.js — Firebase App Initialization
 *
 * Connected to Firebase Project: smart-school-management-66f78
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyANTZA3cfuBMhX_awV0r3ppHwSTsKrr4A0",
  authDomain: "smart-school-management-66f78.firebaseapp.com",
  projectId: "smart-school-management-66f78",
  storageBucket: "smart-school-management-66f78.firebasestorage.app",
  messagingSenderId: "827262974475",
  appId: "1:827262974475:web:683d931e25440c3247a50e",
  measurementId: "G-MCCHNGMS6M"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
