import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

const Timetable = () => {
  const [timetable, setTimetable] = useState({});
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    const savedTimetable = JSON.parse(localStorage.getItem('schoolAdminTimetable') || '{}');
    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    const savedUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');

    setClasses(savedClasses);
    setSubjects(savedSubjects);
    setTeachers(savedUsers.filter(u => u.role === 'teacher' || u.role === 'Teacher'));

    // Filter timetable for this teacher
    const myTimetable = {};
    Object.keys(savedTimetable).forEach(classId => {
      const classTimetable = savedTimetable[classId];
      if (classTimetable && typeof classTimetable === 'object') {
        Object.keys(classTimetable).forEach(day => {
          const dayTimetable = classTimetable[day];
          if (dayTimetable && typeof dayTimetable === 'object') {
            Object.keys(dayTimetable).forEach(period => {
              const entry = dayTimetable[period];
              if (entry && typeof entry === 'object' && entry.teacherId?.toString() === authUser.id?.toString()) {
                if (!myTimetable[day]) myTimetable[day] = {};
                myTimetable[day][period] = { classId, subjectId: entry.subjectId };
              }
            });
          }
        });
      }
    });

    setTimetable(myTimetable);
  }, [authUser.id]);

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id.toString() === id?.toString());
    return sub ? sub.subjectName : 'Free Period';
  };

  const getClassName = (id) => {
    const cls = classes.find(c => c.id.toString() === id?.toString());
    return cls ? `${cls.className}-${cls.section}` : '';
  };

  const isTimetableConfigured = Object.keys(timetable).length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Timetable</h2>
          <p className="text-gray-500 text-sm mt-1">View your weekly teaching schedule.</p>
        </div>
      </div>

      {!isTimetableConfigured ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4 animate-pulse" />
          <p className="font-semibold text-lg text-slate-700">No Classes Scheduled</p>
          <p className="text-slate-400 text-sm mt-1">No timetable periods have been configured for you yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
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
                          {entry ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 h-full flex flex-col justify-center transition-colors">
                              <span className="font-semibold text-green-800 block text-xs mb-1">
                                {getSubjectName(entry.subjectId)}
                              </span>
                              <span className="text-green-600 text-[11px] block">
                                Class: {getClassName(entry.classId)}
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
