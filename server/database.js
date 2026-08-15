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
const DB_PATH_ALT = path.join(__dirname, 'data', 'db.json');

function findDbPath() {
  if (fs.existsSync(DB_PATH)) return DB_PATH;
  if (fs.existsSync(DB_PATH_ALT)) return DB_PATH_ALT;
  return DB_PATH; // default fallback
}

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

// Load local .env file if it exists (for local development database/secret matching)
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    console.log('[Database] Loaded local .env configuration.');
  }
} catch (e) {
  console.warn('[Database] Failed to read local .env file:', e.message);
}

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
    // Quick connectivity check: fetch 'users' first to verify access
    const probeRes = await fetch(`${FIRESTORE_BASE}/users`, { headers });
    if (probeRes.status === 403) {
      console.log('[Firestore Async] Permission denied (403). Skipping Firestore.');
      return null;
    }

    const promises = keys.map(async key => {
      try {
        // Reuse probe result for 'users' to avoid duplicate fetch
        const res = key === 'users' ? probeRes : await fetch(`${FIRESTORE_BASE}/${key}`, { headers });
        if (res.status === 404) return [key, []];
        const json = key === 'users' ? await probeRes.json() : await res.json();
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
    }
  ],
  schools: []
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

function ensureSuperAdminInMemory(db) {
  const superAdminEmail = 'muhammadsaadweb10@gmail.com';
  const existingAdmin = db.users.find(u => normalizeRole(u.role) === 'superAdmin');
  
  let isCorrect = false;
  if (existingAdmin && existingAdmin.email === superAdminEmail && existingAdmin.password) {
    if (existingAdmin.password.startsWith('$2')) {
      try {
        isCorrect = bcrypt.compareSync('Saaddev10@', existingAdmin.password);
      } catch (e) {
        isCorrect = false;
      }
    } else {
      isCorrect = (existingAdmin.password === 'Saaddev10@');
    }
  }
  
  if (!isCorrect) {
    console.log('[Database] Re-registering/updating Super Admin password...');
    db.users = db.users.filter(u => normalizeRole(u.role) !== 'superAdmin');
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('Saaddev10@', salt);
    
    const superAdmin = {
      id: 'super_admin_saad',
      email: superAdminEmail,
      password: hashedPassword,
      name: 'Muhammad Saad',
      role: 'superAdmin',
      status: 'Active',
      schoolId: 'SYSTEM',
      schoolName: 'System Super Admin',
      createdAt: new Date().toISOString()
    };
    
    db.users.unshift(superAdmin);
    return true; // updated
  }
  return false;
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
        const changed = ensureSuperAdminInMemory(dbCache);
        if (changed) {
          console.log('[Firestore Async] Syncing updated Super Admin to Firestore...');
          writeToFirestoreAsync({ users: dbCache.users }).catch(err => {
            console.error('[Firestore Async] Syncing Super Admin failed:', err);
          });
        }
        return dbCache;
      }
      console.log('[Firestore Async] Database empty or fetch failed. Seeding from local file...');
    }
    
    ensureDb();
    try {
      const resolvedPath = findDbPath();
      console.log('[Database] Reading from:', resolvedPath);
      const raw = fs.readFileSync(resolvedPath, 'utf8');
      dbCache = sanitizeCache(JSON.parse(raw));
      
      const changed = ensureSuperAdminInMemory(dbCache);
      if (changed) {
        console.log('[Database] Updating local database file with correct Super Admin...');
        try {
          fs.writeFileSync(resolvedPath, JSON.stringify(dbCache, null, 2), 'utf8');
        } catch (e) {
          // ignore read-only filesystems
        }
      }
      
      // Async seed to firestore if empty
      if (useFirestore && dbCache) {
        console.log('[Firestore Async] Triggering background seed...');
        writeToFirestoreAsync(dbCache).catch(err => {
          console.error('[Firestore Async] Background seed failed:', err);
        });
      }
      
      return dbCache;
    } catch (err) {
      console.error('Error reading database file:', err.message);
      console.log('[Database] Falling back to DEFAULT_DB');
      dbCache = sanitizeCache(null);
      ensureSuperAdminInMemory(dbCache);
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
    const resolvedPath = findDbPath();
    const raw = fs.readFileSync(resolvedPath, 'utf8');
    dbCache = sanitizeCache(JSON.parse(raw));
    ensureSuperAdminInMemory(dbCache);
    return dbCache;
  } catch (err) {
    console.error('Error reading database file synchronously:', err);
    dbCache = sanitizeCache(null);
    ensureSuperAdminInMemory(dbCache);
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
  let list = db[prop] || [];
  
  if (prop === 'schools') {
    const settingsList = db.settings || [];
    const galleryList = db.gallery || [];
    list = list.map(school => {
      const schoolSettings = settingsList.find(s => s.schoolId && s.schoolId.toString() === school.id.toString());
      
      const schoolLogoItem = galleryList
        .filter(item => item.schoolId && item.schoolId.toString() === school.id.toString() && item.category === 'School Logo')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
        
      const schoolBannerItem = galleryList
        .filter(item => item.schoolId && item.schoolId.toString() === school.id.toString() && item.category === 'School Banner')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

      return {
        ...school,
        logo: schoolLogoItem ? schoolLogoItem.url : (schoolSettings?.logoUrl || ''),
        banner: schoolBannerItem ? schoolBannerItem.url : (schoolSettings?.bannerUrl || '')
      };
    });
  }
  
  if (prop === 'settings') {
    const galleryList = db.gallery || [];
    list = list.map(item => {
      const itemSchoolId = item.schoolId || item.school_id;
      if (!itemSchoolId) return item;
      
      const schoolLogoItem = galleryList
        .filter(g => g.schoolId && g.schoolId.toString() === itemSchoolId.toString() && g.category === 'School Logo')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
        
      const schoolBannerItem = galleryList
        .filter(g => g.schoolId && g.schoolId.toString() === itemSchoolId.toString() && g.category === 'School Banner')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

      return {
        ...item,
        logoUrl: schoolLogoItem ? schoolLogoItem.url : (item.logoUrl || ''),
        bannerUrl: schoolBannerItem ? schoolBannerItem.url : (item.bannerUrl || '')
      };
    });
  }
  
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

function performSchoolDeletionCascade(db, deletedSchoolId) {
  if (!deletedSchoolId) return;
  const sidStr = deletedSchoolId.toString();

  // 1. Delete all users belonging to this school
  db.users = (db.users || []).filter(u => {
    const uSchoolId = u.schoolId || u.school_id;
    return !uSchoolId || uSchoolId.toString() !== sidStr;
  });

  // 2. Delete all other collections' data for this school
  const collectionsToClean = [
    'admissions', 'classes', 'subjects', 'teacherAssignments',
    'feeStructures', 'monthlyFees', 'receipts', 'exams', 'results',
    'notices', 'gallery', 'fees', 'timetable', 'gradeScale', 'settings',
    'qrSessions', 'homework', 'schoolAdminAttendance'
  ];

  collectionsToClean.forEach(key => {
    if (db[key]) {
      if (Array.isArray(db[key])) {
        db[key] = db[key].filter(item => {
          const itemSchoolId = item.schoolId || item.school_id;
          return !itemSchoolId || itemSchoolId.toString() !== sidStr;
        });
      } else if (typeof db[key] === 'object') {
        if (db[key].schoolId || db[key].school_id) {
          const itemSchoolId = db[key].schoolId || db[key].school_id;
          if (itemSchoolId.toString() === sidStr) {
            db[key] = {};
          }
        }
      }
    }
  });
}

function saveCollection(key, schoolId, updatedItems) {
  const db = readDb();
  const prop = KEY_MAP[key] || key;
  
  if (!db[prop]) {
    db[prop] = [];
  }

  // Prevent non-Super Admin from writing to schools and superAdminAcademicTemplates
  if ((prop === 'schools' || prop === 'superAdminAcademicTemplates') && schoolId && schoolId !== 'SYSTEM') {
    console.warn(`[Database] Blocked non-Super Admin (schoolId: ${schoolId}) from modifying ${prop} collection.`);
    return;
  }

  // Wrap single objects in an array to support object-to-array serialization mismatch
  const items = Array.isArray(updatedItems) ? updatedItems : (updatedItems ? [updatedItems] : []);

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
      if (prop === 'schools') {
        const currentSchools = db.schools || [];
        const newSchoolIds = new Set(items.map(s => s.id && s.id.toString()));
        currentSchools.forEach(s => {
          if (s.id && !newSchoolIds.has(s.id.toString())) {
            console.log(`[Database] School ${s.name} (${s.id}) was deleted. Triggering cascading cleanup...`);
            performSchoolDeletionCascade(db, s.id);
          }
        });

        // Sync school logo/banner uploads to gallery and avoid duplicate storage
        if (!db.gallery) db.gallery = [];
        items.forEach(school => {
          const sidStr = school.id && school.id.toString();
          if (!sidStr) return;

          if (school.logo && school.logo.startsWith('data:image')) {
            // Remove previous school logos of this school to keep database tidy
            db.gallery = db.gallery.filter(item => 
              !(item.schoolId && item.schoolId.toString() === sidStr && item.category === 'School Logo')
            );
            db.gallery.push({
              id: 'logo-' + Date.now().toString() + '-' + Math.random().toString().substring(2, 6),
              schoolId: sidStr,
              url: school.logo,
              title: 'School Logo',
              category: 'School Logo',
              status: 'published',
              createdAt: new Date().toISOString()
            });
            school.logo = ''; // Clear base64 from school object in db.schools list
          }

          if (school.banner && school.banner.startsWith('data:image')) {
            // Remove previous school banners of this school
            db.gallery = db.gallery.filter(item => 
              !(item.schoolId && item.schoolId.toString() === sidStr && item.category === 'School Banner')
            );
            db.gallery.push({
              id: 'banner-' + Date.now().toString() + '-' + Math.random().toString().substring(2, 6),
              schoolId: sidStr,
              url: school.banner,
              title: 'School Banner',
              category: 'School Banner',
              status: 'published',
              createdAt: new Date().toISOString()
            });
            school.banner = ''; // Clear base64 from school object in db.schools list
          }
        });
      }
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

      // If saving school settings, ensure logoUrl/bannerUrl are saved to gallery
      if (prop === 'settings') {
        const settingsObj = stampedItems[0];
        if (settingsObj && schoolId) {
          if (!db.gallery) db.gallery = [];
          
          if (settingsObj.logoUrl) {
            const existingLogo = db.gallery.find(g => 
              g.schoolId && g.schoolId.toString() === schoolId.toString() && 
              g.category === 'School Logo' && g.url === settingsObj.logoUrl
            );
            if (!existingLogo) {
              db.gallery.push({
                id: 'logo-' + Date.now().toString(),
                schoolId: schoolId.toString(),
                url: settingsObj.logoUrl,
                title: 'School Logo',
                category: 'School Logo',
                status: 'published',
                createdAt: new Date().toISOString()
              });
            }
          }
          
          if (settingsObj.bannerUrl) {
            const existingBanner = db.gallery.find(g => 
              g.schoolId && g.schoolId.toString() === schoolId.toString() && 
              g.category === 'School Banner' && g.url === settingsObj.bannerUrl
            );
            if (!existingBanner) {
              db.gallery.push({
                id: 'banner-' + Date.now().toString(),
                schoolId: schoolId.toString(),
                url: settingsObj.bannerUrl,
                title: 'School Banner',
                category: 'School Banner',
                status: 'published',
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      }
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
  performSchoolDeletionCascade,
  KEY_MAP
};
