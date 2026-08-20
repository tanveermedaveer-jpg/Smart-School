import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Bell, Award, QrCode } from 'lucide-react';
import ProfileHeaderCard from '../../components/ProfileHeaderCard';
import QrAttendanceScanner from '../../components/QrAttendanceScanner';
import toast from 'react-hot-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getAttendance, saveAttendance, BASE_URL } from '../../utils/db';

const Dashboard = () => {
  const [stats, setStats] = useState({
    attendance: 0,
    homework: 0,
    results: 0,
    notices: 0
  });

  const [recentHomework, setRecentHomework] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [parentName, setParentName] = useState('Not Linked');
  const [classInfo, setClassInfo] = useState({ className: 'N/A', section: 'N/A' });
  const [showScanner, setShowScanner] = useState(false);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    // 1. Attendance (calculate percentage for this student from list)
    const savedAttendance = JSON.parse(localStorage.getItem('schoolAdminAttendance') || '[]');
    let totalDays = 0;
    let presentDays = 0;
    
    savedAttendance.forEach(record => {
      const status = record.records?.[authUser.id?.toString()] || record.records?.[authUser.id];
      if (status) {
        totalDays++;
        if (status === 'Present') presentDays++;
      }
    });
    
    const attPercent = totalDays === 0 ? 100 : Math.round((presentDays / totalDays) * 100);

    // 2. Homework for student's class
    const homework = JSON.parse(localStorage.getItem('teacherHomework') || '[]');
    const myHomework = homework.filter(h => !authUser.classId || h.classId?.toString() === authUser.classId?.toString());
    
    // 3. Results (count how many exams this student has marks in)
    const marks = JSON.parse(localStorage.getItem('teacherMarks') || '[]');
    const myMarks = marks.filter(m => m.studentId?.toString() === authUser.id?.toString() && m.submitted);
    const examsTaken = [...new Set(myMarks.map(m => m.examId))].length;

    // 4. Notices relevant to students
    const notices = JSON.parse(localStorage.getItem('schoolAdminNotices') || '[]');
    const relevantNotices = notices.filter(n => n.audience === 'All' || n.audience === 'Students');
    
    // Global Notifications
    const globalNotifications = JSON.parse(localStorage.getItem('superAdminNotifications') || '[]');
    const mySchoolId = authUser.schoolId || 'global';
    
    const relevantGlobal = globalNotifications.filter(n => 
      n.audience === 'All Schools' || n.schoolId === mySchoolId
    ).map(n => ({
      ...n,
      isGlobal: true,
      date: n.publishDate
    }));

    const allNotices = [...relevantNotices, ...relevantGlobal].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setStats({
      attendance: attPercent,
      homework: myHomework.length,
      results: examsTaken,
      notices: allNotices.length
    });

    // Parent Link Check
    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    const parentUser = users.find(u => 
      u.role?.toLowerCase() === 'parent' && 
      (u.id?.toString() === authUser.parentId?.toString() || 
       (u.childIds || []).map(cid => cid.toString()).includes(authUser.id?.toString()))
    );
    if (parentUser) {
      setParentName(parentUser.name);
    }

    // Resolve Class and Section Details
    const classesList = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const myClass = classesList.find(c => c.id?.toString() === authUser.classId?.toString());
    if (myClass) {
      setClassInfo({
        className: myClass.className || 'N/A',
        section: myClass.section || 'N/A'
      });
    }

    setRecentHomework(myHomework.slice(-3).reverse());
    setRecentNotices(allNotices.slice(0, 3));
  }, [authUser.id, authUser.classId]);

  const handleScanSuccess = async (sessionId) => {
    setShowScanner(false);
    toast.loading('Processing attendance...', { id: 'attendance_scan' });
    
    try {
      const token = sessionStorage.getItem('jwtToken');
      let sessionData = null;

      try {
        const res = await fetch(`${BASE_URL}/qr-sessions/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          sessionData = await res.json();
        }
      } catch (e) {}

      if (!sessionData) {
        const localSessions = JSON.parse(localStorage.getItem('qrSessions') || '[]');
        sessionData = localSessions.find(s => s.id === sessionId);
      }

      if (!sessionData) {
        toast.error('Invalid QR Code. Please scan the correct attendance QR code.', { id: 'attendance_scan' });
        return;
      }
      
      const now = Date.now();
      const expiresAt = new Date(sessionData.expiresAt).getTime();
      
      // 1. Expiry Check
      if (now > expiresAt) {
        toast.error('This QR Code has expired. Please ask the teacher for a new one.', { id: 'attendance_scan' });
        return;
      }
      
      // 2. Class Match Check
      if (sessionData.classId?.toString() !== authUser.classId?.toString()) {
        toast.error('You do not belong to this Class / Section.', { id: 'attendance_scan' });
        return;
      }
      
      // 3. Double Scan Check
      const alreadyScanned = (sessionData.scannedStudents || []).some(
        stud => stud.studentId?.toString() === authUser.id?.toString()
      );
      if (alreadyScanned) {
        toast.error('You have already scanned this QR Code.', { id: 'attendance_scan' });
        return;
      }
      
      // 4. Update session log in backend & local fallback
      const newScanRecord = {
        studentId: authUser.id,
        studentName: authUser.name || 'Student',
        timestamp: new Date().toISOString()
      };

      try {
        await fetch(`${BASE_URL}/qr-sessions/${sessionId}/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            studentId: authUser.id,
            studentName: authUser.name || 'Student'
          })
        });
      } catch (e) {}

      const localSessions = JSON.parse(localStorage.getItem('qrSessions') || '[]');
      const sessionIdx = localSessions.findIndex(s => s.id === sessionId);
      if (sessionIdx !== -1) {
        localSessions[sessionIdx].scannedStudents = [
          ...(localSessions[sessionIdx].scannedStudents || []),
          newScanRecord
        ];
        localStorage.setItem('qrSessions', JSON.stringify(localSessions));
      }

      // 5. Update local storage schoolAdminAttendance
      const localAttendance = JSON.parse(localStorage.getItem('schoolAdminAttendance') || '[]');
      const today = new Date().toISOString().split('T')[0];
      const academicSession = '2026-2027';

      const existingIndex = localAttendance.findIndex(att => 
        att.date === today &&
        att.classId?.toString() === sessionData.classId?.toString() &&
        att.subjectId?.toString() === sessionData.subjectId?.toString()
      );

      let updatedRecords;
      if (existingIndex !== -1) {
        const record = localAttendance[existingIndex];
        record.records[authUser.id.toString()] = 'Present';
        updatedRecords = [...localAttendance];
        updatedRecords[existingIndex] = record;
      } else {
        const newRecord = {
          id: `att-${Date.now()}`,
          schoolId: authUser.schoolId || 'global',
          academicSession,
          date: today,
          classId: sessionData.classId,
          subjectId: sessionData.subjectId,
          teacherId: sessionData.teacherId || '',
          records: { [authUser.id.toString()]: 'Present' },
          auditTrail: []
        };
        updatedRecords = [...localAttendance, newRecord];
      }
      localStorage.setItem('schoolAdminAttendance', JSON.stringify(updatedRecords));

      // 6. Save standard attendance record in Firestore
      const schoolId = authUser.schoolId?.toString();
      const attendanceObj = await getAttendance(schoolId);
      if (!attendanceObj[today]) {
        attendanceObj[today] = {};
      }
      attendanceObj[today][authUser.id.toString()] = 'Present';
      await saveAttendance(schoolId, attendanceObj);

      toast.success('Attendance marked successfully as Present!', { id: 'attendance_scan' });
      
      // Force stats reload
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error('Failed to process attendance.', { id: 'attendance_scan' });
    }
  };

  const statCards = [
    { title: 'Attendance', value: `${stats.attendance}%`, icon: <BookOpen size={24} />, color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Homework Assigned', value: stats.homework, icon: <FileText size={24} />, color: 'bg-purple-100 text-purple-600' },
    { title: 'Exams Taken', value: stats.results, icon: <Award size={24} />, color: 'bg-blue-100 text-blue-600' },
    { title: 'New Notices', value: stats.notices, icon: <Bell size={24} />, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <ProfileHeaderCard 
        name={authUser.name || 'Student'}
        role="Student"
        details={[
          { label: 'Roll Number', value: authUser.rollNumber || 'N/A' },
          { label: 'Admission Number', value: authUser.id || 'N/A' },
          { label: 'Class', value: classInfo.className },
          { label: 'Section', value: classInfo.section },
          { label: 'Parent Name', value: parentName }
        ]}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Student Dashboard</h2>
          <p className="text-slate-400 font-medium text-xs mt-1">Welcome back, {authUser.name}</p>
        </div>
        
        <button
          onClick={() => setShowScanner(true)}
          className="w-full sm:w-auto bg-greenAccent hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm shrink-0"
        >
          <QrCode size={16} />
          <span>Scan QR Attendance</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {statCards.map((stat, index) => {
          const cardTypeClass = 
            index === 0 ? 'stat-card-premium-teachers' :
            index === 1 ? 'stat-card-premium-classes' :
            index === 2 ? 'stat-card-premium-students' :
            'stat-card-premium-demo';
          return (
            <div key={index} className={`stat-card-premium ${cardTypeClass} bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl flex items-start justify-between border border-slate-100 dark:border-slate-800/80`}>
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.title}</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">{stat.value}</h3>
              </div>
              <div className={`p-2 sm:p-2.5 rounded-xl shadow-sm ${stat.color} dark:bg-slate-800/40 dark:text-slate-200 inline-flex shrink-0`}>
                {stat.icon}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-6 min-h-[300px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center"><FileText className="mr-2.5 text-purple-500" size={18}/> Recent Homework</h3>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {recentHomework.length > 0 ? recentHomework.map((hw, idx) => (
              <div key={idx} className="p-4 border-l-4 border-purple-400 bg-purple-50/10 dark:bg-purple-950/10 rounded-r-2xl shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{hw.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-2 line-clamp-1">{hw.description}</p>
                <div className="mt-3 text-xs font-bold text-red-500 dark:text-red-400">Due: {hw.dueDate}</div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-sm font-medium">No recent homework.</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-6 min-h-[300px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center"><Bell className="mr-2.5 text-orange-500" size={18}/> Recent Notices</h3>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {recentNotices.length > 0 ? recentNotices.map((notice, idx) => (
              <div key={idx} className={`p-4 border-l-4 rounded-r-2xl shadow-sm ${notice.isGlobal ? 'border-purple-450 bg-purple-50/10 dark:bg-purple-950/10' : 'border-orange-400 bg-orange-50/10 dark:bg-orange-950/10'}`}>
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{notice.title}</h4>
                  {notice.isGlobal && <span className="text-[11px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full ml-2 shrink-0">System</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-2 leading-relaxed line-clamp-2">{notice.content || notice.message}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{notice.date}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-sm font-medium">No new notices found.</div>
            )}
          </div>
        </div>
      </div>

      {showScanner && (
        <QrAttendanceScanner 
          onClose={() => setShowScanner(false)} 
          onScanSuccess={handleScanSuccess} 
        />
      )}
    </div>
  );
};

export default Dashboard;
