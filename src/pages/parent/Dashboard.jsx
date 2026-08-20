import React, { useState, useEffect } from 'react';
import { User, BookOpen, Bell, CreditCard } from 'lucide-react';
import ProfileHeaderCard from '../../components/ProfileHeaderCard';

const Dashboard = () => {
  const [stats, setStats] = useState({
    attendance: 0,
    homework: 0,
    feesDue: 0,
    notices: 0
  });

  const [childInfo, setChildInfo] = useState(null);
  const [parentInfo, setParentInfo] = useState({});
  const [recentNotices, setRecentNotices] = useState([]);
  const [classInfo, setClassInfo] = useState({ className: 'N/A', section: 'N/A' });

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    // Find parent record to get latest updates/photo
    const parent = users.find(u => u.id?.toString() === authUser.id?.toString()) || authUser;
    setParentInfo(parent);

    // Find the linked child using parent associations
    const child = users.find(u => 
      u.role?.toLowerCase() === 'student' && 
      (u.id?.toString() === parent.studentId?.toString() || 
       u.parentId?.toString() === parent.id?.toString() ||
       (parent.childIds || []).map(cid => cid.toString()).includes(u.id?.toString()))
    );
    
    setChildInfo(child || null);

    // Notices relevant to parents
    const notices = JSON.parse(localStorage.getItem('schoolAdminNotices') || '[]');
    const relevantNotices = notices.filter(n => n.audience === 'All' || n.audience === 'Parents');
    
    // Global Notifications
    const globalNotifications = JSON.parse(localStorage.getItem('superAdminNotifications') || '[]');
    const mySchoolId = parent.schoolId || 'global';
    
    const relevantGlobal = globalNotifications.filter(n => 
      n.audience === 'All Schools' || n.schoolId === mySchoolId
    ).map(n => ({
      ...n,
      isGlobal: true,
      date: n.publishDate
    }));

    const allNotices = [...relevantNotices, ...relevantGlobal].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (child) {
      // Resolve class/section name
      const classesList = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
      const myClass = classesList.find(c => c.id?.toString() === child.classId?.toString());
      if (myClass) {
        setClassInfo({
          className: myClass.className || 'N/A',
          section: myClass.section || 'N/A'
        });
      }

      // 1. Attendance percentage calculation from array
      const savedAttendance = JSON.parse(localStorage.getItem('schoolAdminAttendance') || '[]');
      let totalDays = 0;
      let presentDays = 0;
      savedAttendance.forEach(record => {
        const status = record.records?.[child.id?.toString()] || record.records?.[child.id];
        if (status) {
          totalDays++;
          if (status === 'Present') presentDays++;
        }
      });
      const attPercent = totalDays === 0 ? 100 : Math.round((presentDays / totalDays) * 100);

      // 2. Homework
      const homework = JSON.parse(localStorage.getItem('teacherHomework') || '[]');
      const myHomework = homework.filter(h => !child.classId || h.classId?.toString() === child.classId?.toString());
      
      // 3. Fees Due
      const fees = JSON.parse(localStorage.getItem('schoolAdminFees') || '[]');
      const myFees = fees.filter(f => f.studentId?.toString() === child.id?.toString() && f.status === 'Unpaid');
      
      setStats({
        attendance: attPercent,
        homework: myHomework.length,
        feesDue: myFees.length,
        notices: allNotices.length
      });
      setRecentNotices(allNotices.slice(0, 3));
    } else {
      setStats({
        attendance: 100,
        homework: 0,
        feesDue: 0,
        notices: allNotices.length
      });
      setRecentNotices(allNotices.slice(0, 3));
    }
  }, [authUser.id]);

  const statCards = [
    { title: 'Child Attendance', value: `${stats.attendance}%`, icon: <BookOpen size={24} />, color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Homework Pending', value: stats.homework, icon: <User size={24} />, color: 'bg-purple-100 text-purple-600' },
    { title: 'Unpaid Fees', value: stats.feesDue, icon: <CreditCard size={24} />, color: 'bg-red-100 text-red-600' },
    { title: 'New Notices', value: stats.notices, icon: <Bell size={24} />, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <ProfileHeaderCard 
        name={parentInfo.name || 'Parent'}
        role="Parent"
        avatarUrl={parentInfo.photo || ''}
        details={[
          { label: 'Child Name', value: childInfo ? childInfo.name : 'N/A' },
          { label: 'Child Roll Number', value: childInfo ? childInfo.rollNumber : 'N/A' },
          { label: 'Child Class', value: childInfo ? `${classInfo.className} - ${classInfo.section}` : 'N/A' },
          { label: 'Email', value: parentInfo.email || 'N/A' },
          { label: 'Phone', value: parentInfo.phone || 'N/A' }
        ]}
      />

      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Parent Dashboard</h2>
          <p className="text-slate-400 font-medium text-xs mt-1">Welcome back, {parentInfo.name}</p>
        </div>
      </div>

      {!childInfo && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-400 dark:border-yellow-550 p-4 rounded-r-2xl shadow-sm text-yellow-750 dark:text-yellow-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-semibold">
                No child account is linked to your profile. Please contact the school administration.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {statCards.map((stat, index) => {
          const cardTypeClass = 
            index === 0 ? 'stat-card-premium-teachers' :
            index === 1 ? 'stat-card-premium-classes' :
            index === 2 ? 'stat-card-premium-students' :
            'stat-card-premium-demo';
          return (
            <div key={index} className={`stat-card-premium ${cardTypeClass} bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl flex items-start justify-between border border-slate-200 dark:border-slate-800`}>
              <div>
                <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">{stat.title}</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">{stat.value}</h3>
              </div>
              <div className={`p-2.5 rounded-xl shadow-sm ${stat.color} dark:bg-slate-800/60 dark:text-slate-100 inline-flex shrink-0 border border-slate-200/60 dark:border-slate-700`}>
                {stat.icon}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 min-h-[300px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center"><Bell className="mr-2.5 text-orange-600" size={20}/> Recent Notices</h3>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {recentNotices.length > 0 ? recentNotices.map((notice, idx) => (
              <div key={idx} className={`p-4 border-l-4 rounded-r-2xl shadow-xs ${notice.isGlobal ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20' : 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'}`}>
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{notice.title}</h4>
                  {notice.isGlobal && <span className="text-[11px] font-black text-purple-800 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full ml-2 shrink-0">System</span>}
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2">{notice.content || notice.message}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{notice.date}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400 text-sm font-bold italic">No new notices found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
