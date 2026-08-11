import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Save, UserCheck, Calendar, BookOpen, Clock, AlertCircle, CheckCircle, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { logSystemAction } from '../../utils/logger';

const TeacherAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
  // Current attendance entry map: { studentId: status }
  const [currentAttendance, setCurrentAttendance] = useState({});
  const [historyFilterDate, setHistoryFilterDate] = useState('');

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';
  const academicSession = '2026-2027';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // 1. Load teacher assignments
    const savedAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
    const myAssignments = savedAssignments.filter(a => a.teacherId?.toString() === authUser.id?.toString());
    setAssignments(myAssignments);

    // 2. Load attendance array
    const savedAttendance = JSON.parse(localStorage.getItem('schoolAdminAttendance') || '[]');
    setAttendanceRecords(savedAttendance);
  };

  const getClassName = (classId) => {
    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const cls = savedClasses.find(c => c.id.toString() === classId?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  const getSubjectName = (subjectId) => {
    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    const sub = savedSubjects.find(s => s.id.toString() === subjectId?.toString());
    return sub ? sub.subjectName : 'Unknown';
  };

  // Find selected assignment details
  const activeAssignment = assignments.find(a => a.id.toString() === selectedAssignmentId.toString());

  // Load students and existing attendance when assignment or date changes
  useEffect(() => {
    if (activeAssignment) {
      const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      const classStudents = users.filter(u => 
        u.role?.toLowerCase() === 'student' &&
        u.classId?.toString() === activeAssignment.classId?.toString() &&
        u.status === 'Active'
      );
      setStudents(classStudents);

      // Check if attendance already exists for this Date + Class + Subject
      const existing = attendanceRecords.find(att => 
        att.date === date &&
        att.classId?.toString() === activeAssignment.classId?.toString() &&
        att.subjectId?.toString() === activeAssignment.subjectId?.toString()
      );

      const initAtt = {};
      classStudents.forEach(s => {
        initAtt[s.id] = existing ? (existing.records[s.id] || 'Present') : 'Present';
      });
      setCurrentAttendance(initAtt);
    } else {
      setStudents([]);
      setCurrentAttendance({});
    }
  }, [selectedAssignmentId, date, attendanceRecords]);

  // Summary Metrics
  const totalAssigned = assignments.length;
  const completedToday = assignments.filter(a => 
    attendanceRecords.some(att => 
      att.date === date && 
      att.classId?.toString() === a.classId?.toString() && 
      att.subjectId?.toString() === a.subjectId?.toString()
    )
  ).length;
  const pendingToday = totalAssigned - completedToday;

  const handleStatusChange = (studentId, status) => {
    setCurrentAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllPresent = () => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = 'Present';
    });
    setCurrentAttendance(updated);
    toast.success('All marked as Present');
  };

  const handleSave = () => {
    if (!activeAssignment) {
      toast.error('Please select a Class & Subject assignment first.');
      return;
    }

    if (students.length === 0) {
      toast.error('No active students enrolled in this class.');
      return;
    }

    // Check if attendance already exists (Duplicate prevention)
    const existingIndex = attendanceRecords.findIndex(att => 
      att.date === date &&
      att.classId?.toString() === activeAssignment.classId?.toString() &&
      att.subjectId?.toString() === activeAssignment.subjectId?.toString()
    );

    const isUpdate = existingIndex !== -1;

    if (isUpdate && !window.confirm('Attendance already exists for this class on this date. Do you want to update it?')) {
      return;
    }

    const confirmMsg = `Submit attendance for ${getClassName(activeAssignment.classId)} - ${getSubjectName(activeAssignment.subjectId)}?`;
    if (!window.confirm(confirmMsg)) return;

    const newRecord = {
      id: isUpdate ? attendanceRecords[existingIndex].id : `att-${Date.now()}`,
      schoolId,
      academicSession,
      date,
      classId: activeAssignment.classId,
      subjectId: activeAssignment.subjectId,
      teacherId: authUser.id,
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

    localStorage.setItem('schoolAdminAttendance', JSON.stringify(updatedRecords));
    setAttendanceRecords(updatedRecords);
    toast.success('Attendance submitted successfully.');
    logSystemAction(
      isUpdate ? 'Attendance Updated' : 'Attendance Submitted',
      authUser.name || 'Teacher',
      authUser.role || 'Teacher',
      `Class ID: ${activeAssignment.classId} - Date: ${date}`
    );
  };

  // History Filter
  const filteredHistory = attendanceRecords.filter(att => 
    att.teacherId?.toString() === authUser.id?.toString() &&
    (!historyFilterDate || att.date === historyFilterDate)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Class Attendance</h2>
          <p className="text-gray-500 text-sm mt-1">Select your assigned class and subject to record daily student attendance.</p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Classes Assigned</span>
            <h3 className="text-2xl font-black text-darkBlue mt-1">{totalAssigned}</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><BookOpen size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Attendance Completed</span>
            <h3 className="text-2xl font-black text-greenAccent mt-1">{completedToday}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Attendance Pending</span>
            <h3 className="text-2xl font-black text-amber-500 mt-1">{pendingToday}</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Clock size={24} /></div>
        </div>
      </div>

      {/* Selector Dashboard Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1.5"><Calendar size={14} />Select Date</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1.5"><BookOpen size={14} />Select Class & Subject Assignment</label>
          <select 
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
          >
            <option value="">-- Choose Assigned Class --</option>
            {assignments.map(a => (
              <option key={a.id} value={a.id}>
                {getClassName(a.classId)} — {getSubjectName(a.subjectId)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllPresent}
            disabled={students.length === 0}
            className="flex-1 text-center bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors py-2 rounded-xl text-xs font-bold disabled:opacity-50"
          >
            Mark All Present
          </button>
          <button
            onClick={handleSave}
            disabled={students.length === 0}
            className="flex-1 text-center bg-darkBlue text-white hover:bg-blue-900 transition-colors py-2 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Save size={14} />
            Submit
          </button>
        </div>
      </div>

      {/* Today's Student Attendance List */}
      {selectedAssignmentId ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
              Enrolled Students ({students.length})
            </h3>
            {attendanceRecords.some(att => 
              att.date === date && 
              att.classId?.toString() === activeAssignment?.classId?.toString() && 
              att.subjectId?.toString() === activeAssignment?.subjectId?.toString()
            ) && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                Submitted
              </span>
            )}
          </div>

          {students.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-sm font-semibold">No active students found registered in this class.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                    <th className="p-4 font-bold">Student Name</th>
                    <th className="p-4 font-bold">Admission ID</th>
                    <th className="p-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-semibold text-darkBlue flex items-center space-x-2">
                        <UserCheck size={14} className="text-gray-400" />
                        <span>{student.name}</span>
                      </td>
                      <td className="p-4 font-medium text-gray-500">{student.rollNumber}</td>
                      <td className="p-4 text-center">
                        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-white">
                          {['Present', 'Absent', 'Late', 'Leave'].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleStatusChange(student.id, status)}
                              className={`px-3 py-1.5 text-[10px] font-bold transition-all border-r last:border-0 ${
                                currentAttendance[student.id] === status
                                  ? status === 'Present' ? 'bg-green-500 text-white'
                                    : status === 'Absent' ? 'bg-red-500 text-white'
                                    : status === 'Late' ? 'bg-yellow-500 text-white'
                                    : 'bg-blue-500 text-white'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 flex flex-col items-center">
          <BookOpen className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-sm font-semibold">Please select a class and subject assignment to take attendance.</p>
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-3">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><Calendar size={18} className="text-greenAccent" />My Attendance History</h3>
          <input
            type="date"
            value={historyFilterDate}
            onChange={(e) => setHistoryFilterDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none bg-white text-gray-600"
          />
        </div>

        {filteredHistory.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No historical submissions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Class</th>
                  <th className="p-3 font-semibold">Subject</th>
                  <th className="p-3 font-semibold text-center">Summary Statistics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredHistory.map(h => {
                  const values = Object.values(h.records || {});
                  const present = values.filter(v => v === 'Present').length;
                  const absent = values.filter(v => v === 'Absent').length;
                  const late = values.filter(v => v === 'Late').length;
                  const leave = values.filter(v => v === 'Leave').length;

                  return (
                    <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-bold text-gray-700">{h.date}</td>
                      <td className="p-3 font-semibold text-darkBlue">{getClassName(h.classId)}</td>
                      <td className="p-3 font-medium text-gray-500">{getSubjectName(h.subjectId)}</td>
                      <td className="p-3 text-center">
                        <span className="bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded mr-1">P: {present}</span>
                        <span className="bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded mr-1">A: {absent}</span>
                        <span className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-2 py-0.5 rounded mr-1">L: {late}</span>
                        <span className="bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded">LV: {leave}</span>
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

export default TeacherAttendance;
