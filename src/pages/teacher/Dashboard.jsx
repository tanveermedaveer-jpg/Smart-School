import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Clock, Bell, FileText } from 'lucide-react';
import ProfileHeaderCard from '../../components/ProfileHeaderCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    classes: 0,
    students: 0,
    homework: 0,
    notices: 0
  });
  
  const [recentNotices, setRecentNotices] = useState([]);
  const [assignedClassesText, setAssignedClassesText] = useState('Not Assigned');
  const [assignedSubjectsText, setAssignedSubjectsText] = useState('Not Assigned');
  const [upcomingClass, setUpcomingClass] = useState(null);
  
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    // 1. Classes assigned to this teacher via assignments
    const assignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
    const myAssignments = assignments.filter(a => a.teacherId?.toString() === authUser.id?.toString());
    const uniqueClassIds = [...new Set(myAssignments.map(a => a.classId?.toString()))];
    
    // Resolve class details
    const classesList = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const myClassNames = uniqueClassIds.map(classId => {
      const cls = classesList.find(c => c.id.toString() === classId);
      return cls ? `${cls.className}-${cls.section}` : '';
    }).filter(Boolean);
    setAssignedClassesText(myClassNames.length > 0 ? myClassNames.join(', ') : 'Not Assigned');

    // Resolve subject details
    const subjectsList = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    const mySubjectNames = [...new Set(myAssignments.map(a => {
      const sub = subjectsList.find(s => s.id.toString() === a.subjectId?.toString());
      return sub ? sub.subjectName : '';
    }).filter(Boolean))];
    setAssignedSubjectsText(mySubjectNames.length > 0 ? mySubjectNames.join(', ') : 'Not Assigned');

    // 2. Students belonging to assigned classes
    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    const myStudents = users.filter(u => 
      u.role?.toLowerCase() === 'student' && 
      uniqueClassIds.includes(u.classId?.toString())
    );
    
    // 3. Homework assigned by this teacher
    const homework = JSON.parse(localStorage.getItem('teacherHomework') || '[]');
    const myHomework = homework.filter(h => h.teacherId?.toString() === authUser.id?.toString());

    // 4. Notices relevant to teachers
    const notices = JSON.parse(localStorage.getItem('schoolAdminNotices') || '[]');
    const relevantNotices = notices.filter(n => n.audience === 'All' || n.audience === 'Teachers');
    
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
      classes: uniqueClassIds.length,
      students: myStudents.length,
      homework: myHomework.length,
      notices: allNotices.length
    });
    
    setRecentNotices(allNotices.slice(0, 5));

    // 5. Calculate Upcoming Class dynamically from School Admin Timetable
    const savedTimetable = JSON.parse(localStorage.getItem('schoolAdminTimetable') || '{}');
    let timetableDict = {};
    if (Array.isArray(savedTimetable)) {
      savedTimetable.forEach(item => {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach(k => {
            if (k !== 'schoolId' && k !== 'school_id' && typeof item[k] === 'object') {
              timetableDict[k] = item[k];
            }
          });
        }
      });
    } else if (savedTimetable && typeof savedTimetable === 'object') {
      timetableDict = savedTimetable;
    }

    const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const periodTimes = {
      '1': '08:00 AM – 08:40 AM',
      '2': '08:40 AM – 09:20 AM',
      '3': '09:20 AM – 10:00 AM',
      '4': '10:00 AM – 10:40 AM',
      '5': '11:00 AM – 11:40 AM',
      '6': '11:40 AM – 12:20 PM',
      '7': '12:20 PM – 01:00 PM'
    };

    let nextClass = null;
    Object.keys(timetableDict).forEach(classId => {
      const classTimetable = timetableDict[classId];
      if (classTimetable && classTimetable[todayDay]) {
        const daySlots = classTimetable[todayDay];
        Object.keys(daySlots).forEach(periodKey => {
          const entry = daySlots[periodKey];
          if (entry && typeof entry === 'object' && entry.teacherId?.toString() === authUser.id?.toString()) {
            const cls = classesList.find(c => c.id?.toString() === classId.toString());
            const sub = subjectsList.find(s => s.id?.toString() === entry.subjectId?.toString());
            const className = cls ? `${cls.className}-${cls.section}` : `Class ${classId}`;
            const subjectName = sub ? sub.subjectName : 'Subject';
            const timeStr = periodTimes[periodKey] || `Period ${periodKey}`;
            const roomStr = entry.room || (cls ? `Room ${cls.className}` : '');

            if (!nextClass) {
              nextClass = {
                className,
                subject: subjectName,
                time: timeStr,
                room: roomStr,
                period: periodKey
              };
            }
          }
        });
      }
    });

    setUpcomingClass(nextClass);
  }, [authUser.id]);

  const statCards = [
    { title: 'My Classes', value: stats.classes, icon: <Users size={24} />, color: 'bg-blue-100 text-blue-600' },
    { title: 'Total Students', value: stats.students, icon: <BookOpen size={24} />, color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Homework Assigned', value: stats.homework, icon: <FileText size={24} />, color: 'bg-purple-100 text-purple-600' },
    { title: 'New Notices', value: stats.notices, icon: <Bell size={24} />, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <ProfileHeaderCard 
        name={authUser.name || 'Teacher'}
        role="Teacher"
        details={[
          { label: 'Employee ID', value: authUser.id ? `T-${authUser.id.toString().slice(-4)}` : 'N/A' },
          { label: 'Classes', value: assignedClassesText },
          { label: 'Subjects', value: assignedSubjectsText },
          { label: 'Email', value: authUser.email || 'N/A' },
          { label: 'Phone', value: authUser.phone || 'N/A' }
        ]}
      />

      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Teacher Dashboard</h2>
          <p className="text-slate-400 font-medium text-xs mt-1">Welcome back, {authUser.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {statCards.map((stat, index) => {
          const cardTypeClass = 
            index === 0 ? 'stat-card-premium-classes' :
            index === 1 ? 'stat-card-premium-students' :
            index === 2 ? 'stat-card-premium-teachers' :
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

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
            <Clock size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">Upcoming Class</h3>
          
          {upcomingClass ? (
            <div className="space-y-1.5 mb-5">
              <p className="text-lg font-black text-slate-800 dark:text-slate-100">{upcomingClass.className}</p>
              <p className="text-sm font-bold text-greenAccent">{upcomingClass.subject}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-450">{upcomingClass.time}</p>
              {upcomingClass.room && (
                <span className="inline-block text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full mt-1">
                  {upcomingClass.room}
                </span>
              )}
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mb-5">No Upcoming Class</p>
          )}

          <button 
            onClick={() => navigate('/teacher/timetable')}
            className="text-darkBlue hover:text-blue-900 font-bold transition-all text-xs uppercase tracking-wider"
          >
            View Timetable &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
