import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, UserCheck, UserPlus, 
  GraduationCap, CreditCard, ClipboardList, Calendar, 
  Bell, Image as ImageIcon, FileText, Settings, LogOut,
  LifeBuoy, Sun, Moon, Menu, X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const SchoolAdminLayout = () => {
  const navigate = useNavigate();
  const { user: contextUser } = useAuth();
  const authUserString = sessionStorage.getItem('authUser');
  const authUser = authUserString ? JSON.parse(authUserString) : contextUser;
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
      const activeSchoolId = authUser?.schoolId || contextUser?.schoolId;
      if (activeSchoolId) {
        try {
          const { syncAllSchoolData } = await import('../utils/db');
          await syncAllSchoolData(activeSchoolId);
        } catch (err) {
          console.error('Error syncing SchoolAdminLayout:', err);
        }
      }
      setIsSyncing(false);
    };

    doSync();

    return () => window.removeEventListener('avatarUpdate', handleUpdate);
  }, [authUser?.schoolId, contextUser?.schoolId]);

  const handleLogout = () => {
    sessionStorage.removeItem('authUser');
    window.location.href = '/login';
  };

  const menuItems = [
    { path: '/school-admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
    { path: '/school-admin/user-management', icon: <Users size={18} />, label: 'User Management' },
    { path: '/school-admin/classes', icon: <BookOpen size={18} />, label: 'Class & Sections' },
    { path: '/school-admin/subjects', icon: <FileText size={18} />, label: 'Subjects' },
    { path: '/school-admin/teacher-assignments', icon: <UserCheck size={18} />, label: 'Teacher Assignments' },
    { path: '/school-admin/attendance', icon: <UserCheck size={18} />, label: 'Attendance' },
    { path: '/school-admin/admissions', icon: <UserPlus size={18} />, label: 'Admissions' },
    { path: '/school-admin/fee-management', icon: <CreditCard size={18} />, label: 'Fees Management' },
    { path: '/school-admin/fee-structure', icon: <CreditCard size={18} className="opacity-0 w-4" />, label: 'Fee Structure' },
    { path: '/school-admin/monthly-fees', icon: <CreditCard size={18} className="opacity-0 w-4" />, label: 'Monthly Fees' },
    { path: '/school-admin/collect-fees', icon: <CreditCard size={18} className="opacity-0 w-4" />, label: 'Collect Fees' },
    { path: '/school-admin/teacher-salaries', icon: <CreditCard size={18} className="opacity-0 w-4" />, label: 'Teacher Salaries' },
    { path: '/school-admin/exam-management', icon: <ClipboardList size={18} />, label: 'Exam Management' },
    { path: '/school-admin/marks-entry', icon: <ClipboardList size={18} className="opacity-0 w-4" />, label: 'Marks Entry' },
    { path: '/school-admin/result-processing', icon: <ClipboardList size={18} className="opacity-0 w-4" />, label: 'Result Processing' },
    { path: '/school-admin/publish-results', icon: <ClipboardList size={18} className="opacity-0 w-4" />, label: 'Publish Results' },
    { path: '/school-admin/report-cards', icon: <ClipboardList size={18} className="opacity-0 w-4" />, label: 'Report Cards' },
    { path: '/school-admin/merit-list', icon: <ClipboardList size={18} className="opacity-0 w-4" />, label: 'Merit List' },
    { path: '/school-admin/result-reports', icon: <ClipboardList size={18} className="opacity-0 w-4" />, label: 'Result Reports' },
    { path: '/school-admin/timetable', icon: <Calendar size={18} />, label: 'Timetable' },
    { path: '/school-admin/notices', icon: <Bell size={18} />, label: 'Notices' },
    { path: '/school-admin/gallery', icon: <ImageIcon size={18} />, label: 'Gallery' },
    { path: '/school-admin/reports', icon: <FileText size={18} />, label: 'Reports' },
    { path: '/school-admin/support', icon: <LifeBuoy size={18} />, label: 'Support Center' },
    { path: '/school-admin/settings', icon: <Settings size={18} />, label: 'Settings' },
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
        {/* Sidebar Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between lg:justify-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2.5">
              <span className="w-2 h-2 bg-greenAccent rounded-full animate-pulse shadow-sm"></span>
              <h1 className="text-lg font-black text-center leading-none tracking-wide text-white">
                Smart School
              </h1>
            </div>
            <span className="text-[9px] uppercase font-bold text-greenAccent mt-1.5 tracking-widest leading-none">School Admin</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto py-5 px-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => 
                `flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 relative ${
                  isActive 
                    ? 'bg-white/10 text-white font-bold' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-greenAccent rounded-r-md"></span>
                  )}
                  {item.icon}
                  <span className="text-[13px]">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 font-bold"
          >
            <LogOut size={18} />
            <span className="text-[13px]">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col min-w-0">
        {/* Dashboard Header */}
        <header className="bg-white border-b border-slate-100 h-16 flex items-center px-4 sm:px-8 shrink-0 justify-between lg:justify-end sticky top-0 z-10 shadow-sm">
          
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
               className="portal-theme-toggle"
               title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
               aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
             >
               {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
             </button>

             <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

             {/* Admin User Details */}
             <div className="flex items-center space-x-2 sm:space-x-3">
               <div className="w-8 h-8 bg-greenAccent rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm overflow-hidden shrink-0">
                 {avatar ? (
                   <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   authUser?.name?.substring(0,2) || 'SA'
                 )}
               </div>
               <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[120px] sm:max-w-none">{authUser?.name || 'School Admin'}</span>
             </div>
           </div>
        </header>
        
        {/* Main Content Viewport */}
        <div className="p-4 sm:p-6 md:p-8 flex-1 max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SchoolAdminLayout;
