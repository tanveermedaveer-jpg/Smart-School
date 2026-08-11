import React, { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, UserCheck, Calendar, Bell, FileText, CheckCircle, Clock } from 'lucide-react';
import ProfileHeaderCard from '../../components/ProfileHeaderCard';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalClasses: 0,
    presentToday: 0
  });

  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolSettings = JSON.parse(localStorage.getItem('schoolAdminSettings') || '{}');

  const schools = JSON.parse(localStorage.getItem('schools') || '[]');
  const mySchool = schools.find(s => s.id?.toString() === authUser.schoolId?.toString());
  const currentSchoolId = authUser.schoolId?.toString();

  useEffect(() => {
    if (!currentSchoolId) return;

    // Users (Scoped explicitly by schoolId)
    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    const students = users.filter(u => u.role?.toLowerCase() === 'student' && u.schoolId?.toString() === currentSchoolId);
    const teachers = users.filter(u => u.role?.toLowerCase() === 'teacher' && u.schoolId?.toString() === currentSchoolId);
    const parents = users.filter(u => u.role?.toLowerCase() === 'parent' && u.schoolId?.toString() === currentSchoolId);

    // Classes (Scoped explicitly by schoolId)
    const classes = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const filteredClasses = classes.filter(c => c.schoolId?.toString() === currentSchoolId);

    // Attendance (Scoped explicitly by student presence lookup of our own school)
    const today = new Date().toISOString().split('T')[0];
    const attendance = JSON.parse(localStorage.getItem('schoolAdminAttendance') || '{}');
    
    let todayAttendance = {};
    if (Array.isArray(attendance)) {
      attendance.forEach(record => {
        if (record.date === today && record.records) {
          Object.assign(todayAttendance, record.records);
        }
      });
    } else {
      todayAttendance = attendance[today] || {};
    }

    const presentCount = Object.keys(todayAttendance).filter(sid => {
      const status = todayAttendance[sid];
      if (status !== 'Present') return false;
      const student = students.find(s => s.id?.toString() === sid.toString());
      return student !== undefined;
    }).length;

    setStats({
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalParents: parents.length,
      totalClasses: [...new Set(filteredClasses.map(c => c.className))].length,
      presentToday: presentCount
    });

    // Admissions (Scoped explicitly by schoolId)
    const admissions = JSON.parse(localStorage.getItem('admissions') || '[]');
    const filteredAdmissions = admissions.filter(a => a.schoolId?.toString() === currentSchoolId);
    setRecentAdmissions(filteredAdmissions.slice(-5).reverse());

    // Notices (Scoped explicitly by schoolId)
    const notices = JSON.parse(localStorage.getItem('schoolAdminNotices') || '[]');
    const filteredNotices = notices.filter(n => n.schoolId?.toString() === currentSchoolId);
    
    // Global Notifications
    const globalNotifications = JSON.parse(localStorage.getItem('superAdminNotifications') || '[]');
    const mySchoolId = currentSchoolId || 'global';
    
    const relevantGlobal = globalNotifications.filter(n => 
      n.audience === 'All Schools' || n.schoolId === mySchoolId
    ).map(n => ({
      ...n,
      isGlobal: true,
      date: n.publishDate
    }));

    const allNotices = [...filteredNotices, ...relevantGlobal].sort((a, b) => new Date(b.date) - new Date(a.date));
    setRecentNotices(allNotices.slice(0, 5));
  }, [currentSchoolId]);

  const statCards = [
    { title: 'Total Students', value: stats.totalStudents, icon: <GraduationCap size={24} />, color: 'bg-blue-100 text-blue-600', trend: '+5%' },
    { title: 'Total Teachers', value: stats.totalTeachers, icon: <BookOpen size={24} />, color: 'bg-emerald-100 text-emerald-600', trend: '+2%' },
    { title: 'Total Parents', value: stats.totalParents, icon: <Users size={24} />, color: 'bg-purple-100 text-purple-600', trend: '+4%' },
    { title: 'Total Classes', value: stats.totalClasses, icon: <FileText size={24} />, color: 'bg-orange-100 text-orange-600', trend: '0%' },
  ];

  if (!currentSchoolId || !mySchool) {
    return (
      <div className="p-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700">
        <h2 className="text-xl font-bold">School Context Configuration Error</h2>
        <p className="mt-2 text-sm">
          Your School Admin account is not associated with a valid school profile or your school association has been misconfigured. 
          Please contact the Super Administrator to resolve this setup issue.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProfileHeaderCard 
        name={authUser.name || 'School Admin'}
        role="School Admin"
        details={[
          { label: 'School Name', value: mySchool?.name || schoolSettings.schoolName || 'Not Set' },
          { label: 'School Code', value: mySchool?.code || authUser.schoolId || 'N/A' },
          { label: 'Email', value: authUser.email || 'N/A' },
          { label: 'Phone', value: authUser.phone || schoolSettings.phone || 'N/A' }
        ]}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-400 font-medium text-xs mt-1.5">Welcome to the School Administration portal.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm flex items-center space-x-2.5 text-xs font-bold text-slate-600 dark:text-slate-350 shrink-0">
          <Calendar size={14} className="text-greenAccent shrink-0" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const cardTypeClass = 
            index === 0 ? 'stat-card-premium-students' :
            index === 1 ? 'stat-card-premium-teachers' :
            index === 2 ? 'stat-card-premium-parents' :
            'stat-card-premium-classes';
          return (
            <div key={index} className={`stat-card-premium ${cardTypeClass} bg-white dark:bg-slate-900 p-6 rounded-2xl flex items-start justify-between border border-slate-100 dark:border-slate-800/80`}>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{stat.title}</p>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">{stat.value}</h3>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 inline-block">
                  {stat.trend} from last month
                </span>
              </div>
              <div className={`p-2.5 rounded-xl shadow-sm ${stat.color} dark:bg-slate-800/40 dark:text-slate-200 inline-flex`}>
                {stat.icon}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats - Attendance Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-6 flex flex-col justify-between min-h-[360px]">
          <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-6 flex items-center"><UserCheck className="mr-2.5 text-greenAccent" size={18}/> Attendance Summary</h3>
          
          <div className="flex-1 flex flex-col justify-center items-center py-2">
             <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={stats.totalStudents > 0 ? 440 - (440 * stats.presentToday) / stats.totalStudents : 440} className="text-greenAccent transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.totalStudents > 0 ? Math.round((stats.presentToday / stats.totalStudents) * 100) : 0}%</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Present</span>
                </div>
             </div>
             
             <div className="w-full mt-6 grid grid-cols-2 gap-4 text-center">
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100/50 dark:border-emerald-900/20">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Present</p>
                  <p className="text-xl font-bold text-slate-850 dark:text-slate-100 mt-1">{stats.presentToday}</p>
                </div>
                <div className="bg-red-50/40 dark:bg-red-950/20 rounded-xl p-3 border border-red-100/50 dark:border-red-900/20">
                  <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Absent</p>
                  <p className="text-xl font-bold text-slate-850 dark:text-slate-100 mt-1">{Math.max(0, stats.totalStudents - stats.presentToday)}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Recent Admissions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-6 lg:col-span-1 min-h-[360px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center"><UserCheck className="mr-2.5 text-blue-500" size={18}/> Recent Admissions</h3>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto">
            {recentAdmissions.length > 0 ? recentAdmissions.map((req, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all border border-slate-50 dark:border-slate-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold uppercase text-sm">
                    {req.studentName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{req.studentName}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Class: {req.grade}</p>
                  </div>
                </div>
                {req.status === 'Approved' ? (
                  <span className="flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30"><CheckCircle size={12} className="mr-1"/> Approved</span>
                ) : req.status === 'Rejected' ? (
                  <span className="flex items-center text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-full border border-red-100 dark:border-red-900/30">Rejected</span>
                ) : (
                  <span className="flex items-center text-xs font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 px-2.5 py-1 rounded-full border border-yellow-100 dark:border-yellow-900/30"><Clock size={12} className="mr-1"/> Pending</span>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-sm font-medium">No recent admissions found.</div>
            )}
          </div>
        </div>

        {/* Recent Notices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-6 lg:col-span-1 min-h-[360px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center"><Bell className="mr-2.5 text-orange-500" size={18}/> Recent Notices</h3>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto">
            {recentNotices.length > 0 ? recentNotices.map((notice, idx) => (
              <div key={idx} className={`p-4 border-l-4 rounded-r-2xl shadow-sm ${notice.isGlobal ? 'border-purple-450 bg-purple-50/10 dark:bg-purple-950/10' : 'border-orange-400 bg-orange-50/10 dark:bg-orange-950/10'}`}>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{notice.title}</h4>
                  {notice.isGlobal && <span className="text-[11px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full shrink-0">System</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-2 leading-relaxed line-clamp-2">{notice.content || notice.message}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{notice.date}</span>
                  <span className="text-xs font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md text-slate-500 dark:text-slate-450">{notice.audience}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-sm font-medium">No recent notices published.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
