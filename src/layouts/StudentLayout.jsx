import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, UserCheck, Book, Award, 
  Calendar, Bell, User, LogOut, CreditCard, Sun, Moon, Menu, X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const StudentLayout = () => {
  const navigate = useNavigate();
  const authUserString = sessionStorage.getItem('authUser');
  const authUser = authUserString ? JSON.parse(authUserString) : null;
  const { isDark, toggleTheme } = useTheme();

  const [avatar, setAvatar] = useState(authUser?.profilePhoto || null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          console.error('Error syncing StudentLayout:', err);
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
    { path: '/student', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
    { path: '/student/attendance', icon: <UserCheck size={20} />, label: 'Attendance' },
    { path: '/student/homework', icon: <Book size={20} />, label: 'Homework' },
    { path: '/student/results', icon: <Award size={20} />, label: 'My Results' },
    { path: '/student/fee-status', icon: <CreditCard size={20} />, label: 'My Fees' },
    { path: '/student/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
    { path: '/student/notices', icon: <Bell size={20} />, label: 'Notices' },
    { path: '/student/profile', icon: <User size={20} />, label: 'Profile' },
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
      
      {/* Mobile Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar (Desktop + Mobile Slide-over Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-darkBlue text-white flex flex-col h-full shrink-0 shadow-2xl transition-transform duration-300 ease-in-out border-r border-white/5
        lg:static lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between lg:justify-center">
          <h1 className="text-xl font-bold text-center leading-tight">Student<br/><span className="text-sm font-light text-greenAccent">Portal</span></h1>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setIsMobileMenuOpen(false)}
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sm:px-8 shrink-0 justify-between lg:justify-end sticky top-0 z-10 shadow-sm">
          
          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center space-x-3">
             {/* Portal Theme Toggle */}
             <button
               onClick={toggleTheme}
               className="portal-theme-toggle mr-1 sm:mr-2"
               title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
               aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
             >
               {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
             </button>

             <div className="h-6 w-px bg-gray-200" />

             <div className="flex items-center space-x-2 sm:space-x-3">
               <div className="w-8 h-8 bg-greenAccent rounded-full flex items-center justify-center text-white font-bold text-sm uppercase overflow-hidden shrink-0">
                 {avatar ? (
                   <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   authUser?.name?.substring(0,2) || 'S'
                 )}
               </div>
               <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[120px] sm:max-w-none">{authUser?.name || 'Student'}</span>
             </div>
           </div>
        </header>
        <div className="p-4 sm:p-6 md:p-8 flex-1 max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
