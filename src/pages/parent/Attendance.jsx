import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Calendar as CalendarIcon, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const Attendance = () => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, leave: 0, total: 0 });
  const [childId, setChildId] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    const myChildren = users.filter(u => 
      u.role?.toLowerCase() === 'student' && 
      (u.parentId?.toString() === authUser.id?.toString() || 
       (authUser.childIds || []).map(cid => cid.toString()).includes(u.id?.toString()))
    );

    setChildren(myChildren);
    if (myChildren.length > 0) {
      setSelectedChildId(myChildren[0].id?.toString() || '');
      setChildId(myChildren[0].id);
    }
  }, [authUser.id]);

  useEffect(() => {
    if (selectedChildId) {
      setChildId(parseInt(selectedChildId));
      const savedAttendance = JSON.parse(localStorage.getItem('schoolAdminAttendance') || '[]');
      const history = [];
      let p = 0, a = 0, l = 0, lv = 0;

      savedAttendance.forEach(record => {
        const status = record.records?.[selectedChildId] || record.records?.[parseInt(selectedChildId)];
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
    } else {
      setAttendanceHistory([]);
      setStats({ present: 0, absent: 0, late: 0, leave: 0, total: 0 });
    }
  }, [selectedChildId]);

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 text-xs">
        <AlertCircle size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="font-semibold">No children profiles are linked to your parent account.</p>
      </div>
    );
  }

  const percent = stats.total === 0 ? 100 : Math.round(((stats.present + stats.late) / stats.total) * 100);

  const getClassName = (classId) => {
    const classes = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const cls = classes.find(c => c.id?.toString() === classId?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Children Attendance Registers</h2>
          <p className="text-gray-500 text-sm mt-1">Review active class presence records and percentage stats for your children.</p>
        </div>
      </div>

      {/* Select Child Toggle Buttons */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        {children.map(child => (
          <button
            key={child.id}
            onClick={() => setSelectedChildId(child.id?.toString() || '')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${selectedChildId === child.id?.toString() ? 'bg-white text-darkBlue shadow' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {child.name} ({getClassName(child.classId)})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><CalendarIcon size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Overall</p>
            <h3 className="text-xl font-bold text-gray-800">{percent}%</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Present</p>
            <h3 className="text-xl font-bold text-gray-800">{stats.present}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><XCircle size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Absent</p>
            <h3 className="text-xl font-bold text-gray-800">{stats.absent}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg"><AlertCircle size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Late</p>
            <h3 className="text-xl font-bold text-gray-800">{stats.late}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Info size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Leave</p>
            <h3 className="text-xl font-bold text-gray-800">{stats.leave}</h3>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-gray-500 font-semibold">Detailed Log History</span>
        <ExportButtons tableId="export-table" filename="Child_Attendance" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {attendanceHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No attendance records found for this student profile.
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
