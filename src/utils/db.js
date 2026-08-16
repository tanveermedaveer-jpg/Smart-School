/**
 * utils/db.js — Node.js Backend Integration Layer
 *
 * Implements REST API calls to replace direct Firebase/Firestore SDK calls.
 */

export const BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (window.location.port === '5001' ? '/api' : 'http://localhost:5001/api')
  : '/api';

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

export async function deleteSchoolRecord(schoolId) {
  const res = await fetch(`${BASE_URL}/schools/${schoolId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to delete school: ${res.status} ${errText}`);
  }
  return res.json();
}

export async function deleteUser(userId) {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) {
    const users = await getAllUsersRaw();
    const updated = users.filter(u => u.id !== userId);
    await saveSchoolAdmins(updated);
    return;
  }
  return res.json();
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

export async function getGallery(schoolId) {
  const url = schoolId ? `${BASE_URL}/gallery?schoolId=${schoolId}` : `${BASE_URL}/gallery`;
  const res = await fetch(url, { headers: getHeaders() });
  return res.ok ? await res.json() : [];
}

export async function uploadGalleryImage(item) {
  const res = await fetch(`${BASE_URL}/gallery`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(item)
  });
  return res.ok ? await res.json() : null;
}

export async function updateGalleryImage(id, updates) {
  const res = await fetch(`${BASE_URL}/gallery/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  return res.ok ? await res.json() : null;
}

export async function deleteGalleryImage(id) {
  const res = await fetch(`${BASE_URL}/gallery/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return res.ok;
}

export async function getPublicGallery() {
  const res = await fetch(`${BASE_URL}/public/gallery`);
  return res.ok ? await res.json() : [];
}

export async function getPublicSchools() {
  const res = await fetch(`${BASE_URL}/public/schools`);
  return res.ok ? await res.json() : [];
}

export async function submitAdmission(admission) {
  const res = await fetch(`${BASE_URL}/public/admissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(admission)
  });
  return res.ok ? await res.json() : null;
}

export async function getAdmissionsScoped(schoolId) {
  const url = schoolId ? `${BASE_URL}/admissions?schoolId=${schoolId}` : `${BASE_URL}/admissions`;
  const res = await fetch(url, { headers: getHeaders() });
  return res.ok ? await res.json() : [];
}

export async function updateAdmissionStatus(id, status) {
  const res = await fetch(`${BASE_URL}/admissions/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  return res.ok ? await res.json() : null;
}

export async function deleteAdmission(id) {
  const res = await fetch(`${BASE_URL}/admissions/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return res.ok;
}

export async function getAdmissions() {
  return getAdmissionsScoped();
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
  return submitAdmission(admission);
}

export async function syncAllSchoolData(schoolId) {
  console.log(`[db.js] Fetching all backend data for school: ${schoolId}`);
  window.isSyncingFromBackend = true;
  
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
    'schoolAdminAttendance',
    'schoolAdminTeacherSalaries'
  ];

  try {
    const promises = keys.map(key => 
      getCollection(key, schoolId).then(data => {
        let storageValue = data;
        if (['schoolAdminSettings'].includes(key)) {
          storageValue = Array.isArray(data) ? (data[0] || {}) : data;
        }
        localStorage.setItem(key, JSON.stringify(storageValue));
      })
    );
    await Promise.all(promises);
    console.log('[db.js] All collections synced successfully from Node.js backend.');
  } catch (err) {
    console.error('[db.js] Error syncing school data:', err);
    throw err;
  } finally {
    window.isSyncingFromBackend = false;
  }
}
