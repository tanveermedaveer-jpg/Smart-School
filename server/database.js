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

const DB_PATH = path.join(__dirname, 'data', 'db.json');

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

function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return {};
  }
}

function writeDb(data) {
  ensureDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
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
