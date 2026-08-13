const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

function normalizeRole(role) {
  if (!role) return '';
  const r = role.toString().trim();
  const lower = r.toLowerCase().replace(/[\s_-]/g, '');
  if (lower === 'schooladmin') return 'schoolAdmin';
  if (lower === 'superadmin') return 'superAdmin';
  if (lower === 'teacher' || lower === 'faculty') return 'teacher';
  if (lower === 'student') return 'student';
  if (lower === 'parent') return 'parent';
  return r;
}

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({
        users: [],
        schools: [],
        admissions: [],
        demoRequests: [],
        contactMessages: [],
        systemLogs: [],
        superAdminNotifications: [],
        superAdminAcademicTemplates: [],
        parentSupportConversations: [],
        classes: [],
        subjects: [],
        teacherAssignments: [],
        feeStructures: [],
        monthlyFees: [],
        receipts: [],
        exams: [],
        results: [],
        notices: [],
        gallery: [],
        fees: [],
        timetable: [],
        gradeScale: [],
        settings: [],
        attendance: {},
        qrSessions: [],
        homework: []
      }, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('[Database] ensureDb filesystem operation skipped (expected on read-only environments like Vercel):', err.message);
  }
}

const cp = require('child_process');
const useFirestore = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.USE_FIRESTORE === 'true';

let dbCache = null;
let initPromise = null;

async function getAccessTokenAsync() {
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
    const crypto = require('crypto');
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

async function fetchAllFromFirestoreAsync() {
  const keys = [
    'users', 'schools', 'admissions', 'demoRequests', 'contactMessages', 'systemLogs',
    'superAdminNotifications', 'superAdminAcademicTemplates', 'parentSupportConversations',
    'classes', 'subjects', 'teacherAssignments', 'feeStructures', 'monthlyFees', 'receipts',
    'exams', 'results', 'notices', 'gallery', 'fees', 'timetable', 'gradeScale',
    'settings', 'attendance', 'qrSessions', 'homework', 'schoolAdminAttendance'
  ];
  
  const token = await getAccessTokenAsync();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/smart-school-management-66f78/databases/(default)/documents/database';
  
  try {
    const promises = keys.map(async key => {
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
    });
    const results = await Promise.all(promises);
    return Object.fromEntries(results);
  } catch (err) {
    console.error('[Firestore Async] Fetch failed:', err);
    return null;
  }
}

const DEFAULT_DB = {
  users: [
    {
      id: "super_admin_saad",
      email: "muhammadsaadweb10@gmail.com",
      password: "$2a$10$.6gOfk3ceV/KrKuSfAieYO.p5qnmxsvvXhSv1.WKsXwFk1aYidk9O",
      name: "Muhammad Saad",
      role: "superAdmin",
      status: "Active",
      schoolId: "SYSTEM",
      schoolName: "System Super Admin",
      createdAt: "2026-08-13T07:26:28.637Z"
    },
    {
      id: "1786606210437",
      name: "Admin of Tanveer medaveer",
      email: "tanveermedaveer@gmail.com",
      phone: "03103716116",
      username: "admin_tanveermedaveer",
      password: "$2a$10$VwtbmLH.2pFFveWXPrBMzORHKTteiyj56EBvbaMrMDmO0PAGH9Iia",
      role: "schoolAdmin",
      status: "Active",
      schoolId: "1786606210435",
      isTemporaryPassword: false
    },
    {
      name: "Sadaf",
      email: "muhammadsadaf010@gmail.com",
      phone: "03103716116",
      username: "Sadaf",
      password: "$2a$10$FiCjkRPbAT0Kjh0lzZN6hObJUVRwHr6Td.9BFE9fcRYOPMdwtOqtm",
      schoolId: "1786606210435",
      status: "Active",
      role: "schoolAdmin",
      id: "1786606287197",
      isTemporaryPassword: true
    }
  ],
  schools: [
    {
      id: "1786606210435",
      name: "Tanveer medaveer",
      code: "12201",
      email: "tanveermedaveer@gmail.com",
      phone: "03103716116",
      address: "AHMADABAD D IKHAN",
      city: "D I KHAN",
      classes: "1st to 10th",
      description: "yes",
      logo: ""
    }
  ]
};

function sanitizeCache(cache) {
  if (!cache || typeof cache !== 'object') {
    cache = JSON.parse(JSON.stringify(DEFAULT_DB));
  }
  const keys = [
    'users', 'schools', 'admissions', 'demoRequests', 'contactMessages', 'systemLogs',
    'superAdminNotifications', 'superAdminAcademicTemplates', 'parentSupportConversations',
    'classes', 'subjects', 'teacherAssignments', 'feeStructures', 'monthlyFees', 'receipts',
    'exams', 'results', 'notices', 'gallery', 'fees', 'timetable', 'gradeScale',
    'settings', 'attendance', 'qrSessions', 'homework', 'schoolAdminAttendance'
  ];
  keys.forEach(key => {
    if (!cache[key]) {
      cache[key] = DEFAULT_DB[key] || [];
    }
  });
  return cache;
}

async function initDb() {
  if (dbCache) return dbCache;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    if (useFirestore) {
      console.log('[Firestore Async] Fetching database...');
      const data = await fetchAllFromFirestoreAsync();
      if (data && Object.keys(data).length > 0 && data.users && data.users.length > 0) {
        dbCache = sanitizeCache(data);
        console.log('[Firestore Async] Loaded successfully.');
        return dbCache;
      }
      console.log('[Firestore Async] Database empty or fetch failed. Seeding from local file...');
    }
    
    ensureDb();
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      dbCache = sanitizeCache(JSON.parse(raw));
      
      // Async seed to firestore if empty
      if (useFirestore && dbCache) {
        console.log('[Firestore Async] Triggering background seed...');
        writeToFirestoreAsync(dbCache).catch(err => {
          console.error('[Firestore Async] Background seed failed:', err);
        });
      }
      
      return dbCache;
    } catch (err) {
      console.error('Error reading database file:', err);
      dbCache = sanitizeCache(null);
      return dbCache;
    }
  })();
  
  return initPromise;
}

function readDb() {
  if (dbCache) {
    return dbCache;
  }
  // Synchronous fallback for local dev startup (non-vercel, non-async context)
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    dbCache = sanitizeCache(JSON.parse(raw));
    return dbCache;
  } catch (err) {
    console.error('Error reading database file synchronously:', err);
    dbCache = sanitizeCache(null);
    return dbCache;
  }
}

async function writeToFirestoreAsync(changedData) {
  const token = await getAccessTokenAsync();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/smart-school-management-66f78/databases/(default)/documents/database';
  
  const promises = Object.keys(changedData).map(async key => {
    const body = {
      fields: {
        data: {
          stringValue: JSON.stringify(changedData[key])
        }
      }
    };
    const url = `${FIRESTORE_BASE}/${key}?updateMask.fieldPaths=data`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    });
    return res.status;
  });
  
  await Promise.all(promises);
}

function writeDb(data) {
  const oldCache = dbCache;
  dbCache = data;

  ensureDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }

  if (useFirestore && oldCache) {
    const changedData = {};
    let hasChanges = false;
    for (const key in data) {
      if (JSON.stringify(data[key]) !== JSON.stringify(oldCache[key])) {
        changedData[key] = data[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      console.log('[Firestore Async] Syncing changed collections:', Object.keys(changedData));
      writeToFirestoreAsync(changedData).catch(err => {
        console.error('[Firestore Async] Background sync failed:', err);
      });
    }
  }
}

// Maps frontend localStorage key names to backend JSON array property names
const KEY_MAP = {
  schoolAdminUsers: 'users',
  schoolAdminClasses: 'classes',
  schoolAdminSubjects: 'subjects',
  schoolAdminTeacherAssignments: 'teacherAssignments',
  schoolAdminFeeStructures: 'feeStructures',
  schoolAdminMonthlyFees: 'monthlyFees',
  schoolAdminReceipts: 'receipts',
  schoolAdminExams: 'exams',
  schoolAdminResults: 'results',
  schoolAdminNotices: 'notices',
  schoolAdminGallery: 'gallery',
  schoolAdminFees: 'fees',
  schoolAdminTimetable: 'timetable',
  schoolAdminGradeScale: 'gradeScale',
  schoolAdminSettings: 'settings',
  teacherMarks: 'results',
  teacherHomework: 'homework',
  admissions: 'admissions',
  schools: 'schools',
  demoRequests: 'demoRequests',
  contactMessages: 'contactMessages',
  systemLogs: 'systemLogs',
  superAdminNotifications: 'superAdminNotifications',
  superAdminAcademicTemplates: 'superAdminAcademicTemplates',
  parentSupportConversations: 'parentSupportConversations'
};

function getCollection(key, schoolId) {
  const db = readDb();
  const prop = KEY_MAP[key] || key;
  const list = db[prop] || [];
  
  if (!schoolId || schoolId === 'SYSTEM') {
    return list;
  }
  
  if (prop === 'schools') {
    return list.filter(item => item.id && item.id.toString() === schoolId.toString());
  }

  return list.filter(item => {
    const itemSchoolId = item.schoolId || item.school_id;
    return itemSchoolId && itemSchoolId.toString() === schoolId.toString();
  });
}

function saveCollection(key, schoolId, updatedItems) {
  const db = readDb();
  const prop = KEY_MAP[key] || key;
  
  if (!db[prop]) {
    db[prop] = [];
  }

  const items = Array.isArray(updatedItems) ? updatedItems : [];

  if (prop === 'users') {
    const hashedItems = items.map(u => {
      const oldUser = db.users.find(ou => ou.id && ou.id.toString() === u.id.toString());
      
      const mergedUser = oldUser ? { ...oldUser, ...u } : { ...u };
      
      let password = u.password;
      if (password && password.toString().trim() !== '') {
        if (!password.startsWith('$2')) {
          const salt = bcrypt.genSaltSync(10);
          password = bcrypt.hashSync(password, salt);
        }
      } else if (oldUser) {
        password = oldUser.password;
      }

      let parentPassword = u.parentPassword;
      if (parentPassword && parentPassword.toString().trim() !== '') {
        if (!parentPassword.startsWith('$2')) {
          const salt = bcrypt.genSaltSync(10);
          parentPassword = bcrypt.hashSync(parentPassword, salt);
        }
      } else if (oldUser) {
        parentPassword = oldUser.parentPassword;
      }

      mergedUser.password = password;
      mergedUser.parentPassword = parentPassword;
      
      if (mergedUser.password === undefined) delete mergedUser.password;
      if (mergedUser.parentPassword === undefined) delete mergedUser.parentPassword;

      return mergedUser;
    });

    if (!schoolId || schoolId === 'SYSTEM') {
      // Super Admin is saving School Admins
      const nonSchoolAdmins = db.users.filter(u => {
        const role = normalizeRole(u.role);
        return role !== 'schoolAdmin';
      });
      db.users = [...nonSchoolAdmins, ...hashedItems];
    } else {
      // School Admin is saving their school's users (teachers, students, parents)
      // We must preserve:
      // 1. Users of other schools (u.schoolId !== schoolId)
      // 2. School Admins of this school (u.schoolId === schoolId && role === 'schoolAdmin')
      // 3. Super Admin
      const usersToKeep = db.users.filter(u => {
        const uSchoolId = u.schoolId || u.school_id;
        const role = normalizeRole(u.role);
        const isThisSchool = uSchoolId && uSchoolId.toString() === schoolId.toString();
        return !isThisSchool || role === 'schoolAdmin' || role === 'superAdmin';
      });
      
      const stampedItems = hashedItems
        .filter(item => {
          const role = normalizeRole(item.role);
          return role !== 'schoolAdmin' && role !== 'superAdmin';
        })
        .map(item => ({
          ...item,
          schoolId: schoolId
        }));
      
      db.users = [...usersToKeep, ...stampedItems];
    }
  } else {
    if (!schoolId || schoolId === 'SYSTEM') {
      db[prop] = items;
    } else {
      // Keep other schools' data, replace only this school's data
      const otherSchools = db[prop].filter(item => {
        const itemSchoolId = item.schoolId || item.school_id;
        return !itemSchoolId || itemSchoolId.toString() !== schoolId.toString();
      });
      
      const stampedItems = items.map(item => ({
        ...item,
        schoolId: schoolId
      }));

      db[prop] = [...otherSchools, ...stampedItems];
    }
  }

  writeDb(db);
}

module.exports = {
  readDb,
  writeDb,
  initDb,
  getCollection,
  saveCollection,
  KEY_MAP
};
