import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, Calculator, Lock, X, Info, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import ExportButtons from '../../components/ExportButtons';
import { logSystemAction } from '../../utils/logger';

const DEFAULT_GRADE_SCALE = [
  { id: 1, min: 90, max: 100, grade: 'A+' },
  { id: 2, min: 80, max: 89.99, grade: 'A' },
  { id: 3, min: 70, max: 79.99, grade: 'B+' },
  { id: 4, min: 60, max: 69.99, grade: 'B' },
  { id: 5, min: 50, max: 59.99, grade: 'C' },
  { id: 6, min: 40, max: 49.99, grade: 'D' },
  { id: 7, min: 0, max: 39.99, grade: 'F' }
];

const ResultProcessing = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teacherMarks, setTeacherMarks] = useState([]);
  
  // Selection
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // Available Options
  const [availableClasses, setAvailableClasses] = useState([]);

  // Processing settings
  const [passingRule, setPassingRule] = useState('pass_all'); // pass_all | overall_percent
  const [minOverallPercent, setMinOverallPercent] = useState(40);

  // Computed results state
  const [students, setStudents] = useState([]);
  const [processedResults, setProcessedResults] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);

  // Grade Scale Modal
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [gradeScale, setGradeScale] = useState(DEFAULT_GRADE_SCALE);
  const [tempGradeScale, setTempGradeScale] = useState(DEFAULT_GRADE_SCALE);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
    const allClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const allSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    const allMarks = JSON.parse(localStorage.getItem('teacherMarks') || '[]');
    
    setExams(allExams);
    setClasses(allClasses);
    setSubjects(allSubjects);
    setTeacherMarks(allMarks);

    const savedScale = JSON.parse(localStorage.getItem('schoolAdminGradeScale') || 'null');
    if (savedScale) {
      setGradeScale(savedScale);
    }
  };

  // Populate participating classes when Exam changes
  useEffect(() => {
    if (selectedExamId) {
      const exam = exams.find(e => e.id.toString() === selectedExamId.toString());
      if (exam) {
        const participatingIds = exam.participatingClasses || [];
        const matching = classes.filter(c => participatingIds.includes(c.id.toString()));
        setAvailableClasses(matching);
      } else {
        setAvailableClasses([]);
      }
    } else {
      setAvailableClasses([]);
    }
    setSelectedClassId('');
    setProcessedResults([]);
    setIsLocked(false);
  }, [selectedExamId]);

  // Load existing processed results or reset
  useEffect(() => {
    if (selectedExamId && selectedClassId) {
      const allResults = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');
      const existing = allResults.filter(r => 
        r.examId?.toString() === selectedExamId.toString() &&
        r.classId?.toString() === selectedClassId.toString()
      );

      if (existing.length > 0) {
        setProcessedResults(existing);
        setIsLocked(existing.some(r => r.locked));
      } else {
        setProcessedResults([]);
        setIsLocked(false);
      }
    } else {
      setProcessedResults([]);
      setIsLocked(false);
    }
  }, [selectedExamId, selectedClassId]);

  const determineGrade = (pct) => {
    for (const scale of gradeScale) {
      if (pct >= scale.min && pct <= scale.max) {
        return scale.grade;
      }
    }
    return 'F';
  };

  const handleProcessResults = () => {
    try {
      if (!selectedExamId || !selectedClassId) return;

      // Load fresh data directly from localStorage to prevent stale state issues
      const allExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
      const exam = allExams.find(e => e.id.toString() === selectedExamId.toString());
      
      const allClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
      const cRow = allClasses.find(c => c.id.toString() === selectedClassId.toString());
      
      if (!exam || !cRow) return;

      // Load active students in this class using case-insensitive status filtering
      const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      const activeStudents = users.filter(u => 
        u.role?.toLowerCase() === 'student' && 
        (u.status?.toLowerCase() === 'active' || !u.status) && 
        u.classId?.toString() === selectedClassId.toString()
      );

      // Load subjects for this class
      const allSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
      const classSubjects = allSubjects.filter(s => s.classId?.toString() === selectedClassId.toString());
      if (classSubjects.length === 0) {
        toast.error('No subjects are configured for this class section.');
        return;
      }

      // Get marks for this exam and class combo fresh from localStorage
      const freshMarks = JSON.parse(localStorage.getItem('teacherMarks') || '[]');
      const classMarks = freshMarks.filter(m => 
        m.examId?.toString() === selectedExamId.toString() &&
        m.classId?.toString() === selectedClassId.toString()
      );

      // Filter active students to only those who have at least one marks record in teacherMarks
      const studentsToProcess = activeStudents.filter(student => 
        classMarks.some(m => m.studentId?.toString() === student.id.toString())
      );

      if (studentsToProcess.length === 0) {
        toast.error('No students with saved marks found for this class section.');
        return;
      }

      // Validate that marks are entered for each student and each subject
      let studentMissingMarks = []; // { studentName, subjects: [] }
      studentsToProcess.forEach(student => {
        const studentMarks = classMarks.filter(m => m.studentId?.toString() === student.id.toString());
        let missingForStudent = [];

        classSubjects.forEach(sub => {
          const markRecord = studentMarks.find(m => m.subjectId?.toString() === sub.id.toString());
          if (!markRecord || (markRecord.status === 'Present' && (markRecord.marksObtained === null || markRecord.marksObtained === undefined || markRecord.marksObtained === ''))) {
            missingForStudent.push(sub.subjectName);
          }
        });

        if (missingForStudent.length > 0) {
          studentMissingMarks.push({
            name: student.name,
            subjects: missingForStudent
          });
        }
      });

      if (studentMissingMarks.length > 0) {
        const errorMessage = studentMissingMarks.map(item => `${item.name}: ${item.subjects.join(', ')}`).join(' | ');
        toast.error(`Warning: Missing subject marks for: ${errorMessage}. Calculated with available marks.`);
      }

      // Process results for each student
      const processed = studentsToProcess.map(student => {
        const studentMarks = classMarks.filter(m => m.studentId?.toString() === student.id.toString());
        
        let totalMaxMarks = 0;
        let totalObtainedMarks = 0;
        let failedSubjects = [];
        const subjectBreakdown = [];

        classSubjects.forEach(sub => {
          const markRecord = studentMarks.find(m => m.subjectId?.toString() === sub.id.toString());
          const subConfig = exam.subjectConfigs?.[selectedClassId]?.[sub.id.toString()] || { totalMarks: 100, passingMarks: 40 };

          const maxMarks = parseFloat(subConfig.totalMarks) || 0;
          const passMarks = parseFloat(subConfig.passingMarks) || 0;

          totalMaxMarks += maxMarks;
          
          let obtained = 0;
          let subStatus = 'Present';
          
          if (markRecord) {
            subStatus = markRecord.status || 'Present';
            obtained = subStatus === 'Present' ? (markRecord.marksObtained ?? 0) : 0;
          }

          totalObtainedMarks += obtained;

          const subPct = maxMarks > 0 ? (obtained / maxMarks) * 100 : 0;
          const subPass = subStatus === 'Exempted' || (subStatus === 'Present' && obtained >= passMarks);

          if (!subPass) {
            failedSubjects.push(sub.subjectName);
          }

          subjectBreakdown.push({
            subjectId: sub.id,
            subjectName: sub.subjectName,
            totalMarks: maxMarks,
            passingMarks: passMarks,
            marksObtained: subStatus === 'Present' ? (markRecord ? markRecord.marksObtained : null) : (subStatus === 'Absent' ? 0 : null),
            status: subStatus,
            percentage: subPct.toFixed(2),
            passed: subPass
          });
        });

        const overallPercentage = totalMaxMarks > 0 ? (totalObtainedMarks / totalMaxMarks) * 100 : 0;
        const overallGrade = determineGrade(overallPercentage);
        
        // Determine overall pass/fail based on rule
        let overallPass = false;
        if (passingRule === 'pass_all') {
          overallPass = failedSubjects.length === 0;
        } else {
          overallPass = overallPercentage >= minOverallPercent;
        }

        return {
          id: `res-${Date.now()}-${student.id}`,
          examId: selectedExamId,
          classId: selectedClassId,
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber || 'N/A',
          totalPossibleMarks: totalMaxMarks,
          totalObtainedMarks,
          overallPercentage: overallPercentage.toFixed(2),
          overallGrade,
          status: overallPass ? 'PASS' : 'FAIL',
          failedSubjects,
          subjectBreakdown,
          locked: false,
          schoolId: schoolId
        };
      });

      // Save processed results immediately to localStorage
      const allResults = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');
      const otherResults = allResults.filter(r => 
        !(r.examId?.toString() === selectedExamId.toString() && r.classId?.toString() === selectedClassId.toString())
      );
      localStorage.setItem('schoolAdminResults', JSON.stringify([...otherResults, ...processed]));

      setProcessedResults(processed);
      toast.success(`Processed and saved results successfully for ${processed.length} students.`);
    } catch (err) {
      toast.error(`Processing error: ${err.message}`);
      console.error("PROCESSING ERROR:", err);
    }
  };

  const handleLockResults = () => {
    if (processedResults.length === 0) return;

    if (window.confirm('Are you sure you want to Lock these results? Teachers will no longer be able to submit modifications.')) {
      const allResults = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');
      
      // Remove any existing for this exam + class
      const filtered = allResults.filter(r => 
        !(r.examId?.toString() === selectedExamId.toString() && r.classId?.toString() === selectedClassId.toString())
      );

      const lockedBatch = processedResults.map(r => ({
        ...r,
        locked: true,
        lockedAt: new Date().toISOString(),
        lockedBy: authUser.name || 'School Admin'
      }));

      localStorage.setItem('schoolAdminResults', JSON.stringify([...filtered, ...lockedBatch]));
      setProcessedResults(lockedBatch);
      setIsLocked(true);
      
      // Also transition exam status to Processing if it was Marks Entry
      const allExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
      const updatedExams = allExams.map(ex => {
        if (ex.id.toString() === selectedExamId.toString() && ex.status === 'Marks Entry') {
          return { ...ex, status: 'Processing' };
        }
        return ex;
      });
      localStorage.setItem('schoolAdminExams', JSON.stringify(updatedExams));
      setExams(updatedExams);

      toast.success('Results processed and locked securely.');
      logSystemAction('Results Locked', authUser.name || 'School Admin', 'School Admin', `Exam ID: ${selectedExamId}, Class ID: ${selectedClassId}`);
    }
  };

  const handleReopenRequest = (e) => {
    e.preventDefault();
    if (!reopenReason) {
      toast.error('Reopen reason is required.');
      return;
    }

    const allResults = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');
    // Delete locked results to unlock
    const filtered = allResults.filter(r => 
      !(r.examId?.toString() === selectedExamId.toString() && r.classId?.toString() === selectedClassId.toString())
    );
    localStorage.setItem('schoolAdminResults', JSON.stringify(filtered));

    // Also reopen teacher marks status so they can edit
    const allMarks = JSON.parse(localStorage.getItem('teacherMarks') || '[]');
    const reopenedMarks = allMarks.map(m => {
      if (m.examId?.toString() === selectedExamId.toString() && m.classId?.toString() === selectedClassId.toString()) {
        return {
          ...m,
          submitted: false,
          reopenedBy: authUser.name || 'School Admin',
          reopenReason: reopenReason,
          reopenedAt: new Date().toISOString()
        };
      }
      return m;
    });
    localStorage.setItem('teacherMarks', JSON.stringify(reopenedMarks));

    // Update Exam status back to Marks Entry
    const allExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
    const updatedExams = allExams.map(ex => {
      if (ex.id.toString() === selectedExamId.toString()) {
        return { ...ex, status: 'Marks Entry' };
      }
      return ex;
    });
    localStorage.setItem('schoolAdminExams', JSON.stringify(updatedExams));

    setProcessedResults([]);
    setIsLocked(false);
    setShowReopenModal(false);
    setReopenReason('');
    loadData();

    toast.success('Results unlocked. Marks sheets reopened for teachers.');
    logSystemAction('Results Reopened', authUser.name || 'School Admin', 'School Admin', `Exam: ${selectedExamId}, Reason: ${reopenReason}`);
  };

  const saveGradeScale = () => {
    setGradeScale(tempGradeScale);
    localStorage.setItem('schoolAdminGradeScale', JSON.stringify(tempGradeScale));
    setIsGradeModalOpen(false);
    toast.success('Global grade scheme boundaries saved.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Result Processing & Validation</h2>
          <p className="text-gray-500 text-sm mt-1">Compile overall percentages, apply grade schemes, and locked results status.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button onClick={() => { setTempGradeScale([...gradeScale]); setIsGradeModalOpen(true); }} className="px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-xs font-bold transition-all shadow-sm">Grade Scheme</button>
          <ExportButtons tableId="export-table" filename="Processed_Results_Report" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exam</label>
          <select 
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-xs font-semibold"
          >
            <option value="">-- Select Exam --</option>
            {exams.map(e => (
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
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Passing Logic</label>
          <select value={passingRule} onChange={(e) => setPassingRule(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-xs">
            <option value="pass_all">Must Pass All Subjects</option>
            <option value="overall_percent">Overall Average Percentage</option>
          </select>
        </div>

        {passingRule === 'overall_percent' && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minimum Overall %</label>
            <input type="number" value={minOverallPercent} onChange={(e) => setMinOverallPercent(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs font-bold" min="1" max="100" />
          </div>
        )}
      </div>

      {selectedExamId && selectedClassId && (
        <div className="flex justify-end space-x-3">
          {!isLocked ? (
            <>
              <button onClick={handleProcessResults} className="px-5 py-2 bg-darkBlue text-white hover:bg-blue-900 rounded-lg text-xs font-bold transition-all shadow-sm">
                Process Results
              </button>
              {processedResults.length > 0 && (
                <button onClick={handleLockResults} className="px-5 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-xs font-bold transition-all shadow-sm">
                  Lock Results Batch
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs bg-green-50 text-green-700 font-bold border border-green-200 px-3 py-2 rounded-lg flex items-center gap-1">
                <Lock size={14} /> Results Locked Securely
              </span>
              <button onClick={() => setShowReopenModal(true)} className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-all">
                Reopen Marks Sheet
              </button>
            </div>
          )}
        </div>
      )}

      {processedResults.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                  <th className="p-4 font-bold">Roll Number</th>
                  <th className="p-4 font-bold">Student Name</th>
                  <th className="p-4 font-bold">Subject-wise Marks</th>
                  <th className="p-4 font-bold text-center">Total Obtained</th>
                  <th className="p-4 font-bold text-center">Total Marks</th>
                  <th className="p-4 font-bold text-center">Overall Percentage</th>
                  <th className="p-4 font-bold text-center">Grade</th>
                  <th className="p-4 font-bold text-right">Result Status</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                {processedResults.map((res) => (
                  <tr key={res.studentId} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-darkBlue">{res.rollNumber}</td>
                    <td className="p-4 font-semibold text-gray-800">{res.studentName}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {res.subjectBreakdown?.map(sb => (
                          <div key={sb.subjectId} className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-gray-500 font-semibold">{sb.subjectName}:</span>
                            <span className={`font-bold ${sb.passed ? 'text-green-600' : 'text-red-500'}`}>
                              {sb.status === 'Present' ? `${sb.marksObtained ?? 0}/${sb.totalMarks}` : sb.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-gray-700">{res.totalObtainedMarks}</td>
                    <td className="p-4 text-center font-bold text-gray-500">{res.totalPossibleMarks}</td>
                    <td className="p-4 text-center font-semibold">{res.overallPercentage}%</td>
                    <td className="p-4 text-center font-bold text-darkBlue text-sm">{res.overallGrade}</td>
                    <td className="p-4 text-right">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${res.status === 'PASS' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {res.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REOPEN REASON DIALOG MODAL */}
      {showReopenModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-gray-200 my-8">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-1.5"><AlertTriangle className="text-red-500" size={18}/> Reopen Marks Sheets</h3>
            <form onSubmit={handleReopenRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason for Reopening (Audit Log Required)</label>
                <textarea required value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs h-24" placeholder="Describe the change reason..."></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => { setShowReopenModal(false); setReopenReason(''); }} className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs font-bold">Reopen Sheets</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURE GRADE SCALE SCHEME MODAL */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center">
                <Settings className="mr-2" size={18}/> Configure Grade Scheme
              </h3>
              <button onClick={() => setIsGradeModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              <p className="text-xs text-gray-400">Set the percentage score ranges to calculate overall grades.</p>
              <div className="space-y-2">
                {tempGradeScale.map((scale, idx) => (
                  <div key={scale.id} className="grid grid-cols-3 gap-3 items-center text-xs">
                    <span className="font-bold text-center bg-gray-50 py-1.5 rounded border border-gray-200">{scale.grade}</span>
                    <input type="number" step="0.01" value={scale.min} onChange={(e) => {
                      const updated = [...tempGradeScale];
                      updated[idx].min = parseFloat(e.target.value) || 0;
                      setTempGradeScale(updated);
                    }} className="w-full px-2 py-1.5 border border-gray-300 rounded outline-none" placeholder="Min" />
                    <input type="number" step="0.01" value={scale.max} onChange={(e) => {
                      const updated = [...tempGradeScale];
                      updated[idx].max = parseFloat(e.target.value) || 0;
                      setTempGradeScale(updated);
                    }} className="w-full px-2 py-1.5 border border-gray-300 rounded outline-none" placeholder="Max" />
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsGradeModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold">Cancel</button>
                <button onClick={saveGradeScale} className="px-4 py-2 bg-darkBlue text-white rounded-lg text-xs font-bold">Save Scheme</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultProcessing;
