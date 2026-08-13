const admin = require('firebase-admin');

const fs = require('fs');
const changedDataRaw = fs.readFileSync(0, 'utf-8');
const changedData = JSON.parse(changedDataRaw);

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountStr) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountStr))
  });
} else {
  admin.initializeApp({
    projectId: 'smart-school-management-66f78'
  });
}

const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

const promises = Object.keys(changedData).map(async key => {
  const val = JSON.stringify(changedData[key]);
  return db.collection('database').doc(key).set({ data: val });
});

Promise.all(promises).then(() => {
  console.log('Sync complete');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
