/**
 * initStorage.js
 *
 * DEPRECATED: This module was used for localStorage initialization.
 * With Firebase, initialization is handled by Firestore seed scripts.
 * 
 * This file is kept as a no-op for backward compatibility during migration.
 */

export function initializeStorage() {
  // No-op: Firebase Firestore replaces localStorage.
  // Initial data is seeded via the Firebase Console or seed scripts.
  console.log('[initStorage] Using Firebase Firestore — localStorage initialization skipped.');
}

export function getAllUsersRaw() {
  // Deprecated: Use the async version from db.js instead.
  console.warn('[initStorage] getAllUsersRaw() is deprecated. Use db.getAllUsersRaw() instead.');
  return [];
}

export function persistUserUpdate(updatedUser) {
  // Deprecated: Use the async version from db.js instead.
  console.warn('[initStorage] persistUserUpdate() is deprecated. Use db.upsertUser() instead.');
}
