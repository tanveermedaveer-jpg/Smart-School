const fs = require('fs');
const path = require('path');

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

  writeDb(db);
}

module.exports = {
  readDb,
  writeDb,
  getCollection,
  saveCollection,
  KEY_MAP
};
