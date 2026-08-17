import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import ExportButtons from '../../components/ExportButtons';

const Timetable = () => {
  const [timetable, setTimetable] = useState({});
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    const loadAll = async () => {
      let savedTimetable = {};
      let savedClasses = [];
      let savedSubjects = [];
      let savedUsers = [];
      let savedAssignments = [];

      if (schoolId) {
        try {
          const { getCollection } = await import('../../utils/db');
          const [remoteTt, remoteCls, remoteSub, remoteUsers, remoteAssign] = await Promise.all([
            getCollection('schoolAdminTimetable', schoolId),
            getCollection('schoolAdminClasses', schoolId),
            getCollection('schoolAdminSubjects', schoolId),
            getCollection('schoolAdminUsers', schoolId),
            getCollection('schoolAdminTeacherAssignments', schoolId)
          ]);

          if (remoteTt && typeof remoteTt === 'object' && Object.keys(remoteTt).length > 0) {
            savedTimetable = remoteTt;
            localStorage.setItem('schoolAdminTimetable', JSON.stringify(remoteTt));
          } else {
            savedTimetable = JSON.parse(localStorage.getItem('schoolAdminTimetable') || '{}');
          }

          if (remoteCls && Array.isArray(remoteCls) && remoteCls.length > 0) {
            savedClasses = remoteCls;
            localStorage.setItem('schoolAdminClasses', JSON.stringify(remoteCls));
          } else {
            savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
          }

          if (remoteSub && Array.isArray(remoteSub) && remoteSub.length > 0) {
            savedSubjects = remoteSub;
            localStorage.setItem('schoolAdminSubjects', JSON.stringify(remoteSub));
          } else {
            savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
          }

          if (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) {
            savedUsers = remoteUsers;
            localStorage.setItem('schoolAdminUsers', JSON.stringify(remoteUsers));
          } else {
            savedUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
          }

          if (remoteAssign && Array.isArray(remoteAssign) && remoteAssign.length > 0) {
            savedAssignments = remoteAssign;
            localStorage.setItem('schoolAdminTeacherAssignments', JSON.stringify(remoteAssign));
          } else {
            savedAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
          }
        } catch (e) {
          savedTimetable = JSON.parse(localStorage.getItem('schoolAdminTimetable') || '{}');
          savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
          savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
          savedUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
          savedAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
        }
      } else {
        savedTimetable = JSON.parse(localStorage.getItem('schoolAdminTimetable') || '{}');
        savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
        savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
        savedUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
        savedAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
      }

      setClasses(savedClasses);
      setSubjects(savedSubjects);
      setTeachers(savedUsers.filter(u => u.role?.toLowerCase() === 'teacher'));

      // Normalize savedTimetable to object dictionary format defensively
      let timetableDict = {};
      if (Array.isArray(savedTimetable)) {
        savedTimetable.forEach(item => {
          if (item && typeof item === 'object') {
            Object.keys(item).forEach(k => {
              if (k !== 'schoolId' && k !== 'school_id' && typeof item[k] === 'object') {
                timetableDict[k] = item[k];
              }
            });
          }
        });
      } else if (savedTimetable && typeof savedTimetable === 'object') {
        timetableDict = savedTimetable;
      }

      // Filter timetable strictly for logged-in teacher and current schoolId
      const myTimetable = {};
      Object.keys(timetableDict).forEach(classId => {
        const classTimetable = timetableDict[classId];
        if (classTimetable && typeof classTimetable === 'object') {
          Object.keys(classTimetable).forEach(day => {
            const dayTimetable = classTimetable[day];
            if (dayTimetable && typeof dayTimetable === 'object') {
              Object.keys(dayTimetable).forEach(period => {
                const entry = dayTimetable[period];
                if (entry && typeof entry === 'object') {
                  const entrySchoolId = entry.schoolId || schoolId;
                  const isSameSchool = !entrySchoolId || entrySchoolId.toString() === schoolId.toString();
                  
                  let isAssignedToMe = entry.teacherId?.toString() === authUser.id?.toString();

                  // Fallback: cross-check with saved assignments if teacherId was not recorded in entry
                  if (!isAssignedToMe && savedAssignments.length > 0) {
                    const assignMatch = savedAssignments.find(a => 
                      a.classId?.toString() === classId.toString() && 
                      a.subjectId?.toString() === entry.subjectId?.toString()
                    );
                    if (assignMatch && assignMatch.teacherId?.toString() === authUser.id?.toString()) {
                      isAssignedToMe = true;
                    }
                  }

                  if (isSameSchool && isAssignedToMe) {
                    if (!myTimetable[day]) myTimetable[day] = {};
                    const cls = savedClasses.find(c => c.id?.toString() === classId.toString());
                    const sub = savedSubjects.find(s => s.id?.toString() === entry.subjectId?.toString());

                    myTimetable[day][period] = { 
                      ...entry,
                      classId, 
                      className: entry.className || (cls ? `${cls.className}-${cls.section}` : `Class ${classId}`),
                      subjectId: entry.subjectId,
                      subjectName: entry.subjectName || (sub ? sub.subjectName : 'Subject'),
                      startTime: entry.startTime || '',
                      endTime: entry.endTime || '',
                      room: entry.room || (cls ? `Room ${cls.className}` : '')
                    };
                  }
                }
              });
            }
          });
        }
      });

      setTimetable(myTimetable);
    };

    loadAll();
  }, [authUser.id, schoolId]);

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id.toString() === id?.toString());
    return sub ? sub.subjectName : 'Subject';
  };

  const getClassName = (id) => {
    const cls = classes.find(c => c.id.toString() === id?.toString());
    return cls ? `${cls.className}-${cls.section}` : `Class ${id}`;
  };

  const isTimetableConfigured = Object.keys(timetable).length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Timetable</h2>
          <p className="text-gray-500 text-sm mt-1">View your assigned weekly teaching schedule.</p>
        </div>
        {isTimetableConfigured && (
          <ExportButtons tableId="export-table" filename={`My_Timetable_${authUser.name || 'Teacher'}`} />
        )}
      </div>

      {!isTimetableConfigured ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4 animate-pulse" />
          <p className="font-semibold text-lg text-slate-700">No Classes Scheduled</p>
          <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
            No timetable periods have been assigned to your account yet. 
            If you believe this is an error, please ensure your School Administrator has assigned you to your subject classes in Timetable Management.
          </p>
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
                          {entry ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 h-full flex flex-col justify-center transition-colors">
                              <span className="font-bold text-green-900 block text-xs mb-0.5">
                                {entry.subjectName || getSubjectName(entry.subjectId)}
                              </span>
                              <span className="text-green-700 font-semibold text-[11px] block">
                                {entry.className || getClassName(entry.classId)}
                              </span>
                              {entry.startTime && entry.endTime && (
                                <span className="text-slate-500 text-[10px] block mt-0.5 font-mono">
                                  {entry.startTime} – {entry.endTime}
                                </span>
                              )}
                              {entry.room && (
                                <span className="text-slate-400 text-[10px] block font-mono">
                                  {entry.room}
                                </span>
                              )}
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
