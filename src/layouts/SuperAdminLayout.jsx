import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  School, 
  Users,
  MessageSquare, 
  Image as ImageIcon, 
  GraduationCap, 
  CreditCard, 
  Settings,
  LogOut,
  Mail,
  Globe,
  Bell,
  FileText,
  LifeBuoy,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const authUserString = sessionStorage.getItem('authUser');
  const authUser = authUserString ? JSON.parse(authUserString) : null;
  const [avatar, setAvatar] = useState(authUser?.profilePhoto || null);

  useEffect(() => {
    const handleUpdate = () => {
      const updatedUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
      setAvatar(updatedUser?.profilePhoto || null);
    };
    window.addEventListener('avatarUpdate', handleUpdate);
    
    // Sync memoryStorage cache from backend for Super Admin
    const syncData = async () => {
      try {
        const { syncAllSchoolData } = await import('../utils/db');
        await syncAllSchoolData('SYSTEM');
      } catch (e) {
        console.warn('[SuperAdminLayout] Data sync warning:', e);
      }
    };
    syncData();

    return () => window.removeEventListener('avatarUpdate', handleUpdate);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('superAdminAuth');
    sessionStorage.removeItem('authUser');
    window.location.href = '/login';
  };

  const menuItems = [
    { path: '/super-admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
    { path: '/super-admin/schools', icon: <School size={20} />, label: 'Schools Management' },
    { path: '/super-admin/school-admins', icon: <Users size={20} />, label: 'School Admins' },
    { path: '/super-admin/academic-templates', icon: <BookOpen size={20} />, label: 'Academic Templates' },
    { path: '/super-admin/admissions', icon: <GraduationCap size={20} />, label: 'Admissions' },
    { path: '/super-admin/demo-requests', icon: <MessageSquare size={20} />, label: 'Demo Requests' },
    { path: '/super-admin/contact-messages', icon: <Mail size={20} />, label: 'Contact Messages' },
    { path: '/super-admin/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    { path: '/super-admin/support', icon: <LifeBuoy size={20} />, label: 'Support Center' },
    { path: '/super-admin/gallery', icon: <ImageIcon size={20} />, label: 'Gallery Management' },
    { path: '/super-admin/website-content', icon: <Globe size={20} />, label: 'Website Content' },
    { path: '/super-admin/subscriptions', icon: <CreditCard size={20} />, label: 'Subscriptions' },
    { path: '/super-admin/system-logs', icon: <FileText size={20} />, label: 'System Logs' },
    { path: '/super-admin/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-poppins overflow-hidden" data-theme={isDark ? 'dark' : 'light'}>
      {/* Sidebar */}
      <aside className="w-64 bg-darkBlue text-white flex flex-col h-full shrink-0 shadow-xl z-20 relative border-r border-white/5">
        <div className="p-6 border-b border-white/10 flex items-center justify-center">
          <h1 className="text-xl font-bold text-center leading-tight">Super Admin<br/><span className="text-sm font-light text-greenAccent">Smart School</span></h1>
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shrink-0 justify-end sticky top-0 z-10 shadow-sm">
           <div className="flex items-center space-x-3">
             {/* Portal Theme Toggle */}
             <button
               onClick={toggleTheme}
               className="portal-theme-toggle mr-2"
               title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
               aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
             >
               {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
             </button>

             <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mr-2" />

             <div className="w-8 h-8 bg-greenAccent rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
               {avatar ? (
                 <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 authUser?.name?.substring(0,2) || 'SA'
               )}
             </div>
             <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{authUser?.name || 'Super Admin'}</span>
           </div>
        </header>
        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
