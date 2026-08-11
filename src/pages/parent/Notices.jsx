import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

const Notices = () => {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const mySchoolId = authUser.schoolId || 'global';

    const savedNotices = JSON.parse(localStorage.getItem('schoolAdminNotices') || '[]');
    const relevantNotices = savedNotices.filter(n => n.audience === 'All' || n.audience === 'Parents');
    
    const globalNotifications = JSON.parse(localStorage.getItem('superAdminNotifications') || '[]');
    const relevantGlobal = globalNotifications.filter(n => 
      n.audience === 'All Schools' || n.schoolId === mySchoolId
    ).map(n => ({
      ...n,
      isGlobal: true,
      date: n.publishDate
    }));

    const allNotices = [...relevantNotices, ...relevantGlobal].sort((a, b) => new Date(b.date) - new Date(a.date));
    setNotices(allNotices);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notices & Announcements</h2>
          <p className="text-gray-500 text-sm mt-1">View important updates from the school administration.</p>
        </div>
      </div>

      <div className="grid gap-4 text-xs">
        {notices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 flex flex-col items-center">
            <Bell className="w-12 h-12 text-gray-300 mb-3 animate-bounce" />
            <p className="font-bold">No new notices at this time.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full shrink-0 mt-1">
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <h3 className="text-sm font-bold text-gray-800">{notice.title}</h3>
                    {notice.isGlobal && (
                      <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full ml-2 shrink-0 uppercase">
                        System Announcement
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase tracking-wider">{notice.date}</span>
                </div>
                <p className="text-gray-500 mt-2 text-xs leading-relaxed whitespace-pre-wrap">{notice.content || notice.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notices;
