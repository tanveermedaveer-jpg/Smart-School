import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Save, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import ExportButtons from '../../components/ExportButtons';
import { logSystemAction } from '../../utils/logger';

const Marks = () => {
  const location = useLocation();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [hasAssignments, setHasAssignments] = useState(false);
  
  // Selection
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Available selections
  const [availableExams, setAvailableExams] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Data
  const [students, setStudents] = useState([]);
  const [marksConfig, setMarksConfig] = useState({ totalMarks: 100, passingMarks: 40 });
  const [marksInput, setMarksInput] = useState({}); // { [studentId]: { marksObtained: '', status: 'Present' } }
  
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
    const allClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const allSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    const allAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');

    const isAdmin = authUser.role === 'schoolAdmin';

    // Filter assignments for this specific teacher
    const myAssignments = allAssignments.filter(a => a.teacherId?.toString() === authUser.id?.toString());
    setHasAssignments(isAdmin || myAssignments.length > 0);
    
    // Only exams in status 'Marks Entry' or 'Processing' or 'Published' (and also Scheduled for admin if needed, but Marks Entry is standard)
    const allowedExams = allExams.filter(ex => ['Marks Entry', 'Processing', 'Published', 'Scheduled', 'Draft'].includes(ex.status) || isAdmin);

    setExams(allowedExams);
    setAvailableExams(allowedExams);
    setClasses(allClasses);
    setSubjects(allSubjects);
  };

  // When Exam changes -> compute available classes for this teacher
  useEffect(() => {
    if (selectedExamId) {
      const exam = exams.find(e => e.id.toString() === selectedExamId.toString());
      if (exam) {
        const isAdmin = authUser.role === 'schoolAdmin';
        const participatingClassIds = exam.participatingClasses || [];
        
        let matchingClasses = [];
        if (isAdmin) {
          matchingClasses = classes.filter(c => participatingClassIds.includes(c.id?.toString()));
        } else {
          const allAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
          const myAssignments = allAssignments.filter(a => a.teacherId?.toString() === authUser.id?.toString());
          const teacherClassIds = myAssignments.map(a => a.classId?.toString());
          const matchingClassIds = participatingClassIds.filter(id => teacherClassIds.includes(id));
          matchingClasses = classes.filter(c => matchingClassIds.includes(c.id?.toString()));
        }
        setAvailableClasses(matchingClasses);
      } else {
        setAvailableClasses([]);
      }
    } else {
      setAvailableClasses([]);
    }
    setSelectedClassId('');
    setSelectedSubjectId('');
    setStudents([]);
    setMarksInput({});
  }, [selectedExamId, exams]);

  // When Class changes -> compute available subjects for this teacher in this class
  useEffect(() => {
    if (selectedExamId && selectedClassId) {
      const isAdmin = authUser.role === 'schoolAdmin';
      
      let classSubjects = [];
      if (isAdmin) {
        classSubjects = subjects.filter(s => s.classId?.toString() === selectedClassId.toString());
      } else {
        const allAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
        const myAssignments = allAssignments.filter(a => 
          a.teacherId?.toString() === authUser.id?.toString() && 
          a.classId?.toString() === selectedClassId.toString()
        );
        
        const teacherSubjectIds = myAssignments.map(a => a.subjectId?.toString());
        classSubjects = subjects.filter(s => 
          s.classId?.toString() === selectedClassId.toString() &&
          teacherSubjectIds.includes(s.id?.toString())
        );
      }
      
      setAvailableSubjects(classSubjects);
    } else {
      setAvailableSubjects([]);
    }
    setSelectedSubjectId('');
    setStudents([]);
    setMarksInput({});
  }, [selectedClassId]);

  // Read pre-populated examId from router state
  useEffect(() => {
    if (location.state?.examId && exams.length > 0) {
      setSelectedExamId(location.state.examId.toString());
    }
  }, [location.state, exams]);

  // Load subject config and students
  useEffect(() => {
    if (selectedExamId && selectedClassId && selectedSubjectId) {
      const exam = exams.find(e => e.id.toString() === selectedExamId.toString());
      const config = exam?.subjectConfigs?.[selectedClassId]?.[selectedSubjectId] || { totalMarks: 100, passingMarks: 40 };
      setMarksConfig(config);

      const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      const activeStudents = users.filter(u => 
        u.role?.toLowerCase() === 'student' && 
        (u.status?.toLowerCase() === 'active' || !u.status) && 
        u.classId?.toString() === selectedClassId.toString()
      );
      setStudents(activeStudents);

      // Load existing saved marks
      const allMarks = JSON.parse(localStorage.getItem('teacherMarks') || '[]');
      const currentEntry = allMarks.filter(m => 
        m.examId?.toString() === selectedExamId.toString() &&
        m.classId?.toString() === selectedClassId.toString() &&
        m.subjectId?.toString() === selectedSubjectId.toString()
      );

      const inputs = {};
      activeStudents.forEach(s => {
        const found = currentEntry.find(m => m.studentId?.toString() === s.id?.toString());
        inputs[s.id] = {
          marksObtained: found ? found.marksObtained ?? '' : '',
          status: found ? found.status || 'Present' : 'Present',
          submitted: found ? found.submitted || false : false
        };
      });

      setMarksInput(inputs);

      // Determine lock and submit status
      const hasSubmitted = currentEntry.some(m => m.submitted);
      setIsSubmitted(hasSubmitted);

      const isAdmin = authUser.role === 'schoolAdmin';
      setIsLocked(!isAdmin && hasSubmitted);
    } else {
      setStudents([]);
      setMarksInput({});
      setIsLocked(false);
      setIsSubmitted(false);
    }
  }, [selectedExamId, selectedClassId, selectedSubjectId, exams]);

  const handleMarkChange = (studentId, field, value) => {
    if (isLocked) return;

    const exam = exams.find(e => e.id.toString() === selectedExamId.toString());

    setMarksInput(prev => {
      const item = prev[studentId] || { marksObtained: '', status: 'Present' };
      let finalVal = value;

      let updatedItem = { ...item, [field]: finalVal };

      if (field === 'status' && value === 'Absent') {
        updatedItem.marksObtained = 0;
      }

      if (field === 'marksObtained') {
        if (value !== '') {
          const allowDecimals = exam?.allowDecimals ?? true;
          if (!allowDecimals && value.toString().includes('.')) {
            toast.error('Decimal marks are not allowed for this exam.');
            return prev;
          }
          const num = parseFloat(value);
          if (!isNaN(num)) {
            if (num > (marksConfig.totalMarks || 100)) {
              toast.error(`Obtained marks cannot exceed total marks of ${marksConfig.totalMarks || 100}`);
              return prev;
            }
            if (num < 0) {
              toast.error('Obtained marks cannot be negative.');
              return prev;
            }
          }
        }
      }

      return {
        ...prev,
        [studentId]: updatedItem
      };
    });
  };

  const handleSaveDraft = () => {
    saveMarks(false);
  };

  const handleSubmitMarks = () => {
    if (window.confirm('Are you sure you want to submit these marks? Once submitted, they will be locked.')) {
      saveMarks(true);
    }
  };

  const saveMarks = (submit = false) => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) return;

    if (submit) {
      let validationError = null;
      for (const student of students) {
        const input = marksInput[student.id] || { marksObtained: '', status: 'Present' };
        if (input.status === 'Present') {
          if (input.marksObtained === undefined || input.marksObtained === null || input.marksObtained === '') {
            validationError = `Please enter marks for student ${student.name}.`;
            break;
          }
          const score = parseFloat(input.marksObtained);
          if (isNaN(score) || score < 0 || score > (marksConfig.totalMarks || 100)) {
            validationError = `Invalid marks for student ${student.name}. Must be between 0 and ${marksConfig.totalMarks || 100}.`;
            break;
          }
        } else if (input.status === 'Absent') {
          const score = parseFloat(input.marksObtained);
          if (isNaN(score) || score !== 0) {
            validationError = `Absent student ${student.name} must have 0 marks.`;
            break;
          }
        }
      }

      if (validationError) {
        toast.error(validationError);
        return;
      }
    }

    const exam = exams.find(e => e.id.toString() === selectedExamId.toString());
    const academicSession = exam?.academicSession || '2026-2027';

    const allMarks = JSON.parse(localStorage.getItem('teacherMarks') || '[]');
    
    // Remove previous entries for this exact subject, class and exam to overwrite cleanly
    const filtered = allMarks.filter(m => 
      !(m.examId?.toString() === selectedExamId.toString() &&
        m.classId?.toString() === selectedClassId.toString() &&
        m.subjectId?.toString() === selectedSubjectId.toString())
    );

    const newRecords = students.map(student => {
      const input = marksInput[student.id] || { marksObtained: '', status: 'Present' };
      const isEntered = input.marksObtained !== undefined && input.marksObtained !== null && input.marksObtained !== '';
      const obtainedVal = input.status === 'Present' ? (isEntered ? parseFloat(input.marksObtained) : null) : 0;
      const calcScore = obtainedVal !== null ? obtainedVal : 0;
      const pct = marksConfig.totalMarks > 0 ? (calcScore / marksConfig.totalMarks) * 100 : 0;
      
      // Calculate grade based on globally configured scale or standard scale
      const scales = JSON.parse(localStorage.getItem('schoolAdminGradeScale') || '[]');
      let grade = 'F';
      const score = input.status === 'Present' ? pct : 0;
      for (const scale of scales) {
        if (score >= scale.min && score <= scale.max) {
          grade = scale.grade;
          break;
        }
      }

      return {
        id: `mark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        examId: selectedExamId,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        teacherId: authUser.id || 'system',
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber || 'N/A',
        academicSession,
        marksObtained: obtainedVal,
        status: input.status,
        maximumMarks: marksConfig.totalMarks || 100,
        passingMarks: marksConfig.passingMarks || 40,
        grade,
        percentage: score,
        submitted: submit,
        submittedAt: submit ? new Date().toISOString() : null,
        updatedBy: authUser.name || 'Teacher',
        updatedAt: new Date().toISOString(),
        schoolId: schoolId
      };
    });

    localStorage.setItem('teacherMarks', JSON.stringify([...filtered, ...newRecords]));
    
    // Refresh states
    const inputs = {};
    students.forEach(s => {
      const record = newRecords.find(m => m.studentId.toString() === s.id.toString());
      inputs[s.id] = {
        marksObtained: record.marksObtained !== null ? record.marksObtained : '',
        status: record.status,
        submitted: record.submitted
      };
    });

    setMarksInput(inputs);
    setIsSubmitted(submit);
    setIsLocked(submit);
    
    toast.success(submit ? 'Marks submitted and locked successfully!' : 'Marks draft saved successfully!');
    logSystemAction(submit ? 'Marks Finalized' : 'Marks Draft Saved', authUser.name || 'Teacher', 'Teacher', `Exam: ${selectedExamId}, Subject: ${selectedSubjectId}`);
  };

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id.toString() === id.toString());
    return sub ? sub.subjectName : 'Unknown';
  };

  const getClassName = (id) => {
    const cls = classes.find(c => c.id.toString() === id.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Teacher Marks Entry</h2>
          <p className="text-gray-500 text-sm mt-1">Enter, draft, and submit final marks sheet for your assigned subjects.</p>
        </div>
        {students.length > 0 && !isLocked && (
          <div className="flex space-x-2">
            <button onClick={handleSaveDraft} className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm">
              Save Draft
            </button>
            <button onClick={handleSubmitMarks} className="px-4 py-2 bg-darkBlue text-white hover:bg-blue-900 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm">
              <CheckCircle size={14} />
              Submit Marks
            </button>
          </div>
        )}
      </div>

      {isSubmitted && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle size={16} />
          <span>Marks for this subject have been submitted and locked. For adjustments, contact your School Administrator.</span>
        </div>
      )}

      {!hasAssignments ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center justify-center text-center font-bold text-xs shadow-sm">
          You are not assigned to any classes or subjects in the school academic structure. Please contact your administrator.
        </div>
      ) : availableExams.length === 0 ? (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-6 rounded-2xl flex items-center justify-center text-center font-bold text-xs shadow-sm">
          No exams available yet. Please select/create an exam in the School Admin portal first.
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exam</label>
                <select 
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-xs font-semibold"
                >
                  <option value="">-- Select Exam --</option>
                  {availableExams.map(e => (
                    <option key={e.id} value={e.id}>{e.examName} ({e.academicSession})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class Section</label>
                <select 
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  disabled={!selectedExamId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-xs font-semibold disabled:bg-gray-50"
                >
                  <option value="">-- Select Class --</option>
                  {availableClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                <select 
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={!selectedClassId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-xs font-semibold disabled:bg-gray-50"
                >
                  <option value="">-- Select Subject --</option>
                  {availableSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.subjectName} ({s.subjectCode})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {students.length > 0 && selectedSubjectId ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-xs flex justify-between items-center font-bold">
                <span>Subject: {getSubjectName(selectedSubjectId)} | Class: {getClassName(selectedClassId)}</span>
                <span>Total Marks: {marksConfig.totalMarks} | Passing Marks: {marksConfig.passingMarks}</span>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                        <th className="p-4 font-bold">Roll Number</th>
                        <th className="p-4 font-bold">Student Name</th>
                        <th className="p-4 font-bold">Attendance Status</th>
                        <th className="p-4 font-bold text-center w-48">Obtained Marks</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                      {students.map((student) => {
                        const input = marksInput[student.id] || { marksObtained: '', status: 'Present' };
                        return (
                          <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-bold text-darkBlue">{student.rollNumber}</td>
                            <td className="p-4 font-semibold text-gray-800">{student.name}</td>
                            <td className="p-4">
                              <select 
                                value={input.status} 
                                onChange={(e) => handleMarkChange(student.id, 'status', e.target.value)}
                                disabled={isLocked}
                                className="px-2 py-1 border border-gray-200 rounded text-xs bg-white"
                              >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Exempted">Exempted</option>
                              </select>
                            </td>
                            <td className="p-4">
                              <input 
                                type="number" 
                                value={input.status === 'Present' ? (input.marksObtained ?? '') : (input.status === 'Absent' ? 0 : '')} 
                                onChange={(e) => handleMarkChange(student.id, 'marksObtained', e.target.value)}
                                disabled={isLocked || input.status !== 'Present'}
                                className="w-full px-3 py-1.5 border border-gray-200 rounded outline-none text-center font-bold disabled:bg-gray-50"
                                placeholder={input.status === 'Present' ? 'Enter Score' : input.status}
                                max={marksConfig.totalMarks}
                                min="0"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 border-dashed text-xs">
              Please complete all selections above to load students.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Marks;
