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

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access token missing' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Startup: Ensure correct Super Admin exists in the database
function ensureSuperAdmin() {
  const db = dbManager.readDb();
  const superAdminEmail = 'muhammadsaadweb10@gmail.com';

  // Remove any old/stale super admin accounts (including the previous one)
  db.users = db.users.filter(u => normalizeRole(u.role) !== 'superAdmin');

  // Create the new Super Admin with a securely hashed password
  console.log('[Startup] Registering Super Admin...');
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
  dbManager.writeDb(db);
  console.log('[Startup] Super Admin registered successfully.');
}
ensureSuperAdmin();

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
  
  res.json({
    id: user.id,
    email: user.email,
    role,
    schoolId,
    token,
    user: {
      ...profile,
      role,
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

app.put('/api/users/:userId', authenticateToken, (req, res) => {
  const db = dbManager.readDb();
  const idx = db.users.findIndex(u => u.id.toString() === req.params.userId.toString());
  if (idx === -1) return res.status(404).json({ message: 'User not found' });

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
  const updatedUser = { ...db.users[idx], ...req.body };
  
  // If password is changed, hash it
  if (req.body.password && req.body.password !== db.users[idx].password) {
    const salt = bcrypt.genSaltSync(10);
    updatedUser.password = bcrypt.hashSync(req.body.password, salt);
  }

  db.users[idx] = updatedUser;
  dbManager.writeDb(db);

  const { password: _, ...profile } = updatedUser;
  res.json(profile);
});

// ─── SCHOOLS ENDPOINTS ───────────────────────────────────────────────────

app.get('/api/schools', authenticateToken, (req, res) => {
  const schools = dbManager.getCollection('schools');
  res.json(schools);
});

app.post('/api/schools', authenticateToken, (req, res) => {
  const userRole = normalizeRole(req.user.role);
  if (userRole !== 'superAdmin') {
    return res.status(403).json({ message: 'Access Denied: Only Super Admin can create schools.' });
  }

  const db = dbManager.readDb();
  const newSchool = { ...req.body };
  db.schools.push(newSchool);
  dbManager.writeDb(db);
  res.status(201).json(newSchool);
});

app.delete('/api/schools/:schoolId', authenticateToken, (req, res) => {
  const userRole = normalizeRole(req.user.role);
  if (userRole !== 'superAdmin') {
    return res.status(403).json({ message: 'Access Denied: Only Super Admin can delete schools.' });
  }

  const db = dbManager.readDb();
  const sid = req.params.schoolId;

  db.schools = db.schools.filter(s => s.id !== sid);
  // Cascading cleanup of users belonging to this school
  db.users = db.users.filter(u => u.schoolId !== sid);

  dbManager.writeDb(db);
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

app.post('/api/collections/:key', authenticateToken, (req, res) => {
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

  dbManager.saveCollection(key, schoolId, req.body);
  res.json({ message: 'Collection saved successfully.' });
});

// ─── QR SESSION ENDPOINTS ────────────────────────────────────────────────

app.get('/api/qr-sessions/:sessionId', authenticateToken, (req, res) => {
  const db = dbManager.readDb();
  const session = db.qrSessions.find(s => s.id === req.params.sessionId);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.json(session);
});

app.post('/api/qr-sessions', authenticateToken, (req, res) => {
  const db = dbManager.readDb();
  const newSession = { ...req.body };
  db.qrSessions.push(newSession);
  dbManager.writeDb(db);
  res.status(201).json(newSession);
});

app.post('/api/qr-sessions/:sessionId/scan', authenticateToken, (req, res) => {
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
  dbManager.writeDb(db);

  res.json(session);
});

app.listen(PORT, () => {
  console.log(`[Server] Smart School Backend running on http://localhost:${PORT}`);
});
