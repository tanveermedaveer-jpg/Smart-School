/**
 * utils/db.js — Node.js Backend Integration Layer
 *
 * Implements REST API calls to replace direct Firebase/Firestore SDK calls.
 */

const BASE_URL = 'http://localhost:5001/api';

function getHeaders() {
  const token = sessionStorage.getItem('jwtToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

export function normalizeRole(role) {
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

export async function getSchools() {
  const res = await fetch(`${BASE_URL}/schools`, { headers: getHeaders() });
  return res.ok ? await res.json() : [];
}

export async function getSchoolById(schoolId) {
  const schools = await getSchools();
  return schools.find(s => s.id?.toString() === schoolId?.toString()) || null;
}

export async function saveSchools(schools) {
  await fetch(`${BASE_URL}/collections/schools`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(schools)
  });
}

export async function getAllUsersRaw() {
  const res = await fetch(`${BASE_URL}/collections/schoolAdminUsers`, { headers: getHeaders() });
  return res.ok ? await res.json() : [];
}

export async function getUsersBySchool(schoolId) {
  const res = await fetch(`${BASE_URL}/collections/schoolAdminUsers?schoolId=${schoolId}`, { headers: getHeaders() });
  return res.ok ? await res.json() : [];
}

export async function getUsersByRole(schoolId, role) {
  const users = await getUsersBySchool(schoolId);
  const normalizedTarget = normalizeRole(role);
  return users.filter(u => normalizeRole(u.role) === normalizedTarget);
}

export async function findUserForAuth(credential, password) {
  const users = await getAllUsersRaw();
  const searchId = credential.trim().toLowerCase();
  
  return users.find(u => {
    const uEmail = (u.email || '').toLowerCase();
    const uUsername = (u.username || '').toLowerCase();
    const uRoll = (u.rollNumber || '').toLowerCase();
    const role = normalizeRole(u.role);

    const isMatch = role === 'student'
      ? (uRoll === searchId || uUsername === searchId || uEmail === searchId)
      : (uEmail === searchId || uUsername === searchId);
      
    return isMatch && (u.password === password);
  }) || null;
}

export async function saveSchoolUsers(schoolId, updatedUsers) {
  await fetch(`${BASE_URL}/collections/schoolAdminUsers?schoolId=${schoolId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(updatedUsers)
  });
}

export async function saveSchoolAdmins(updatedAdmins) {
  await fetch(`${BASE_URL}/collections/schoolAdminUsers`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(updatedAdmins)
  });
}

export async function upsertUser(user) {
  const res = await fetch(`${BASE_URL}/users/${user.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    const users = await getAllUsersRaw();
    const exists = users.some(u => u.id === user.id);
    const updated = exists ? users.map(u => u.id === user.id ? user : u) : [...users, user];
    await saveSchoolAdmins(updated);
  }
}

export async function deleteUser(userId) {
  const users = await getAllUsersRaw();
  const updated = users.filter(u => u.id !== userId);
  await saveSchoolAdmins(updated);
}

export async function getClassesBySchool(schoolId) {
  return getCollection('schoolAdminClasses', schoolId);
}

export async function saveClasses(schoolId, updatedClasses) {
  return saveCollection('schoolAdminClasses', schoolId, updatedClasses);
}

export async function getCollection(key, schoolId) {
  const res = await fetch(`${BASE_URL}/collections/${key}?schoolId=${schoolId || ''}`, { headers: getHeaders() });
  return res.ok ? await res.json() : [];
}

export async function saveCollection(key, schoolId, updatedItems) {
  await fetch(`${BASE_URL}/collections/${key}?schoolId=${schoolId || ''}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(updatedItems)
  });
}

export async function getAdmissions() {
  return getCollection('admissions');
}

export async function saveAdmissions(admissions) {
  return saveCollection('admissions', null, admissions);
}

export async function getAttendance(schoolId) {
  const res = await fetch(`${BASE_URL}/collections/schoolAdminAttendance?schoolId=${schoolId}`, { headers: getHeaders() });
  if (res.ok) {
    const raw = await res.json();
    return Array.isArray(raw) ? raw : [];
  }
  return [];
}

export async function saveAttendance(schoolId, attendanceObj) {
  await saveCollection('schoolAdminAttendance', schoolId, attendanceObj);
}

export async function getSchoolSettings(schoolId, settingsKey) {
  const settings = await getCollection('schoolAdminSettings', schoolId);
  return settings.find(s => s.key === settingsKey)?.data || null;
}

export async function saveSchoolSettings(schoolId, settingsKey, data) {
  const settings = await getCollection('schoolAdminSettings', schoolId);
  const exists = settings.some(s => s.key === settingsKey);
  const updated = exists 
    ? settings.map(s => s.key === settingsKey ? { ...s, data } : s)
    : [...settings, { key: settingsKey, data }];
  await saveCollection('schoolAdminSettings', schoolId, updated);
}

export async function persistUserUpdate(user) {
  await upsertUser(user);
}

export async function getSuperAdminConfig() {
  const res = await getCollection('superAdminConfig');
  return res[0] || null;
}

export async function saveSuperAdminConfig(config) {
  await saveCollection('superAdminConfig', null, [config]);
}

export async function syncAttendanceFromFirestore(schoolId) {
  const attendance = await getAttendance(schoolId);
  localStorage.setItem('schoolAdminAttendance', JSON.stringify(attendance));
  return attendance;
}

export async function addAdmission(admission) {
  const admissions = await getAdmissions();
  const updated = [...admissions, admission];
  await saveAdmissions(updated);
}

export async function syncAllSchoolData(schoolId) {
  console.log(`[db.js] Fetching all backend data for school: ${schoolId}`);
  
  const keys = [
    'schools',
    'schoolAdminUsers',
    'schoolAdminClasses',
    'schoolAdminSubjects',
    'schoolAdminTeacherAssignments',
    'schoolAdminFeeStructures',
    'schoolAdminMonthlyFees',
    'schoolAdminReceipts',
    'schoolAdminExams',
    'schoolAdminResults',
    'schoolAdminNotices',
    'schoolAdminGallery',
    'schoolAdminFees',
    'teacherHomework',
    'schoolAdminTimetable',
    'schoolAdminGradeScale',
    'schoolAdminSettings',
    'schoolAdminAttendance'
  ];

  try {
    const promises = keys.map(key => 
      getCollection(key, schoolId).then(data => {
        localStorage.setItem(key, JSON.stringify(data));
      })
    );
    await Promise.all(promises);
    console.log('[db.js] All collections synced successfully from Node.js backend.');
  } catch (err) {
    console.error('[db.js] Error syncing school data:', err);
    throw err;
  }
}
