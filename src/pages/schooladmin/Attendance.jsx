import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Save, UserCheck, Calendar, BookOpen, AlertCircle, CheckCircle, Search, Edit2, ShieldAlert, FileText, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { logSystemAction } from '../../utils/logger';

const SchoolAdminAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Report/Tab state: 'monitor' | 'pending' | 'reports' | 'corrections'
  const [activeTab, setActiveTab] = useState('monitor');

  // Filters for Monitoring
  const [filterClassId, setFilterClassId] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Report Specific States
  const [reportType, setReportType] = useState('daily'); // daily | class | student | teacher
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Correction Modal States
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionRecordId, setCorrectionRecordId] = useState(null); // ID of attendance record
  const [correctionStudentId, setCorrectionStudentId] = useState(null);
  const [correctionStatus, setCorrectionStatus] = useState('Present');
  const [correctionReason, setCorrectionReason] = useState('');

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses);

    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    setSubjects(savedSubjects);

    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    setTeachers(users.filter(u => u.role?.toLowerCase() === 'teacher'));
    setStudents(users.filter(u => u.role?.toLowerCase() === 'student'));

    const savedAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
    setAssignments(savedAssignments);

    const savedAttendance = JSON.parse(localStorage.getItem('schoolAdminAttendance') || '[]');
    setAttendanceRecords(savedAttendance);
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id.toString() === classId?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  const getSubjectName = (subjectId) => {
    const sub = subjects.find(s => s.id.toString() === subjectId?.toString());
    return sub ? sub.subjectName : 'Unknown';
  };

  const getTeacherName = (teacherId) => {
    const t = teachers.find(u => u.id.toString() === teacherId?.toString());
    return t ? t.name : 'Unknown';
  };

  const getStudentName = (studentId) => {
    const s = students.find(u => u.id.toString() === studentId?.toString());
    return s ? s.name : 'Unknown';
  };

  // Calculations for Today's Stats
  const totalStudents = students.length;
  
  // Extract all attendance values marked today
  const todaysRecords = attendanceRecords.filter(r => r.date === date);
  
  let presentToday = 0;
  let absentToday = 0;
  let lateToday = 0;
  let leaveToday = 0;

  // We map by student to avoid double-counting if they have attendance marked in multiple classes/subjects,
  // or we can aggregate total marks. Let's aggregate unique student statuses for the day.
  const studentDailyStatus = {};
  todaysRecords.forEach(record => {
    Object.entries(record.records || {}).forEach(([stdId, status]) => {
      // Prioritize Absences/Leaves over Presents for safety status representation
      if (!studentDailyStatus[stdId] || status === 'Absent' || status === 'Leave') {
        studentDailyStatus[stdId] = status;
      }
    });
  });

  Object.values(studentDailyStatus).forEach(status => {
    if (status === 'Present') presentToday++;
    else if (status === 'Absent') absentToday++;
    else if (status === 'Late') lateToday++;
    else if (status === 'Leave') leaveToday++;
  });

  const totalAssignedClassesCount = assignments.length;
  const completedClassesCount = assignments.filter(a => 
    todaysRecords.some(r => r.classId?.toString() === a.classId?.toString() && r.subjectId?.toString() === a.subjectId?.toString())
  ).length;

  // Monitoring Rows: maps assignments + date to show Submitted vs Pending
  const monitoringData = assignments.map(a => {
    const submitted = todaysRecords.find(r => r.classId?.toString() === a.classId?.toString() && r.subjectId?.toString() === a.subjectId?.toString());
    
    let presentCount = 0;
    let absentCount = 0;
    if (submitted) {
      const vals = Object.values(submitted.records || {});
      presentCount = vals.filter(v => v === 'Present').length;
      absentCount = vals.filter(v => v === 'Absent').length;
    }

    return {
      assignment: a,
      status: submitted ? 'Submitted' : 'Pending',
      recordId: submitted ? submitted.id : null,
      present: presentCount,
      absent: absentCount,
      submittedRecord: submitted
    };
  });

  // Filtered monitoring rows
  const filteredMonitoring = monitoringData.filter(row => {
    const matchesClass = !filterClassId || row.assignment.classId?.toString() === filterClassId.toString();
    const matchesTeacher = !filterTeacherId || row.assignment.teacherId?.toString() === filterTeacherId.toString();
    const matchesStatus = !filterStatus || row.status === filterStatus;
    return matchesClass && matchesTeacher && matchesStatus;
  });

  // Pending submissions list
  const pendingAttendanceList = monitoringData.filter(row => row.status === 'Pending');

  // Manual Correction Trigger
  const triggerCorrection = (recordId, studentId, currentStatus) => {
    setCorrectionRecordId(recordId);
    setCorrectionStudentId(studentId);
    setCorrectionStatus(currentStatus);
    setCorrectionReason('');
    setIsCorrectionModalOpen(true);
  };

  const handleCorrectionSubmit = (e) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      toast.error('Please specify a reason for this change.');
      return;
    }

    const updated = attendanceRecords.map(r => {
      if (r.id === correctionRecordId) {
        const prevStatus = r.records[correctionStudentId];
        const newRecords = { ...r.records, [correctionStudentId]: correctionStatus };
        
        const newAudit = [
          ...(r.auditTrail || []),
          {
            changedBy: authUser.name || 'School Admin',
            changedAt: new Date().toISOString(),
            previousStatus: prevStatus,
            newStatus: correctionStatus,
            reason: correctionReason,
            studentId: correctionStudentId
          }
        ];

        return { ...r, records: newRecords, auditTrail: newAudit };
      }
      return r;
    });

    localStorage.setItem('schoolAdminAttendance', JSON.stringify(updated));
    setAttendanceRecords(updated);
    toast.success('Attendance record overridden successfully.');
    setIsCorrectionModalOpen(false);
    
    logSystemAction(
      'Attendance Corrected',
      authUser.name || 'School Admin',
      authUser.role || 'School Admin',
      `Student ID: ${correctionStudentId} - Reason: ${correctionReason}`
    );
  };

  // Student Report Calculations
  const filteredStudentsForSearch = students.filter(s => 
    s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
    s.rollNumber.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const activeStudentReport = students.find(s => s.id.toString() === selectedStudentId.toString());
  
  // Calculate attendance details for selected student
  const studentHistoryRecords = [];
  let studentPresents = 0;
  let studentAbsents = 0;
  let studentLates = 0;
  let studentLeaves = 0;

  if (activeStudentReport) {
    attendanceRecords.forEach(r => {
      if (r.records && r.records[activeStudentReport.id]) {
        const status = r.records[activeStudentReport.id];
        studentHistoryRecords.push({
          date: r.date,
          classId: r.classId,
          subjectId: r.subjectId,
          status,
          recordId: r.id
        });

        if (status === 'Present') studentPresents++;
        else if (status === 'Absent') studentAbsents++;
        else if (status === 'Late') studentLates++;
        else if (status === 'Leave') studentLeaves++;
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Attendance Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Monitor daily attendance submissions, generate reports, and correct records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none bg-white text-gray-700 font-semibold"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-semibold text-gray-400 uppercase">Total Students</span>
          <h3 className="text-xl font-bold text-darkBlue mt-1">{totalStudents}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-semibold text-gray-400 uppercase">Present Today</span>
          <h3 className="text-xl font-bold text-greenAccent mt-1">{presentToday}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-semibold text-gray-400 uppercase">Absent Today</span>
          <h3 className="text-xl font-bold text-red-500 mt-1">{absentToday}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-semibold text-gray-400 uppercase">Late Today</span>
          <h3 className="text-xl font-bold text-yellow-500 mt-1">{lateToday}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-semibold text-gray-400 uppercase">Leave Today</span>
          <h3 className="text-xl font-bold text-blue-500 mt-1">{leaveToday}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-semibold text-gray-400 uppercase">Completion Rate</span>
          <h3 className="text-xs font-bold text-darkBlue mt-1.5">{completedClassesCount} / {totalAssignedClassesCount} Classes</h3>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 text-xs font-bold">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex-1 py-3 text-center border-r border-gray-50 transition-all ${activeTab === 'monitor' ? 'bg-blue-50/50 text-darkBlue border-b-2 border-b-darkBlue' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Monitoring Console
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 text-center border-r border-gray-50 transition-all ${activeTab === 'pending' ? 'bg-blue-50/50 text-darkBlue border-b-2 border-b-darkBlue' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Pending List ({pendingAttendanceList.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-3 text-center transition-all ${activeTab === 'reports' ? 'bg-blue-50/50 text-darkBlue border-b-2 border-b-darkBlue' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Analytics Reports
          </button>
        </div>
      </div>

      {/* TAB A: MONITORING CONSOLE */}
      {activeTab === 'monitor' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filters Dashboard */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap md:flex-nowrap gap-3 items-center">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 outline-none"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
              ))}
            </select>
            <select
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 outline-none"
            >
              <option value="">All Teachers</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending">Pending</option>
            </select>
            <button
              onClick={() => { setFilterClassId(''); setFilterTeacherId(''); setFilterStatus(''); }}
              className="text-xs text-gray-400 hover:text-red-500 font-semibold px-2 py-2"
            >
              Reset Filters
            </button>
          </div>

          {/* Assignments Monitor Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                    <th className="p-4 font-bold">Class & Section</th>
                    <th className="p-4 font-bold">Subject</th>
                    <th className="p-4 font-bold">Assigned Teacher</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-center">Present</th>
                    <th className="p-4 font-bold text-center">Absent</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                  {filteredMonitoring.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-darkBlue">{getClassName(row.assignment.classId)}</td>
                      <td className="p-4 font-semibold text-gray-600">{getSubjectName(row.assignment.subjectId)}</td>
                      <td className="p-4 font-medium">{getTeacherName(row.assignment.teacherId)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${row.status === 'Submitted' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-green-600">{row.status === 'Submitted' ? row.present : '—'}</td>
                      <td className="p-4 text-center font-bold text-red-500">{row.status === 'Submitted' ? row.absent : '—'}</td>
                      <td className="p-4 text-right">
                        {row.status === 'Submitted' ? (
                          <button
                            onClick={() => {
                              // Expand records to trigger override corrections
                              setActiveTab('reports');
                              setReportType('daily');
                            }}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg font-bold"
                          >
                            Inspect Details
                          </button>
                        ) : (
                          <span className="text-gray-400 italic">No Actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: PENDING ATTENDANCE LIST */}
      {activeTab === 'pending' && (
        <div className="space-y-4 animate-fade-in bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              <AlertCircle size={18} className="text-amber-500" />
              Classes Pending Attendance For Today ({pendingAttendanceList.length})
            </h3>
          </div>

          {pendingAttendanceList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center">
              <CheckCircle size={36} className="text-greenAccent mb-2" />
              <p className="text-xs font-semibold">Excellent! All classes have submitted attendance for today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                    <th className="p-3 font-semibold">Class</th>
                    <th className="p-3 font-semibold">Subject</th>
                    <th className="p-3 font-semibold">Assigned Teacher</th>
                    <th className="p-3 font-semibold">Scheduled Date</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingAttendanceList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-bold text-darkBlue">{getClassName(row.assignment.classId)}</td>
                      <td className="p-3 font-semibold text-gray-600">{getSubjectName(row.assignment.subjectId)}</td>
                      <td className="p-3 font-medium text-gray-700">{getTeacherName(row.assignment.teacherId)}</td>
                      <td className="p-3 font-semibold text-gray-400">{date}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-700">Pending</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB C: ANALYTICS REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub Tab Controls */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            {['daily', 'student', 'teacher'].map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${reportType === type ? 'bg-white text-darkBlue shadow' : 'text-gray-500'}`}
              >
                {type} Report
              </button>
            ))}
          </div>

          {/* REPORT VIEW: DAILY CLASS DETAILS INSPECTOR */}
          {reportType === 'daily' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-3">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><FileText size={18} className="text-greenAccent" />Daily Attendance Log Details</h3>
                <ExportButtons tableId="daily-log-table" filename={`Daily_Attendance_${date}`} />
              </div>

              {todaysRecords.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No attendance records submitted for this date.</p>
              ) : (
                <div className="space-y-6">
                  {todaysRecords.map(record => (
                    <div key={record.id} className="p-4 border border-gray-200 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-2">
                        <div>
                          <h4 className="font-bold text-darkBlue text-xs">{getClassName(record.classId)} — {getSubjectName(record.subjectId)}</h4>
                          <span className="text-[10px] text-gray-400 font-semibold">Teacher: {getTeacherName(record.teacherId)}</span>
                        </div>
                      </div>

                      <table id="daily-log-table" className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                            <th className="p-2 font-semibold">Student Name</th>
                            <th className="p-2 font-semibold">Status</th>
                            <th className="p-2 text-right font-semibold">Admin Override</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {Object.entries(record.records || {}).map(([stdId, status]) => (
                            <tr key={stdId} className="hover:bg-gray-50">
                              <td className="p-2 font-semibold text-gray-700">{getStudentName(stdId)}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  status === 'Present' ? 'bg-green-50 text-green-700 border border-green-200'
                                  : status === 'Absent' ? 'bg-red-50 text-red-700 border border-red-200'
                                  : status === 'Late' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {status}
                                </span>
                              </td>
                              <td className="p-2 text-right">
                                <button
                                  onClick={() => triggerCorrection(record.id, stdId, status)}
                                  className="text-[10px] font-bold text-darkBlue hover:underline flex items-center gap-1.5 ml-auto"
                                >
                                  <Edit2 size={12} />
                                  Correct
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Display Audit Trail if present */}
                      {record.auditTrail && record.auditTrail.length > 0 && (
                        <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 mt-2 space-y-1.5">
                          <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1"><ShieldAlert size={12} />Manual Admin Corrections Trail:</span>
                          <div className="divide-y divide-amber-100 text-[10px] text-amber-700">
                            {record.auditTrail.map((trail, index) => (
                              <p key={index} className="py-1">
                                <strong>{trail.changedBy}</strong> changed student <strong>{getStudentName(trail.studentId)}</strong> status from <em>{trail.previousStatus}</em> to <em>{trail.newStatus}</em> at {new Date(trail.changedAt).toLocaleString()} ({trail.reason})
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REPORT VIEW: STUDENT REPORT CARD HISTORICAL */}
          {reportType === 'student' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              {/* Left panel student search list */}
              <div className="lg:col-span-4 border-r border-gray-100 pr-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none bg-gray-50"
                  />
                </div>
                <div className="h-[350px] overflow-y-auto space-y-1 pr-1">
                  {filteredStudentsForSearch.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${selectedStudentId.toString() === s.id.toString() ? 'bg-darkBlue text-white border-darkBlue' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                    >
                      {s.name} ({s.rollNumber})
                    </button>
                  ))}
                </div>
              </div>

              {/* Right panel report cards detail */}
              <div className="lg:col-span-8 space-y-4 pl-4 min-h-[350px]">
                {activeStudentReport ? (
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-2 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{activeStudentReport.name} Report</h4>
                        <span className="text-[10px] text-gray-400 font-semibold">Roll No: {activeStudentReport.rollNumber} | Class: {getClassName(activeStudentReport.classId)}</span>
                      </div>
                      <ExportButtons tableId="student-report-table" filename={`Student_${activeStudentReport.rollNumber}_Report`} />
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-green-50 text-green-700 p-2.5 rounded-lg border border-green-100"><span className="text-[10px] uppercase font-bold block">Presents</span><strong className="text-sm font-black">{studentPresents}</strong></div>
                      <div className="bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-100"><span className="text-[10px] uppercase font-bold block">Absents</span><strong className="text-sm font-black">{studentAbsents}</strong></div>
                      <div className="bg-yellow-50 text-yellow-700 p-2.5 rounded-lg border border-yellow-100"><span className="text-[10px] uppercase font-bold block">Lates</span><strong className="text-sm font-black">{studentLates}</strong></div>
                      <div className="bg-blue-50 text-blue-700 p-2.5 rounded-lg border border-blue-100"><span className="text-[10px] uppercase font-bold block">Leaves</span><strong className="text-sm font-black">{studentLeaves}</strong></div>
                    </div>

                    <table id="student-report-table" className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                          <th className="p-3 font-semibold">Date</th>
                          <th className="p-3 font-semibold">Class placement</th>
                          <th className="p-3 font-semibold">Subject</th>
                          <th className="p-3 font-semibold">Marked Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {studentHistoryRecords.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-3 font-bold text-gray-700">{item.date}</td>
                            <td className="p-3 font-semibold text-darkBlue">{getClassName(item.classId)}</td>
                            <td className="p-3 font-semibold text-gray-500">{getSubjectName(item.subjectId)}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'Present' ? 'bg-green-50 text-green-700 border border-green-200'
                                : item.status === 'Absent' ? 'bg-red-50 text-red-700 border border-red-200'
                                : item.status === 'Late' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>{item.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-12 text-gray-400">
                    <Search className="w-12 h-12 text-gray-200 mb-2" />
                    <p className="text-xs font-semibold">Select a student from the left panel to load reports.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REPORT VIEW: TEACHER SUBMISSION AUDITS */}
          {reportType === 'teacher' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-3">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><Calendar size={18} className="text-greenAccent" />Teacher Submission Report Dashboard</h3>
                <ExportButtons tableId="teacher-submission-table" filename={`Teacher_Submission_${date}`} />
              </div>

              <div className="overflow-x-auto">
                <table id="teacher-submission-table" className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                      <th className="p-3 font-semibold">Teacher Name</th>
                      <th className="p-3 font-semibold">Class assignments</th>
                      <th className="p-3 font-semibold">Submitted Today</th>
                      <th className="p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {teachers.map(t => {
                      const teacherAssignments = assignments.filter(a => a.teacherId?.toString() === t.id.toString());
                      const submittedList = teacherAssignments.filter(a => 
                        todaysRecords.some(r => r.classId?.toString() === a.classId?.toString() && r.subjectId?.toString() === a.subjectId?.toString())
                      );
                      const isComplete = teacherAssignments.length > 0 && teacherAssignments.length === submittedList.length;

                      return (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="p-3 font-bold text-darkBlue">{t.name}</td>
                          <td className="p-3 font-medium text-gray-500">{teacherAssignments.length} Assignments</td>
                          <td className="p-3 font-medium text-gray-700">{submittedList.length} Completed</td>
                          <td className="p-3">
                            {teacherAssignments.length === 0 ? (
                              <span className="text-gray-400 italic">No Assignments</span>
                            ) : isComplete ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">Completed</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANUAL CORRECTION CORRECTION OVERRIDE MODAL */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">Manual Attendance Correction</h3>
              <button onClick={() => setIsCorrectionModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCorrectionSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                <div><span className="font-bold text-gray-400 block uppercase">Student</span><span className="font-semibold text-gray-800">{getStudentName(correctionStudentId)}</span></div>
                <div className="pt-2"><span className="font-bold text-gray-400 block uppercase">Date</span><span className="font-semibold text-gray-800">{date}</span></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Status</label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white font-semibold"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason for Change</label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                  placeholder="e.g. Student was marked absent by mistake."
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50">
                <button type="button" onClick={() => setIsCorrectionModalOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 text-xs font-bold transition-all">Confirm Change</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdminAttendance;
