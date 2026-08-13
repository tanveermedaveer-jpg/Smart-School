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
}

const cp = require('child_process');
const useFirestore = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.USE_FIRESTORE === 'true';

let dbCache = null;

function fetchAllFromFirestore() {
  try {
    const result = cp.spawnSync(process.execPath, [path.join(process.cwd(), 'server', 'readDb.js')], {
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 50 * 1024 * 1024 // 50MB safe buffer
    });
    if (result.status === 0 && result.stdout.trim()) {
      return JSON.parse(result.stdout);
    } else {
      console.error('[Firestore Admin] Fetch process error:', result.stderr);
    }
  } catch (err) {
    console.error('[Firestore Admin] Fetch execution failed:', err);
  }
  return null;
}

function readDb() {
  if (dbCache) {
    return dbCache;
  }

  if (useFirestore) {
    console.log('[Firestore Admin] Fetching database...');
    const data = fetchAllFromFirestore();
    if (data && Object.keys(data).length > 0 && data.users && data.users.length > 0) {
      dbCache = data;
      console.log('[Firestore Admin] Loaded successfully.');
      return dbCache;
    }
    console.log('[Firestore Admin] Database empty or fetch failed. Seeding from local file...');
  }

  ensureDb();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    dbCache = JSON.parse(raw);
    
    // Seed Firestore asynchronously on startup
    if (useFirestore && dbCache) {
      console.log('[Firestore Admin] Seeding database to Firestore...');
      try {
        const child = cp.spawn(process.execPath, [
          path.join(process.cwd(), 'server', 'writeDb.js')
        ], { 
          stdio: ['pipe', 'ignore', 'ignore'], 
          detached: true,
          env: process.env
        });
        child.stdin.write(JSON.stringify(dbCache));
        child.stdin.end();
        child.unref();
      } catch (err) {
        console.error('[Firestore Admin] Async seed spawn failed:', err);
      }
    }
    
    return dbCache;
  } catch (err) {
    console.error('Error reading database file:', err);
    return {};
  }
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
      console.log('[Firestore Admin] Syncing changed collections:', Object.keys(changedData));
      try {
        const result = cp.spawnSync(process.execPath, [
          path.join(process.cwd(), 'server', 'writeDb.js')
        ], {
          encoding: 'utf8',
          input: JSON.stringify(changedData),
          env: process.env
        });
        if (result.status !== 0) {
          console.error('[Firestore Admin] Write process error:', result.stderr);
        }
      } catch (err) {
        console.error('[Firestore Admin] Write execution failed:', err);
      }
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
  getCollection,
  saveCollection,
  KEY_MAP
};
