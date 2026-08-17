import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Calendar, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Timetable = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  // Format: { classId: { Day: { Period: subjectId } } }
  const [timetableData, setTimetableData] = useState({});
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = ['1', '2', '3', '4', 'Break', '5', '6', '7'];

  useEffect(() => {
    const loadData = async () => {
      let savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
      let savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
      let savedAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
      let savedUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      let savedTimetable = JSON.parse(localStorage.getItem('schoolAdminTimetable') || '{}');

      if (schoolId) {
        try {
          const { getCollection } = await import('../../utils/db');
          const [remoteTt, remoteCls, remoteSub, remoteAssign, remoteUsers] = await Promise.all([
            getCollection('schoolAdminTimetable', schoolId),
            getCollection('schoolAdminClasses', schoolId),
            getCollection('schoolAdminSubjects', schoolId),
            getCollection('schoolAdminTeacherAssignments', schoolId),
            getCollection('schoolAdminUsers', schoolId)
          ]);

          if (remoteTt && typeof remoteTt === 'object' && Object.keys(remoteTt).length > 0) {
            savedTimetable = remoteTt;
            localStorage.setItem('schoolAdminTimetable', JSON.stringify(remoteTt));
          }
          if (remoteCls && Array.isArray(remoteCls) && remoteCls.length > 0) {
            savedClasses = remoteCls;
            localStorage.setItem('schoolAdminClasses', JSON.stringify(remoteCls));
          }
          if (remoteSub && Array.isArray(remoteSub) && remoteSub.length > 0) {
            savedSubjects = remoteSub;
            localStorage.setItem('schoolAdminSubjects', JSON.stringify(remoteSub));
          }
          if (remoteAssign && Array.isArray(remoteAssign) && remoteAssign.length > 0) {
            savedAssignments = remoteAssign;
            localStorage.setItem('schoolAdminTeacherAssignments', JSON.stringify(remoteAssign));
          }
          if (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) {
            savedUsers = remoteUsers;
            localStorage.setItem('schoolAdminUsers', JSON.stringify(remoteUsers));
          }
        } catch (e) {
          console.warn('Error fetching timetable background data:', e);
        }
      }

      setClasses(savedClasses);
      setSubjects(savedSubjects);
      setTeacherAssignments(savedAssignments);
      setTeachers(savedUsers.filter(u => u.role?.toLowerCase() === 'teacher'));
      setTimetableData(savedTimetable);
    };

    loadData();
  }, [schoolId]);

  const handleCellChange = (day, period, val) => {
    if (!selectedClass) return;
    
    let entry = null;
    if (val) {
      const parts = val.split('___');
      const subjectId = parts[0] || '';
      let teacherId = parts[1] || '';
      
      if (!teacherId) {
        const assignment = teacherAssignments.find(a => 
          a.classId?.toString() === selectedClass.toString() && 
          a.subjectId?.toString() === subjectId.toString()
        );
        if (assignment) {
          teacherId = assignment.teacherId?.toString() || '';
        }
      }

      const cls = classes.find(c => c.id?.toString() === selectedClass.toString());
      const sub = subjects.find(s => s.id?.toString() === subjectId.toString());
      const tch = teachers.find(t => t.id?.toString() === teacherId.toString());

      const periodTimeMap = {
        '1': { startTime: '08:00 AM', endTime: '08:40 AM' },
        '2': { startTime: '08:40 AM', endTime: '09:20 AM' },
        '3': { startTime: '09:20 AM', endTime: '10:00 AM' },
        '4': { startTime: '10:00 AM', endTime: '10:40 AM' },
        'Break': { startTime: '10:40 AM', endTime: '11:00 AM' },
        '5': { startTime: '11:00 AM', endTime: '11:40 AM' },
        '6': { startTime: '11:40 AM', endTime: '12:20 PM' },
        '7': { startTime: '12:20 PM', endTime: '01:00 PM' }
      };

      entry = {
        schoolId: schoolId,
        classId: selectedClass,
        className: cls ? `${cls.className}-${cls.section}` : `Class ${selectedClass}`,
        subjectId: subjectId,
        subjectName: sub ? sub.subjectName : 'Subject',
        teacherId: teacherId,
        teacherName: tch ? tch.name : 'Teacher',
        day: day,
        period: period,
        startTime: periodTimeMap[period]?.startTime || '',
        endTime: periodTimeMap[period]?.endTime || '',
        room: cls ? `Room ${cls.className}` : `Room ${selectedClass}`
      };
    }
    
    setTimetableData(prev => ({
      ...prev,
      [selectedClass]: {
        ...(prev[selectedClass] || {}),
        [day]: {
          ...(prev[selectedClass]?.[day] || {}),
          [period]: entry
        }
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    localStorage.setItem('schoolAdminTimetable', JSON.stringify(timetableData));
    try {
      const { saveCollection } = await import('../../utils/db');
      await saveCollection('schoolAdminTimetable', schoolId, timetableData);
    } catch (e) {
      console.warn('Error saving timetable to backend database:', e);
    }
    toast.success('Timetable saved successfully');
  };

  const currentClassTimetable = timetableData[selectedClass] || {};

  const assignedForSelectedClass = teacherAssignments.filter(a => a.classId?.toString() === selectedClass.toString());

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Timetable Management</h2>
          <p className="text-gray-500 text-sm mt-1">Create and manage class schedules.</p>
        </div>
        <div className="flex items-center space-x-3">
        <ExportButtons tableId="export-table" filename="Timetable Management" />
        <button onClick={handleSave} className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm">
          <Save size={20} />
          <span>Save Timetable</span>
        </button>
      </div>
</div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
        <select 
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white text-sm"
        >
          <option value="">-- Select a Class --</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
          ))}
        </select>
      </div>

      {selectedClass ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold border-r border-gray-100 w-32">Day / Period</th>
                  {periods.map(p => (
                    <th key={p} className="p-4 font-semibold text-center border-r border-gray-100 min-w-[120px]">
                      {p === 'Break' ? 'Break' : `Period ${p}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {days.map(day => (
                  <tr key={day} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-darkBlue border-r border-gray-100 flex items-center h-full">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      {day}
                    </td>
                    {periods.map(period => {
                      const currentEntry = currentClassTimetable[day]?.[period];
                      const currentValue = currentEntry
                        ? `${currentEntry.subjectId || ''}___${currentEntry.teacherId || ''}`
                        : '';
                      return (
                        <td key={period} className="p-2 border-r border-gray-100 bg-white">
                          {period === 'Break' ? (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 font-medium bg-gray-50 rounded py-2">
                              Break
                            </div>
                          ) : (
                            <select
                              value={currentValue}
                              onChange={(e) => handleCellChange(day, period, e.target.value)}
                              className="w-full p-2 border border-gray-200 rounded focus:ring-1 focus:ring-greenAccent outline-none text-xs"
                            >
                              <option value="">- Free -</option>
                              {assignedForSelectedClass.length > 0 ? (
                                assignedForSelectedClass.map(a => {
                                  const subject = subjects.find(s => s.id?.toString() === a.subjectId?.toString());
                                  const teacher = teachers.find(t => t.id?.toString() === a.teacherId?.toString());
                                  return (
                                    <option key={`${a.id}`} value={`${a.subjectId}___${a.teacherId}`}>
                                      {subject ? subject.subjectName : 'Subject'} ({teacher ? teacher.name : 'Teacher'})
                                    </option>
                                  );
                                })
                              ) : (
                                subjects.map(s => {
                                  if (teachers.length > 0) {
                                    return teachers.map(t => (
                                      <option key={`${s.id}-${t.id}`} value={`${s.id}___${t.id}`}>
                                        {s.subjectName} ({t.name})
                                      </option>
                                    ));
                                  }
                                  return (
                                    <option key={s.id} value={`${s.id}___`}>
                                      {s.subjectName}
                                    </option>
                                  );
                                })
                              )}
                            </select>
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
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          Please select a class to view and edit its timetable.
        </div>
      )}
    </div>
  );
};

export default Timetable;
