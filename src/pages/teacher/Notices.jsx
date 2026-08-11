import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

const Notices = () => {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const savedNotices = JSON.parse(localStorage.getItem('schoolAdminNotices') || '[]');
    // Filter notices meant for Teachers or All
    const relevantNotices = savedNotices.filter(n => n.audience === 'All' || n.audience === 'Teachers');
    // Sort by date (newest first)
    relevantNotices.sort((a, b) => new Date(b.date) - new Date(a.date));
    setNotices(relevantNotices);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notices & Announcements</h2>
          <p className="text-gray-500 text-sm mt-1">View important updates from the school administration.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {notices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 flex flex-col items-center">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p>No new notices at this time.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full shrink-0 mt-1">
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-800">{notice.title}</h3>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{notice.date}</span>
                </div>
                <p className="text-gray-600 mt-2 text-sm leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Target Audience:</span>
                  <span className="text-xs font-medium text-darkBlue bg-blue-50 px-2 py-0.5 rounded">{notice.audience}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notices;
