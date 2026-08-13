import React, { useEffect, useState } from 'react';
import { School, Users, UserCheck, MessageSquare, Mail } from 'lucide-react';
import ProfileHeaderCard from '../../components/ProfileHeaderCard';
import { getSchools, getAllUsersRaw, getCollection } from '../../utils/db';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    schools: 0,
    students: 0,
    teachers: 0,
    demoRequests: 0,
    contactMessages: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all collections asynchronously from Firestore
        const schoolsList = await getSchools();
        const usersList = await getAllUsersRaw();
        const demoReqs = await getCollection('demoRequests');
        const contactMsgs = await getCollection('contactMessages');

        // Filter users count by role
        const studentsCount = usersList.filter(u => u.role === 'student').length;
        const teachersCount = usersList.filter(u => u.role === 'teacher').length;

        setStats({
          schools: schoolsList.length,
          students: studentsCount,
          teachers: teachersCount,
          demoRequests: demoReqs.length,
          contactMessages: contactMsgs.length
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const statCards = [
    { 
      title: 'Total Schools', 
      value: stats.schools, 
      icon: <School className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />, 
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      cardClass: 'stat-card-premium-schools'
    },
    { 
      title: 'Total Students', 
      value: stats.students.toLocaleString(), 
      icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />, 
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      cardClass: 'stat-card-premium-students'
    },
    { 
      title: 'Total Teachers', 
      value: stats.teachers.toLocaleString(), 
      icon: <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />, 
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      cardClass: 'stat-card-premium-teachers'
    },
    { 
      title: 'Demo Requests', 
      value: stats.demoRequests, 
      icon: <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />, 
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      cardClass: 'stat-card-premium-demo'
    },
    { 
      title: 'Contact Messages', 
      value: stats.contactMessages, 
      icon: <Mail className="w-6 h-6 text-teal-600 dark:text-teal-400" />, 
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      cardClass: 'stat-card-premium-contact'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Profile Section */}
      <ProfileHeaderCard 
        name={user?.name || "Super Administrator"}
        role="Super Admin"
        details={[
          { label: 'Company', value: 'Smart School Management System' },
          { label: 'Email', value: user?.email || 'muhammadsaadweb10@gmail.com' },
          { label: 'Phone', value: '+92 300 1234567' }
        ]}
      />

      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
              Dashboard Overview
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Platform statistics and resource utilization</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
            <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-darkBlue"></span>
            <span className="ml-3 text-slate-500 font-medium text-sm">Loading statistics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {statCards.map((stat, idx) => (
              <div 
                key={idx} 
                className={`stat-card-premium ${stat.cardClass} bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.bg} shadow-sm inline-flex`}>
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">{stat.value}</h3>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* High Fidelity Performance Visual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 min-h-[320px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">School Registration Trends</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Monthly overview of new schools registered on the platform</p>
            </div>
            <div className="flex space-x-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg text-xs font-bold font-mono">
                +18.4%
              </span>
            </div>
          </div>
          
          <div className="h-44 flex items-end justify-between gap-3 px-2 pt-4 relative">
            {[40, 55, 38, 70, 85, 60, 95, 80, 110, 90, 130, 145].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer relative h-full justify-end">
                <div 
                  className="w-full bg-slate-50 dark:bg-slate-800/40 rounded-t-lg absolute bottom-0 left-0 right-0 h-full -z-0"
                />
                <div 
                  className="w-full bg-gradient-to-t from-darkBlue to-greenAccent rounded-t-lg transition-all duration-500 ease-out z-10 group-hover:brightness-110"
                  style={{ height: `${(val / 160) * 100}%` }}
                />
                
                {/* Custom Tooltip */}
                <div className="absolute -top-7 bg-slate-850 dark:bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow font-mono font-bold">
                  {val}
                </div>
                
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 z-10 select-none uppercase font-bold tracking-tighter">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between min-h-[320px]">
          <div>
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-1">System Diagnostics</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Real-time health status of cloud systems</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm"></span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Auth Systems</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full uppercase">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm"></span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Firestore Cloud</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full uppercase">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm"></span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Storage Nodes</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full uppercase">Active</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Ping Response latency:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">24ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
