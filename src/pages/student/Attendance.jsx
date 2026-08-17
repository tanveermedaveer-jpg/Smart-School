import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Calendar as CalendarIcon, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const Attendance = () => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, leave: 0, total: 0 });
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    const savedAttendance = JSON.parse(localStorage.getItem('schoolAdminAttendance') || '[]');
    const history = [];
    let p = 0, a = 0, l = 0, lv = 0;

    savedAttendance.forEach(record => {
      const status = record.records?.[authUser.id?.toString()] || record.records?.[authUser.id];
      if (status) {
        history.push({ date: record.date, status, subjectId: record.subjectId });
        if (status === 'Present') p++;
        else if (status === 'Absent') a++;
        else if (status === 'Late') l++;
        else if (status === 'Leave') lv++;
      }
    });

    // Sort history by date descending
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Resolve subject names for display if possible
    const subjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    const enriched = history.map(item => {
      const sub = subjects.find(s => s.id?.toString() === item.subjectId?.toString());
      return {
        ...item,
        subjectName: sub ? sub.subjectName : 'General Attendance'
      };
    });

    setAttendanceHistory(enriched);
    setStats({ present: p, absent: a, late: l, leave: lv, total: p + a + l + lv });
  }, [authUser.id]);

  const percent = stats.total === 0 ? 100 : Math.round(((stats.present + stats.late) / stats.total) * 100);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Attendance</h2>
          <p className="text-gray-500 text-sm mt-1">View your attendance record and statistics.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-2.5 sm:space-x-4">
          <div className="p-2.5 sm:p-3 bg-blue-100 text-blue-600 rounded-lg shrink-0"><CalendarIcon size={20} className="sm:w-6 sm:h-6" /></div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Overall</p>
            <h3 className="text-base sm:text-xl font-bold text-gray-800">{percent}%</h3>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-2.5 sm:space-x-4">
          <div className="p-2.5 sm:p-3 bg-green-100 text-green-600 rounded-lg shrink-0"><CheckCircle size={20} className="sm:w-6 sm:h-6" /></div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Present</p>
            <h3 className="text-base sm:text-xl font-bold text-gray-800">{stats.present}</h3>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-2.5 sm:space-x-4">
          <div className="p-2.5 sm:p-3 bg-red-100 text-red-600 rounded-lg shrink-0"><XCircle size={20} className="sm:w-6 sm:h-6" /></div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Absent</p>
            <h3 className="text-base sm:text-xl font-bold text-gray-800">{stats.absent}</h3>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-2.5 sm:space-x-4">
          <div className="p-2.5 sm:p-3 bg-yellow-100 text-yellow-600 rounded-lg shrink-0"><AlertCircle size={20} className="sm:w-6 sm:h-6" /></div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Late</p>
            <h3 className="text-base sm:text-xl font-bold text-gray-800">{stats.late}</h3>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-2.5 sm:space-x-4 col-span-2 sm:col-span-1">
          <div className="p-2.5 sm:p-3 bg-purple-100 text-purple-600 rounded-lg shrink-0"><Info size={20} className="sm:w-6 sm:h-6" /></div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Leave</p>
            <h3 className="text-base sm:text-xl font-bold text-gray-800">{stats.leave}</h3>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <span className="text-xs text-gray-500 font-semibold">Detailed Log History</span>
        <ExportButtons tableId="export-table" filename="My Attendance" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {attendanceHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No attendance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Subject / Class Activity</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700">
                {attendanceHistory.map((record, index) => (
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-darkBlue">{record.date}</td>
                    <td className="p-4 font-semibold text-gray-600">{record.subjectName}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold 
                        ${record.status === 'Present' ? 'bg-green-50 text-green-700 border border-green-200' : 
                          record.status === 'Absent' ? 'bg-red-50 text-red-700 border border-red-200' : 
                          record.status === 'Late' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                          'bg-purple-50 text-purple-700 border border-purple-200'}`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
