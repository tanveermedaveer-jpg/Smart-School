import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

const Timetable = () => {
  const [timetable, setTimetable] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    const savedUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');

    setSubjects(savedSubjects);
    setTeachers(savedUsers.filter(u => u.role?.toLowerCase() === 'teacher'));

    const myChildren = savedUsers.filter(u => 
      u.role?.toLowerCase() === 'student' && 
      (u.parentId?.toString() === authUser.id?.toString() || 
       (authUser.childIds || []).map(cid => cid.toString()).includes(u.id?.toString()))
    );

    setChildren(myChildren);
    if (myChildren.length > 0) {
      setSelectedChildId(myChildren[0].id?.toString() || '');
    }
  }, [authUser.id]);

  useEffect(() => {
    if (selectedChildId) {
      const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      const child = users.find(u => u.id?.toString() === selectedChildId);
      if (child && child.classId) {
        const savedTimetable = JSON.parse(localStorage.getItem('schoolAdminTimetable') || '{}');
        setTimetable(savedTimetable[child.classId] || {});
      } else {
        setTimetable({});
      }
    } else {
      setTimetable({});
    }
  }, [selectedChildId]);

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id?.toString() === id?.toString());
    return sub ? sub.subjectName : 'Free Period';
  };

  const getTeacherName = (id) => {
    const teacher = teachers.find(t => t.id?.toString() === id?.toString());
    return teacher ? teacher.name : '';
  };

  const getClassName = (classId) => {
    const classes = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const cls = classes.find(c => c.id?.toString() === classId?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 text-xs">
        <AlertCircle size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="font-semibold">No children profiles are linked to your parent account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Weekly Class Timetable</h2>
          <p className="text-gray-500 text-sm mt-1">Review lesson schedules, timeslots, and subject classrooms for your children.</p>
        </div>
      </div>

      {/* Select Child Toggle Buttons */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        {children.map(child => (
          <button
            key={child.id}
            onClick={() => setSelectedChildId(child.id.toString())}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${selectedChildId === child.id.toString() ? 'bg-white text-darkBlue shadow' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {child.name} ({getClassName(child.classId)})
          </button>
        ))}
      </div>

      {!selectedChildId || Object.keys(timetable).length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4 animate-pulse" />
          <p className="font-semibold text-lg text-slate-700">No Timetable Configured</p>
          <p className="text-slate-400 text-sm mt-1">No timetable has been configured for this class yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-darkBlue text-white text-xs">
                  <th className="p-4 font-bold border-r border-blue-800 w-32 uppercase">Day / Period</th>
                  {periods.map(p => (
                    <th key={p} className="p-4 font-bold text-center border-r border-blue-800 last:border-0 uppercase">
                      Period {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700">
                {days.map((day) => (
                  <tr key={day} className="border-b border-gray-100 last:border-0">
                    <td className="p-4 font-bold text-darkBlue bg-gray-50 border-r border-gray-100 uppercase tracking-wider">
                      {day}
                    </td>
                    {periods.map((period) => {
                      const entry = timetable[day]?.[period];
                      return (
                        <td key={period} className="p-3 border-r border-gray-100 last:border-0 text-center relative group h-24">
                          {entry && entry.subjectId ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 h-full flex flex-col justify-center transition-colors">
                              <span className="font-bold text-blue-800 block text-[10px] mb-1">
                                {getSubjectName(entry.subjectId)}
                              </span>
                              <span className="text-blue-600 text-[9px] font-semibold block truncate">
                                {getTeacherName(entry.teacherId)}
                              </span>
                            </div>
                          ) : (
                            <div className="text-slate-400 bg-slate-50/50 rounded-lg p-2 h-full flex flex-col justify-center font-semibold text-[10px]">
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
