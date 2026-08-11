import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, UserCheck, Edit3, Upload, 
  Calendar, Bell, User, LogOut, Sun, Moon, QrCode 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const TeacherLayout = () => {
  const navigate = useNavigate();
  const authUserString = sessionStorage.getItem('authUser');
  const authUser = authUserString ? JSON.parse(authUserString) : null;
  const { isDark, toggleTheme } = useTheme();

  const [avatar, setAvatar] = useState(authUser?.profilePhoto || null);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const handleUpdate = () => {
      const updatedUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
      setAvatar(updatedUser?.profilePhoto || null);
    };
    window.addEventListener('avatarUpdate', handleUpdate);

    const doSync = async () => {
      if (authUser?.schoolId) {
        try {
          const { syncAllSchoolData } = await import('../utils/db');
          await syncAllSchoolData(authUser.schoolId);
        } catch (err) {
          console.error('Error syncing TeacherLayout:', err);
        }
      }
      setIsSyncing(false);
    };

    doSync();

    return () => window.removeEventListener('avatarUpdate', handleUpdate);
  }, [authUser?.schoolId]);

  const handleLogout = () => {
    sessionStorage.removeItem('authUser');
    window.location.href = '/login';
  };

  const menuItems = [
    { path: '/teacher', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
    { path: '/teacher/attendance', icon: <UserCheck size={20} />, label: 'Manage Attendance' },
    { path: '/teacher/qr-attendance', icon: <QrCode size={20} />, label: 'QR Attendance' },
    { path: '/teacher/marks', icon: <Edit3 size={20} />, label: 'Marks Entry' },
    { path: '/teacher/homework', icon: <Upload size={20} />, label: 'Upload Homework' },
    { path: '/teacher/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
    { path: '/teacher/notices', icon: <Bell size={20} />, label: 'Notices' },
    { path: '/teacher/profile', icon: <User size={20} />, label: 'Update Profile' },
  ];

  if (isSyncing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 flex-col gap-3 font-poppins">
        <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-darkBlue"></span>
        <span className="text-sm font-semibold text-gray-500">Synchronizing portal data...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-poppins overflow-hidden" data-theme={isDark ? 'dark' : 'light'}>
      <aside className="w-64 bg-darkBlue text-white flex flex-col h-full shrink-0 shadow-xl z-20 relative">
        <div className="p-6 border-b border-white/10 flex items-center justify-center">
          <h1 className="text-xl font-bold text-center leading-tight">Teacher<br/><span className="text-sm font-light text-greenAccent">Portal</span></h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => 
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                  isActive 
                    ? 'bg-white/10 text-white font-bold' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-3 bottom-3 w-1 bg-greenAccent rounded-r-md"></span>
                  )}
                  {item.icon}
                  <span className="text-[13px]">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shrink-0 justify-end sticky top-0 z-10 shadow-sm">
           <div className="flex items-center space-x-4">
             {/* Portal Theme Toggle */}
             <button
               onClick={toggleTheme}
               className="portal-theme-toggle"
               title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
               aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
             >
               {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
             </button>

             <div className="h-6 w-px bg-gray-200" />

             <div className="flex items-center space-x-3">
               <div className="w-8 h-8 bg-greenAccent rounded-full flex items-center justify-center text-white font-bold text-sm uppercase overflow-hidden">
                 {avatar ? (
                   <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   authUser?.name?.substring(0,2) || 'T'
                 )}
               </div>
               <span className="text-sm font-medium text-gray-700">{authUser?.name || 'Teacher'}</span>
             </div>
           </div>
        </header>
        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default TeacherLayout;
