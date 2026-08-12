import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// ─── LOCAL STORAGE / SESSION STORAGE / INDEXEDDB VIRTUALIZATION & CLEANUP ───
const SCHOOL_DATA_KEYS = new Set([
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
  'teacherMarks',
  'teacherHomework',
  'schoolAdminTimetable',
  'schoolAdminGradeScale',
  'schoolAdminSettings',
  'schoolAdminAttendance',
  'admissions',
  'schools',
  'parentSupportConversations',
  'supportTickets',
  'demoRequests',
  'contactMessages',
  'systemLogs',
  'superAdminNotifications',
  'superAdminAcademicTemplates'
]);

// 1. Clear actual persistent browser storage for school data
try {
  SCHOOL_DATA_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
} catch (e) {
  console.error('[Cleanup] LocalStorage cleanup failed:', e);
}

// 2. Clear sessionStorage of old/demo data (keeping only authUser)
try {
  const keysToKeep = new Set(['authUser', 'jwtToken', 'superAdminAuth', 'tempAuthUser']);
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach(key => {
    if (!keysToKeep.has(key)) {
      sessionStorage.removeItem(key);
    }
  });
} catch (e) {
  console.error('[Cleanup] SessionStorage cleanup failed:', e);
}

// 3. Clear IndexedDB databases
try {
  if (window.indexedDB && window.indexedDB.databases) {
    window.indexedDB.databases().then(dbs => {
      if (dbs && Array.isArray(dbs)) {
        dbs.forEach(dbInfo => {
          if (dbInfo.name && !dbInfo.name.startsWith('firebase-heartbeat') && !dbInfo.name.startsWith('firebase-local-metadata')) {
            try {
              window.indexedDB.deleteDatabase(dbInfo.name);
              console.log(`[Cleanup] Deleted IndexedDB: ${dbInfo.name}`);
            } catch (e) {
              console.error(`[Cleanup] Failed to delete IndexedDB ${dbInfo.name}:`, e);
            }
          }
        });
      }
    }).catch(err => {
      console.warn('[Cleanup] IndexedDB databases listing failed:', err);
    });
  }
} catch (e) {
  console.error('[Cleanup] IndexedDB cleanup failed:', e);
}

// 4. Virtualize localStorage for school data so it never writes to disk
const memoryStorage = {};
const originalGetItem = localStorage.getItem.bind(localStorage);
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

localStorage.getItem = function(key) {
  if (SCHOOL_DATA_KEYS.has(key)) {
    return memoryStorage[key] || (key === 'schoolAdminAttendance' ? '{}' : '[]');
  }
  return originalGetItem(key);
};

localStorage.setItem = function(key, value) {
  if (SCHOOL_DATA_KEYS.has(key)) {
    memoryStorage[key] = value ? value.toString() : '[]';
    
    // Asynchronously synchronize this data update with Node.js backend
    const syncToBackend = async () => {
      try {
        const token = sessionStorage.getItem('jwtToken');
        const authUserStr = sessionStorage.getItem('authUser');
        const authUser = authUserStr ? JSON.parse(authUserStr) : null;
        const schoolId = authUser?.schoolId?.toString() || 'SYSTEM';
        const parsed = JSON.parse(value || '[]');
        
        const isTopLevel = ['admissions', 'demoRequests', 'contactMessages', 'systemLogs', 'superAdminNotifications', 'superAdminAcademicTemplates', 'parentSupportConversations'].includes(key);
        const targetSchool = isTopLevel ? '' : schoolId;

        await fetch(`http://localhost:5001/api/collections/${key}?schoolId=${targetSchool}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(parsed)
        });
        console.log(`[Auto-Sync] Successfully synchronized ${key} to backend`);
      } catch (err) {
        console.error(`[Auto-Sync] Failed to synchronize ${key} to backend:`, err);
      }
    };
    
    syncToBackend();
    return;
  }
  originalSetItem(key, value);
};

localStorage.removeItem = function(key) {
  if (SCHOOL_DATA_KEYS.has(key)) {
    delete memoryStorage[key];
    return;
  }
  originalRemoveItem(key);
};
// ────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
