const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dbManager = require('./database');

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

const app = express();
const PORT = 5001;
const JWT_SECRET = 'smart_school_jwt_secret_key_2026';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  // Normalize req.url to ensure it always starts with /api to match Express routes
  if (req.url) {
    if (req.url.startsWith('/api/index.js')) {
      req.url = req.url.replace('/api/index.js', '/api');
    }
    if (!req.url.startsWith('/api')) {
      req.url = '/api' + req.url;
    }
  }
  next();
});

app.use(async (req, res, next) => {
  if (req.path === '/api/debug/db-error' || req.path === '/api/debug-paths') {
    return next();
  }
  try {
    await dbManager.initDb();
    next();
  } catch (err) {
    console.error('[Startup Middleware] dbManager.initDb failed:', err);
    res.status(500).json({ error: 'Database failed to initialize', details: err.message });
  }
});

app.get('/api/debug-paths', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const filesInCwd = fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()) : [];
  const filesInServer = fs.existsSync(path.join(process.cwd(), 'server')) ? fs.readdirSync(path.join(process.cwd(), 'server')) : [];
  const filesInApi = fs.existsSync(path.join(process.cwd(), 'api')) ? fs.readdirSync(path.join(process.cwd(), 'api')) : [];
  
  res.json({
    cwd: process.cwd(),
    dirname: __dirname,
    filesInCwd,
    filesInServer,
    filesInApi,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL
    }
  });
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access token missing' });
  
  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    
    // Check if user still exists and is active
    const db = dbManager.readDb();
    const user = db.users.find(u => u.id && u.id.toString() === decodedUser.id.toString());
    
    if (!user) {
      return res.status(401).json({ message: 'User account has been deleted or does not exist.' });
    }
    
    if ((user.status || '').toString().trim().toLowerCase() === 'inactive') {
      return res.status(403).json({ message: 'This account is inactive. Please contact the administrator.' });
    }
    
    const role = normalizeRole(user.role);
    if (role !== 'superAdmin') {
      const schoolId = user.schoolId || user.school_id;
      const schoolExists = db.schools.some(s => s.id && s.id.toString() === schoolId.toString());
      if (!schoolExists) {
        return res.status(403).json({ message: 'The school associated with this account has been deleted.' });
      }
    }
    
    req.user = decodedUser;
    next();
  });
}



app.get('/api/debug/db-error', (req, res) => {
  res.json({
    useFirestore: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.USE_FIRESTORE === 'true',
    hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
    lastDbError: dbManager.getLastDbError ? dbManager.getLastDbError() : null
  });
});

// ─── AUTHENTICATION ENDPOINTS ───────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const db = dbManager.readDb();
  const searchId = email.trim().toLowerCase();
  
  const user = db.users.find(u => {
    const uEmail = (u.email || '').toLowerCase();
    const uUsername = (u.username || '').toLowerCase();
    const uRoll = (u.rollNumber || '').toLowerCase();
    
    const r = normalizeRole(u.role);
    const isStudent = (r === 'student');

    return isStudent
      ? (uRoll === searchId || uUsername === searchId || uEmail === searchId)
      : (uEmail === searchId || uUsername === searchId);
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  let isMatch = false;
  if (user.password && user.password.startsWith('$2')) {
    try {
      isMatch = bcrypt.compareSync(password, user.password);
    } catch (e) {
      isMatch = false;
    }
  }
  if (!isMatch) {
    isMatch = (user.password === password);
  }
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const role = normalizeRole(user.role);

  // Status check (Inactive check)
  const status = (user.status || '').toString().trim().toLowerCase();
  if (status === 'inactive') {
    return res.status(403).json({ message: 'This account is inactive. Please contact the administrator.' });
  }

  // School Admin schoolId check
  let schoolId = user.schoolId;
  if (role === 'schoolAdmin') {
    if (!schoolId || schoolId.toString().trim() === '' || schoolId === 'SYSTEM') {
      console.error(`[Auth Error] School Admin ${user.email} has invalid or missing schoolId:`, schoolId);
      return res.status(400).json({ message: 'School Admin account has no assigned School ID. Please contact the administrator.' });
    }
  } else if (role === 'superAdmin') {
    schoolId = 'SYSTEM';
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role, schoolId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...profile } = user;
  
  const displayRole = (role === 'schoolAdmin') ? 'school_admin' : role;

  res.json({
    id: user.id,
    email: user.email,
    role: displayRole,
    schoolId,
    token,
    user: {
      ...profile,
      role: displayRole,
      schoolId
    }
  });
});

// ─── USERS ENDPOINTS ─────────────────────────────────────────────────────

app.get('/api/users/:userId', authenticateToken, (req, res) => {
  const db = dbManager.readDb();
  const user = db.users.find(u => u.id.toString() === req.params.userId.toString());
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  const userRole = normalizeRole(req.user.role);
  if (userRole !== 'superAdmin' && req.user.id.toString() !== req.params.userId.toString()) {
    if (userRole === 'schoolAdmin') {
      const targetSchoolId = user.schoolId || user.school_id;
      if (!targetSchoolId || targetSchoolId.toString() !== req.user.schoolId.toString()) {
        return res.status(403).json({ message: 'Access Denied: You can only access users of your own school.' });
      }
    } else {
      return res.status(403).json({ message: 'Access Denied: Unauthorized to access this user.' });
    }
  }

  const { password: _, ...profile } = user;
  res.json(profile);
});

app.put('/api/users/:userId', authenticateToken, async (req, res) => {
  const db = dbManager.readDb();
  const idx = db.users.findIndex(u => u.id.toString() === req.params.userId.toString());
  
  if (idx === -1) {
    const userRole = normalizeRole(req.user.role);
    const newRole = normalizeRole(req.body.role);
    
    // Authorization Check for creation
    if (userRole !== 'superAdmin') {
      if (userRole === 'schoolAdmin') {
        const bodySchoolId = req.body.schoolId || req.body.school_id;
        if (!bodySchoolId || bodySchoolId.toString() !== req.user.schoolId.toString()) {
          return res.status(403).json({ message: 'Access Denied: You can only create users for your own school.' });
        }
        if (newRole === 'superAdmin' || newRole === 'schoolAdmin') {
          return res.status(403).json({ message: 'Access Denied: School Admins cannot create administrators.' });
        }
      } else {
        return res.status(403).json({ message: 'Access Denied: Unauthorized to create users.' });
      }
    }

    // Create user
    const newUser = { ...req.body, id: req.params.userId.toString() };
    if (newUser.password) {
      if (!newUser.password.startsWith('$2')) {
        const salt = bcrypt.genSaltSync(10);
        newUser.password = bcrypt.hashSync(newUser.password, salt);
      }
    }
    db.users.push(newUser);
    await dbManager.writeDb(db);
    
    const { password: _, ...profile } = newUser;
    return res.json(profile);
  }

  const targetUser = db.users[idx];
  const userRole = normalizeRole(req.user.role);

  // Authorization Check
  if (userRole !== 'superAdmin' && req.user.id.toString() !== req.params.userId.toString()) {
    // If not updating themselves, must be a School Admin of the same school
    if (userRole === 'schoolAdmin') {
      const targetSchoolId = targetUser.schoolId || targetUser.school_id;
      if (!targetSchoolId || targetSchoolId.toString() !== req.user.schoolId.toString()) {
        return res.status(403).json({ message: 'Access Denied: You can only update users of your own school.' });
      }
    } else {
      return res.status(403).json({ message: 'Access Denied: Unauthorized to update this user.' });
    }
  }

  // Update fields
  const { password, ...bodyWithoutPassword } = req.body;
  const updatedUser = { ...db.users[idx], ...bodyWithoutPassword };
  
  // If password is provided and not empty, check and hash it
  if (password && password.toString().trim() !== '') {
    if (password !== db.users[idx].password) {
      const salt = bcrypt.genSaltSync(10);
      updatedUser.password = bcrypt.hashSync(password, salt);
    }
  }

  db.users[idx] = updatedUser;
  await dbManager.writeDb(db);

  const { password: _, parentPassword: __, ...profile } = updatedUser;
  res.json(profile);
});

app.delete('/api/users/:userId', authenticateToken, async (req, res) => {
  const db = dbManager.readDb();
  const targetId = req.params.userId.toString();
  const idx = db.users.findIndex(u => u.id && u.id.toString() === targetId);
  
  if (idx === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const targetUser = db.users[idx];
  const userRole = normalizeRole(req.user.role);

  if (userRole !== 'superAdmin' && req.user.id.toString() !== targetId) {
    if (userRole === 'schoolAdmin') {
      const targetSchoolId = targetUser.schoolId || targetUser.school_id;
      if (!targetSchoolId || targetSchoolId.toString() !== req.user.schoolId.toString()) {
        return res.status(403).json({ message: 'Access Denied: You can only delete users of your own school.' });
      }
    } else {
      return res.status(403).json({ message: 'Access Denied: Unauthorized to delete users.' });
    }
  }

  db.users.splice(idx, 1);
  await dbManager.writeDb(db);
  res.json({ message: 'User deleted successfully' });
});

// ─── SCHOOLS ENDPOINTS ───────────────────────────────────────────────────

app.get('/api/schools', authenticateToken, (req, res) => {
  const schools = dbManager.getCollection('schools');
  res.json(schools);
});

app.post('/api/schools', authenticateToken, async (req, res) => {
  const userRole = normalizeRole(req.user.role);
  if (userRole !== 'superAdmin') {
    return res.status(403).json({ message: 'Access Denied: Only Super Admin can create schools.' });
  }

  const db = dbManager.readDb();
  const newSchool = { ...req.body };
  db.schools.push(newSchool);
  await dbManager.writeDb(db);
  res.status(201).json(newSchool);
});

app.delete('/api/schools/:schoolId', authenticateToken, async (req, res) => {
  const userRole = normalizeRole(req.user.role);
  if (userRole !== 'superAdmin') {
    return res.status(403).json({ message: 'Access Denied: Only Super Admin can delete schools.' });
  }

  const db = dbManager.readDb();
  const sid = req.params.schoolId;

  db.schools = db.schools.filter(s => s.id && s.id.toString() !== sid.toString());
  // Cascading cleanup of all associated data
  dbManager.performSchoolDeletionCascade(db, sid);

  await dbManager.writeDb(db);
  res.json({ message: 'School and associated accounts deleted successfully.' });
});

// ─── GENERIC COLLECTIONS ENDPOINTS ───────────────────────────────────────

app.get('/api/collections/:key', authenticateToken, (req, res) => {
  const { key } = req.params;
  let schoolId = req.query.schoolId;
  
  const userRole = normalizeRole(req.user.role);
  if (userRole !== 'superAdmin') {
    schoolId = req.user.schoolId;
  }
  if (userRole !== 'superAdmin' && (!schoolId || schoolId === 'SYSTEM')) {
    return res.status(403).json({ message: 'Access Denied: Missing school association.' });
  }

  let items = dbManager.getCollection(key, schoolId);
  if (key === 'schoolAdminUsers' || key === 'users') {
    items = items.map(u => {
      const copy = { ...u };
      delete copy.password;
      delete copy.parentPassword;
      return copy;
    });
  }
  res.json(items);
});

app.post('/api/collections/:key', authenticateToken, async (req, res) => {
  const { key } = req.params;
  let schoolId = req.query.schoolId;
  
  const userRole = normalizeRole(req.user.role);
  if (userRole !== 'superAdmin') {
    // Force the schoolId to be the user's schoolId
    schoolId = req.user.schoolId;
  }
  
  if (userRole !== 'superAdmin' && (!schoolId || schoolId === 'SYSTEM')) {
    return res.status(403).json({ message: 'Access Denied: Missing school association.' });
  }

  await dbManager.saveCollection(key, schoolId, req.body);
  res.json({ message: 'Collection saved successfully.' });
});

// ─── DEDICATED GALLERY AND ADMISSIONS ENDPOINTS ─────────────────────────

// Public: Get active schools
app.get('/api/public/schools', (req, res) => {
  const db = dbManager.readDb();
  const schools = db.schools || [];
  const active = schools.filter(s => s.status === 'Active');
  res.json(active);
});

// Public: Get published gallery items
app.get('/api/public/gallery', (req, res) => {
  const db = dbManager.readDb();
  const gallery = db.gallery || [];
  const published = gallery.filter(item => item.status === 'published');
  res.json(published);
});

// Public: Submit admission application
app.post('/api/public/admissions', async (req, res) => {
  const db = dbManager.readDb();
  const admission = req.body;
  if (!admission || !admission.schoolId) {
    return res.status(400).json({ message: 'Invalid admission data or missing School ID' });
  }

  const newAdmission = {
    ...admission,
    id: admission.id || Date.now().toString(),
    status: 'Pending',
    createdAt: admission.createdAt || new Date().toISOString(),
    date: admission.date || new Date().toISOString()
  };

  if (!db.admissions) db.admissions = [];
  db.admissions.push(newAdmission);
  await dbManager.writeDb(db);
  res.status(201).json(newAdmission);
});

// Authenticated: Get gallery items (scoped by schoolId if schoolAdmin)
app.get('/api/gallery', authenticateToken, (req, res) => {
  const db = dbManager.readDb();
  const gallery = db.gallery || [];
  const role = normalizeRole(req.user.role);

  if (role === 'superAdmin') {
    const { schoolId } = req.query;
    if (schoolId) {
      return res.json(gallery.filter(item => item.schoolId && item.schoolId.toString() === schoolId.toString()));
    }
    return res.json(gallery);
  } else {
    // School Admin
    const schoolId = req.user.schoolId;
    return res.json(gallery.filter(item => item.schoolId && item.schoolId.toString() === schoolId.toString()));
  }
});

// Authenticated: Add gallery item (scoped by schoolId if schoolAdmin)
app.post('/api/gallery', authenticateToken, async (req, res) => {
  const db = dbManager.readDb();
  const role = normalizeRole(req.user.role);
  const { title, url, category, status } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'Image URL/data is required' });
  }

  let schoolId = req.body.schoolId;
  if (role !== 'superAdmin') {
    schoolId = req.user.schoolId;
  }

  if (!schoolId) {
    return res.status(400).json({ message: 'School ID is required' });
  }

  const newItem = {
    id: Date.now().toString(),
    schoolId: schoolId.toString(),
    url,
    title: title || 'Untitled',
    category: category || 'Other',
    status: status || 'pending',
    createdAt: new Date().toISOString()
  };

  if (!db.gallery) db.gallery = [];
  db.gallery.push(newItem);
  await dbManager.writeDb(db);
  res.status(201).json(newItem);
});

// Authenticated: Update gallery item
app.put('/api/gallery/:id', authenticateToken, async (req, res) => {
  const db = dbManager.readDb();
  const role = normalizeRole(req.user.role);
  const { id } = req.params;
  const updates = req.body;

  if (!db.gallery) db.gallery = [];
  const idx = db.gallery.findIndex(item => item.id.toString() === id.toString());
  if (idx === -1) {
    return res.status(404).json({ message: 'Gallery item not found' });
  }

  const item = db.gallery[idx];
  if (role !== 'superAdmin' && item.schoolId.toString() !== req.user.schoolId.toString()) {
    return res.status(403).json({ message: 'Access Denied: You do not own this gallery item.' });
  }

  db.gallery[idx] = {
    ...item,
    ...updates,
    id: item.id, // preserve ID
    schoolId: item.schoolId // preserve schoolId
  };

  await dbManager.writeDb(db);
  res.json(db.gallery[idx]);
});

// Authenticated: Delete gallery item
app.delete('/api/gallery/:id', authenticateToken, async (req, res) => {
  const db = dbManager.readDb();
  const role = normalizeRole(req.user.role);
  const { id } = req.params;

  if (!db.gallery) db.gallery = [];
  const idx = db.gallery.findIndex(item => item.id.toString() === id.toString());
  if (idx === -1) {
    return res.status(404).json({ message: 'Gallery item not found' });
  }

  const item = db.gallery[idx];
  if (role !== 'superAdmin' && item.schoolId.toString() !== req.user.schoolId.toString()) {
    return res.status(403).json({ message: 'Access Denied: You do not own this gallery item.' });
  }

  db.gallery.splice(idx, 1);
  await dbManager.writeDb(db);
  res.json({ message: 'Gallery item deleted successfully.' });
});

// Authenticated: Get admissions (scoped by schoolId if schoolAdmin)
app.get('/api/admissions', authenticateToken, (req, res) => {
  const db = dbManager.readDb();
  const admissions = db.admissions || [];
  const role = normalizeRole(req.user.role);

  if (role === 'superAdmin') {
    const { schoolId } = req.query;
    if (schoolId) {
      return res.json(admissions.filter(item => item.schoolId && item.schoolId.toString() === schoolId.toString()));
    }
    return res.json(admissions);
  } else {
    // School Admin
    const schoolId = req.user.schoolId;
    return res.json(admissions.filter(item => item.schoolId && item.schoolId.toString() === schoolId.toString()));
  }
});

// Authenticated: Update admission application status
app.put('/api/admissions/:id', authenticateToken, async (req, res) => {
  const db = dbManager.readDb();
  const role = normalizeRole(req.user.role);
  const { id } = req.params;
  const { status } = req.body;

  if (!db.admissions) db.admissions = [];
  const idx = db.admissions.findIndex(a => a.id.toString() === id.toString());
  if (idx === -1) {
    return res.status(404).json({ message: 'Admission application not found' });
  }

  const admission = db.admissions[idx];
  if (role !== 'superAdmin' && admission.schoolId.toString() !== req.user.schoolId.toString()) {
    return res.status(403).json({ message: 'Access Denied: You do not manage this school.' });
  }

  admission.status = status;
  db.admissions[idx] = admission;
  await dbManager.writeDb(db);
  res.json(admission);
});

// Authenticated: Delete admission application
app.delete('/api/admissions/:id', authenticateToken, async (req, res) => {
  const db = dbManager.readDb();
  const role = normalizeRole(req.user.role);
  const { id } = req.params;

  if (!db.admissions) db.admissions = [];
  const idx = db.admissions.findIndex(a => a.id.toString() === id.toString());
  if (idx === -1) {
    return res.status(404).json({ message: 'Admission application not found' });
  }

  const admission = db.admissions[idx];
  if (role !== 'superAdmin' && admission.schoolId.toString() !== req.user.schoolId.toString()) {
    return res.status(403).json({ message: 'Access Denied: You do not manage this school.' });
  }

  db.admissions.splice(idx, 1);
  await dbManager.writeDb(db);
  res.json({ message: 'Admission application deleted successfully.' });
});


// ─── QR SESSION ENDPOINTS ────────────────────────────────────────────────

app.get('/api/qr-sessions/:sessionId', authenticateToken, (req, res) => {
  const db = dbManager.readDb();
  const session = db.qrSessions.find(s => s.id === req.params.sessionId);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.json(session);
});

app.post('/api/qr-sessions', authenticateToken, async (req, res) => {
  const db = dbManager.readDb();
  const newSession = { ...req.body };
  db.qrSessions.push(newSession);
  await dbManager.writeDb(db);
  res.status(201).json(newSession);
});

app.post('/api/qr-sessions/:sessionId/scan', authenticateToken, async (req, res) => {
  const db = dbManager.readDb();
  const idx = db.qrSessions.findIndex(s => s.id === req.params.sessionId);
  if (idx === -1) return res.status(404).json({ message: 'Session not found' });

  const session = db.qrSessions[idx];
  const { studentId, studentName } = req.body;
  
  const alreadyScanned = (session.scannedStudents || []).some(s => s.studentId === studentId);
  if (alreadyScanned) {
    return res.status(400).json({ message: 'Already scanned' });
  }

  const scanRecord = {
    studentId,
    studentName,
    timestamp: new Date().toISOString()
  };

  session.scannedStudents = [...(session.scannedStudents || []), scanRecord];
  db.qrSessions[idx] = session;
  await dbManager.writeDb(db);

  res.json(session);
});

if (require.main === module && !process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[Server] Smart School Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
