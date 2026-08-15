import React, { useState, useEffect } from 'react';
import { Save, UserCheck, Calendar, BookOpen, AlertCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { logSystemAction } from '../../utils/logger';

const SchoolAdminAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentAttendance, setCurrentAttendance] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load classes
      const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
      const classesArray = Array.isArray(savedClasses) ? savedClasses : [];
      setClasses(classesArray);

      // Fetch attendance records from backend directly to ensure fresh scoped data
      if (schoolId && schoolId !== 'global') {
        const { syncAttendanceFromFirestore } = await import('../../utils/db');
        const freshAttendance = await syncAttendanceFromFirestore(schoolId);
        setAttendanceRecords(Array.isArray(freshAttendance) ? freshAttendance : []);
      } else {
        const savedAttendance = JSON.parse(localStorage.getItem('schoolAdminAttendance') || '[]');
        setAttendanceRecords(Array.isArray(savedAttendance) ? savedAttendance : []);
      }

      // Load students
      const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      const usersArray = Array.isArray(users) ? users : [];
      const activeStudents = usersArray.filter(u => u.role?.toLowerCase() === 'student' && u.status === 'Active');
      setStudents(activeStudents);

      // Initialize class selection if classes exist
      if (classesArray.length > 0) {
        const uniqueClassNames = [...new Set(classesArray.map(c => c.className))];
        if (uniqueClassNames.length > 0) {
          setSelectedClass(uniqueClassNames[0]);
          const firstClassSections = classesArray.filter(c => c.className === uniqueClassNames[0]).map(c => c.section);
          if (firstClassSections.length > 0) {
            setSelectedSection(firstClassSections[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError('Unable to load attendance. Please try again.');
      toast.error('Failed to load attendance.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get active class based on selected name and section
  const activeClass = classes.find(c => c.className === selectedClass && c.section === selectedSection);

  // Filter students for the active class
  const filteredStudents = activeClass
    ? students.filter(s => s.classId?.toString() === activeClass.id?.toString())
    : [];

  useEffect(() => {
    if (activeClass) {
      // Find existing record for this class and date
      const existing = attendanceRecords.find(att => 
        att.date === date && 
        att.classId?.toString() === activeClass.id?.toString() &&
        (!att.subjectId || att.subjectId === '')
      );

      const initAtt = {};
      filteredStudents.forEach(s => {
        initAtt[s.id] = existing ? (existing.records?.[s.id] || 'Present') : 'Present';
      });
      setCurrentAttendance(initAtt);
    } else {
      setCurrentAttendance({});
    }
  }, [selectedClass, selectedSection, date, attendanceRecords, students]);

  const handleStatusChange = (studentId, status) => {
    setCurrentAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = async () => {
    if (!activeClass) {
      toast.error('Please select a class and section first.');
      return;
    }

    if (filteredStudents.length === 0) {
      toast.error('No students found for this class.');
      return;
    }

    try {
      setIsLoading(true);

      // Check if attendance already exists
      const existingIndex = attendanceRecords.findIndex(att => 
        att.date === date &&
        att.classId?.toString() === activeClass.id?.toString() &&
        (!att.subjectId || att.subjectId === '')
      );

      const isUpdate = existingIndex !== -1;
      const recordId = isUpdate ? attendanceRecords[existingIndex].id : `att-${Date.now()}`;

      const newRecord = {
        id: recordId,
        schoolId,
        academicSession: '2026-2027',
        date,
        classId: activeClass.id,
        records: currentAttendance,
        auditTrail: isUpdate ? (attendanceRecords[existingIndex].auditTrail || []) : []
      };

      let updatedRecords;
      if (isUpdate) {
        updatedRecords = [...attendanceRecords];
        updatedRecords[existingIndex] = newRecord;
      } else {
        updatedRecords = [...attendanceRecords, newRecord];
      }

      // Save to server using the helper function
      const { saveAttendance } = await import('../../utils/db');
      await saveAttendance(schoolId, updatedRecords);

      setAttendanceRecords(updatedRecords);
      toast.success('Attendance saved successfully.');
      logSystemAction(
        isUpdate ? 'Attendance Updated' : 'Attendance Submitted',
        authUser.name || 'School Admin',
        authUser.role || 'School Admin',
        `Class ID: ${activeClass.id} - Date: ${date}`
      );
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('Failed to save attendance.');
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueClassNames = [...new Set(classes.map(c => c.className))];
  const uniqueSections = classes
    .filter(c => c.className === selectedClass)
    .map(c => c.section);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-2.5 text-gray-500 font-medium">
          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-darkBlue"></span>
          Loading attendance...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-gray-800">Failed to Load Attendance</h3>
        <p className="text-gray-500 text-sm mt-1 max-w-sm">{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-darkBlue text-white rounded-lg text-xs font-bold hover:bg-blue-900 transition-colors">
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Attendance Management</h2>
          <p className="text-gray-500 text-sm mt-1">Record and manage daily student attendance sheets.</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1.5">
            <Calendar size={14} />
            Select Date
          </label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1.5">
            <BookOpen size={14} />
            Class
          </label>
          <select 
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              const sections = classes.filter(c => c.className === e.target.value).map(c => c.section);
              if (sections.length > 0) {
                setSelectedSection(sections[0]);
              }
            }}
            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white font-semibold"
          >
            <option value="">-- Choose Class --</option>
            {uniqueClassNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1.5">
            <Filter size={14} />
            Section
          </label>
          <select 
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white font-semibold"
          >
            <option value="">-- Choose Section --</option>
            {uniqueSections.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={handleSave}
            disabled={filteredStudents.length === 0}
            className="w-full text-center bg-darkBlue text-white hover:bg-blue-900 transition-colors py-2 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Save size={14} />
            Save Attendance
          </button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No students found for this class.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                  <th className="p-4 font-bold">Student Name</th>
                  <th className="p-4 font-bold">Roll Number</th>
                  <th className="p-4 font-bold text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                {filteredStudents.map((student) => {
                  const status = currentAttendance[student.id] || 'Present';
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-darkBlue flex items-center gap-2">
                        <UserCheck size={16} className="text-gray-400" />
                        <span>{student.name}</span>
                      </td>
                      <td className="p-4 font-semibold text-gray-600">{student.rollNumber || 'N/A'}</td>
                      <td className="p-4 text-right">
                        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                          {['Present', 'Absent', 'Late'].map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleStatusChange(student.id, opt)}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                                status === opt
                                  ? opt === 'Present' ? 'bg-greenAccent text-white'
                                    : opt === 'Absent' ? 'bg-red-500 text-white'
                                    : 'bg-yellow-500 text-white'
                                  : 'text-gray-500 hover:text-gray-800'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolAdminAttendance;
