import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Calendar } from 'lucide-react';

const Timetable = () => {
  const [timetable, setTimetable] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    const savedTimetable = JSON.parse(localStorage.getItem('schoolAdminTimetable') || '{}');
    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    const savedUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');

    setSubjects(savedSubjects);
    setTeachers(savedUsers.filter(u => u.role === 'teacher' || u.role === 'Teacher'));

    if (authUser.classId && savedTimetable[authUser.classId]) {
      setTimetable(savedTimetable[authUser.classId]);
    }
  }, [authUser.classId]);

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id.toString() === id?.toString());
    return sub ? sub.subjectName : 'Free Period';
  };

  const getTeacherName = (id) => {
    const teacher = teachers.find(t => t.id.toString() === id?.toString());
    return teacher ? teacher.name : '';
  };

  const isTimetableConfigured = Object.keys(timetable).length > 0;

  if (!authUser.classId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
        You are not assigned to any class yet. Please contact the administration.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Timetable</h2>
          <p className="text-gray-500 text-sm mt-1">View your weekly class schedule.</p>
        </div>
      
        <ExportButtons tableId="export-table" filename="My Timetable" />
      </div>

      {!isTimetableConfigured ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4 animate-pulse" />
          <p className="font-semibold text-lg text-slate-700">No Timetable Configured</p>
          <p className="text-slate-400 text-sm mt-1">No timetable has been configured for this class yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-darkBlue text-white text-sm">
                  <th className="p-4 font-semibold border-r border-blue-800 w-32">Day / Period</th>
                  {periods.map(p => (
                    <th key={p} className="p-4 font-semibold text-center border-r border-blue-800 last:border-0">
                      Period {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {days.map((day) => (
                  <tr key={day} className="border-b border-gray-100 last:border-0">
                    <td className="p-4 font-semibold text-darkBlue bg-gray-50 border-r border-gray-100">
                      {day}
                    </td>
                    {periods.map((period) => {
                      const entry = timetable[day]?.[period];
                      return (
                        <td key={period} className="p-3 border-r border-gray-100 last:border-0 text-center relative group h-24">
                          {entry && entry.subjectId ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 h-full flex flex-col justify-center transition-colors">
                              <span className="font-semibold text-blue-800 block text-xs mb-1">
                                {getSubjectName(entry.subjectId)}
                              </span>
                              <span className="text-blue-600 text-[11px] block truncate">
                                {getTeacherName(entry.teacherId)}
                              </span>
                            </div>
                          ) : (
                            <div className="text-slate-400 bg-slate-50/50 rounded-lg p-2 h-full flex flex-col justify-center font-medium text-xs">
                              Free Period
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
