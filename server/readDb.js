const crypto = require('crypto');

const keys = [
  'users', 'schools', 'admissions', 'demoRequests', 'contactMessages', 'systemLogs',
  'superAdminNotifications', 'superAdminAcademicTemplates', 'parentSupportConversations',
  'classes', 'subjects', 'teacherAssignments', 'feeStructures', 'monthlyFees', 'receipts',
  'exams', 'results', 'notices', 'gallery', 'fees', 'timetable', 'gradeScale',
  'settings', 'attendance', 'qrSessions', 'homework', 'schoolAdminAttendance'
];

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/smart-school-management-66f78/databases/(default)/documents/database';

async function getAccessToken() {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountStr) return null;
  
  try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    const header = JSON.stringify({ alg: 'RS256', typ: 'JWT' });
    const headerBase64 = Buffer.from(header).toString('base64url');
    
    const now = Math.floor(Date.now() / 1000);
    const claim = JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    });
    const claimBase64 = Buffer.from(claim).toString('base64url');
    
    const jwtInput = `${headerBase64}.${claimBase64}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(jwtInput);
    
    const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
    const signature = sign.sign(privateKey, 'base64url');
    const assertion = `${jwtInput}.${signature}`;
    
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`
    });
    const json = await res.json();
    return json.access_token;
  } catch (err) {
    console.error('Failed to authenticate service account:', err);
    return null;
  }
}

async function run() {
  const token = await getAccessToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const results = await Promise.all(keys.map(async key => {
    try {
      const res = await fetch(`${FIRESTORE_BASE}/${key}`, { headers });
      if (res.status === 404) return [key, []];
      const json = await res.json();
      if (json.fields && json.fields.data && json.fields.data.stringValue) {
        return [key, JSON.parse(json.fields.data.stringValue)];
      }
      return [key, []];
    } catch (err) {
      return [key, []];
    }
  }));
  
  console.log(JSON.stringify(Object.fromEntries(results)));
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
