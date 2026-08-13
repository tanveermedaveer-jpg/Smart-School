const admin = require('firebase-admin');

const keys = [
  'users', 'schools', 'admissions', 'demoRequests', 'contactMessages', 'systemLogs',
  'superAdminNotifications', 'superAdminAcademicTemplates', 'parentSupportConversations',
  'classes', 'subjects', 'teacherAssignments', 'feeStructures', 'monthlyFees', 'receipts',
  'exams', 'results', 'notices', 'gallery', 'fees', 'timetable', 'gradeScale',
  'settings', 'attendance', 'qrSessions', 'homework', 'schoolAdminAttendance'
];

if (!admin.apps.length) {
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
}

const db = admin.firestore();

Promise.all(keys.map(async key => {
  try {
    const doc = await db.collection('database').doc(key).get();
    if (doc.exists) {
      const data = doc.data().data;
      return [key, data ? JSON.parse(data) : []];
    }
    return [key, []];
  } catch (err) {
    return [key, []];
  }
})).then(results => {
  console.log(JSON.stringify(Object.fromEntries(results)));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
